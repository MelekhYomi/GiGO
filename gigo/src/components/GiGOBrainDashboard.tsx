import React, { useState } from 'react';

export interface GiGOBrainDashboardProps {
  profile: any;
  userId: string;
  API_BASE_URL: string;
  brainSyncPercentage: number;
  isAnalyzingGaps: boolean;
  aiCareerGaps: any[];
  cognitiveGaps: any[];
  isSavingProfileVault: boolean;
  handleSaveProfileVault: () => void;
  isGeneratingCoverLetter: boolean;
  isGeneratingCV: boolean;
  isGeneratingPortfolio: boolean;
  generatedCoverLetter: string | null;
  compiledDocuments: any[];
  isCalibrating: boolean;
  handleCalibrateBehavioral: (dilemmaId: string, question: string, userResponse: string) => void;
  activeCalibratedFeedback: {
    toneAnalysis: string;
    decisionStyle: string;
    feedback: string;
    cognitiveBoost: number;
    behavioralBoost: number;
  } | null;
  setActiveCalibratedFeedback: (val: any) => void;

  // Wizard form states & setters (passed from parent to maintain Firestore sync)
  wizardWorkHistory: any[];
  setWizardWorkHistory: React.Dispatch<React.SetStateAction<any[]>>;
  wizardEducationList: any[];
  setWizardEducationList: React.Dispatch<React.SetStateAction<any[]>>;
  wizardMaritalStatus: string;
  setWizardMaritalStatus: (val: string) => void;
  wizardDob: string;
  setWizardDob: (val: string) => void;
  wizardAddress: string;
  setWizardAddress: (val: string) => void;
  wizardHobbies: string;
  setWizardHobbies: (val: string) => void;
  wizardStrengths: string;
  setWizardStrengths: (val: string) => void;
  wizardSoftSkills: string;
  setWizardSoftSkills: (val: string) => void;
  wizardTeamworkExperience: string;
  setWizardTeamworkExperience: (val: string) => void;
  wizardConflictResolution: string;
  setWizardConflictResolution: (val: string) => void;

  // Gap enrichment callbacks
  setBrainEnrichStatement: (val: string) => void;
  setActiveGapToFeed: (val: string) => void;
  setActiveGapQuestion: (val: string) => void;
  setShowBrainEnrichModal: (val: boolean) => void;
}

export const GiGOBrainDashboard: React.FC<GiGOBrainDashboardProps> = ({
  profile,
  userId,
  API_BASE_URL,
  brainSyncPercentage,
  isAnalyzingGaps,
  aiCareerGaps,
  cognitiveGaps,
  isSavingProfileVault,
  handleSaveProfileVault,
  isGeneratingCoverLetter,
  isGeneratingCV,
  isGeneratingPortfolio,
  generatedCoverLetter,
  compiledDocuments,
  isCalibrating,
  handleCalibrateBehavioral,
  activeCalibratedFeedback,
  setActiveCalibratedFeedback,

  // Wizard states
  wizardWorkHistory,
  setWizardWorkHistory,
  wizardEducationList,
  setWizardEducationList,
  wizardMaritalStatus,
  setWizardMaritalStatus,
  wizardDob,
  setWizardDob,
  wizardAddress,
  setWizardAddress,
  wizardHobbies,
  setWizardHobbies,
  wizardStrengths,
  setWizardStrengths,
  wizardSoftSkills,
  setWizardSoftSkills,
  wizardTeamworkExperience,
  setWizardTeamworkExperience,
  wizardConflictResolution,
  setWizardConflictResolution,

  // Gap enrichment callbacks
  setBrainEnrichStatement,
  setActiveGapToFeed,
  setActiveGapQuestion,
  setShowBrainEnrichModal
}) => {
  // Mind Clone chat state
  const [brainChatMessages, setBrainChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [brainChatInput, setBrainChatInput] = useState('');
  const [isBrainChatSending, setIsBrainChatSending] = useState(false);

  // Document archive: edit-in-place + JPEG download. Local overrides layer on top
  // of the compiledDocuments prop so a save reflects immediately without needing
  // a full parent refetch.
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [documentOverrides, setDocumentOverrides] = useState<Record<string, { content: string }>>({});

  const startEditingDoc = (doc: any) => {
    setEditingDocId(doc.id);
    setEditContent(documentOverrides[doc.id]?.content ?? doc.content);
  };

  const saveDocEdit = async (docId: string) => {
    setIsSavingEdit(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      });
      if (res.ok) {
        setDocumentOverrides(prev => ({ ...prev, [docId]: { content: editContent } }));
        setEditingDocId(null);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to save changes.");
      }
    } catch (err: any) {
      alert(`Network error saving document: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const downloadDocJpeg = (docId: string, filenameHint: string) => {
    const a = document.createElement('a');
    a.href = `${API_BASE_URL}/api/users/${userId}/documents/${docId}/download-jpeg`;
    a.download = `${filenameHint.replace(/\s+/g, '_')}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const sendMindCloneMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBrainChatSending) return;
    const history = brainChatMessages;
    setBrainChatMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setBrainChatInput('');
    setIsBrainChatSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/mind-clone-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history })
      });
      const data = await res.json();
      if (res.ok) {
        setBrainChatMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        setBrainChatMessages(prev => [...prev, { role: 'assistant', text: `⚠️ ${data.error || 'Mind Clone is unavailable right now.'}` }]);
      }
    } catch (err: any) {
      setBrainChatMessages(prev => [...prev, { role: 'assistant', text: '⚠️ Network error reaching your Mind Clone.' }]);
    } finally {
      setIsBrainChatSending(false);
    }
  };

  // Local Cloner Navigation & Calibration States
  const [clonerSubTab, setClonerSubTab] = useState<'calibrate' | 'profile' | 'history' | 'docs'>('calibrate');
  const [activeWizardStep, setActiveWizardStep] = useState<'work_edu' | 'personal' | 'behavioral'>('work_edu');
  const [calibrationDilemmaIndex, setCalibrationDilemmaIndex] = useState<number>(0);
  const [calibrationResponseText, setCalibrationResponseText] = useState<string>('');

  // Local helper form-states (kept self-contained)
  const [newJobCompany, setNewJobCompany] = useState<string>('');
  const [newJobRole, setNewJobRole] = useState<string>('');
  const [newJobStart, setNewJobStart] = useState<string>('');
  const [newJobEnd, setNewJobEnd] = useState<string>('');
  const [newJobAchievements, setNewJobAchievements] = useState<string>('');

  const [newSchoolName, setNewSchoolName] = useState<string>('');
  const [newSchoolDegree, setNewSchoolDegree] = useState<string>('');
  const [newSchoolField, setNewSchoolField] = useState<string>('');
  const [newSchoolYear, setNewSchoolYear] = useState<string>('');

  const clonerDilemmas = [
    {
      id: 'crisis_sla',
      title: 'Crisis Resolution SLA',
      question: 'A fellow team member consistently misses ticket SLAs, causing backlog creep. How do you handle it?'
    },
    {
      id: 'boundary_shift',
      title: 'Boundary Shift Dilemma',
      question: 'An important customer requests a major project change late in the cycle. How do you respond?'
    },
    {
      id: 'ambiguous_backlog',
      title: 'Ambiguous Backlog',
      question: "You are assigned a critical ticket on a legacy system you've never touched before. What is your immediate action plan?"
    }
  ];

  const activeDilemma = clonerDilemmas[calibrationDilemmaIndex] || clonerDilemmas[0];
  const axes = profile.calibrationAxes || { cognitive: 65, credential: 55, behavioral: 60, operational: 70 };

  const confidenceScore = Math.round((axes.behavioral + axes.operational) / 2);
  const calibrationCount = (profile.calibrationHistory || []).length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* GiGO Brain Hero */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Welcome back</span>
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>GiGO Brain</h2>
          </div>
          <span className="badge badge-emerald" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span className="dot-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span> Live sync
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(138, 92, 246, 0.06)', borderRadius: '14px', border: '1px solid rgba(138, 92, 246, 0.15)' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>🧠</div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {brainSyncPercentage >= 90 ? 'Mind Clone has mastered your patterns' : 'Mind Clone is learning your patterns'}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              {brainSyncPercentage >= 90
                ? "Fully synced across your speaking style, experience, and workplace decisions."
                : "Synchronizing your speaking style, experience, and workplace decisions."}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem', marginTop: '1rem' }}>
          <div style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Brain sync</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{brainSyncPercentage >= 90 ? 'Stable' : 'Syncing'}</div>
          </div>
          <div style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Learning</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{isAnalyzingGaps ? 'Active' : 'Idle'}</div>
          </div>
          <div style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>Confidence</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>{confidenceScore >= 75 ? 'High' : confidenceScore >= 50 ? 'Medium' : 'Low'}</div>
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${brainSyncPercentage}%`, background: 'linear-gradient(90deg, var(--primary), var(--secondary), #10b981)', transition: 'width 0.5s ease' }}></div>
          </div>
        </div>
      </div>

      {/* Learning progress + Career confidence score */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Learning progress</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>{brainSyncPercentage}%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.4rem', height: '48px' }}>
            {[axes.cognitive, axes.credential, axes.behavioral, axes.operational].map((val, i) => (
              <div key={i} style={{
                flex: 1,
                height: `${Math.max(val, 6)}%`,
                background: i % 2 === 0 ? 'var(--primary)' : '#10b981',
                borderRadius: '4px 4px 0 0',
                opacity: 0.85
              }} />
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', flexShrink: 0,
            background: `conic-gradient(#10b981 ${confidenceScore}%, rgba(255,255,255,0.05) ${confidenceScore}%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#0a0816', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
              {confidenceScore}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Career confidence score</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Based on workplace decisions & account setup sync</div>
          </div>
        </div>
      </div>

      <main className="brain-widescreen-grid">
      {/* Left Column: 4-Axis Fidelity Metrics, Cognitive Gap Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <h5 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
              🧬 Profile Matching Strengths
            </h5>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {/* Axis 1: Cognitive Dialect */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.15rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--cyan)' }}>💬 Speaking Style (How You Talk)</span>
                  <span style={{ fontWeight: 800, color: 'var(--cyan)' }}>{axes.cognitive}% Sync</span>
                </div>
                <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${axes.cognitive}%`, background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)', transition: 'width 0.5s ease' }}></div>
                </div>
              </div>

              {/* Axis 2: Credential Depth */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.15rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>📜 Experience & Education</span>
                  <span style={{ fontWeight: 800, color: 'var(--secondary)' }}>{axes.credential}% Sync</span>
                </div>
                <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${axes.credential}%`, background: 'var(--secondary)', boxShadow: '0 0 8px var(--secondary)', transition: 'width 0.5s ease' }}></div>
                </div>
              </div>

              {/* Axis 3: Behavioral Signature */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.15rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>🧠 Workplace Decisions</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{axes.behavioral}% Sync</span>
                </div>
                <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${axes.behavioral}%`, background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)', transition: 'width 0.5s ease' }}></div>
                </div>
              </div>

              {/* Axis 4: Operational Sync */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.15rem' }}>
                  <span style={{ fontWeight: 700, color: '#10b981' }}>🔌 Account Setup (Location & Settings)</span>
                  <span style={{ fontWeight: 800, color: '#10b981' }}>{axes.operational}% Sync</span>
                </div>
                <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${axes.operational}%`, background: '#10b981', boxShadow: '0 0 8px #10b981', transition: 'width 0.5s ease' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Adaptive Cognitive Gaps (Always show at bottom of GiGO Brain tab) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h5 style={{ margin: 0, fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>🧠 Knowledge Gaps</h5>
            <button 
              type="button" 
              onClick={() => {
                setBrainEnrichStatement('');
                setActiveGapToFeed('');
                setActiveGapQuestion('');
                setShowBrainEnrichModal(true);
              }}
              style={{
                background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.68rem', cursor: 'pointer'
              }}
            >
              ➕ Add Details
            </button>
          </div>

          {isAnalyzingGaps ? (
            <div className="cyber-scanner-container" style={{ padding: '1rem' }}>
              <div className="cyber-scanner-grid" />
              <div className="cyber-scanner-line" />
              <div className="cyber-scanner-radar">
                <span style={{ fontSize: '1.25rem', animation: 'float 2s infinite' }}>🧠</span>
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em', animation: 'pulseGlow 1.5s infinite' }}>
                FINDING CAREER PATHS...
              </div>
              <div style={{ fontSize: '0.52rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                Mapping standard industry requirements for {profile.role}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '0.2rem' }}>
              {(() => {
                const activeGaps = aiCareerGaps.length > 0 ? aiCareerGaps : cognitiveGaps;
                if (activeGaps.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.7rem' }} className="glass-card">
                      Zero cognitive gaps detected. Your personalized AI model is perfectly synchronized with active market demand!
                    </div>
                  );
                }
                return activeGaps.map((gap, index) => {
                  const isHigh = 'priority' in gap ? gap.priority === 'high' : true;
                  const priorityText = 'priority' in gap ? gap.priority : 'medium';
                  return (
                    <div 
                      key={index} 
                      className="glass-card" 
                      style={{ 
                        padding: '0.4rem 0.6rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.2rem',
                        borderLeft: isHigh ? '2px solid var(--rose)' : '2px solid var(--primary-glow)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                          <span className="badge badge-purple" style={{ fontSize: '0.52rem', padding: '0.05rem 0.2rem', fontWeight: 800 }}>
                            {gap.skill}
                          </span>
                          <span className={`badge ${isHigh ? 'badge-pink' : 'badge-amber'}`} style={{ fontSize: '0.42rem', padding: '0.02rem 0.15rem', fontWeight: 800 }}>
                            {priorityText}
                          </span>
                        </div>
                        <button 
                          type="button"
                          className="btn-glass"
                          style={{ padding: '0.1rem 0.25rem', fontSize: '0.52rem', fontWeight: 700, color: 'var(--primary)' }}
                          onClick={() => {
                            setActiveGapToFeed(gap.skill);
                            setActiveGapQuestion(gap.question);
                            setBrainEnrichStatement('');
                            setShowBrainEnrichModal(true);
                          }}
                        >
                          Add Details
                        </button>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: '0.85rem' }}>
                        {gap.reason}
                      </p>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Profile Wizard Form, Calibration dilemmas console, Compiled documents list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Segment Navigation Control */}
          <div style={{ 
            display: 'flex', 
            gap: '0.35rem', 
            background: 'rgba(255, 255, 255, 0.02)', 
            padding: '0.3rem', 
            borderRadius: '10px', 
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
            marginBottom: '0.5rem'
          }}>
            <button 
              type="button" 
              onClick={() => {
                setClonerSubTab('calibrate');
                setActiveCalibratedFeedback(null);
              }}
              style={{ 
                flex: 1, 
                padding: '0.5rem 0.25rem', 
                borderRadius: '8px', 
                border: 'none', 
                background: clonerSubTab === 'calibrate' ? 'var(--primary)' : 'transparent', 
                color: clonerSubTab === 'calibrate' ? 'var(--text-primary)' : 'var(--text-secondary)', 
                fontSize: '0.7rem', 
                fontWeight: 800, 
                cursor: 'pointer', 
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
              }}
            >
              🧠 Workplace Decisions Practice
            </button>
            <button 
              type="button" 
              onClick={() => setClonerSubTab('profile')}
              style={{ 
                flex: 1, 
                padding: '0.5rem 0.25rem', 
                borderRadius: '8px', 
                border: 'none', 
                background: clonerSubTab === 'profile' ? 'var(--primary)' : 'transparent', 
                color: clonerSubTab === 'profile' ? 'var(--text-primary)' : 'var(--text-secondary)', 
                fontSize: '0.7rem', 
                fontWeight: 800, 
                cursor: 'pointer', 
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
              }}
            >
              🧬 My Career Profile
            </button>
            <button 
              type="button" 
              onClick={() => setClonerSubTab('history')}
              style={{ 
                flex: 1, 
                padding: '0.5rem 0.25rem', 
                borderRadius: '8px', 
                border: 'none', 
                background: clonerSubTab === 'history' ? 'var(--primary)' : 'transparent', 
                color: clonerSubTab === 'history' ? 'var(--text-primary)' : 'var(--text-secondary)', 
                fontSize: '0.7rem', 
                fontWeight: 800, 
                cursor: 'pointer', 
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
              }}
            >
              📜 Calibration History
            </button>
            <button 
              type="button" 
              onClick={() => setClonerSubTab('docs')}
              style={{ 
                flex: 1, 
                padding: '0.5rem 0.25rem', 
                borderRadius: '8px', 
                border: 'none', 
                background: clonerSubTab === 'docs' ? 'var(--primary)' : 'transparent', 
                color: clonerSubTab === 'docs' ? 'var(--text-primary)' : 'var(--text-secondary)', 
                fontSize: '0.7rem', 
                fontWeight: 800, 
                cursor: 'pointer', 
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
              }}
            >
              📁 My Documents
            </button>
          </div>

          {clonerSubTab === 'calibrate' && (
            <div className="glass-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h5 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                  ⚡ Practice Work Scenarios
                </h5>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Dilemma {calibrationDilemmaIndex + 1} / 3
                </span>
              </div>

              {/* Selector Steps */}
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {clonerDilemmas.map((d, index) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setCalibrationDilemmaIndex(index);
                      setActiveCalibratedFeedback(null);
                      setCalibrationResponseText('');
                    }}
                    className="btn-glass"
                    style={{
                      flex: 1,
                      padding: '0.35rem',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      background: calibrationDilemmaIndex === index ? 'rgba(138,92,246,0.15)' : 'rgba(255,255,255,0.02)',
                      border: calibrationDilemmaIndex === index ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                      color: calibrationDilemmaIndex === index ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}
                  >
                    {d.title}
                  </button>
                ))}
              </div>

              {/* Dilemma Prompt Card */}
              <div style={{ padding: '0.65rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.8rem' }}>⚠️</span>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>Workplace Scenario</span>
                </div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 600, lineHeight: '1rem' }}>
                  {activeDilemma.question}
                </p>
              </div>

              {/* Quick Voice / Speech Simulator Tags */}
              <div>
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                  🎙️ Example Answers
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <button
                    type="button"
                    onClick={() => setCalibrationResponseText("I schedule a 1-on-1 first to understand what barriers they are facing. If it is high workloads, I offer team help. It is critical to collaborate and handle things with empathy, resolving mutual friction rather than immediate escalation.")}
                    className="btn-glass"
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.3rem 0.5rem', fontSize: '0.62rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    🤝 <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>Friendly & Collaborative Answer:</span> "Collaborate first with empathy..."
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalibrationResponseText("I check the historic performance metrics and diagnostic logs immediately to inspect backlog creep. I then run standard test cycles, review missing SLAs, and compile structured priority guidelines to defend system SLA targets objectively.")}
                    className="btn-glass"
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.3rem 0.5rem', fontSize: '0.62rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    📊 <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>Logical & Data-Driven Answer:</span> "Check logs and run diagnostic metrics..."
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalibrationResponseText("I take immediate triage action to resolve this backlog quick. Restoring business continuity and SLA uptime is priority number one. We fix the issue, mitigate customer impact, and schedule standard retrospective reviews afterward.")}
                    className="btn-glass"
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.3rem 0.5rem', fontSize: '0.62rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    ⚡ <span style={{ color: 'var(--rose)', fontWeight: 700 }}>Action-Oriented & Direct Answer:</span> "Take immediate uptime triage..."
                  </button>
                </div>
              </div>

              {/* Text Response Control */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Type your own answer or choose an example answer above</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Type how you would handle this scenario. Provide details about your strategy to get higher sync boosts..."
                  value={calibrationResponseText}
                  onChange={(e) => setCalibrationResponseText(e.target.value)}
                  style={{ fontSize: '0.72rem', background: '#090715', color: 'var(--text-primary)', resize: 'none' }}
                />
              </div>

              {/* Action Calibration Button */}
              <button
                type="button"
                disabled={isCalibrating}
                onClick={() => handleCalibrateBehavioral(activeDilemma.id, activeDilemma.question, calibrationResponseText)}
                className="btn-glass btn-primary"
                style={{
                  padding: '0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  justifyContent: 'center',
                  borderRadius: '8px',
                  background: isCalibrating ? 'rgba(255,255,255,0.1)' : 'var(--primary)'
                }}
              >
                {isCalibrating ? '⚡ Analyzing your response style...' : '🎙️ Test Answer'}
              </button>

              {/* Scanning Radar Simulator Animation */}
              {isCalibrating && (
                <div className="cyber-scanner-container" style={{ padding: '1rem', marginTop: '0.1rem' }}>
                  <div className="cyber-scanner-grid" />
                  <div className="cyber-scanner-line" />
                  <div className="cyber-scanner-radar">
                    <span style={{ fontSize: '1.25rem', animation: 'float 2s infinite' }}>🧠</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', animation: 'pulseGlow 1.5s infinite' }}>
                    Analyzing response language...
                  </div>
                </div>
              )}

              {/* Feedback Overlay Panel */}
              {activeCalibratedFeedback && !isCalibrating && (
                <div style={{ 
                  padding: '0.75rem', 
                  background: 'rgba(138, 92, 246, 0.08)', 
                  border: '1px solid rgba(138, 92, 246, 0.25)', 
                  borderRadius: '10px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.4rem',
                  animation: 'fade-in 0.3s'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge-purple" style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem', fontWeight: 800 }}>
                      👤 Communication Style: {activeCalibratedFeedback.toneAnalysis}
                    </span>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10b981' }}>
                      +{activeCalibratedFeedback.cognitiveBoost}% Cog • +{activeCalibratedFeedback.behavioralBoost}% Beh
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: '0.95rem' }}>
                    <strong>Decision Profile:</strong> {activeCalibratedFeedback.decisionStyle}
                  </p>
                  <div style={{ padding: '0.45rem', background: '#060410', borderLeft: '2px solid var(--primary)', borderRadius: '4px', fontSize: '0.65rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: '0.9rem' }}>
                    " {activeCalibratedFeedback.feedback} "
                  </div>
                </div>
              )}
            </div>
          )}

          {clonerSubTab === 'profile' && (
            <div className="glass-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              {/* Wizard Tab Controller */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--secondary)' }}>🧬 Complete Your Career Profile</span>
                <div style={{ display: 'flex', gap: '0.2rem' }}>
                  <button
                    type="button"
                    onClick={() => setActiveWizardStep('work_edu')}
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.6rem', fontWeight: 800, border: 'none', borderRadius: '4px', background: activeWizardStep === 'work_edu' ? 'var(--secondary)' : 'rgba(255,255,255,0.02)', color: 'var(--text-primary)', cursor: 'pointer' }}
                  >
                    💼 Experience
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWizardStep('personal')}
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.6rem', fontWeight: 800, border: 'none', borderRadius: '4px', background: activeWizardStep === 'personal' ? 'var(--secondary)' : 'rgba(255,255,255,0.02)', color: 'var(--text-primary)', cursor: 'pointer' }}
                  >
                    👤 Bio
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveWizardStep('behavioral')}
                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.6rem', fontWeight: 800, border: 'none', borderRadius: '4px', background: activeWizardStep === 'behavioral' ? 'var(--secondary)' : 'rgba(255,255,255,0.02)', color: 'var(--text-primary)', cursor: 'pointer' }}
                  >
                    🧠 Preferences
                  </button>
                </div>
              </div>

              {/* STEP 1: CAREER AND EDUCATION */}
              {activeWizardStep === 'work_edu' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  {/* Work History Sub-Panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>💼 Work Experience</div>
                    
                    {/* Listed positions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '120px', overflowY: 'auto', paddingRight: '0.15rem' }}>
                      {wizardWorkHistory.length === 0 ? (
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No professional positions added yet.</span>
                      ) : (
                        wizardWorkHistory.map((job, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.4rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div>
                              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-primary)' }}>{job.role} @ {job.company}</div>
                              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{job.startDate} - {job.endDate}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = wizardWorkHistory.filter((_, idx) => idx !== i);
                                setWizardWorkHistory(updated);
                              }}
                              style={{ border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.6rem', fontWeight: 800, padding: '0.2rem 0.35rem', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Delete
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Position Form */}
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--secondary)' }}>➕ Add Work Experience</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                        <input 
                          type="text" 
                          placeholder="Company" 
                          value={newJobCompany} 
                          onChange={e => setNewJobCompany(e.target.value)} 
                          style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                        />
                        <input 
                          type="text" 
                          placeholder="Role" 
                          value={newJobRole} 
                          onChange={e => setNewJobRole(e.target.value)} 
                          style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                        <input 
                          type="text" 
                          placeholder="Start (e.g. 2021)" 
                          value={newJobStart} 
                          onChange={e => setNewJobStart(e.target.value)} 
                          style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                        />
                        <input 
                          type="text" 
                          placeholder="End (e.g. Present)" 
                          value={newJobEnd} 
                          onChange={e => setNewJobEnd(e.target.value)} 
                          style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                        />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Key Achievements (comma separated highlights)" 
                        value={newJobAchievements} 
                        onChange={e => setNewJobAchievements(e.target.value)} 
                        style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newJobCompany || !newJobRole) {
                            alert("Company and Role are required.");
                            return;
                          }
                          setWizardWorkHistory(prev => [...prev, { company: newJobCompany, role: newJobRole, startDate: newJobStart, endDate: newJobEnd, achievements: newJobAchievements }]);
                          setNewJobCompany('');
                          setNewJobRole('');
                          setNewJobStart('');
                          setNewJobEnd('');
                          setNewJobAchievements('');
                        }}
                        className="btn-glass"
                        style={{ padding: '0.25rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', border: '1px solid rgba(138,92,246,0.3)', width: '100%', justifyContent: 'center' }}
                      >
                        Save Job
                      </button>
                    </div>
                  </div>

                  {/* Education Sub-Panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>🎓 Education & Certificates</div>
                    
                    {/* Listed education */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '120px', overflowY: 'auto', paddingRight: '0.15rem' }}>
                      {wizardEducationList.length === 0 ? (
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No academic degrees listed yet.</span>
                      ) : (
                        wizardEducationList.map((edu, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.4rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div>
                              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-primary)' }}>{edu.degree} in {edu.fieldOfStudy}</div>
                              <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{edu.institution} • {edu.gradYear}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = wizardEducationList.filter((_, idx) => idx !== i);
                                setWizardEducationList(updated);
                              }}
                              style={{ border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.6rem', fontWeight: 800, padding: '0.2rem 0.35rem', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              Delete
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Education Form */}
                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--secondary)' }}>➕ Add School or Course</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                        <input 
                          type="text" 
                          placeholder="Institution Name" 
                          value={newSchoolName} 
                          onChange={e => setNewSchoolName(e.target.value)} 
                          style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                        />
                        <input 
                          type="text" 
                          placeholder="Degree (e.g. BSc)" 
                          value={newSchoolDegree} 
                          onChange={e => setNewSchoolDegree(e.target.value)} 
                          style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.3rem' }}>
                        <input 
                          type="text" 
                          placeholder="Field of Study (e.g. Computer Sci)" 
                          value={newSchoolField} 
                          onChange={e => setNewSchoolField(e.target.value)} 
                          style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                        />
                        <input 
                          type="text" 
                          placeholder="Grad Year (2020)" 
                          value={newSchoolYear} 
                          onChange={e => setNewSchoolYear(e.target.value)} 
                          style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newSchoolName || !newSchoolDegree) {
                            alert("Institution and Degree are required.");
                            return;
                          }
                          setWizardEducationList(prev => [...prev, { institution: newSchoolName, degree: newSchoolDegree, fieldOfStudy: newSchoolField, gradYear: newSchoolYear }]);
                          setNewSchoolName('');
                          setNewSchoolDegree('');
                          setNewSchoolField('');
                          setNewSchoolYear('');
                        }}
                        className="btn-glass"
                        style={{ padding: '0.25rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', border: '1px solid rgba(138,92,246,0.3)', width: '100%', justifyContent: 'center' }}
                      >
                        Save School
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* STEP 2: PERSONAL BIO DETAILS */}
              {activeWizardStep === 'personal' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>👤 Personal Bio & Demographics</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Date of Birth</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={wizardDob} 
                        onChange={e => setWizardDob(e.target.value)} 
                        style={{ fontSize: '0.7rem', background: '#090715', color: 'var(--text-primary)' }} 
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Marital Status</label>
                      <select 
                        className="form-control" 
                        value={wizardMaritalStatus} 
                        onChange={e => setWizardMaritalStatus(e.target.value)} 
                        style={{ fontSize: '0.7rem', background: '#090715', color: 'var(--text-primary)', height: '36px' }}
                      >
                        <option value="">Select Status</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Married with Kids">Married with Kids</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Other">Other / Private</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Residential Address</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. 15 Ikoyi Link Road, Lagos, Nigeria" 
                      value={wizardAddress} 
                      onChange={e => setWizardAddress(e.target.value)} 
                      style={{ fontSize: '0.7rem', background: '#090715', color: 'var(--text-primary)' }} 
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Hobbies & Special Interests (comma separated)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Robotics, Hiking, Decentralized Ledgers" 
                      value={wizardHobbies} 
                      onChange={e => setWizardHobbies(e.target.value)} 
                      style={{ fontSize: '0.7rem', background: '#090715', color: 'var(--text-primary)' }} 
                    />
                  </div>
                </div>
              )}

              {/* STEP 3: BEHAVIORAL PROFILE */}
              {activeWizardStep === 'behavioral' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>🧠 Soft Skills & Behavioral Style</div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Professional Strengths</label>
                    <textarea 
                      className="form-control" 
                      rows={2}
                      placeholder="e.g. High focus under stress, methodical triage, proactive bottleneck mapping" 
                      value={wizardStrengths} 
                      onChange={e => setWizardStrengths(e.target.value)} 
                      style={{ fontSize: '0.68rem', background: '#090715', color: 'var(--text-primary)', resize: 'none' }} 
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Soft Skills Tag List (comma separated)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Empathy, Active Listening, Clear Written Communications" 
                      value={wizardSoftSkills} 
                      onChange={e => setWizardSoftSkills(e.target.value)} 
                      style={{ fontSize: '0.7rem', background: '#090715', color: 'var(--text-primary)' }} 
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Prior Teamwork & Leadership Experience</label>
                    <textarea 
                      className="form-control" 
                      rows={2}
                      placeholder="e.g. Guided 4 developers through SLA backlogs, coordinated agile sprints" 
                      value={wizardTeamworkExperience} 
                      onChange={e => setWizardTeamworkExperience(e.target.value)} 
                      style={{ fontSize: '0.68rem', background: '#090715', color: 'var(--text-primary)', resize: 'none' }} 
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Typical Conflict Resolution Approach</label>
                    <textarea 
                      className="form-control" 
                      rows={2}
                      placeholder="e.g. 1-on-1 alignment, identifying technical blockages objectively" 
                      value={wizardConflictResolution} 
                      onChange={e => setWizardConflictResolution(e.target.value)} 
                      style={{ fontSize: '0.68rem', background: '#090715', color: 'var(--text-primary)', resize: 'none' }} 
                    />
                  </div>
                </div>
              )}

              {/* Save Action Controller */}
              <button
                type="button"
                disabled={isSavingProfileVault}
                onClick={handleSaveProfileVault}
                className="btn-glass btn-secondary"
                style={{
                  padding: '0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  justifyContent: 'center',
                  borderRadius: '8px',
                  background: isSavingProfileVault ? 'rgba(255,255,255,0.1)' : 'var(--secondary)',
                  marginTop: '0.3rem'
                }}
              >
                {isSavingProfileVault ? '🧬 Saving Career Profile...' : '🧬 Save Career Profile'}
              </button>

            </div>
          )}

          {clonerSubTab === 'history' && (
            <div className="glass-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <h5 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                📜 Historical Calibration Records
              </h5>
              <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: '0.9rem' }}>
                Past workplace scenarios evaluated by the GiGO Calibration engine.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.15rem' }}>
                {(!profile.calibrationHistory || profile.calibrationHistory.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.7rem' }} className="glass-card">
                    No past calibration cycles recorded in this synapse directory. Speak or type responses to active dilemmas above.
                  </div>
                ) : (
                  [...profile.calibrationHistory].reverse().map((session, index) => (
                    <div key={index} className="glass-card" style={{ padding: '0.55rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--secondary)' }}>
                          {session.dilemmaId === 'crisis_sla' ? 'Crisis SLA Scenario' : session.dilemmaId === 'boundary_shift' ? 'Boundary Shift Scenario' : 'Legacy Backlog Scenario'}
                        </span>
                        <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                          {new Date(session.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-primary)', fontStyle: 'italic', background: 'rgba(0,0,0,0.15)', padding: '0.3rem', borderRadius: '4px', borderLeft: '2px solid var(--primary)', lineHeight: '0.85rem' }}>
                        "{session.userResponse}"
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6rem', marginTop: '0.1rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--cyan)' }}>Tone: {session.toneAnalysis}</span>
                        <span style={{ fontWeight: 800, color: '#10b981' }}>Fidelity Score: {session.scoreAfter}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {clonerSubTab === 'docs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
              <div className="transaction-panel" style={{ flex: 1, minHeight: '180px', maxHeight: '350px', overflowY: 'auto' }}>
                {isGeneratingCoverLetter && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', background: 'rgba(138, 92, 246, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--primary)', marginBottom: '1rem' }}>
                    <div className="spinner-micro" style={{ width: '20px', height: '20px', border: '2px solid rgba(255, 255, 255, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }}></div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>Compiling ATS Cover Letter...</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Debiting ₦400 NGN and running Gemini 2.5 Pro...</div>
                  </div>
                )}
                {isGeneratingCV && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', background: 'rgba(236, 72, 153, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--secondary)', marginBottom: '1rem' }}>
                    <div className="spinner-micro" style={{ width: '20px', height: '20px', border: '2px solid rgba(255, 255, 255, 0.1)', borderTopColor: 'var(--secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }}></div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>Compiling ATS CV / Resume...</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Debiting ₦500 NGN and running Gemini 2.5 Pro...</div>
                  </div>
                )}
                {isGeneratingPortfolio && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--emerald)', marginBottom: '1rem' }}>
                    <div className="spinner-micro" style={{ width: '20px', height: '20px', border: '2px solid rgba(255, 255, 255, 0.1)', borderTopColor: 'var(--emerald)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }}></div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>Compiling Case Portfolio...</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Debiting ₦600 NGN and running Gemini 2.5 Pro...</div>
                  </div>
                )}
                {generatedCoverLetter && (
                  <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>NEWLY COMPILED ASSET</span>
                      <button 
                        className="btn-glass" 
                        style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', color: '#f8fafc' }}
                        onClick={() => {
                          navigator.clipboard.writeText(generatedCoverLetter);
                          alert("Asset copied to clipboard!");
                        }}
                      >
                        Copy Text
                      </button>
                    </div>
                    <pre style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto', background: 'rgba(0, 0, 0, 0.2)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-glass)', fontFamily: 'monospace' }}>
                      {generatedCoverLetter}
                    </pre>
                  </div>
                )}
                {compiledDocuments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    No compiled ATS documents found.
                  </div>
                ) : (
                  compiledDocuments.map((rawDoc: any) => {
                    const doc = { ...rawDoc, content: documentOverrides[rawDoc.id]?.content ?? rawDoc.content };
                    const isEditing = editingDocId === doc.id;
                    return (
                    <div key={doc.id} className="transaction-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                            {doc.jobTitle}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>
                            {doc.companyName}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                            <span className={`badge ${doc.type === 'CV' ? 'badge-purple' : doc.type === 'PORTFOLIO' ? 'badge-emerald' : 'badge-pink'}`} style={{ fontSize: '0.55rem', padding: '0.1rem 0.35rem' }}>
                              {doc.type || 'COVER_LETTER'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button
                            className="btn-glass"
                            style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}
                            onClick={() => {
                              navigator.clipboard.writeText(doc.content);
                              alert("Asset copied to clipboard!");
                            }}
                          >
                            Copy
                          </button>
                          <button
                            className="btn-glass"
                            style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}
                            onClick={() => isEditing ? setEditingDocId(null) : startEditingDoc(doc)}
                          >
                            {isEditing ? 'Cancel' : 'Edit'}
                          </button>
                          <button
                            className="btn-glass"
                            style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}
                            onClick={() => downloadDocJpeg(doc.id, `${doc.type || 'Document'}_${doc.jobTitle}`)}
                          >
                            📥 JPEG
                          </button>
                        </div>
                      </div>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            style={{ fontSize: '0.7rem', color: '#fff', whiteSpace: 'pre-wrap', minHeight: '160px', background: 'rgba(0,0,0,0.25)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-glass)', fontFamily: 'monospace', resize: 'vertical' }}
                          />
                          <button
                            className="btn-glass btn-primary"
                            style={{ padding: '0.3rem 0.75rem', fontSize: '0.7rem', alignSelf: 'flex-start', fontWeight: 700 }}
                            disabled={isSavingEdit}
                            onClick={() => saveDocEdit(doc.id)}
                          >
                            {isSavingEdit ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      ) : (
                        <pre style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-glass)', fontFamily: 'monospace' }}>
                          {doc.content}
                        </pre>
                      )}
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                        Compiled: {new Date(doc.generatedAt).toLocaleString()}
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </main>

      {/* Ask your Mind Clone */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Ask your Mind Clone
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', minHeight: '120px', maxHeight: '360px', overflowY: 'auto', padding: '0.25rem' }}>
          {brainChatMessages.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', padding: '1rem 0', textAlign: 'center' }}>
              Ask your Mind Clone anything about how it's learning your profile.
            </div>
          ) : (
            brainChatMessages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.role === 'user' ? 'rgba(255,255,255,0.05)' : 'rgba(138, 92, 246, 0.12)',
                border: m.role === 'user' ? '1px solid var(--border-glass)' : '1px solid rgba(138, 92, 246, 0.25)',
                borderRadius: '12px',
                padding: '0.6rem 0.8rem',
                fontSize: '0.78rem',
                lineHeight: '1.4',
                whiteSpace: 'pre-wrap'
              }}>
                {m.role === 'assistant' && (
                  <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.2rem' }}>Mind Clone</div>
                )}
                {m.text}
              </div>
            ))
          )}
          {isBrainChatSending && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Mind Clone is thinking...</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Ask your Mind Clone"
            value={brainChatInput}
            onChange={(e) => setBrainChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !isBrainChatSending) sendMindCloneMessage(brainChatInput); }}
            style={{ flex: 1, fontSize: '0.8rem' }}
            disabled={isBrainChatSending}
          />
          <button
            className="btn-glass btn-primary"
            onClick={() => sendMindCloneMessage(brainChatInput)}
            disabled={isBrainChatSending || !brainChatInput.trim()}
            style={{ padding: '0.5rem 1rem', fontSize: '0.78rem', fontWeight: 700 }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
