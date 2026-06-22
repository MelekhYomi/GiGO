const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-ce78d47a-1bfa-42ef-8ae'
  });
}
const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('users').get();
  console.log('Total users:', snapshot.size);
  snapshot.forEach(doc => {
    const data = doc.data();
    console.log(`User ID: ${doc.id}`);
    console.log(`  Email: ${data.email}`);
    console.log(`  Password: ${data.password}`);
    console.log(`  Full Name: ${data.fullName}`);
    console.log(`  Gemini Key: ${data.geminiApiKey ? data.geminiApiKey.substring(0, 10) + '...' : 'NONE'}`);
    console.log(`  Target Roles:`, data.targetRoles);
  });

  console.log('\n--- Recent Agent Execution Logs ---');
  const logsSnapshot = await db.collection('agent_execution_logs').orderBy('timestamp', 'desc').limit(15).get();
  logsSnapshot.forEach(doc => {
    const log = doc.data();
    console.log(`[${log.timestamp}] Agent: ${log.agentName || log.agent_name} | Status: ${log.status || log.executionMetrics?.status}`);
    console.log(`  Metrics:`, JSON.stringify(log.executionMetrics || log.metrics || {}));
    console.log(`  Decisions:`, log.businessDecisionsExecuted || log.autonomousDecisions || log.decisionsExecuted);
  });
}
run().catch(console.error);

