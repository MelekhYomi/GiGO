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
  // 1. Real revenue: every WALLET_TOPUP CREDIT ledger entry across all users, resolved
  // via a collection-group query (single range filter on timestamp — no composite index
  // needed; purpose/type are filtered in application code).
  const revIndependent = emptyMonthRow();
  const revRelated = emptyMonthRow();

  const ledgerSnapshot = await db.collectionGroup('ledger')
    .where('timestamp', '>=', '2026-05-19T00:00:00.000Z')
    .where('timestamp', '<=', '2026-08-17T23:59:59.999Z')
    .get();

  const relatedPartyCache = new Map<string, boolean>();

  for (const doc of ledgerSnapshot.docs) {
    const entry = doc.data();
    if (entry.type !== 'CREDIT' || entry.purpose !== 'WALLET_TOPUP') continue;

    const month = monthKeyFromISO(entry.timestamp);
    if (!month) continue;

    const currency = entry.currency || 'NGN';
    const amountUSD = currency === 'USD' ? Number(entry.amount) : Number(entry.amount) / FX_RATE_NGN_PER_USD;
    if (!amountUSD || isNaN(amountUSD)) continue;

    const userId = doc.ref.parent.parent?.id;
    if (!userId) continue;

    let isRelatedParty = relatedPartyCache.get(userId);
    if (isRelatedParty === undefined) {
      const userDoc = await db.collection('users').doc(userId).get();
      isRelatedParty = !!userDoc.data()?.isRelatedParty;
      relatedPartyCache.set(userId, isRelatedParty);
    }

    addToMonth(isRelatedParty ? revRelated : revIndependent, month, amountUSD);
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

const PL_ROW_LABELS: Array<[string, string | null]> = [
  ['Description', null],
  ['REVENUE', null],
  ['Independent Sales (ie. sales of product or service)', 'revIndependent'],
  ['Related Party Revenue (ie. see Rules)', 'revRelated'],
  ['TOTAL REVENUE', 'revTotal'],
  ['', null],
  ['EXPENSES', null],
  ['COGS', null],
  ['Personnel', 'cogsPersonnel'],
  ['Software Subscriptions', 'cogsSoftware'],
  ['Tokens', 'cogsTokens'],
  ['SG&A', null],
  ['Personnel ', 'sgaPersonnel'],
  ['Software Subscriptions', 'sgaSoftware'],
  ['Tokens', 'sgaTokens'],
  ['Other Expenses', null],
  ['Other expenses (see Legend)', 'otherExpenses'],
  ['TOTAL EXPENSES', 'expTotal'],
  ['', null],
  ['PROFIT (LOSS)', 'profitLoss'],
];

function buildSheetRows(statement: Awaited<ReturnType<typeof computePLStatement>>): (string | number)[][] {
  const dataRows: Record<string, any> = {
    revIndependent: statement.revenue.independent,
    revRelated: statement.revenue.related,
    revTotal: statement.revenue.total,
    cogsPersonnel: statement.expenses.cogsPersonnel,
    cogsSoftware: statement.expenses.cogsSoftware,
    cogsTokens: statement.expenses.cogsTokens,
    sgaPersonnel: statement.expenses.sgaPersonnel,
    sgaSoftware: statement.expenses.sgaSoftware,
    sgaTokens: statement.expenses.sgaTokens,
    otherExpenses: statement.expenses.otherExpenses,
    expTotal: statement.expenses.total,
    profitLoss: statement.profitLoss,
  };

  return [
    ['Build with Gemini XPRIZE'],
    ['PROFIT & LOSS STATEMENT'],
    [`Program Period: May 19 - August 17`, '', '', 'Currency:', 'USD'],
    [],
    ['Description', 'May', 'June', 'July', 'August', 'Full 90 Days'],
    ...PL_ROW_LABELS.map(([label, key]) => {
      if (!key) return [label];
      const d = dataRows[key];
      return [label, round2(d.may), round2(d.june), round2(d.july), round2(d.august), round2(d.total)];
    }),
    [],
    [`Live-synced from GiGO's real transaction data on ${new Date().toISOString()} — not manually maintained.`],
  ];
}

function round2(n: number): number {
  return Math.round((n || 0) * 100) / 100;
}

// Syncs the real, live-computed P&L into a Google Sheet under the founder's own
// Google account, creating it on first run and reusing the same sheet thereafter.
router.post('/admin/pl-statement/sync-to-sheet', async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const shareWithEmail = req.body?.shareWithEmail || 'abayomi.deleale@gmail.com';

  try {
    const auth = getGoogleSheetsAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    const statement = await computePLStatement();
    const rows = buildSheetRows(statement);

    const configRef = db.collection('system_configs').doc('global');
    const configDoc = await configRef.get();
    let spreadsheetId = configDoc.data()?.plGoogleSheetId as string | undefined;

    if (spreadsheetId) {
      // Verify it still exists / is accessible before reusing it.
      try {
        await sheets.spreadsheets.get({ spreadsheetId });
      } catch {
        spreadsheetId = undefined;
      }
    }

    if (!spreadsheetId) {
      const created = await sheets.spreadsheets.create({
        requestBody: {
          properties: { title: 'GiGO — Build with Gemini XPRIZE P&L Statement' }
        }
      });
      spreadsheetId = created.data.spreadsheetId!;

      await drive.permissions.create({
        fileId: spreadsheetId,
        sendNotificationEmail: true,
        requestBody: { type: 'user', role: 'writer', emailAddress: shareWithEmail }
      });

      await configRef.set({ plGoogleSheetId: spreadsheetId }, { merge: true });
    }

    await sheets.spreadsheets.values.clear({ spreadsheetId, range: 'A1:Z100' });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: rows }
    });

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
