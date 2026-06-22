const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-ce78d47a-1bfa-42ef-8ae'
  });
}
const db = admin.firestore();

async function run() {
  const snap = await db.collection('users').get();
  console.log('Total users (snap.size):', snap.size);
  console.log('Is array:', Array.isArray(snap.docs));
  console.log('Length of docs:', snap.docs.length);
  for (let i = 0; i < snap.docs.length; i++) {
    const doc = snap.docs[i];
    console.log(`Document ${i}: ID=${doc.id}`, doc.data());
  }
}
run().catch(console.error);
