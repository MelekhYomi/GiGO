const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'project-1827db43-f913-4a0e-978'
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
  
  // Filter for Native_Voice_Parsing_Agent
  const voiceLogs = logs.filter(l => l.agentName === 'Native_Voice_Parsing_Agent' || l.agent_name === 'Native_Voice_Parsing_Agent');
  console.log('Native_Voice_Parsing_Agent logs count:', voiceLogs.length);
  voiceLogs.slice(0, 10).forEach(log => {
    console.log(`[${log.timestamp}] User ID: ${log.userId} | Status: ${log.executionMetrics?.status || log.status}`);
  });
}
run().catch(console.error);
