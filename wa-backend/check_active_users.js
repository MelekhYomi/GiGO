const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-ce78d47a-1bfa-42ef-8ae'
  });
}
const db = admin.firestore();

async function run() {
  const snapshot = await db.collection('agent_execution_logs').get();
  console.log('Total agent execution logs:', snapshot.size);
  const logs = [];
  snapshot.forEach(doc => {
    logs.push({ id: doc.id, ...doc.data() });
  });
  
  // Sort in memory by timestamp desc
  logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  
  const userActions = {};
  logs.forEach(log => {
    const u = log.userId || log.user_id || 'UNKNOWN';
    if (!userActions[u]) userActions[u] = [];
    userActions[u].push({
      timestamp: log.timestamp,
      agentName: log.agentName || log.agent_name,
      status: log.executionMetrics?.status || log.status || 'DONE'
    });
  });
  
  console.log('\n--- Active Users and their operations ---');
  for (const [userId, actions] of Object.entries(userActions)) {
    console.log(`\nUser ID: ${userId} (${actions.length} actions)`);
    actions.slice(0, 10).forEach(act => {
      console.log(`  [${act.timestamp}] Agent: ${act.agentName} | Status: ${act.status}`);
    });
  }
}
run().catch(console.error);
