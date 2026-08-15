import { useState } from 'react';

interface Tier {
  id: string;
  label: string;
  priceNGN: number;
  applicationsPerMonth: number;
}

interface WaitlistCommitmentModalProps {
  API_BASE_URL: string;
  userId: string;
  onDone: () => void;
}

const FALLBACK_TIERS: Tier[] = [
  { id: 'starter', label: 'Starter', priceNGN: 5000, applicationsPerMonth: 50 },
  { id: 'growth', label: 'Growth', priceNGN: 10000, applicationsPerMonth: 120 },
  { id: 'unlimited', label: 'Unlimited', priceNGN: 20000, applicationsPerMonth: 999 },
];

export default function WaitlistCommitmentModal({ API_BASE_URL, userId, onDone }: WaitlistCommitmentModalProps) {
  const [selectedTier, setSelectedTier] = useState<string>('starter');
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [isRelatedParty, setIsRelatedParty] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isRelatedParty === null) {
      alert("Please answer the relationship question below — it's required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await fetch(`${API_BASE_URL}/api/users/${userId}/waitlist-commitment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          committedTierId: selectedTier,
          voiceOnboardingFeedback: feedback,
          voiceOnboardingRating: rating,
          isRelatedParty
        })
      });
    } catch (err) {
      console.error("Failed to record waitlist commitment:", err);
    } finally {
      setIsSubmitting(false);
      onDone();
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 9997, background: 'rgba(5, 3, 15, 0.92)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        <div className="logo-icon" style={{ margin: '0 auto 1rem auto', width: '48px', height: '48px', fontSize: '1.4rem' }}>🎉</div>
        <h2 className="text-gradient-purple-pink" style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>You're on the List!</h2>
        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          Your profile is real and saved. A few quick questions to help us prioritize the waitlist rollout:
        </p>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '0.6rem' }}>
            Are you a friend, family member, or otherwise personally connected to the GiGO team?
          </label>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0 0 0.6rem 0' }}>
            This doesn't affect your access — we just need to report it separately for transparency.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" onClick={() => setIsRelatedParty(false)} className="btn-glass" style={{ flex: 1, padding: '0.6rem', fontWeight: 700, background: isRelatedParty === false ? 'var(--primary)' : 'transparent' }}>
              No, I found GiGO independently
            </button>
            <button type="button" onClick={() => setIsRelatedParty(true)} className="btn-glass" style={{ flex: 1, padding: '0.6rem', fontWeight: 700, background: isRelatedParty === true ? 'var(--primary)' : 'transparent' }}>
              Yes, I know the team
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '0.6rem' }}>
            Which plan would you subscribe to once GiGO is fully live?
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {FALLBACK_TIERS.map(tier => (
              <label key={tier.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem',
                borderRadius: '10px', border: selectedTier === tier.id ? '2px solid var(--primary)' : '1px solid var(--border-glass)',
                background: selectedTier === tier.id ? 'rgba(138, 92, 246, 0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="radio" name="tier" checked={selectedTier === tier.id} onChange={() => setSelectedTier(tier.id)} style={{ accentColor: 'var(--primary)' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{tier.label}</span>
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>₦{tier.priceNGN.toLocaleString()}/mo · {tier.applicationsPerMonth === 999 ? 'Unlimited' : tier.applicationsPerMonth} apps</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '0.5rem' }}>
            How was talking to GiGO like an interview, instead of filling out forms? (1–5)
          </label>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setRating(n)} className="btn-glass" style={{
                flex: 1, padding: '0.5rem', fontWeight: 800, background: rating === n ? 'var(--primary)' : 'transparent'
              }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'block', marginBottom: '0.5rem' }}>
            Anything else about the voice onboarding experience? (optional)
          </label>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="e.g. Felt natural, wish it asked more about my portfolio..."
            style={{ width: '100%', minHeight: '80px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.6rem', fontSize: '0.8rem', color: '#fff', resize: 'vertical' }}
          />
        </div>

        <button className="btn-glass btn-primary" style={{ width: '100%', justifyContent: 'center', fontWeight: 700, padding: '0.75rem' }} onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Join the Waitlist →'}
        </button>
      </div>
    </div>
  );
}
