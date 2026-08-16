import express, { Request, Response } from 'express';
import { Type } from '@google/genai';
import { db } from '../firebase-config';
import { executeWalletCreditTransaction } from '../transaction-router';
import { getGeminiClient } from '../utils/gemini';

const router = express.Router();

const MINIMUM_MANUAL_PAYMENT_NGN = 1000;

function requireAdmin(req: Request, res: Response): boolean {
  const adminEmail = req.body?.adminEmail || req.query?.adminEmail;
  if (adminEmail !== 'admin@gigo.com') {
    res.status(403).json({ error: "Unauthorized. Only the primary super admin (admin@gigo.com) can manage manual payments." });
    return false;
  }
  return true;
}

// Public — shown in the Wallet's Refuel modal as an alternative to Paystack.
router.get('/manual-payment/details', async (req: Request, res: Response) => {
  try {
    const doc = await db.collection('system_configs').doc('global').get();
    const data = doc.data() || {};
    res.status(200).json({
      bankName: data.bankTransferDetails?.bankName || '',
      accountName: data.bankTransferDetails?.accountName || '',
      accountNumber: data.bankTransferDetails?.accountNumber || '',
      whatsappNumber: data.bankTransferDetails?.whatsappNumber || '',
      minimumAmountNGN: MINIMUM_MANUAL_PAYMENT_NGN
    });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch manual payment details.", details: error.message });
  }
});

router.put('/admin/manual-payment/details', async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const { bankName, accountName, accountNumber, whatsappNumber } = req.body;
  try {
    await db.collection('system_configs').doc('global').set({
      bankTransferDetails: {
        bankName: bankName || '',
        accountName: accountName || '',
        accountNumber: accountNumber || '',
        whatsappNumber: whatsappNumber || ''
      }
    }, { merge: true });
    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to save manual payment details.", details: error.message });
  }
});

// Reads a bank-transfer receipt image and extracts the amount paid — a suggestion
// for the admin to review, never an auto-credit. The admin still confirms (or
// corrects) the amount via /admin/manual-payment/credit below; this just removes
// the need to squint at a WhatsApp screenshot and type the number by hand.
router.post('/admin/manual-payment/scan-receipt', async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const { receiptImageBase64, mimeType } = req.body;

  if (!receiptImageBase64) {
    res.status(400).json({ error: "receiptImageBase64 is required." });
    return;
  }

  try {
    const { ai, modelFlash } = getGeminiClient();
    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: [
        { inlineData: { mimeType: mimeType || 'image/jpeg', data: receiptImageBase64 } },
        {
          text: `This is a bank transfer receipt or screenshot. Extract the amount that was paid/transferred, in Nigerian Naira (NGN). If the amount is shown in a different currency, convert your best estimate is not needed — just extract the NGN figure if present. If you cannot find a clear amount, set amountNGN to 0 and explain why in the note.`
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amountNGN: { type: Type.NUMBER, description: "The transferred amount in NGN. 0 if not confidently found." },
            note: { type: Type.STRING, description: "Brief note: what you saw, or why extraction failed." }
          },
          required: ['amountNGN', 'note']
        }
      }
    });

    if (!response.text) throw new Error("Empty response from Gemini receipt scan.");
    const parsed = JSON.parse(response.text);
    res.status(200).json({ success: true, extractedAmountNGN: parsed.amountNGN || 0, note: parsed.note || '' });
  } catch (error: any) {
    console.error("Receipt scan failed:", error.message);
    res.status(200).json({ success: false, extractedAmountNGN: 0, note: '', error: "AI scan unavailable — please enter the amount manually from the receipt." });
  }
});

// Admin manually credits a candidate's wallet after verifying a bank-transfer
// receipt received via WhatsApp. This is real money that actually moved, so it
// feeds the real ledger/P&L exactly like a Paystack transaction — same credit
// function, same schema, just a different paymentMethod tag for audit clarity.
router.post('/admin/manual-payment/credit', async (req: Request, res: Response) => {
  if (!requireAdmin(req, res)) return;
  const { userEmail, amountNGN, receiptNote, receiptImageBase64 } = req.body;

  if (!userEmail || typeof amountNGN !== 'number' || amountNGN < MINIMUM_MANUAL_PAYMENT_NGN) {
    res.status(400).json({ error: `userEmail and an amountNGN of at least ₦${MINIMUM_MANUAL_PAYMENT_NGN.toLocaleString()} are required.` });
    return;
  }

  try {
    const userQuery = await db.collection('users').where('email', '==', userEmail.toLowerCase()).get();
    if (userQuery.empty) {
      res.status(404).json({ error: "No account found with that email." });
      return;
    }
    const userDoc = userQuery.docs[0];
    const referenceId = `gigo-manual-${Date.now()}`;

    await executeWalletCreditTransaction(userDoc.id, amountNGN, 'NGN', referenceId, 'BANK_TRANSFER_MANUAL');

    // Separate audit record of the admin action itself (who credited whom, why),
    // distinct from the ledger entry the credit function already wrote.
    await db.collection('manual_payment_audit').add({
      timestamp: new Date().toISOString(),
      userId: userDoc.id,
      userEmail: userDoc.data().email,
      amountNGN,
      receiptNote: receiptNote || '',
      receiptImageBase64: receiptImageBase64 || null,
      creditedBy: req.body.adminEmail,
      referenceId
    });

    res.status(200).json({ success: true, userId: userDoc.id, amountNGN });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to credit manual payment.", details: error.message });
  }
});

router.get('/admin/manual-payment/audit', async (req: Request, res: Response) => {
  try {
    const snapshot = await db.collection('manual_payment_audit').orderBy('timestamp', 'desc').limit(100).get();
    res.status(200).json(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch manual payment audit.", details: error.message });
  }
});

export default router;
