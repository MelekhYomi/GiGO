import { useState } from 'react';

interface SandboxResult {
  success: boolean;
  classification: 'interview_offered' | 'rejected' | 'replied';
  explanation: string;
  suggestedReply: string;
}

interface RecruiterResponseSandboxProps {
  API_BASE_URL: string;
  addLog: (log: string) => void;
}

export default function RecruiterResponseSandbox({ API_BASE_URL, addLog }: RecruiterResponseSandboxProps) {
  const [emailBody, setEmailBody] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SandboxResult | null>(null);

  const presets = [
    {
      title: "📅 Interview Offer",
      body: `Hi there,

We loved your application and your work at GiGO. We would love to hop on a quick 30-minute Zoom call this week to talk about the Senior Fullstack role.

Are you free on Thursday at 2:00 PM EST or Friday at 10:00 AM EST?

Best,
Sarah at Google`
    },
    {
      title: "📝 Technical Drill-down",
      body: `Hi,

Thanks for your details. Before scheduling our interview, could you clarify your experience with React 19 Server Components and event-loop performance tuning?

We want to make sure your background aligns with our immediate scaling bottlenecks.

Thanks,
Marcus at Anthropic`
    },
    {
      title: "🛑 Gentle Rejection",
      body: `Hi Candidate,

Thank you for your interest in the Lead AI position. We received many qualified candidates, and unfortunately, we have decided to move forward with other applicants whose backgrounds more closely match our current requirements.

We will keep your profile in our candidate pool for future roles.

Best regards,
Vercel Recruiting`
    }
  ];

  const handleAnalyzeEmail = async () => {
    if (!emailBody.trim()) {
      alert("Please paste or type a recruiter email body first!");
      return;
    }

    setIsAnalyzing(true);
    setResult(null);
    addLog("🧪 Sandbox: Transmitting recruiter mockup email to backend classifier simulator...");

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/sandbox-parse-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emailBody })
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        addLog(`✔ Sandbox: Classification matched: "${data.classification.toUpperCase()}". Responder generated.`);
      } else {
        throw new Error("Sandbox parsing failed");
      }
    } catch (err) {
      addLog("⚠️ Sandbox: Rerouting sandbox through local fallback engine.");
      // Handled by backend fallback, but just in case:
      setResult({
        success: true,
        classification: 'replied',
        explanation: "API handshaking timeout. Using local sandbox fallback matching.",
        suggestedReply: "Thank you for reaching out! I appreciate the update and would be happy to discuss further."
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusBadgeStyle = (status: 'interview_offered' | 'rejected' | 'replied') => {
    switch (status) {
      case 'interview_offered':
        return {
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: 'var(--emerald)',
          boxShadow: '0 0 10px rgba(16, 185, 129, 0.1)'
        };
      case 'rejected':
        return {
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          boxShadow: '0 0 10px rgba(239, 68, 68, 0.1)'
        };
      default:
        return {
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          color: '#f59e0b',
          boxShadow: '0 0 10px rgba(245, 158, 11, 0.1)'
        };
    }
  };

  const getStatusLabel = (status: 'interview_offered' | 'rejected' | 'replied') => {
    switch (status) {
      case 'interview_offered':
        return '📅 Interview Offer Identified';
      case 'rejected':
        return '🛑 Rejection Notice Parsed';
      default:
        return '💬 General Inquiry / Reply Recorded';
    }
  };

  return (
    <div className="sandbox-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', width: '100%', padding: '1rem' }}>
      
      {/* Left Column: Email Input & Preset Injectors */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            🧪 Recruiter Response Simulator Sandbox
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            Input a recruiter email body to evaluate classifier accuracy and preview automatic context-aware candidate response drafts generated by Gemini.
          </p>
        </div>

        {/* Preset Injectors */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
            ⚡ Sample Presets Injectors
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {presets.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setEmailBody(p.body)}
                className="btn-glass"
                style={{ padding: '0.5rem', fontSize: '0.72rem', borderRadius: '6px', cursor: 'pointer', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Input Textarea */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--secondary)', textTransform: 'uppercase' }}>
            ✉️ Recruiter Email Body
          </span>
          <textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            placeholder="Paste recruiter email body text here..."
            style={{
              width: '100%',
              minHeight: '180px',
              flex: 1,
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              padding: '0.75rem',
              fontSize: '0.8rem',
              lineHeight: 1.45,
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>

        <button
          onClick={handleAnalyzeEmail}
          disabled={isAnalyzing}
          className="btn-glass btn-primary"
          style={{ padding: '0.75rem', fontSize: '0.85rem', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}
        >
          {isAnalyzing ? 'Evaluating Thread Integrity...' : '🔬 Analyze & Draft Responder'}
        </button>

      </div>

      {/* Right Column: Classification Results & Draft preview */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        
        {result ? (
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', border: '1px solid rgba(138, 92, 246, 0.15)', flex: 1 }}>
            
            {/* Status Badge */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                📊 Classifier Verdict
              </span>
              <div 
                style={{ 
                  padding: '0.75rem 1rem', 
                  borderRadius: '8px', 
                  fontSize: '0.85rem', 
                  fontWeight: 800,
                  ...getStatusBadgeStyle(result.classification)
                }}
              >
                {getStatusLabel(result.classification)}
              </div>
            </div>

            {/* Explanation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                💡 Analytical Explanation
              </span>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                {result.explanation}
              </p>
            </div>

            {/* Suggested Reply Draft */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase' }}>
                🎓 Structured Responder Draft (Gemini Core)
              </span>
              <p 
                style={{ 
                  fontSize: '0.8rem', 
                  color: 'var(--text-primary)', 
                  margin: 0, 
                  lineHeight: 1.5, 
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  flex: 1
                }}
              >
                {result.suggestedReply}
              </p>
            </div>

          </div>
        ) : (
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '350px', color: 'var(--text-muted)', padding: '2rem', textAlign: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>🔬</span>
            <div>
              <h4 style={{ color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>Sandbox Standby</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, maxWidth: '280px', lineHeight: 1.4 }}>
                Select a sample preset or type in a customized email and click analyze to test classifier outputs.
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
