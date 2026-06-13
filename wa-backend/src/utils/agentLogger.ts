import { db } from '../firebase-config';

interface AgentLogPayload {
  agentName: string;
  cycleType: 'PROFILE_INGESTION' | 'BOOLEAN_SCRAPE' | 'RECONCILIATION' | 'WORKSPACE_SYNC';
  userId?: string;
  executionMetrics: Record<string, any>;
  decisionsExecuted: string[];
}

export async function commitAgentExecutionTrace(payload: AgentLogPayload): Promise<void> {
  try {
    const logId = `trace_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const telemetryRef = db.collection('agent_execution_logs').doc(logId);

    const fullLogRecord = {
      timestamp: new Date().toISOString(),
      agentName: payload.agentName,
      status: 'COMPLETED',
      cycleType: payload.cycleType,
      userId: payload.userId || 'SYSTEM_GLOBAL',
      executionMetrics: payload.executionMetrics,
      autonomousDecisionsExecuted: payload.decisionsExecuted
    };

    await telemetryRef.set(fullLogRecord);
    console.log(`🪵 [GiGO Telemetry Log Committed Successfully] -> ID: ${logId}`);
  } catch (err: any) {
    console.error('⚠️ Critical telemetry pipeline failure:', err.message);
  }
}
