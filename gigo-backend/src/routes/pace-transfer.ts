import express, { Request, Response } from 'express';
import { db } from '../firebase-config';
import { authenticateToken } from '../utils/auth';

const router = express.Router();

const MIN_TRANSFER_NGN = 100;

// Real users can send each other Pace, but only funds that came from a real
// payment (Paystack or bank transfer) - never the promotional welcome bonus,
// which stays non-transferable by design. "Paid balance" is tracked as its own
// running total (see executeWalletCreditTransaction) and clamped to the actual
// wallet balance here, since spending isn't attributed to a specific pool.
router.get('/users/:userId/transferable-balance', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).userId || req.params.userId;
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    const financials = userDoc.data()?.financials || {};
    const walletBalanceNGN = financials.walletBalanceNGN || 0;
    const transferableNGN = Math.min(financials.paidBalanceNGN || 0, walletBalanceNGN);
    res.status(200).json({ transferableNGN, walletBalanceNGN });
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch transferable balance.", details: error.message });
  }
});

router.post('/users/:userId/transfer-pace', authenticateToken, async (req: Request, res: Response) => {
  const senderId = (req as any).userId || req.params.userId;
  const { recipientEmail, amountNGN } = req.body;

  if (!recipientEmail || typeof amountNGN !== 'number' || amountNGN < MIN_TRANSFER_NGN) {
    res.status(400).json({ error: `recipientEmail and an amountNGN of at least ₦${MIN_TRANSFER_NGN} are required.` });
    return;
  }

  try {
    const senderRef = db.collection('users').doc(senderId);
    const senderDoc = await senderRef.get();
    if (!senderDoc.exists) {
      res.status(404).json({ error: "Sender account not found." });
      return;
    }
    const senderEmail = (senderDoc.data()?.email || '').toLowerCase();
    if (senderEmail === recipientEmail.toLowerCase()) {
      res.status(400).json({ error: "You can't transfer Pace to yourself." });
      return;
    }

    const recipientQuery = await db.collection('users').where('email', '==', recipientEmail.toLowerCase()).limit(1).get();
    if (recipientQuery.empty) {
      res.status(404).json({ error: "No GiGO account found with that email." });
      return;
    }
    const recipientRef = recipientQuery.docs[0].ref;
    const referenceId = `gigo-pace-transfer-${Date.now()}`;

    await db.runTransaction(async (transaction) => {
      const freshSenderDoc = await transaction.get(senderRef);
      const freshRecipientDoc = await transaction.get(recipientRef);

      const senderFinancials = freshSenderDoc.data()?.financials || {};
      const senderWalletNGN = senderFinancials.walletBalanceNGN || 0;
      const senderTransferableNGN = Math.min(senderFinancials.paidBalanceNGN || 0, senderWalletNGN);

      if (senderTransferableNGN < amountNGN) {
        throw new Error(`INSUFFICIENT_TRANSFERABLE_BALANCE:${senderTransferableNGN}`);
      }

      const recipientFinancials = freshRecipientDoc.data()?.financials || {};
      const recipientWalletNGN = recipientFinancials.walletBalanceNGN || 0;
      const recipientPaidNGN = recipientFinancials.paidBalanceNGN || 0;

      const newSenderWalletNGN = senderWalletNGN - amountNGN;
      const newSenderPaidNGN = (senderFinancials.paidBalanceNGN || 0) - amountNGN;
      const newRecipientWalletNGN = recipientWalletNGN + amountNGN;
      const newRecipientPaidNGN = recipientPaidNGN + amountNGN; // received Pace is real money too, transferable onward

      transaction.update(senderRef, {
        'financials.walletBalanceNGN': newSenderWalletNGN,
        'financials.walletBalanceUSD': newSenderWalletNGN / 1500,
        'financials.paidBalanceNGN': newSenderPaidNGN
      });
      transaction.update(recipientRef, {
        'financials.walletBalanceNGN': newRecipientWalletNGN,
        'financials.walletBalanceUSD': newRecipientWalletNGN / 1500,
        'financials.paidBalanceNGN': newRecipientPaidNGN
      });

      const senderLedgerRef = senderRef.collection('ledger').doc();
      transaction.set(senderLedgerRef, {
        timestamp: new Date().toISOString(),
        type: 'DEBIT',
        purpose: 'PACE_TRANSFER_SENT',
        currency: 'NGN',
        amount: amountNGN,
        paymentMethod: 'INTERNAL_TRANSFER',
        status: 'SUCCESSFUL',
        reconciliationId: referenceId,
        meta: { recipientEmail: recipientEmail.toLowerCase() }
      });

      const recipientLedgerRef = recipientRef.collection('ledger').doc();
      transaction.set(recipientLedgerRef, {
        timestamp: new Date().toISOString(),
        type: 'CREDIT',
        purpose: 'PACE_TRANSFER_RECEIVED',
        currency: 'NGN',
        amount: amountNGN,
        paymentMethod: 'INTERNAL_TRANSFER',
        status: 'SUCCESSFUL',
        reconciliationId: referenceId,
        meta: { senderEmail }
      });
    });

    res.status(200).json({ success: true, amountNGN, recipientEmail: recipientEmail.toLowerCase() });
  } catch (error: any) {
    if (typeof error.message === 'string' && error.message.startsWith('INSUFFICIENT_TRANSFERABLE_BALANCE:')) {
      const available = error.message.split(':')[1];
      res.status(402).json({ error: `You only have ₦${Number(available).toLocaleString()} of paid (transferable) balance — bonus Pace can't be transferred.` });
      return;
    }
    res.status(500).json({ error: "Failed to transfer Pace.", details: error.message });
  }
});

export default router;
