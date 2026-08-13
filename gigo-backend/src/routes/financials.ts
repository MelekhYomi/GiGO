import express, { Request, Response } from 'express';
import { google } from 'googleapis';
import { db } from '../firebase-config';

const router = express.Router();

const FX_RATE_NGN_PER_USD = 1500;

// Program period per the Devpost "Build with Gemini XPRIZE" P&L template
const PROGRAM_MONTHS = ['may', 'june', 'july', 'august'] as const;
type ProgramMonth = typeof PROGRAM_MONTHS[number];

function monthKeyFromISO(iso: string): ProgramMonth | null {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const m = d.getUTCMonth(); // 0-indexed: April=3, May=4, June=5, July=6, August=7
  if (m === 4) return 'may';
  if (m === 5) return 'june';
  if (m === 6) return 'july';
  if (m === 7) return 'august';
  return null; // outside the hackathon program period
}

function emptyMonthRow() {
  return { may: 0, june: 0, july: 0, august: 0, total: 0 };
}

function addToMonth(row: ReturnType<typeof emptyMonthRow>, month: ProgramMonth, amount: number) {
  row[month] += amount;
  row.total += amount;
}

function requireAdmin(req: Request, res: Response): boolean {
  const adminEmail = req.body?.adminEmail || req.query?.adminEmail;
  if (adminEmail !== 'admin@gigo.com') {
    res.status(403).json({ error: "Unauthorized. Only the primary super admin (admin@gigo.com) can manage financial records." });
    return false;
  }
  return true;
}

// Mark/unmark a user as a related party (team member, family, pre-existing customer
// relationship) — Devpost requires this revenue reported separately from arms-length
// (Independent Sales) revenue.
router.post('/admin/users/:userId/set-related-party', async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const { userId } = req.params;
  const { isRelatedParty } = req.body;

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      res.status(404).json({ error: "Candidate profile not found." });
      return;
    }
    await userRef.update({ isRelatedParty: !!isRelatedParty, updatedAt: new Date().toISOString() });
    res.status(200).json({ success: true, message: `User marked as ${isRelatedParty ? '' : 'not '}a related party.` });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to update related-party flag.", details: error.message });
  }
});

// Real, manually-logged company expenses (hosting, API overage, contractor pay, etc.)
// — cash-basis: log an expense when the money actually leaves your account.
router.post('/admin/expenses', async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const { date, category, subcategory, amountUSD, description } = req.body;

  if (!date || !category || !subcategory || typeof amountUSD !== 'number' || amountUSD <= 0) {
    res.status(400).json({ error: "date, category, subcategory, and a positive amountUSD are required." });
    return;
  }
  if (!['COGS', 'SG&A', 'Other'].includes(category)) {
    res.status(400).json({ error: "category must be one of: COGS, SG&A, Other." });
    return;
  }
  const month = monthKeyFromISO(date);
  if (!month) {
    res.status(400).json({ error: "date must fall within the hackathon program period (May 19 - Aug 17, 2026)." });
    return;
  }

  try {
    const docRef = await db.collection('company_expenses').add({
      date,
      month,
      category,
      subcategory,
      amountUSD,
      description: description || '',
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ success: true, id: docRef.id });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to log expense.", details: error.message });
  }
});

router.get('/admin/expenses', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('company_expenses').orderBy('date', 'desc').get();
    const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(expenses);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch expenses.", details: error.message });
  }
});

router.delete('/admin/expenses/:id', async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  try {
    await db.collection('company_expenses').doc(req.params.id).delete();
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to delete expense.", details: error.message });
  }
});

// Real, computed P&L statement matching the Devpost "Build with Gemini XPRIZE" template
// row-for-row. Revenue comes from actual Paystack-confirmed wallet top-ups (cash basis —
// credited only once Paystack confirms payment); expenses come from real logged spend.
// Nothing here is simulated or formula-projected.
async function computePLStatement() {
  // 1. Real revenue: every WALLET_TOPUP CREDIT ledger entry across all users. Queries
  // each user's own ledger subcollection directly (no filters — read once, filter in
  // application code) rather than a collectionGroup query, since collection-group
  // queries require a manually-provisioned index that isn't guaranteed to exist yet.
  const revIndependent = emptyMonthRow();
  const revRelated = emptyMonthRow();

  const usersSnapshot = await db.collection('users').get();

  for (const userDoc of usersSnapshot.docs) {
    const isRelatedParty = !!userDoc.data()?.isRelatedParty;
    const ledgerSnapshot = await userDoc.ref.collection('ledger').get();

    for (const doc of ledgerSnapshot.docs) {
      const entry = doc.data();
      if (entry.type !== 'CREDIT' || entry.purpose !== 'WALLET_TOPUP') continue;

      const month = monthKeyFromISO(entry.timestamp);
      if (!month) continue;

      const currency = entry.currency || 'NGN';
      const amountUSD = currency === 'USD' ? Number(entry.amount) : Number(entry.amount) / FX_RATE_NGN_PER_USD;
      if (!amountUSD || isNaN(amountUSD)) continue;

      addToMonth(isRelatedParty ? revRelated : revIndependent, month, amountUSD);
    }
  }

  const revTotal = emptyMonthRow();
  for (const m of PROGRAM_MONTHS) {
    revTotal[m] = revIndependent[m] + revRelated[m];
  }
  revTotal.total = revIndependent.total + revRelated.total;

  // 2. Real expenses: sum logged company_expenses by category/subcategory/month.
  const expenseCategories = {
    cogsPersonnel: emptyMonthRow(),
    cogsSoftware: emptyMonthRow(),
    cogsTokens: emptyMonthRow(),
    sgaPersonnel: emptyMonthRow(),
    sgaSoftware: emptyMonthRow(),
    sgaTokens: emptyMonthRow(),
    otherExpenses: emptyMonthRow(),
  };

  const expensesSnapshot = await db.collection('company_expenses').get();
  for (const doc of expensesSnapshot.docs) {
    const exp = doc.data();
    const month = exp.month as ProgramMonth;
    if (!PROGRAM_MONTHS.includes(month)) continue;
    const amount = Number(exp.amountUSD) || 0;

    let key: keyof typeof expenseCategories | null = null;
    if (exp.category === 'COGS' && exp.subcategory === 'Personnel') key = 'cogsPersonnel';
    else if (exp.category === 'COGS' && exp.subcategory === 'Software Subscriptions') key = 'cogsSoftware';
    else if (exp.category === 'COGS' && exp.subcategory === 'Tokens') key = 'cogsTokens';
    else if (exp.category === 'SG&A' && exp.subcategory === 'Personnel') key = 'sgaPersonnel';
    else if (exp.category === 'SG&A' && exp.subcategory === 'Software Subscriptions') key = 'sgaSoftware';
    else if (exp.category === 'SG&A' && exp.subcategory === 'Tokens') key = 'sgaTokens';
    else key = 'otherExpenses';

    addToMonth(expenseCategories[key], month, amount);
  }

  const expTotal = emptyMonthRow();
  for (const m of PROGRAM_MONTHS) {
    expTotal[m] = Object.values(expenseCategories).reduce((sum, row) => sum + row[m], 0);
  }
  expTotal.total = Object.values(expenseCategories).reduce((sum, row) => sum + row.total, 0);

  const profitLoss = emptyMonthRow();
  for (const m of PROGRAM_MONTHS) {
    profitLoss[m] = revTotal[m] - expTotal[m];
  }
  profitLoss.total = revTotal.total - expTotal.total;

  return {
    revenue: { independent: revIndependent, related: revRelated, total: revTotal },
    expenses: { ...expenseCategories, total: expTotal },
    profitLoss,
    currency: 'USD',
    fxRateUsed: FX_RATE_NGN_PER_USD,
    generatedAt: new Date().toISOString()
  };
}

router.get('/admin/pl-statement', async (req: Request, res: Response) => {
  try {
    const statement = await computePLStatement();
    res.status(200).json(statement);
  } catch (error: any) {
    console.error("Failed to compute P&L statement:", error);
    res.status(500).json({ error: "Failed to compute P&L statement.", details: error.message });
  }
});

// Same service-account credential resolution as firebase-config.ts, requesting the
// Sheets/Drive scopes needed to write and share a spreadsheet on the founder's behalf
// without any interactive OAuth consent flow.
function getGoogleSheetsAuth() {
  const scopes = ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive.file'];

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    const credentials = JSON.parse(serviceAccountJson);
    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
    }
    return new google.auth.GoogleAuth({ credentials, scopes });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (projectId && clientEmail && privateKey) {
    return new google.auth.GoogleAuth({ credentials: { client_email: clientEmail, private_key: privateKey }, scopes });
  }

  return new google.auth.GoogleAuth({ scopes });
}

// Official Devpost "Build with Gemini XPRIZE" P&L template colors/format, read
// directly from the .xlsx template's cell styles.
const COLOR_NAVY = { red: 0x0B / 255, green: 0x16 / 255, blue: 0x29 / 255 };
const COLOR_ORANGE = { red: 0xF7 / 255, green: 0x94 / 255, blue: 0x1D / 255 };
const COLOR_GREEN = { red: 0x00 / 255, green: 0xC4 / 255, blue: 0x8C / 255 };
const COLOR_LIGHT_GRAY = { red: 0xF4 / 255, green: 0xF5 / 255, blue: 0xF7 / 255 };
const COLOR_WHITE = { red: 1, green: 1, blue: 1 };
const CURRENCY_FORMAT = '$#,##0.00;($#,##0.00);\\-';

// 1-indexed sheet row numbers for the fixed line items (used both to build the
// values array and to generate the SUM/subtraction formulas that mirror the
// template exactly, per-column, rather than pushing pre-computed totals).
const ROW = {
  title: 1, plBanner: 2, period: 3, accentBar: 4, colHeaders: 5,
  revenueHeader: 6, revIndependent: 7, revRelated: 8, totalRevenue: 9,
  expensesHeader: 11, cogsLabel: 12, cogsPersonnel: 13, cogsSoftware: 14, cogsTokens: 15,
  sgaLabel: 16, sgaPersonnel: 17, sgaSoftware: 18, sgaTokens: 19,
  otherLabel: 20, otherExpenses: 21, totalExpenses: 22,
  profitLoss: 24, footer: 26,
};
const COLS = ['B', 'C', 'D', 'E', 'F']; // May, June, July, August, Full 90 Days

function buildSheetRows(statement: Awaited<ReturnType<typeof computePLStatement>>): (string | number)[][] {
  const rows: (string | number)[][] = [];
  const set = (rowNum: number, values: (string | number)[]) => { rows[rowNum - 1] = values; };
  const line = (label: string, d: { may: number; june: number; july: number; august: number; total: number }) =>
    [label, round2(d.may), round2(d.june), round2(d.july), round2(d.august), round2(d.total)];

  set(ROW.title, ['Build with Gemini XPRIZE']);
  set(ROW.plBanner, ['PROFIT & LOSS STATEMENT']);
  set(ROW.period, ['Program Period: May 19 - August 17', '', '', 'Currency:', 'USD']);
  set(ROW.accentBar, []);
  set(ROW.colHeaders, ['Description', 'May', 'June', 'July', 'August', 'Full 90 Days']);

  set(ROW.revenueHeader, ['REVENUE']);
  set(ROW.revIndependent, line('Independent Sales (ie. sales of product or service)', statement.revenue.independent));
  set(ROW.revRelated, line('Related Party Revenue (ie. see Rules)', statement.revenue.related));
  set(ROW.totalRevenue, ['TOTAL REVENUE', ...COLS.map(c => `=SUM(${c}${ROW.revIndependent}:${c}${ROW.revRelated})`)]);

  set(ROW.expensesHeader, ['EXPENSES']);
  set(ROW.cogsLabel, ['COGS']);
  set(ROW.cogsPersonnel, line('Personnel', statement.expenses.cogsPersonnel));
  set(ROW.cogsSoftware, line('Software Subscriptions', statement.expenses.cogsSoftware));
  set(ROW.cogsTokens, line('Tokens', statement.expenses.cogsTokens));
  set(ROW.sgaLabel, ['SG&A']);
  set(ROW.sgaPersonnel, line('Personnel', statement.expenses.sgaPersonnel));
  set(ROW.sgaSoftware, line('Software Subscriptions', statement.expenses.sgaSoftware));
  set(ROW.sgaTokens, line('Tokens', statement.expenses.sgaTokens));
  set(ROW.otherLabel, ['Other Expenses']);
  set(ROW.otherExpenses, line('Other expenses (see Legend)', statement.expenses.otherExpenses));
  set(ROW.totalExpenses, ['TOTAL EXPENSES', ...COLS.map(c =>
    `=${c}${ROW.cogsPersonnel}+${c}${ROW.cogsSoftware}+${c}${ROW.cogsTokens}+${c}${ROW.sgaPersonnel}+${c}${ROW.sgaSoftware}+${c}${ROW.sgaTokens}+${c}${ROW.otherExpenses}`
  )]);

  set(ROW.profitLoss, ['PROFIT (LOSS)', ...COLS.map(c => `=${c}${ROW.totalRevenue}-${c}${ROW.totalExpenses}`)]);
  set(ROW.footer, [`Build with Gemini XPRIZE | Live-synced from GiGO's real transaction data on ${new Date().toISOString()} | CONFIDENTIAL`]);

  for (let i = 0; i < rows.length; i++) {
    if (!rows[i]) rows[i] = [];
  }
  return rows;
}

function round2(n: number): number {
  return Math.round((n || 0) * 100) / 100;
}

// Formatting requests (colors + number format) matching the official template's
// cell styles exactly, built from the same ROW map used for values/formulas.
function buildFormatRequests(sheetId: number) {
  const bandRow = (rowNum: number, color: any, textColor?: any) => ({
    repeatCell: {
      range: { sheetId, startRowIndex: rowNum - 1, endRowIndex: rowNum, startColumnIndex: 0, endColumnIndex: 6 },
      cell: { userEnteredFormat: { backgroundColor: color, ...(textColor ? { textFormat: { foregroundColor: textColor, bold: true } } : {}) } },
      fields: 'userEnteredFormat.backgroundColor' + (textColor ? ',userEnteredFormat.textFormat' : '')
    }
  });
  const currencyRow = (rowNum: number, color: any) => ({
    repeatCell: {
      range: { sheetId, startRowIndex: rowNum - 1, endRowIndex: rowNum, startColumnIndex: 1, endColumnIndex: 6 },
      cell: { userEnteredFormat: { backgroundColor: color, numberFormat: { type: 'CURRENCY', pattern: CURRENCY_FORMAT } } },
      fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.numberFormat'
    }
  });

  const white = COLOR_WHITE;
  const whiteRows = [
    ROW.cogsLabel, ROW.cogsPersonnel, ROW.cogsSoftware, ROW.cogsTokens,
    ROW.sgaLabel, ROW.sgaPersonnel, ROW.sgaSoftware, ROW.sgaTokens,
    ROW.otherLabel, ROW.otherExpenses, ROW.revIndependent, ROW.revRelated
  ];

  return [
    bandRow(ROW.title, COLOR_NAVY, COLOR_WHITE),
    bandRow(ROW.plBanner, COLOR_ORANGE, COLOR_WHITE),
    bandRow(ROW.period, COLOR_LIGHT_GRAY),
    bandRow(ROW.accentBar, COLOR_GREEN),
    bandRow(ROW.colHeaders, COLOR_NAVY, COLOR_WHITE),
    bandRow(ROW.revenueHeader, COLOR_NAVY, COLOR_WHITE),
    bandRow(ROW.expensesHeader, COLOR_NAVY, COLOR_WHITE),
    ...whiteRows.map(r => bandRow(r, white)),
    ...whiteRows.map(r => currencyRow(r, white)),
    bandRow(ROW.totalRevenue, COLOR_LIGHT_GRAY, undefined), currencyRow(ROW.totalRevenue, COLOR_LIGHT_GRAY),
    bandRow(ROW.totalExpenses, COLOR_LIGHT_GRAY, undefined), currencyRow(ROW.totalExpenses, COLOR_LIGHT_GRAY),
    bandRow(ROW.profitLoss, COLOR_GREEN, COLOR_WHITE), currencyRow(ROW.profitLoss, COLOR_GREEN),
    bandRow(ROW.footer, COLOR_NAVY, COLOR_WHITE),
    {
      updateDimensionProperties: {
        range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
        properties: { pixelSize: 380 },
        fields: 'pixelSize'
      }
    }
  ];
}

function extractSpreadsheetId(input: string): string {
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : input.trim();
}

// Service accounts have no personal Drive storage quota, so they can't create new
// spreadsheets in a regular Google account's Drive. Instead: the admin creates a
// blank sheet themselves and shares it (Editor) with this service account email —
// GiGO_SHEETS_SERVICE_ACCOUNT_EMAIL below — then this endpoint just writes into it.
router.get('/admin/pl-statement/sheets-service-account', async (req: Request, res: Response) => {
  try {
    const auth = getGoogleSheetsAuth();
    const client = await auth.getClient();
    const email = (client as any).email || (await (auth as any).getCredentials?.())?.client_email;
    res.status(200).json({ serviceAccountEmail: email || 'unknown' });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to resolve service account email.", details: error.message });
  }
});

// Syncs the real, live-computed P&L into a Google Sheet the admin has already created
// and shared with GiGO's service account. Pass spreadsheetUrlOrId on first call (or
// whenever switching sheets); it's remembered in system_configs/global thereafter.
router.post('/admin/pl-statement/sync-to-sheet', async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;

  try {
    const auth = getGoogleSheetsAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const statement = await computePLStatement();
    const rows = buildSheetRows(statement);

    const configRef = db.collection('system_configs').doc('global');
    const configDoc = await configRef.get();
    let spreadsheetId = req.body?.spreadsheetUrlOrId
      ? extractSpreadsheetId(req.body.spreadsheetUrlOrId)
      : (configDoc.data()?.plGoogleSheetId as string | undefined);

    if (!spreadsheetId) {
      res.status(400).json({
        error: "No Google Sheet configured yet.",
        needsSpreadsheetId: true,
        details: "Create a blank Google Sheet, share it (Editor) with the service account email, and resubmit with spreadsheetUrlOrId."
      });
      return;
    }

    await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'A1:Z100' });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows }
    });

    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetId = meta.data.sheets?.[0]?.properties?.sheetId ?? 0;
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: buildFormatRequests(sheetId) }
    });

    await configRef.set({ plGoogleSheetId: spreadsheetId }, { merge: true });

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    res.status(200).json({ success: true, sheetUrl, spreadsheetId });
  } catch (error: any) {
    console.error("Failed to sync P&L to Google Sheet:", error?.response?.data || error.message);
    res.status(500).json({
      error: "Failed to sync to Google Sheet.",
      details: error?.response?.data?.error?.message || error.message
    });
  }
});

export default router;
