const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-1827db43-f913-4a0e-978'
  });
}
const db = admin.firestore();

async function run() {
  const jobsSnap = await db.collection('discovered_jobs').get();
  console.log('Total discovered jobs:', jobsSnap.size);
  let count = 0;
  for (const doc of jobsSnap.docs) {
    const d = doc.data();
    if (d.title || d.jobTitle || d.companyName || d.company) {
      console.log(`Job Doc ID: ${doc.id}`);
      console.log(JSON.stringify(d, null, 2));
      count++;
      if (count >= 2) break;
    }
  }
}
run().catch(console.error);
