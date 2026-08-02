const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-ce78d47a-1bfa-42ef-8ae'
  });
}
const db = admin.firestore();

async function run() {
  const userId = 'user_1780714671963_281';
  const threadsSnap = await db.collection('users').doc(userId).collection('mail_threads').get();
  console.log(`User: ${userId} has ${threadsSnap.size} threads`);
  threadsSnap.forEach(doc => {
    console.log(`\nThread ID: ${doc.id}`);
    const data = doc.data();
    console.log(`Subject: ${data.subject}`);
    console.log(`folder: ${data.folder}`);
    console.log(`isTrash: ${data.isTrash}`);
    console.log(`messages:`);
    if (data.messages) {
      data.messages.forEach((msg, idx) => {
        console.log(`  [${idx}] sender: ${msg.sender}, senderName: ${msg.senderName}, senderEmail: ${msg.senderEmail}, body snippet: ${msg.body ? msg.body.substring(0, 100) : ''}`);
      });
    } else {
      console.log(`  (no messages array)`);
    }
  });
}
run().catch(console.error);
