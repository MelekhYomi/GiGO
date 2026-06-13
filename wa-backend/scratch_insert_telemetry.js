const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-1827db43-f913-4a0e-978'
  });
}

const db = admin.firestore();

async function run() {
  console.log('Inserting verification log for agent_execution_logs telemetry records...');

  const telemetryLog = {
    timestamp: new Date().toISOString(),
    agentName: "Native_Voice_Parsing_Agent",
    cycleType: "PROFILE_INGESTION",
    userId: "TEST_HACKATHON_USER_01",
    executionMetrics: {
      latencyMs: 1420,
      audioPayloadSizeBytes: 84210,
      modelUsed: "gemini-live-2.5-flash-native-audio"
    }
  };

  const docRef = await db.collection('agent_execution_logs').add(telemetryLog);
  console.log('Telemetry verification record written with ID:', docRef.id);

  // Read it back to verify
  const docSnap = await docRef.get();
  console.log('Retrieved document content:');
  console.log(JSON.stringify(docSnap.data(), null, 2));

  // Querying using the composite indexes to verify they work
  console.log('\nVerifying queries against composite indexes...');

  // Index 1: userId (ASC) + timestamp (DESC)
  try {
    const q1 = await db.collection('agent_execution_logs')
      .where('userId', '==', 'TEST_HACKATHON_USER_01')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();
    console.log(`- Query by userId + timestamp DESC succeeded. Matches found: ${q1.size}`);
  } catch (err) {
    console.error('- Query by userId + timestamp DESC failed:', err.message);
  }

  // Index 2: cycleType (ASC) + timestamp (DESC)
  try {
    const q2 = await db.collection('agent_execution_logs')
      .where('cycleType', '==', 'PROFILE_INGESTION')
      .orderBy('timestamp', 'desc')
      .limit(5)
      .get();
    console.log(`- Query by cycleType + timestamp DESC succeeded. Matches found: ${q2.size}`);
  } catch (err) {
    console.error('- Query by cycleType + timestamp DESC failed:', err.message);
  }
}

run().catch(console.error);
