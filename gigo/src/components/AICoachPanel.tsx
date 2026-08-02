import React, { useState, useRef, useEffect } from 'react';

interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

interface AICoachPanelProps {
  userId: string;
  API_BASE_URL: string;
  addLog: (msg: string) => void;
}

const SUGGESTED_PROMPTS = [
  { icon: '💼', label: 'Career advice', prompt: "I'd like some career advice — what should I focus on next?" },
  { icon: '💰', label: 'Salary negotiation', prompt: "Help me prepare to negotiate my salary for an upcoming offer." },
  { icon: '📄', label: 'Resume help', prompt: "Can you help me strengthen my resume?" },
  { icon: '🔗', label: 'Networking', prompt: "How should I approach networking for my next role?" }
];

const AICoachPanel: React.FC<AICoachPanelProps> = ({ userId, API_BASE_URL, addLog }) => {
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    const nextHistory: ChatTurn[] = [...messages, { role: 'user', text: trimmed }];
    setMessages(nextHistory);
    setInputText('');
    setIsSending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/coach-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history: messages })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: `⚠️ ${data.error || 'AI Coach is unavailable right now.'}` }]);
      }
    } catch (err: any) {
      addLog(`[AI Coach] Network error: ${err.message}`);
      setMessages(prev => [...prev, { role: 'assistant', text: '⚠️ Network error reaching AI Coach. Please try again.' }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem'
          }}>🤖</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>AI Coach</h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Career advice, salary negotiation, resume help, networking</p>
          </div>
        </div>
        <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>Live</span>
      </div>

      {/* Suggested prompts */}
      {messages.length === 0 && (
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Suggested prompts</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem' }}>
            {SUGGESTED_PROMPTS.map(p => (
              <button
                key={p.label}
                className="btn-glass"
                style={{ padding: '0.6rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, justifyContent: 'flex-start', gap: '0.5rem' }}
                onClick={() => sendMessage(p.prompt)}
                disabled={isSending}
              >
                <span>{p.icon}</span> {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation */}
      <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
        <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Ask anything about your career
        </h4>
        <div ref={scrollRef} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minHeight: '260px', maxHeight: '480px', overflowY: 'auto', padding: '0.25rem' }}>
          {messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '2rem 0' }}>
              Ask a question or tap a suggested prompt above to get started.
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                background: m.role === 'user' ? 'rgba(255,255,255,0.05)' : 'rgba(138, 92, 246, 0.12)',
                border: m.role === 'user' ? '1px solid var(--border-glass)' : '1px solid rgba(138, 92, 246, 0.25)',
                borderRadius: '12px',
                padding: '0.65rem 0.85rem',
                fontSize: '0.8rem',
                lineHeight: '1.4',
                color: 'var(--text-primary)',
                whiteSpace: 'pre-wrap'
              }}>
                {m.role === 'assistant' && (
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '0.25rem' }}>AI Coach</div>
                )}
                {m.text}
              </div>
            ))
          )}
          {isSending && (
            <div style={{ alignSelf: 'flex-start', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              AI Coach is typing...
            </div>
          )}
        </div>

        {/* Input row */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
          <input
            type="text"
            className="form-control"
            placeholder="Ask your AI Coach..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !isSending) sendMessage(inputText); }}
            style={{ flex: 1, fontSize: '0.85rem' }}
            disabled={isSending}
          />
          <button
            className="btn-glass btn-primary"
            onClick={() => sendMessage(inputText)}
            disabled={isSending || !inputText.trim()}
            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 700 }}
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
};

export default AICoachPanel;
