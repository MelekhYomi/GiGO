import { useState, useEffect } from 'react';

interface BankTransferPanelProps {
  API_BASE_URL: string;
}

export default function BankTransferPanel({ API_BASE_URL }: BankTransferPanelProps) {
  const [details, setDetails] = useState<{ bankName: string; accountName: string; accountNumber: string; whatsappNumber: string; minimumAmountNGN: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/manual-payment/details`)
      .then(res => res.json())
      .then(setDetails)
      .catch(err => console.error("Failed to fetch bank transfer details:", err));
  }, []);

  const copyAccountNumber = () => {
    if (!details?.accountNumber) return;
    navigator.clipboard.writeText(details.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!details) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</div>;
  }

  if (!details.accountNumber) {
    return (
      <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px', padding: '1rem', fontSize: '0.8rem', color: '#fde047' }}>
        Bank transfer isn't set up yet — please use Paystack, or check back shortly.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
        Transfer any amount from <strong style={{ color: '#fff' }}>₦{details.minimumAmountNGN.toLocaleString()}</strong> upward to the account below, then send your payment receipt to the WhatsApp number shown. Your wallet is credited manually once verified — usually within a few hours.
      </p>

      <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bank Name</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{details.bankName}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Name</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{details.accountName}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Number</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.03em' }}>{details.accountNumber}</div>
            <button type="button" className="btn-glass" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }} onClick={copyAccountNumber}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      {details.whatsappNumber && (
        <a
          href={`https://wa.me/${details.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent("Hi GiGO, I've made a bank transfer and I'm attaching my receipt.")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-glass btn-primary"
          style={{ textAlign: 'center', justifyContent: 'center', fontWeight: 700, padding: '0.75rem', textDecoration: 'none' }}
        >
          💬 Send Receipt via WhatsApp
        </a>
      )}
    </div>
  );
}
