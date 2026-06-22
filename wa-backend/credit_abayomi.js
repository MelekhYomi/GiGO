const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-ce78d47a-1bfa-42ef-8ae'
  });
}
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

async function creditUser() {
  const userId = 'user_1780714671963_281'; // Abayomi Dele Ale's ID
  const creditAmount = 50000; // ₦50,000 NGN

  console.log(`Crediting user ${userId} with ₦${creditAmount} NGN...`);

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error(`User ${userId} not found in database.`);
      return;
    }

    const ledgerRef = userRef.collection('ledger').doc();

    await db.runTransaction(async (transaction) => {
      transaction.update(userRef, {
        'financials.walletBalanceNGN': FieldValue.increment(creditAmount),
        'financials.lastTopUpTimestamp': new Date().toISOString()
      });

      transaction.set(ledgerRef, {
        timestamp: new Date().toISOString(),
        type: 'CREDIT',
        purpose: 'MANUAL_RECONCILIATION_CREDIT',
        currency: 'NGN',
        amount: creditAmount,
        paymentMethod: 'ADMIN_OVERRIDE',
        status: 'SUCCESSFUL',
        reconciliationId: `manual-credit-${Date.now()}`,
        meta: {
          description: `Credited ₦${creditAmount} NGN via system diagnostics to support exhaustive user testing.`
        }
      });
    });

    console.log(`Successfully credited user ${userId} with ₦${creditAmount} NGN!`);
    
    const updatedDoc = await userRef.get();
    console.log(`New Wallet Balance: ₦${updatedDoc.data().financials?.walletBalanceNGN || 0}`);
  } catch (error) {
    console.error('Failed to credit user:', error);
  }
}

creditUser();
