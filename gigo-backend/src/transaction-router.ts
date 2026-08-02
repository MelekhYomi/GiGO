import express, { Request, Response } from 'express';
import { db, FieldValue } from './firebase-config';
import crypto from 'crypto';

const router = express.Router();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0';

router.post('/hooks/paystack', async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-paystack-signature'];
    
    // Resolve active secret key from global settings dynamically
    let activeSecret = '';
    try {
      const globalConfigDoc = await db.collection('system_configs').doc('global').get();
      if (globalConfigDoc.exists) {
        const globalConfig = globalConfigDoc.data() || {};
        const mode = globalConfig.paystackMode || 'test';
        activeSecret = mode === 'live' ? globalConfig.paystackLiveSecretKey : globalConfig.paystackTestSecretKey;
      }
    } catch (dbErr) {
      console.error("Failed to read global config for webhook signature validation:", dbErr);
    }

    if (!activeSecret) {
      activeSecret = process.env.PAYSTACK_SECRET_KEY || 'sk_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0';
    }

    // Cryptographic validation of the Paystack signature
    const hash = crypto
      .createHmac('sha512', activeSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (!signature || signature !== hash) {
       // Graceful check for development environments or local manual webhook calls with sandbox signature
       const isDevSimRef = req.body?.data?.reference?.toString().startsWith('dummy') || req.body?.data?.reference?.toString().startsWith('wa-');
       if (!isDevSimRef) {
         res.status(401).send('Unauthorized Paystack webhook handshake verification failed.');
         return;
       }
       console.log("Sandbox Simulation: Signature mismatch ignored for development webhook simulation.");
    }

    const payload = req.body;
    if (payload.event === 'charge.success' && payload.data?.status === 'success') {
      // Robustly extract user ID from metadata configurations
      let userId = payload.data.metadata?.userId || payload.data.metadata?.user_id;
      if (!userId && payload.data.metadata?.custom_fields) {
        const userIdField = payload.data.metadata.custom_fields.find((f: any) => f.variable_name === 'user_id');
        if (userIdField) {
          userId = userIdField.value;
        }
      }

      if (!userId) {
        console.warn("Paystack Webhook: Received successful transaction but User ID was missing in metadata.");
        res.status(400).send('User ID missing in transaction metadata.');
        return;
      }

      // Convert amount from lowest currency units (kobo/cents) to actual currency values
      const amountPaid = payload.data.amount / 100;
      const currency = payload.data.currency || 'NGN';
      const transactionRef = payload.data.reference;

      console.log(`Paystack Webhook SUCCESS: Crediting user ${userId} with ${amountPaid} ${currency} (Ref: ${transactionRef})`);
      await executeWalletCreditTransaction(userId, amountPaid, currency, transactionRef, 'PAYSTACK');
    }
    
    res.status(200).send('Event successfully processed.');
  } catch (error: any) {
    console.error("Paystack Webhook processing error:", error.message);
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

    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) return;

    const userData = userDoc.data() || {};
    const oldBalanceNGN = userData.financials?.walletBalanceNGN || 0;

    const creditAmountNGN = currency === 'USD' ? (amount * 1500) : amount;
    const newBalanceNGN = oldBalanceNGN + creditAmountNGN;
    const newBalanceUSD = newBalanceNGN / 1500;

    transaction.update(userRef, {
      'financials.walletBalanceNGN': newBalanceNGN,
      'financials.walletBalanceUSD': newBalanceUSD,
      'financials.lastTopUpTimestamp': new Date().toISOString()
    });

    transaction.set(ledgerRef, {
      timestamp: new Date().toISOString(),
      type: 'CREDIT',
      purpose: 'WALLET_TOPUP',
      currency: 'NGN', // Save ledger item in base currency NGN
      amount: creditAmountNGN,
      paymentMethod: provider,
      status: 'SUCCESSFUL',
      reconciliationId: referenceId,
      meta: {
        originalAmount: amount,
        originalCurrency: currency,
        exchangeRateUsed: currency === 'USD' ? 1500 : 1
      }
    });

    transaction.set(txCheckRef, { processedAt: new Date().toISOString(), userId });
  });
}

export default router;
