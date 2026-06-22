const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-ce78d47a-1bfa-42ef-8ae'
  });
}
const db = admin.firestore();

async function run() {
  const snap = await db.collection('agent_execution_logs')
    .orderBy('timestamp', 'desc')
    .limit(15)
    .get();

  console.log('Last 15 Execution Logs:');
  snap.forEach(doc => {
    const d = doc.data();
    console.log(`\n-----------------------------------`);
    console.log(`Log ID: ${doc.id}`);
    console.log(`Timestamp: ${d.timestamp}`);
    console.log(`Agent: ${d.agentName || d.agent_name}`);
    console.log(`Cycle: ${d.cycleType || d.cycle_type}`);
    console.log(`User ID: ${d.userId || d.user_id}`);
    console.log(`Status: ${JSON.stringify(d.executionMetrics || d.status)}`);
    console.log(`Message: ${d.message}`);
    console.log(`Metrics: ${JSON.stringify(d.executionMetrics)}`);
  });
}
run().catch(console.error);
