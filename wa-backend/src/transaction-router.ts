import express, { Request, Response } from 'express';
import { db, FieldValue } from './firebase-config';

const router = express.Router();
const FLUTTERWAVE_SECRET_HASH = process.env.FLUTTERWAVE_SECRET_HASH || 'WA_SECURE_HASH_123';

router.post('/hooks/flutterwave', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['verif-hash'];
    if (!signature || signature !== FLUTTERWAVE_SECRET_HASH) {
       res.status(401).send('Unauthorized webhook handshake execution attempt.');
       return;
    }
    const payload = req.body;
    if (payload.status === 'successful' || payload.event === 'charge.completed') {
      const userId = payload.data.customer.id;
      const amountPaid = payload.data.amount;
      const currency = payload.data.currency;
      const transactionRef = payload.data.tx_ref;
      await executeWalletCreditTransaction(userId, amountPaid, currency, transactionRef, 'FLUTTERWAVE');
    }
    res.status(200).send('Event successfully logged.');
  } catch (error: any) {
    res.status(500).send('Internal validation handling lapse.');
  }
});

export async function executeWalletCreditTransaction(userId: string, amount: number, currency: string, referenceId: string, provider: string) {
  const userRef = db.collection('users').doc(userId);
  const ledgerRef = userRef.collection('ledger').doc();
  const txCheckRef = db.collection('processed_transactions').doc(referenceId);

  await db.runTransaction(async (transaction) => {
    const txCheckDoc = await transaction.get(txCheckRef);
    if (txCheckDoc.exists) return;
    const balanceField = currency === 'USD' ? 'financials.walletBalanceUSD' : 'financials.walletBalanceNGN';
    transaction.update(userRef, {
      [balanceField]: FieldValue.increment(amount),
      'financials.lastTopUpTimestamp': new Date().toISOString()
    });
    transaction.set(ledgerRef, {
      timestamp: new Date().toISOString(),
      type: 'CREDIT',
      purpose: 'WALLET_TOPUP',
      currency,
      amount,
      paymentMethod: provider,
      status: 'SUCCESSFUL',
      reconciliationId: referenceId
    });
    transaction.set(txCheckRef, { processedAt: new Date().toISOString(), userId });
  });
}

export default router;
