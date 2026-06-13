const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-1827db43-f913-4a0e-978'
  });
}
const db = admin.firestore();

async function run() {
  const userRef = db.collection('users').doc('user_1780714671963_281');
  const userDoc = await userRef.get();
  if (userDoc.exists) {
    const userData = userDoc.data();
    console.log(`User: ${userData.fullName}`);
    console.log(`Email: ${userData.email}`);
    console.log(`SMTP Settings:`, userData.smtpSettings);
    console.log(`Gemini API Key:`, userData.geminiApiKey ? "PRESENT" : "MISSING");
  } else {
    console.log("User not found!");
  }
}
run().catch(console.error);
