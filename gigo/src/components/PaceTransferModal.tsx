import { useState, useEffect } from 'react';

interface PaceTransferModalProps {
  API_BASE_URL: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PACE_PER_NGN = 20; // 250 Pace welcome bonus = ₦5,000, i.e. 1 Pace = ₦20

export default function PaceTransferModal({ API_BASE_URL, userId, onClose, onSuccess }: PaceTransferModalProps) {
  const [transferableNGN, setTransferableNGN] = useState<number | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amountPace, setAmountPace] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/users/${userId}/transferable-balance`)
      .then(res => res.json())
      .then(data => setTransferableNGN(data.transferableNGN ?? 0))
      .catch(() => setTransferableNGN(0));
  }, [userId]);

  const handleSend = async () => {
    const pace = parseFloat(amountPace);
    if (!recipientEmail.trim() || !pace || pace <= 0) {
      setResult({ success: false, message: "Enter a recipient email and a valid Pace amount." });
      return;
    }
    const amountNGN = pace * PACE_PER_NGN;
    setIsSending(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/transfer-pace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: recipientEmail.trim(), amountNGN })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ success: true, message: `Sent ${pace} Pace to ${data.recipientEmail}.` });
        setRecipientEmail(''); setAmountPace('');
        onSuccess();
        fetch(`${API_BASE_URL}/api/users/${userId}/transferable-balance`)
          .then(r => r.json())
          .then(d => setTransferableNGN(d.transferableNGN ?? 0));
      } else {
        setResult({ success: false, message: data.error || "Transfer failed." });
      }
    } catch (err: any) {
      setResult({ success: false, message: `Network error: ${err.message}` });
    } finally {
      setIsSending(false);
    }
  };

  const transferablePace = transferableNGN !== null ? Math.floor(transferableNGN / PACE_PER_NGN) : null;

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 9998 }}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: '440px', width: '95%' }}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>
          ↗️ Send Pace
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
          Send Pace to another GiGO user. Only Pace from a real top-up (Paystack or bank transfer) can be sent — your welcome bonus stays non-transferable.
        </p>

        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available to Send</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fff' }}>
            {transferablePace === null ? 'Loading...' : `${transferablePace.toLocaleString()} Pace`}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
          <input
            value={recipientEmail}
            onChange={e => setRecipientEmail(e.target.value)}
            placeholder="Recipient's GiGO email"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '0.65rem 0.85rem', fontSize: '0.85rem', color: '#fff' }}
          />
          <input
            type="number"
            min="1"
            value={amountPace}
            onChange={e => setAmountPace(e.target.value)}
            placeholder="Amount in Pace"
            style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '0.65rem 0.85rem', fontSize: '0.85rem', color: '#fff' }}
          />
        </div>

        {result && (
          <div style={{
            fontSize: '0.78rem', padding: '0.6rem 0.85rem', borderRadius: '8px', marginBottom: '1rem',
            background: result.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(248, 113, 113, 0.1)',
            color: result.success ? '#10b981' : '#f87171',
            border: `1px solid ${result.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`
          }}>
            {result.message}
          </div>
        )}

        <button className="btn-glass btn-primary" style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }} onClick={handleSend} disabled={isSending}>
          {isSending ? 'Sending...' : 'Send Pace'}
        </button>
      </div>
    </div>
  );
}
