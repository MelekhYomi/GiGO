const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-1827db43-f913-4a0e-978'
  });
}
const db = admin.firestore();

async function run() {
  const userId = 'user_1780714671963_281';
  const ledgerSnap = await db.collection('users').doc(userId).collection('ledger').get();
  console.log(`User: ${userId} has ${ledgerSnap.size} ledger records:`);
  ledgerSnap.forEach(doc => {
    const data = doc.data();
    console.log(`- [${data.timestamp}] Type: ${data.type}, Purpose: ${data.purpose}, Amount: ${data.amount}, Status: ${data.status}`);
  });
}
run().catch(console.error);
