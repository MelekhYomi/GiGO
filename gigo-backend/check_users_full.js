const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-ce78d47a-1bfa-42ef-8ae'
  });
}
const db = admin.firestore();

async function run() {
  const snap = await db.collection('users').get();
  console.log('Total users:', snap.size);
  snap.forEach(doc => {
    const d = doc.data();
    console.log(`\n===================================`);
    console.log(`User ID: ${doc.id}`);
    console.log(`Email: ${d.email}`);
    console.log(`Full Name: ${d.fullName}`);
    console.log(`Role: ${d.role}`);
    console.log(`Target Roles: ${JSON.stringify(d.targetRoles)}`);
    console.log(`hasVoiceOnboarded: ${d.hasVoiceOnboarded}`);
    console.log(`inferredLocationHints: ${d.inferredLocationHints}`);
    console.log(`infrastructureStatus: ${JSON.stringify(d.infrastructureStatus)}`);
    console.log(`skills: ${JSON.stringify(d.skills)}`);
    console.log(`tickerTargetDomains: ${JSON.stringify(d.tickerTargetDomains)}`);
    console.log(`updatedAt: ${d.updatedAt}`);
  });
}
run().catch(console.error);
