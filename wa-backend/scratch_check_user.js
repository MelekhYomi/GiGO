const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-1827db43-f913-4a0e-978'
  });
}
const db = admin.firestore();

async function run() {
  const usersSnap = await db.collection('users').get();
  console.log('--- ALL USERS IN FIRESTORE ---');
  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    console.log(`User ID: ${userDoc.id}`);
    console.log(`  Name: ${userData.fullName}`);
    console.log(`  Email: ${userData.email}`);
    console.log(`  Wallet Balance: ₦${userData.financials?.walletBalanceNGN || 0}`);
    
    // Check mail threads
    const threadsSnap = await db.collection('users').doc(userDoc.id).collection('mail_threads').get();
    console.log(`  Mail Threads Count: ${threadsSnap.size}`);
    threadsSnap.forEach(tDoc => {
      const tData = tDoc.data();
      console.log(`    - Thread ID: ${tDoc.id}, Subject: "${tData.subject}", Company: "${tData.companyName}", folder: "${tData.folder}", isTrash: ${tData.isTrash}`);
    });
  }
}
run().catch(console.error);
