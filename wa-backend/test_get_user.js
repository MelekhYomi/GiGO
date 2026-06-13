const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-1827db43-f913-4a0e-978'
  });
}
const db = admin.firestore();

async function run() {
  const userId = 'user_1780714671963_281';
  const doc = await db.collection('users').doc(userId).get();
  console.log('User document in Firestore:', doc.exists ? 'EXISTS' : 'NOT FOUND');
  if (doc.exists) {
    console.log(JSON.stringify(doc.data(), null, 2));
  }
}
run().catch(console.error);
