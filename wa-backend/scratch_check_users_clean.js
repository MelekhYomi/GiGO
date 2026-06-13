const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-1827db43-f913-4a0e-978'
  });
}
const db = admin.firestore();

async function run() {
  const snap = await db.collection('users').get();
  console.log('Total users:', snap.size);
  snap.forEach(doc => {
    const d = doc.data();
    console.log('User ID:', doc.id);
    console.log('  Email:', d.email);
    console.log('  Name:', d.fullName);
    console.log('  hasVoiceOnboarded:', d.hasVoiceOnboarded);
    console.log('  role:', d.role);
    console.log('  tickerTargetDomains:', d.tickerTargetDomains);
  });
}
run().catch(console.error);
