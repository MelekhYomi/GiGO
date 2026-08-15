import { useState, useEffect } from 'react';

interface WaitlistPanelProps {
  API_BASE_URL: string;
}

export default function WaitlistPanel({ API_BASE_URL }: WaitlistPanelProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/admin/waitlist`)
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Failed to fetch waitlist data:", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Loading real waitlist data...
      </div>
    );
  }

  if (!data || data.totalSignups === 0) {
    return (
      <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }} className="text-gradient-purple-pink">📋 Waitlist Demand Validation</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>No waitlist signups yet. Share the /waitlist link to start collecting real demand evidence.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-glass)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }} className="text-gradient-purple-pink">📋 Waitlist Demand Validation</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
          Real demand-pipeline evidence — every person here completed the actual voice-onboarding AI and gave explicit price commitment. This is not revenue; it's separate from the P&L above.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Signups', value: data.totalSignups },
          { label: 'With Price Commitment', value: data.totalWithCommitment },
          { label: 'Total Committed Monthly', value: `₦${data.totalCommittedMonthlyNGN.toLocaleString()}` },
          { label: 'Avg. Committed Price', value: `₦${data.avgCommittedPriceNGN.toLocaleString()}` },
          { label: 'Avg. Voice Onboarding Rating', value: data.avgVoiceRating ? `${data.avgVoiceRating} / 5` : '—' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '10px', padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fff' }}>{stat.value}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Real Candidates</h4>
        <div className="table-wrapper" style={{ overflowX: 'auto', maxHeight: '320px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '0.5rem' }}>Name</th>
                <th style={{ padding: '0.5rem' }}>Committed Tier</th>
                <th style={{ padding: '0.5rem' }}>Voice Rating</th>
                <th style={{ padding: '0.5rem' }}>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {data.candidates.map((c: any) => (
                <tr key={c.userId} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '0.5rem', fontWeight: 700 }}>{c.fullName}</td>
                  <td style={{ padding: '0.5rem' }}>{c.waitlistCommittedPriceNGN ? `₦${c.waitlistCommittedPriceNGN.toLocaleString()}/mo` : '—'}</td>
                  <td style={{ padding: '0.5rem' }}>{c.voiceOnboardingRating ?? '—'}</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-muted)', maxWidth: '220px' }}>{c.voiceOnboardingFeedback || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
