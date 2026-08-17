import { useState, useEffect } from 'react';

interface AdminAccessManagementProps {
  API_BASE_URL: string;
  userEmail: string;
  addLog: (log: string) => void;
}

export default function AdminAccessManagement({ API_BASE_URL, userEmail, addLog }: AdminAccessManagementProps) {
  const [additionalAdmins, setAdditionalAdmins] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isPrimaryAdmin = userEmail === 'admin@gigo.com';

  const fetchAdmins = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/additional-admins?adminEmail=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      setAdditionalAdmins(data.additionalAdminEmails || []);
    } catch (err) {
      console.error("Failed to fetch additional admins:", err);
    }
  };

  useEffect(() => { if (isPrimaryAdmin) fetchAdmins(); }, [isPrimaryAdmin]);

  if (!isPrimaryAdmin) return null;

  const handleAdd = async () => {
    if (!newEmail.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/additional-admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: userEmail, email: newEmail.trim() })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addLog(`🔑 Granted admin access to ${newEmail.trim()}.`);
        setNewEmail('');
        await fetchAdmins();
      } else {
        alert(data.error || "Failed to grant admin access.");
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevoke = async (email: string) => {
    if (!confirm(`Revoke admin access for ${email}?`)) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/additional-admins/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: userEmail })
      });
      addLog(`🔒 Revoked admin access for ${email}.`);
      await fetchAdmins();
    } catch (err: any) {
      alert(`Failed to revoke: ${err.message}`);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }} className="text-gradient-purple-pink">🔑 Admin Access</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
          Grant a second account (e.g. judges@gigo.com) admin-level access for review — revocable any time. The most sensitive actions (role changes, wallet balance edits, credential resets, legal document edits, payment/expense records) stay restricted to the primary super admin only.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem' }}>
        <input
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          placeholder="judges@gigo.com"
          style={{ flex: 1, background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}
        />
        <button className="btn-glass btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.8rem', fontWeight: 700 }} onClick={handleAdd} disabled={isSaving}>
          {isSaving ? 'Granting...' : '+ Grant Access'}
        </button>
      </div>

      {additionalAdmins.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {additionalAdmins.map(email => (
            <div key={email} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{email}</span>
              <button className="btn-glass" style={{ padding: '0.25rem 0.75rem', fontSize: '0.7rem', color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.3)' }} onClick={() => handleRevoke(email)}>
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
