import { useState, useEffect } from 'react';

interface MailDiagnosticsPanelProps {
  API_BASE_URL: string;
  userEmail: string;
}

function StatusRow({ label, ok, summary }: { label: string; ok: boolean; summary: string }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.6rem 0', borderBottom: '1px solid var(--border-glass)' }}>
      <span style={{ fontSize: '1rem', flexShrink: 0 }}>{ok ? '✅' : '⚠️'}</span>
      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{label}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.1rem', lineHeight: 1.4 }}>{summary}</div>
      </div>
    </div>
  );
}

export default function MailDiagnosticsPanel({ API_BASE_URL, userEmail }: MailDiagnosticsPanelProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDiagnostics = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/mail-diagnostics?adminEmail=${encodeURIComponent(userEmail)}`);
      setData(await res.json());
    } catch (err) {
      console.error("Failed to fetch mail diagnostics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchDiagnostics(); }, []);

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }} className="text-gradient-purple-pink">📬 Email Delivery Diagnostics</h3>
        <button className="btn-glass" style={{ padding: '0.35rem 0.9rem', fontSize: '0.72rem' }} onClick={fetchDiagnostics} disabled={isLoading}>
          {isLoading ? 'Checking...' : '↻ Recheck Live'}
        </button>
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>
        Live checks against the real SMTP/OAuth infrastructure — not just whether config values exist.
      </p>

      {isLoading || !data ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0' }}>Checking...</div>
      ) : (
        <>
          <StatusRow label="GiGO System Mailbox (default for every candidate)" ok={data.gigoSystemMailbox?.verified} summary={data.gigoSystemMailbox?.summary} />
          <StatusRow label="Google OAuth (per-candidate Gmail connect)" ok={data.googleOAuth?.configured} summary={data.googleOAuth?.summary} />
          <StatusRow label="Platform Zapier Webhook" ok={data.platformDefaultZapierWebhook?.configured} summary={data.platformDefaultZapierWebhook?.summary} />
        </>
      )}
    </div>
  );
}
