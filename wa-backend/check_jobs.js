const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-ce78d47a-1bfa-42ef-8ae'
  });
}
const db = admin.firestore();

async function run() {
  const jobsSnap = await db.collection('discovered_jobs').get();
  console.log('Total discovered jobs:', jobsSnap.size);
  if (jobsSnap.size > 0) {
    const d = jobsSnap.docs[0].data();
    console.log('Sample job:');
    console.log('  ID:', jobsSnap.docs[0].id);
    console.log('  Title:', d.title);
    console.log('  Company:', d.company);
    console.log('  Location:', d.location);
    console.log('  Score:', d.score);
    console.log('  Application Method:', d.applicationMethod);
    console.log('  Recipient Email:', d.emailRecipient);
  }
}
run().catch(console.error);
