import { useState, useEffect } from 'react';

interface PaceTransferModalProps {
  API_BASE_URL: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const NGN_PER_PACE = 20;

export default function PaceTransferModal({ API_BASE_URL, userId, onClose, onSuccess }: PaceTransferModalProps) {
  const [transferableNGN, setTransferableNGN] = useState<number | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [paceAmount, setPaceAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users/${userId}/transferable-balance`)
      .then(res => res.json())
      .then(data => setTransferableNGN(data.transferableNGN ?? 0))
      .catch(() => setTransferableNGN(0));
  }, []);

  const transferablePace = transferableNGN !== null ? Math.floor(transferableNGN / NGN_PER_PACE) : null;

  const handleSend = async () => {
    setError('');
    const pace = parseFloat(paceAmount);
    if (!recipientEmail.trim() || !pace || pace <= 0) {
      setError("Enter a valid recipient email and Pace amount.");
      return;
    }
    const amountNGN = pace * NGN_PER_PACE;
    setIsSending(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/transfer-pace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: recipientEmail.trim(), amountNGN })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(`Sent ${pace} Pace to ${data.recipientEmail}.`);
        onSuccess();
      } else {
        setError(data.error || "Failed to send Pace.");
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 9998 }}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: '440px', width: '95%' }}>
        <button className="close-btn" onClick={onClose}>&times;</button>

        {success ? (
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', margin: '0 auto 1rem auto'
            }}>✅</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Pace Sent</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0' }}>{success}</p>
            <button className="btn-glass btn-primary" style={{ width: '100%', padding: '0.7rem', fontWeight: 700 }} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>↗️ Send Pace</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
              Send Pace to another GiGO user by email. Only Pace from money you've actually paid in can be sent — your welcome bonus stays non-transferable.
            </p>

            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Transferable Balance</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                {transferablePace === null ? 'Loading...' : `${transferablePace.toLocaleString()} Pace`}
              </div>
            </div>

            {error && <div className="auth-error-badge" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              <input
                value={recipientEmail}
                onChange={e => setRecipientEmail(e.target.value)}
                placeholder="Recipient's GiGO email"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}
              />
              <input
                type="number"
                min="1"
                value={paceAmount}
                onChange={e => setPaceAmount(e.target.value)}
                placeholder="Pace amount"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '0.75rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}
              />
            </div>

            <button className="btn-glass btn-primary" style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }} onClick={handleSend} disabled={isSending || transferablePace === 0}>
              {isSending ? 'Sending...' : 'Send Pace'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
