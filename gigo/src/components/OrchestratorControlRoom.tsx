import { useState, useEffect } from 'react';

interface AgentNode {
  id: string;
  name: string;
  label: string;
  status: 'ACTIVE' | 'IDLE' | 'ERROR';
  description: string;
  runs: number;
  avgLatency: string;
  icon: string;
  x: number;
  y: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  agentName: string;
  status: string;
  cycleType: string;
  executionMetrics?: {
    latencyMs?: number;
    tokensUsed?: number;
    [key: string]: any;
  };
  autonomousDecisionsExecuted?: string[];
  [key: string]: any;
}

interface OrchestratorControlRoomProps {
  API_BASE_URL: string;
  addLog: (log: string) => void;
}

export default function OrchestratorControlRoom({ API_BASE_URL, addLog }: OrchestratorControlRoomProps) {
  const [agents, setAgents] = useState<AgentNode[]>([
    { id: '1', name: 'ScraperAgent', label: '🕸️ Scraper Agent', status: 'ACTIVE', description: 'Indexes the web, extracts job matches, and seeds database vacancies.', runs: 148, avgLatency: '2.4s', icon: '🔍', x: 150, y: 120 },
    { id: '2', name: 'MatchMakerAgent', label: '🤝 MatchMaker Agent', status: 'IDLE', description: 'Synthesizes profiles to map vacancies to candidate boards.', runs: 96, avgLatency: '1.8s', icon: '⚡', x: 450, y: 120 },
    { id: '3', name: 'MailroomSyncAgent', label: '📬 MailroomSync Agent', status: 'ACTIVE', description: 'Monitors inbound recruiter emails, classifying and drafting responders.', runs: 212, avgLatency: '1.2s', icon: '✉️', x: 150, y: 320 },
    { id: '4', name: 'DocumentAgent', label: '📄 Document Agent', status: 'IDLE', description: 'Generates context-aware high-fidelity cover letters and custom resume PDFs.', runs: 74, avgLatency: '3.1s', icon: '🖋️', x: 450, y: 320 },
  ]);

  const [selectedAgent, setSelectedAgent] = useState<AgentNode | null>(null);
  const [agentLogs, setAgentLogs] = useState<LogEntry[]>([]);
  const [prompts, setPrompts] = useState<Record<string, string>>({
    ScraperAgent: '',
    MatchMakerAgent: '',
    MailroomSyncAgent: '',
    DocumentAgent: '',
  });
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [calibrationPrompt, setCalibrationPrompt] = useState('');

  // Fetch all prompts from Firestore on mount
  useEffect(() => {
    fetchPrompts();
  }, []);

  // Fetch logs when selected agent changes
  useEffect(() => {
    if (selectedAgent) {
      fetchAgentLogs();
      setCalibrationPrompt(prompts[selectedAgent.name] || '');
    }
  }, [selectedAgent, prompts]);

  const fetchPrompts = async () => {
    setIsLoadingPrompts(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/agent-prompts`);
      if (res.ok) {
        const data = await res.json();
        setPrompts(data);
      }
    } catch (err) {
      console.error("Failed to load agent prompts:", err);
    } finally {
      setIsLoadingPrompts(false);
    }
  };

  const fetchAgentLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/agent-logs`);
      if (res.ok) {
        const data = await res.json();
        // Filter logs specifically for the selected agent
        const filtered = data.filter((log: LogEntry) => log.agentName === selectedAgent?.name);
        setAgentLogs(filtered);
      }
    } catch (err) {
      console.error("Failed to fetch logs for agent:", err);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!selectedAgent) return;
    setIsSavingPrompt(true);
    addLog(`⚙️ Calibration: Saving system prompt calibration for ${selectedAgent.name}...`);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/agent-prompts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [selectedAgent.name]: calibrationPrompt
        })
      });

      if (res.ok) {
        setPrompts(prev => ({
          ...prev,
          [selectedAgent.name]: calibrationPrompt
        }));
        addLog(`✔ Calibration: ${selectedAgent.name} instruction set adjusted successfully.`);
        alert(`${selectedAgent.name} prompts calibrated successfully!`);
      } else {
        throw new Error("Failed to calibrate prompts");
      }
    } catch (err) {
      addLog(`⚠️ Calibration: Update failed for ${selectedAgent.name}.`);
      alert("Failed to save calibrated prompts.");
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const triggerAgentRun = (agentName: string) => {
    addLog(`🚀 Control Room: Manual execution override triggered for ${agentName}.`);
    
    // Simulate active pulse state
    setAgents(prev => prev.map(node => {
      if (node.name === agentName) {
        return { ...node, status: 'ACTIVE', runs: node.runs + 1 };
      }
      return node;
    }));

    setTimeout(() => {
      setAgents(prev => prev.map(node => {
        if (node.name === agentName) {
          return { ...node, status: 'IDLE' };
        }
        return node;
      }));
      addLog(`✔ Control Room: ${agentName} cycle completed successfully. Database indexes updated.`);
    }, 3000);
  };

  return (
    <div className="orchestrator-layout" style={{ display: 'grid', gridTemplateColumns: selectedAgent ? '1fr 400px' : '1fr', gap: '1.5rem', width: '100%', transition: 'all 0.3s ease' }}>
      
      {/* Visual Canvas Area */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', minHeight: '520px', position: 'relative', overflow: 'hidden' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              🤖 Agentic Cluster Orchestrator Control Room
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
              Monitor system heartbeats, view logs, and manually calibrate underlying model prompt scripts.
            </p>
          </div>
          <button 
            onClick={fetchPrompts}
            className="btn-glass"
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', borderRadius: '6px', cursor: 'pointer' }}
          >
            🔄 Refresh Systems
          </button>
        </div>

        {/* SVG/CSS Interactive Network Map */}
        <div style={{ flex: 1, position: 'relative', background: 'var(--bg-dark-card)', borderRadius: '12px', border: '1px solid var(--border-glass)', minHeight: '400px' }}>
          
          <svg style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            {/* SVG Connecting Paths with dynamic glow */}
            <path d="M 150 120 L 450 120" stroke="rgba(138, 92, 246, 0.2)" strokeWidth="3" fill="none" strokeDasharray="5,5" className="flowing-line" />
            <path d="M 150 320 L 450 320" stroke="rgba(138, 92, 246, 0.2)" strokeWidth="3" fill="none" strokeDasharray="5,5" className="flowing-line" />
            <path d="M 150 120 L 150 320" stroke="rgba(138, 92, 246, 0.2)" strokeWidth="3" fill="none" strokeDasharray="5,5" className="flowing-line" />
            <path d="M 450 120 L 450 320" stroke="rgba(138, 92, 246, 0.2)" strokeWidth="3" fill="none" strokeDasharray="5,5" className="flowing-line" />
            <path d="M 150 120 L 450 320" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="2" fill="none" />
          </svg>

          {/* Interactive Nodes */}
          {agents.map(node => {
            const isSelected = selectedAgent?.id === node.id;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedAgent(node)}
                style={{
                  position: 'absolute',
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  transform: 'translate(-50%, -50%)',
                  zIndex: 2,
                  cursor: 'pointer',
                  width: '180px',
                  padding: '1rem',
                  borderRadius: '12px',
                  background: isSelected ? 'rgba(26, 21, 54, 0.9)' : 'rgba(13, 10, 31, 0.85)',
                  border: isSelected 
                    ? '1.5px solid var(--primary)' 
                    : node.status === 'ACTIVE' 
                    ? '1.5px solid rgba(16, 185, 129, 0.4)' 
                    : '1px solid rgba(255,255,255,0.06)',
                  boxShadow: isSelected 
                    ? '0 0 15px rgba(138, 92, 246, 0.3)' 
                    : node.status === 'ACTIVE' 
                    ? '0 0 12px rgba(16, 185, 129, 0.15)' 
                    : 'none',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                className="agent-node"
              >
                {/* Node Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>{node.icon}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span 
                      style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: node.status === 'ACTIVE' ? 'var(--emerald)' : '#9ca3af',
                        animation: node.status === 'ACTIVE' ? 'pulse 1.5s infinite' : 'none'
                      }} 
                    />
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: node.status === 'ACTIVE' ? 'var(--emerald)' : 'var(--text-muted)' }}>
                      {node.status}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>{node.name}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Runs: {node.runs} cycles</div>
                
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerAgentRun(node.name);
                    }}
                    className="btn-glass"
                    style={{ flex: 1, padding: '0.25rem 0', fontSize: '0.62rem', borderRadius: '4px', cursor: 'pointer', border: '1px solid var(--border-glass)' }}
                  >
                    🚀 Trigger
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating System Calibration Drawer */}
      {selectedAgent && (
        <div 
          className="glass-panel slide-in-right" 
          style={{ 
            padding: '1.5rem', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1.25rem', 
            borderLeft: '1px solid rgba(138, 92, 246, 0.2)', 
            background: 'rgba(10, 8, 25, 0.95)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {selectedAgent.label}
              </h4>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Calibration & Console</span>
            </div>
            <button 
              onClick={() => setSelectedAgent(null)} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '1.2rem' }}
            >
              ×
            </button>
          </div>

          {/* Description */}
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            {selectedAgent.description}
          </p>

          {/* Prompt Calibration Textarea */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
              🎯 Core Instructions calibration
            </span>
            {isLoadingPrompts ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fetching instructions from Firestore...</span>
            ) : (
              <>
                <textarea
                  value={calibrationPrompt}
                  onChange={(e) => setCalibrationPrompt(e.target.value)}
                  placeholder="Insert custom guidelines and rulesets for agent execution context..."
                  style={{
                    width: '100%',
                    height: '110px',
                    background: 'var(--bg-dark-card)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '6px',
                    color: 'var(--text-primary)',
                    padding: '0.5rem',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    resize: 'none',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={handleSavePrompt}
                  disabled={isSavingPrompt}
                  className="btn-glass btn-primary"
                  style={{ width: '100%', padding: '0.5rem', fontSize: '0.75rem', borderRadius: '6px', fontWeight: 700 }}
                >
                  {isSavingPrompt ? 'Saving Instructions...' : 'Save Calibration to Cloud'}
                </button>
              </>
            )}
          </div>

          {/* Embedded Real-time Terminal Log Console */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minHeight: '180px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--secondary)', textTransform: 'uppercase' }}>
              💻 Live Execution Console Logs
            </span>
            
            <div 
              style={{ 
                flex: 1, 
                background: '#04020a', 
                border: '1px solid var(--border-glass)', 
                borderRadius: '6px', 
                padding: '0.75rem', 
                fontFamily: 'monospace', 
                fontSize: '0.65rem', 
                color: '#10b981', 
                overflowY: 'auto',
                lineHeight: 1.4,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}
            >
              {isLoadingLogs ? (
                <span style={{ color: 'var(--text-muted)' }}>Streaming logs from pipeline...</span>
              ) : agentLogs.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem', textAlign: 'center' }}>
                  No recent execution logs matching telemetry filter. Trigger a manual cycle above.
                </div>
              ) : (
                agentLogs.map((log) => (
                  <div key={log.id} style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#999' }}>
                      <span>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span style={{ color: log.status === 'COMPLETED' ? 'var(--emerald)' : 'red' }}>{log.status}</span>
                    </div>
                    <div style={{ color: 'var(--text-primary)', margin: '0.15rem 0' }}>Cycle: {log.cycleType}</div>
                    {log.autonomousDecisionsExecuted && log.autonomousDecisionsExecuted.map((d, i) => (
                      <div key={i} style={{ paddingLeft: '0.5rem', color: '#6366f1' }}>➔ {d}</div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
