import { useState, useEffect } from 'react';

interface ManualPaymentAdminProps {
  API_BASE_URL: string;
  userEmail: string;
  addLog: (log: string) => void;
}

export default function ManualPaymentAdmin({ API_BASE_URL, userEmail, addLog }: ManualPaymentAdminProps) {
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isSavingDetails, setIsSavingDetails] = useState(false);

  const [creditEmail, setCreditEmail] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNote, setCreditNote] = useState('');
  const [isCrediting, setIsCrediting] = useState(false);

  const [audit, setAudit] = useState<any[]>([]);

  const fetchAll = async () => {
    try {
      const [detailsRes, auditRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/manual-payment/details`),
        fetch(`${API_BASE_URL}/api/admin/manual-payment/audit`)
      ]);
      const details = await detailsRes.json();
      setBankName(details.bankName || '');
      setAccountName(details.accountName || '');
      setAccountNumber(details.accountNumber || '');
      setWhatsappNumber(details.whatsappNumber || '');
      setAudit(await auditRes.json());
    } catch (err) {
      console.error("Failed to fetch manual payment admin data:", err);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSaveDetails = async () => {
    setIsSavingDetails(true);
    try {
      await fetch(`${API_BASE_URL}/api/admin/manual-payment/details`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: userEmail, bankName, accountName, accountNumber, whatsappNumber })
      });
      addLog("🏦 Bank transfer details updated.");
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleCredit = async () => {
    const amount = parseFloat(creditAmount);
    if (!creditEmail || !amount || amount < 1000) {
      alert("A valid email and an amount of at least ₦1,000 are required.");
      return;
    }
    setIsCrediting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/manual-payment/credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: userEmail, userEmail: creditEmail, amountNGN: amount, receiptNote: creditNote })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addLog(`💰 Credited ₦${amount.toLocaleString()} to ${creditEmail} (verified bank transfer).`);
        setCreditEmail(''); setCreditAmount(''); setCreditNote('');
        await fetchAll();
      } else {
        alert(data.error || "Failed to credit payment.");
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setIsCrediting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px',
    padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#fff', width: '100%'
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-glass)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }} className="text-gradient-purple-pink">🏦 Manual Bank Transfer Payments</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
          Real money, real revenue — these credits feed the actual P&L above, tagged BANK_TRANSFER_MANUAL for audit.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Bank Name</label>
          <input style={inputStyle} value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. GTBank" />
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Account Name</label>
          <input style={inputStyle} value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="e.g. GiGO Ecosystem Labs" />
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Account Number</label>
          <input style={inputStyle} value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="0123456789" />
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>WhatsApp Number (for receipts)</label>
          <input style={inputStyle} value={whatsappNumber} onChange={e => setWhatsappNumber(e.target.value)} placeholder="2348012345678" />
        </div>
      </div>
      <button className="btn-glass btn-primary" style={{ alignSelf: 'flex-start', padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: 700 }} onClick={handleSaveDetails} disabled={isSavingDetails}>
        {isSavingDetails ? 'Saving...' : 'Save Bank Details'}
      </button>

      <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', margin: '0 0 0.75rem 0' }}>💰 Credit a Verified Receipt</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <input style={inputStyle} value={creditEmail} onChange={e => setCreditEmail(e.target.value)} placeholder="Candidate email" />
          <input style={inputStyle} type="number" min="1000" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="Amount (₦, min 1000)" />
          <input style={inputStyle} value={creditNote} onChange={e => setCreditNote(e.target.value)} placeholder="Note (optional)" />
        </div>
        <button className="btn-glass" style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: 700, borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }} onClick={handleCredit} disabled={isCrediting}>
          {isCrediting ? 'Crediting...' : '+ Credit Wallet'}
        </button>
      </div>

      {audit.length > 0 && (
        <div>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Recent Manual Credits</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
            {audit.map((a: any) => (
              <div key={a.id} style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                ₦{a.amountNGN?.toLocaleString()} → {a.userEmail} {a.receiptNote ? `(${a.receiptNote})` : ''} — {new Date(a.timestamp).toLocaleString()}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
