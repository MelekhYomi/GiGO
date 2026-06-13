const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-1827db43-f913-4a0e-978'
  });
}
const db = admin.firestore();

async function run() {
  const usersSnap = await db.collection('users').get();
  console.log('Scanning users for mail threads...');
  for (const userDoc of usersSnap.docs) {
    const userData = userDoc.data();
    const threadsSnap = await db.collection('users').doc(userDoc.id).collection('mail_threads').get();
    if (threadsSnap.size > 0) {
      console.log(`\nUser: ${userData.fullName} (${userDoc.id}) has ${threadsSnap.size} thread(s):`);
      threadsSnap.forEach(tDoc => {
        const tData = tDoc.data();
        console.log(`  - Thread ID: ${tDoc.id}`);
        console.log(`    Subject: ${tData.subject}`);
        console.log(`    Company: ${tData.companyName}`);
        console.log(`    Job Title: ${tData.jobTitle}`);
        console.log(`    Status: ${tData.status}`);
        console.log(`    Recipient Email: ${tData.recipientEmail}`);
        console.log(`    Messages count: ${tData.messages?.length || 0}`);
        if (tData.messages && tData.messages.length > 0) {
          console.log(`    Last Message:`);
          const lastMsg = tData.messages[tData.messages.length - 1];
          console.log(`      Sender: ${lastMsg.senderName || lastMsg.sender} (${lastMsg.senderEmail})`);
          console.log(`      Body snippet: ${lastMsg.body ? lastMsg.body.substring(0, 100).replace(/\n/g, ' ') : ''}...`);
        }
      });
    }
  }
}
run().catch(console.error);
