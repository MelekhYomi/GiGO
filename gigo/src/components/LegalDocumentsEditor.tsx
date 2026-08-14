import { useState, useEffect } from 'react';

interface LegalDocumentsEditorProps {
  API_BASE_URL: string;
  userEmail: string;
  addLog: (log: string) => void;
}

export default function LegalDocumentsEditor({ API_BASE_URL, userEmail, addLog }: LegalDocumentsEditorProps) {
  const [activeDoc, setActiveDoc] = useState<'terms' | 'privacy'>('terms');
  const [termsOfService, setTermsOfService] = useState('');
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchLegal = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/legal`);
      if (res.ok) {
        const data = await res.json();
        setTermsOfService(data.termsOfService || '');
        setPrivacyPolicy(data.privacyPolicy || '');
        setLastUpdated(data.lastUpdated);
      }
    } catch (err) {
      console.error("Failed to fetch legal documents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLegal(); }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/legal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: userEmail, termsOfService, privacyPolicy })
      });
      if (res.ok) {
        addLog("📜 Legal documents (Terms of Service / Privacy Policy) updated.");
        await fetchLegal();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to save legal documents.");
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }} className="text-gradient-purple-pink">📜 Legal Documents</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Terms of Service and Privacy Policy shown to users at signup and in Settings. Edits here go live immediately, no redeploy needed.
            {lastUpdated && <> Last updated: {new Date(lastUpdated).toLocaleString()}.</>}
          </p>
        </div>
        <button className="btn-glass btn-primary" onClick={handleSave} disabled={isSaving || isLoading} style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: 700 }}>
          {isSaving ? 'Saving...' : '💾 Save & Publish'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          className="btn-glass"
          style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: activeDoc === 'terms' ? 'var(--primary)' : 'transparent' }}
          onClick={() => setActiveDoc('terms')}
        >
          Terms of Service
        </button>
        <button
          className="btn-glass"
          style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: activeDoc === 'privacy' ? 'var(--primary)' : 'transparent' }}
          onClick={() => setActiveDoc('privacy')}
        >
          Privacy Policy
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</div>
      ) : (
        <textarea
          value={activeDoc === 'terms' ? termsOfService : privacyPolicy}
          onChange={(e) => activeDoc === 'terms' ? setTermsOfService(e.target.value) : setPrivacyPolicy(e.target.value)}
          style={{
            width: '100%', minHeight: '420px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-glass)',
            borderRadius: '8px', padding: '1rem', fontSize: '0.8rem', color: '#fff', fontFamily: 'monospace', resize: 'vertical', lineHeight: 1.6
          }}
        />
      )}
    </div>
  );
}
