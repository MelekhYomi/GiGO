import { useState, useEffect, useRef } from 'react';

interface VoiceAssistantCopilotProps {
  activeWorkspaceTab: string;
  setActiveWorkspaceTab: (tab: any) => void;
  tasks: any[];
  moveTaskStatus: (taskId: string, direction: 'forward' | 'backward') => Promise<void>;
  addLog: (log: string) => void;
  setShowSettingsModal: (show: boolean) => void;
  activeTheme: string;
  setActiveTheme: (theme: any) => void;
  mailThreads: any[];
  triggerManualJobSearch: (query: string) => void;
}

export default function VoiceAssistantCopilot({
  activeWorkspaceTab,
  setActiveWorkspaceTab,
  tasks,
  moveTaskStatus,
  addLog,
  setShowSettingsModal,
  activeTheme,
  setActiveTheme,
  mailThreads,
  triggerManualJobSearch,
}: VoiceAssistantCopilotProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [statusText, setStatusText] = useState('Tap to speak command');
  const [transcript, setTranscript] = useState('');
  const [orbState, setOrbState] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');

  const recognitionRef = useRef<any>(null);
  const voiceSynthesisRef = useRef<SpeechSynthesis | null>(window.speechSynthesis);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setOrbState('listening');
        setStatusText('Listening carefully...');
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        const resultText = event.results[0][0].transcript;
        setTranscript(resultText);
        setOrbState('processing');
        setStatusText('Processing intent...');
        handleCommand(resultText);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setOrbState('idle');
        setStatusText(`Error: ${event.error}. Tap to retry.`);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (orbState === 'listening') {
          setOrbState('idle');
          setStatusText('Tap to speak command');
        }
      };

      recognitionRef.current = recognition;
    } else {
      setStatusText('Speech recognition not supported in browser');
    }
  }, [tasks, mailThreads, activeTheme, activeWorkspaceTab]);

  // Voice Synthesis response function
  const speakText = (text: string) => {
    if (!voiceSynthesisRef.current) return;
    voiceSynthesisRef.current.cancel(); // cancel current speech

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => {
      setIsSpeaking(true);
      setOrbState('speaking');
      setStatusText('Speaking...');
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setOrbState('idle');
      setStatusText('Tap to speak command');
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setOrbState('idle');
      setStatusText('Tap to speak command');
    };

    voiceSynthesisRef.current.speak(utterance);
  };

  // Toggle listening session
  const toggleListening = () => {
    if (!recognitionRef.current) {
      addLog('⚠️ Voice Copilot: Speech recognition not supported or initialized.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        if (isSpeaking && voiceSynthesisRef.current) {
          voiceSynthesisRef.current.cancel();
          setIsSpeaking(false);
        }
        recognitionRef.current.start();
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  };

  // Core Natural Language Command Router
  // Core Agentic Intent Router (NLU-Driven)
  const handleCommand = async (rawText: string) => {
    addLog(`🎙️ Voice Copilot heard: "${rawText}"`);

    // 1. Try Live Gemini Agentic Conversation & Control Routing
    try {
      setOrbState('processing');
      setStatusText('Consulting Gemini...');

      const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8080'
        : (import.meta.env.VITE_API_BASE_URL || 'https://gigo-backend.example.com');

      const token = localStorage.getItem('gigo_token');
      const userId = localStorage.getItem('gigo_userId') || 'user_1780714671963_281';

      const response = await fetch(`${API_BASE_URL}/api/voice-copilot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          prompt: rawText,
          userId
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Speak response first
        if (data.reply) {
          speakText(data.reply);
        } else {
          setOrbState('idle');
          setStatusText('Tap to speak command');
        }

        // Execute platform UI action dynamically from NLU payload
        if (data.action) {
          const { type, params } = data.action;
          addLog(`⚡ Live Copilot action: ${type} with params ${JSON.stringify(params)}`);

          switch (type) {
            case 'navigate':
              if (params?.tab) {
                // Map to real frontend tabs
                const tabMap: Record<string, string> = {
                  'mailroom': 'mailroom',
                  'brain': 'brain',
                  'wallets': 'wallets',
                  'interview': 'interview',
                  'resume_tailor': 'resume_tailor',
                  'copilot': 'copilot'
                };
                const mappedTab = tabMap[params.tab];
                if (mappedTab) {
                  setActiveWorkspaceTab(mappedTab);
                }
              }
              break;

            case 'kanban': {
              const kw = (params?.taskKeyword || '').toLowerCase();
              const dir = params?.direction || 'forward';
              if (kw) {
                const targetTask = tasks.find(t => 
                  t.title.toLowerCase().includes(kw) || 
                  (t.company || '').toLowerCase().includes(kw)
                );
                if (targetTask) {
                  await moveTaskStatus(targetTask.id, dir);
                  addLog(`✅ Moved Kanban card: "${targetTask.title}" ${dir === 'forward' ? 'forward' : 'backward'}`);
                }
              }
              break;
            }

            case 'search':
              if (params?.query) {
                triggerManualJobSearch(params.query);
              }
              break;

            case 'theme': {
              const themeName = params?.theme || 'toggle';
              const themes: ('obsidian' | 'emerald' | 'sunset' | 'ocean')[] = ['obsidian', 'emerald', 'sunset', 'ocean'];
              if (themeName === 'toggle') {
                const currentIdx = themes.indexOf(activeTheme as any);
                const nextTheme = themes[(currentIdx + 1) % themes.length];
                setActiveTheme(nextTheme);
              } else if (themes.includes(themeName as any)) {
                setActiveTheme(themeName);
              }
              break;
            }

            case 'settings':
              setShowSettingsModal(true);
              break;

            case 'read_emails':
              if (mailThreads && mailThreads.length > 0) {
                const latest = mailThreads[0];
                const subject = latest.subject || 'No Subject';
                const sender = latest.fromName || latest.fromEmail || 'Unknown Recruiter';
                speakText(`Your latest synchronized email is from ${sender}, with the subject: "${subject}".`);
              } else {
                speakText('No recruiter emails have been synchronized in your mailroom inbox yet.');
              }
              break;

            default:
              break;
          }
        }
        return;
      }
    } catch (error) {
      console.error("Live voice copilot error:", error);
    }

    // 2. Offline / Local Regex Command Fallback
    executeOfflineFallback(rawText);
  };

  // Graceful Offline Action Command Router
  const executeOfflineFallback = async (rawText: string) => {
    const text = rawText.toLowerCase().trim();

    // Navigation fallback
    if (text.includes('go to') || text.includes('switch to') || text.includes('navigate to') || text.includes('open tab')) {
      if (text.includes('mail') || text.includes('mailroom') || text.includes('inbox')) {
        setActiveWorkspaceTab('mailroom');
        speakText('Switching your workspace to the Mailroom Tab.');
        return;
      }
      if (text.includes('brain') || text.includes('dashboard') || text.includes('metrics')) {
        setActiveWorkspaceTab('brain');
        speakText('Opening your GiGO Brain calibration dashboard.');
        return;
      }
      if (text.includes('wallets') || text.includes('wallet') || text.includes('balance') || text.includes('escrow')) {
        setActiveWorkspaceTab('wallets');
        speakText('Opening your career wallets ledger.');
        return;
      }
      if (text.includes('interview') || text.includes('prep') || text.includes('mock')) {
        setActiveWorkspaceTab('interview');
        speakText('Launching the AI Mock Interview Room.');
        return;
      }
      if (text.includes('tailor') || text.includes('resume') || text.includes('pdf')) {
        setActiveWorkspaceTab('resume_tailor');
        speakText('Opening the ATS Resume Tailoring and Exporter module.');
        return;
      }
      if (text.includes('copilot') || text.includes('home') || text.includes('feed') || text.includes('stream')) {
        setActiveWorkspaceTab('copilot');
        speakText('Returning to your core copilot feed.');
        return;
      }
    }

    // Kanban movements fallback
    if (text.includes('move') || text.includes('promote') || text.includes('drag') || text.includes('push')) {
      const words = text.split(' ');
      let targetTask: any = null;
      for (const t of tasks) {
        const titleLower = t.title.toLowerCase();
        const companyLower = (t.company || '').toLowerCase();
        if (words.some(word => word.length > 2 && (titleLower.includes(word) || companyLower.includes(word)))) {
          targetTask = t;
          break;
        }
      }

      if (targetTask) {
        const direction = text.includes('back') || text.includes('revert') ? 'backward' : 'forward';
        try {
          await moveTaskStatus(targetTask.id, direction);
          speakText(`Moved card ${targetTask.title} at ${targetTask.company || 'unnamed'} ${direction === 'forward' ? 'forward' : 'backward'}.`);
          return;
        } catch (err) {
          speakText(`Sorry, I encountered an issue updating the column status.`);
          return;
        }
      }
    }

    // Trigger manual search fallback
    if (text.includes('search for') || text.includes('find jobs') || text.includes('query')) {
      const match = rawText.match(/(?:search for|find jobs for|query|find)\s+(.+)/i);
      if (match && match[1]) {
        const query = match[1].trim();
        speakText(`Initiating search for ${query}.`);
        triggerManualJobSearch(query);
        return;
      }
    }

    // Read Synced Recruiter Emails fallback
    if (text.includes('read my emails') || text.includes('new messages') || text.includes('latest message') || text.includes('read latest')) {
      if (mailThreads && mailThreads.length > 0) {
        const latest = mailThreads[0];
        const subject = latest.subject || 'No Subject';
        const sender = latest.fromName || latest.fromEmail || 'Unknown Recruiter';
        speakText(`Your latest email is from ${sender}, with subject: "${subject}".`);
        return;
      }
    }

    // Open Settings fallback
    if (text.includes('open settings') || text.includes('show settings')) {
      setShowSettingsModal(true);
      speakText('Opening your platform settings drawer.');
      return;
    }

    // Rotate Theme fallback
    if (text.includes('change theme') || text.includes('toggle theme') || text.includes('set theme')) {
      const themes: ('obsidian' | 'emerald' | 'sunset' | 'ocean')[] = ['obsidian', 'emerald', 'sunset', 'ocean'];
      const currentIdx = themes.indexOf(activeTheme as any);
      const nextTheme = themes[(currentIdx + 1) % themes.length];
      setActiveTheme(nextTheme);
      speakText(`Setting layout theme to ${nextTheme}.`);
      return;
    }

    speakText(`I heard you say: "${rawText}". I am currently running in offline command-routing mode.`);
  };

  const isActive = orbState !== 'idle';

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '5rem',
        right: '1.25rem',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
        borderRadius: 'var(--radius-xl)',
        background: isActive ? 'rgba(10, 8, 25, 0.85)' : 'transparent',
        boxShadow: isActive ? 'var(--shadow-glow-purple)' : 'none',
        border: isActive ? '1px solid rgba(138, 92, 246, 0.3)' : 'none',
        padding: isActive ? '0.5rem 0.85rem' : 0,
        maxWidth: '280px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Glow Voice Assistant Orb — matches the splash screen's GiGO gradient badge */}
      <div
        onClick={toggleListening}
        title="Talk to GiGO"
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          background: orbState === 'listening'
            ? 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)'
            : 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
          boxShadow: orbState === 'listening'
            ? '0 0 18px var(--secondary)'
            : orbState === 'speaking'
            ? '0 0 18px var(--emerald)'
            : '0 4px 16px rgba(138, 92, 246, 0.45)',
          transition: 'all 0.4s ease'
        }}
        className={orbState === 'listening' ? 'assistant-orb-pulsing' : ''}
      >
        {orbState === 'listening' ? (
          <span style={{ fontSize: '0.9rem' }}>🎙️</span>
        ) : orbState === 'speaking' ? (
          <span style={{ fontSize: '0.9rem' }}>🔊</span>
        ) : orbState === 'processing' ? (
          <div className="spinner-border" style={{ width: '14px', height: '14px', border: '2px solid transparent', borderRightColor: '#fff', borderRadius: '50%', animation: 'spinner-border .5s linear infinite' }}></div>
        ) : (
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff' }}>Gi</span>
        )}
      </div>

      {/* Visual Status Content — only shown while actively listening/speaking/processing */}
      {isActive && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', flex: 1, minWidth: '120px' }}>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {statusText}
            </span>
            {transcript && (
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic', display: 'block', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                "{transcript}"
              </span>
            )}
          </div>

          {(orbState === 'listening' || orbState === 'speaking') && (
            <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '16px' }}>
              <div className="voice-bar voice-bar-1"></div>
              <div className="voice-bar voice-bar-2"></div>
              <div className="voice-bar voice-bar-3"></div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
