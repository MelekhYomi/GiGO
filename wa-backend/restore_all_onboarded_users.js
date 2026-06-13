const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-1827db43-f913-4a0e-978'
  });
}
const db = admin.firestore();

async function run() {
  console.log('Fetching all agent execution logs for Native_Voice_Parsing_Agent...');
  const snapshot = await db.collection('agent_execution_logs').get();
  
  const onboardedUserIds = new Set();
  snapshot.forEach(doc => {
    const data = doc.data();
    const agentName = data.agentName || data.agent_name;
    const status = data.executionMetrics?.status || data.status;
    const userId = data.userId || data.user_id;
    
    if (
      agentName === 'Native_Voice_Parsing_Agent' && 
      (status === 'SUCCESS' || status === 'DONE' || status === 'COMPLETED') &&
      userId && userId !== 'SIGNUP_VOICE_PENDING' && userId !== 'UNKNOWN'
    ) {
      onboardedUserIds.add(userId);
    }
  });
  
  console.log(`Found ${onboardedUserIds.size} users who have completed voice onboarding successfully:`, Array.from(onboardedUserIds));
  
  for (const userId of onboardedUserIds) {
    const userRef = db.collection('users').doc(userId);
    const doc = await userRef.get();
    if (doc.exists) {
      const data = doc.data();
      console.log(`Updating User ${userId} (${data.email || 'No email'}) - setting hasVoiceOnboarded: true`);
      await userRef.set({
        hasVoiceOnboarded: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } else {
      console.warn(`User ${userId} found in logs but does not exist in users collection!`);
    }
  }
  
  console.log('Restoration of all onboarded users completed successfully.');
}

run().catch(console.error);
