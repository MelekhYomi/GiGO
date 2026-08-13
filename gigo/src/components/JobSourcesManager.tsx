import { useState, useEffect } from 'react';

interface JobSourcesManagerProps {
  API_BASE_URL: string;
  userEmail: string;
  addLog: (log: string) => void;
}

interface BuiltInSource {
  id: string;
  name: string;
  apiUrl: string;
  builtIn: true;
  coverage: string;
}

interface ConfiguredSource {
  id: string;
  name: string;
  apiUrl: string;
  resultsPath: string;
  fieldMap: {
    company: string; title: string; location?: string; url?: string;
    description?: string; postedAt?: string; remoteFlag?: string; remoteKeywordCheck?: boolean;
  };
  enabled: boolean;
  createdAt: string;
  createdBy: string;
}

const emptyForm = {
  name: '', apiUrl: '', resultsPath: '',
  company: '', title: '', location: '', url: '', description: '', postedAt: '',
  remoteFlag: '', remoteKeywordCheck: false
};

export default function JobSourcesManager({ API_BASE_URL, userEmail, addLog }: JobSourcesManagerProps) {
  const [builtIn, setBuiltIn] = useState<BuiltInSource[]>([]);
  const [configured, setConfigured] = useState<ConfiguredSource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);

  const fetchSources = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/job-sources`);
      if (res.ok) {
        const data = await res.json();
        setBuiltIn(data.builtIn || []);
        setConfigured(data.configured || []);
      }
    } catch (err) {
      console.error("Failed to fetch job sources:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSources(); }, []);

  const handleAddSource = async () => {
    if (!form.name || !form.apiUrl || !form.company || !form.title) {
      alert("Name, API URL, and the Company/Title field paths are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/job-sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: userEmail,
          name: form.name,
          apiUrl: form.apiUrl,
          resultsPath: form.resultsPath,
          fieldMap: {
            company: form.company,
            title: form.title,
            location: form.location || undefined,
            url: form.url || undefined,
            description: form.description || undefined,
            postedAt: form.postedAt || undefined,
            remoteFlag: form.remoteFlag || undefined,
            remoteKeywordCheck: form.remoteKeywordCheck
          }
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addLog(`🌐 Admin added new job source: ${form.name}`);
        setForm(emptyForm);
        setShowAddForm(false);
        await fetchSources();
      } else {
        alert(data.error || "Failed to add job source.");
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await fetch(`${API_BASE_URL}/api/admin/job-sources/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: userEmail, enabled })
      });
      await fetchSources();
    } catch (err) {
      console.error("Failed to toggle source:", err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove job source "${name}"? Already-discovered jobs from it stay in the pool.`)) return;
    try {
      await fetch(`${API_BASE_URL}/api/admin/job-sources/${id}?adminEmail=${encodeURIComponent(userEmail)}`, { method: 'DELETE' });
      await fetchSources();
    } catch (err) {
      console.error("Failed to delete source:", err);
    }
  };

  const handleRunNow = async (id: string, name: string) => {
    setRunningId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/job-sources/${id}/run-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: userEmail })
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`🌐 Ran "${name}" now — stored ${data.storedCount} real listing(s).`);
      } else {
        alert(data.error || "Failed to run source.");
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setRunningId(null);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px',
    padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#fff', width: '100%'
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-glass)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }} className="text-gradient-purple-pink">🌐 Job Sources</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
            Real, no-AI job board feeds GiGO pulls from on a schedule. Add a new one by mapping its API's real JSON field paths — no code deploy needed.
          </p>
        </div>
        <button className="btn-glass btn-primary" onClick={() => setShowAddForm(v => !v)} style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', fontWeight: 700 }}>
          {showAddForm ? 'Cancel' : '+ Add Source'}
        </button>
      </div>

      {showAddForm && (
        <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-glass)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Source Name</label>
              <input style={inputStyle} placeholder="e.g. Jobicy" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>API URL (must return JSON, no key required)</label>
              <input style={inputStyle} placeholder="https://example.com/api/jobs" value={form.apiUrl} onChange={e => setForm(f => ({ ...f, apiUrl: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Results array path (blank if the response IS the array)</label>
              <input style={inputStyle} placeholder="e.g. data.results" value={form.resultsPath} onChange={e => setForm(f => ({ ...f, resultsPath: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Company name field path *</label>
              <input style={inputStyle} placeholder="e.g. company.name" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Job title field path *</label>
              <input style={inputStyle} placeholder="e.g. title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Location field path</label>
              <input style={inputStyle} placeholder="e.g. locations.0.name" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Application URL field path</label>
              <input style={inputStyle} placeholder="e.g. url" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Description field path</label>
              <input style={inputStyle} placeholder="e.g. description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Posted-date field path</label>
              <input style={inputStyle} placeholder="e.g. created_at" value={form.postedAt} onChange={e => setForm(f => ({ ...f, postedAt: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Remote boolean field path (optional)</label>
              <input style={inputStyle} placeholder="e.g. remote" value={form.remoteFlag} onChange={e => setForm(f => ({ ...f, remoteFlag: e.target.value }))} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <input type="checkbox" checked={form.remoteKeywordCheck} onChange={e => setForm(f => ({ ...f, remoteKeywordCheck: e.target.checked }))} />
            No remote field available — detect "Remote" by keyword-matching the location text instead
          </label>
          <button className="btn-glass btn-primary" onClick={handleAddSource} disabled={isSubmitting} style={{ alignSelf: 'flex-start', padding: '0.5rem 1.25rem', fontWeight: 700 }}>
            {isSubmitting ? 'Adding...' : 'Add & Enable Source'}
          </button>
        </div>
      )}

      <div>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Built-in Sources</h4>
        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>
                <th style={{ padding: '0.5rem' }}>Name</th>
                <th style={{ padding: '0.5rem' }}>API URL</th>
                <th style={{ padding: '0.5rem' }}>Coverage</th>
              </tr>
            </thead>
            <tbody>
              {builtIn.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '0.5rem', fontWeight: 700 }}>{s.name}</td>
                  <td style={{ padding: '0.5rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.7rem' }}>{s.apiUrl}</td>
                  <td style={{ padding: '0.5rem' }}>{s.coverage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
          Admin-Added Sources ({configured.length})
        </h4>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</div>
        ) : configured.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No admin-added sources yet.</div>
        ) : (
          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>
                  <th style={{ padding: '0.5rem' }}>Name</th>
                  <th style={{ padding: '0.5rem' }}>API URL</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                  <th style={{ padding: '0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {configured.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 700 }}>{s.name}</td>
                    <td style={{ padding: '0.5rem', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.7rem', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.apiUrl}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <span className={`badge ${s.enabled ? 'badge-emerald' : 'badge-pink'}`} style={{ fontSize: '0.6rem' }}>
                        {s.enabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <button className="btn-glass" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }} onClick={() => handleRunNow(s.id, s.name)} disabled={runningId === s.id}>
                        {runningId === s.id ? 'Running...' : 'Run Now'}
                      </button>
                      <button className="btn-glass" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }} onClick={() => handleToggle(s.id, !s.enabled)}>
                        {s.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button className="btn-glass" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', borderColor: 'rgba(244, 63, 94, 0.4)', color: '#f43f5e' }} onClick={() => handleDelete(s.id, s.name)}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
