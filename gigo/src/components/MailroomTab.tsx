import React, { useState, useEffect } from 'react';

interface MailroomTabProps {
  userId: string;
  userEmail: string;
  mailThreads: any[];
  setMailThreads: React.Dispatch<React.SetStateAction<any[]>>;
  fetchMailThreads: () => Promise<void>;
  addLog: (log: string) => void;
  API_BASE_URL: string;
  mailBackend?: 'gmail' | 'gigomail' | 'zapier';
}

export const MailroomTab: React.FC<MailroomTabProps> = ({
  userId,
  userEmail,
  mailThreads,
  setMailThreads,
  fetchMailThreads,
  addLog,
  API_BASE_URL,
  mailBackend = 'gigomail',
}) => {
  // Local Mailroom States
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [isSyncingMail, setIsSyncingMail] = useState<boolean>(false);
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);
  const [replyBody, setReplyBody] = useState<string>('');
  const [isGeneratingFollowup, setIsGeneratingFollowup] = useState<boolean>(false);
  const [followupDraftText, setFollowupDraftText] = useState<string>('');
  const [showFollowupModal, setShowFollowupModal] = useState<boolean>(false);
  const [activeMailFolder, setActiveMailFolder] = useState<'inbox' | 'sent' | 'all' | 'trash'>('inbox');
  const [isClearingTrash, setIsClearingTrash] = useState<boolean>(false);
  const [isTrashingThread, setIsTrashingThread] = useState<string | null>(null);

  // Poll mail threads while the Mailroom Tab is active
  useEffect(() => {
    if (!userId) return;

    fetchMailThreads();

    // High-frequency workspace synchronization for folders
    const interval = setInterval(() => {
      fetchMailThreads();
    }, 10000);

    return () => clearInterval(interval);
  }, [userId, fetchMailThreads]);

  // Handler: Move thread to trash
  const handleMoveToTrash = async (threadId: string) => {
    if (!userId) return;
    setIsTrashingThread(threadId);
    try {
      const token = localStorage.getItem('gigo_token');
      const response = await fetch(`${API_BASE_URL}/api/mail/threads/${threadId}/trash`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        addLog(`Moved thread to Trash folder successfully.`);
        setMailThreads(prev => prev.map(t => t.id === threadId ? { ...t, isTrash: true, folder: 'trash' } : t));
        if (selectedThreadId === threadId) {
          setSelectedThreadId(null);
        }
      } else {
        const errData = await response.json();
        console.error("Failed to move to trash:", errData);
      }
    } catch (err) {
      console.error("Error trashing mail thread:", err);
    } finally {
      setIsTrashingThread(null);
    }
  };

  // Handler: Restore thread from trash
  const handleRestoreFromTrash = async (threadId: string) => {
    if (!userId) return;
    setIsTrashingThread(threadId);
    try {
      const token = localStorage.getItem('gigo_token');
      const response = await fetch(`${API_BASE_URL}/api/mail/threads/${threadId}/restore`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        addLog(`Restored thread from Trash successfully.`);
        setMailThreads(prev => prev.map(t => t.id === threadId ? { ...t, isTrash: false, folder: 'inbox' } : t));
      } else {
        const errData = await response.json();
        console.error("Failed to restore thread:", errData);
      }
    } catch (err) {
      console.error("Error restoring mail thread:", err);
    } finally {
      setIsTrashingThread(null);
    }
  };

  // Handler: Empty trash folder
  const handleEmptyTrash = async () => {
    if (!userId) return;
    if (!window.confirm("Are you sure you want to permanently empty the trash? This action is irreversible.")) return;
    setIsClearingTrash(true);
    addLog(`Initiating database purge of Trash folder...`);
    try {
      const token = localStorage.getItem('gigo_token');
      const response = await fetch(`${API_BASE_URL}/api/mail/threads/trash/empty`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        addLog(`Permanently cleared all threads from Trash.`);
        setMailThreads(prev => prev.filter(t => !t.isTrash && t.folder !== 'trash'));
        setSelectedThreadId(null);
      } else {
        const errData = await response.json();
        console.error("Failed to empty trash:", errData);
      }
    } catch (err) {
      console.error("Error emptying trash:", err);
    } finally {
      setIsClearingTrash(false);
    }
  };

  // Handler: Synchronize Inbox / Simulation
  const handleSyncMail = async (forceSimulate = false) => {
    if (!userId) return;
    setIsSyncingMail(true);
    const isGigoMail = mailBackend === 'gigomail';
    const isZapier = mailBackend === 'zapier';
    addLog(isGigoMail 
      ? `Initiating GiGO Mail Sync & Simulated Recruiter Scan...` 
      : (isZapier ? `Initiating Zapier Mail Synchronizer & Audit Logger Sync...` : `Initiating Gmail Inbox Synchronization via Google Email API...`)
    );
    try {
      const token = localStorage.getItem('gigo_token');
      const response = await fetch(`${API_BASE_URL}/api/mail/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ forceSimulate })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        addLog(`📬 ${data.message}`);
        await fetchMailThreads();
      } else {
        addLog(isGigoMail 
          ? `❌ Failed to sync GiGO mailroom: ${data.error || 'Unknown error'}`
          : (isZapier ? `❌ Failed to sync Zapier mailroom: ${data.error || 'Unknown error'}` : `❌ Failed to sync Gmail inbox: ${data.error || 'Unknown error'}`)
        );
      }
    } catch (err) {
      addLog(`❌ Error syncing inbox: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSyncingMail(false);
    }
  };

  // Handler: Send standard reply
  const handleSendReply = async () => {
    if (!userId || !selectedThreadId || !replyBody.trim()) return;
    setIsSendingReply(true);
    const isGigoMail = mailBackend === 'gigomail';
    const isZapier = mailBackend === 'zapier';
    addLog(isGigoMail
      ? `Dispatched email reply via GiGO Virtual Mailroom Agent...`
      : (isZapier ? `Dispatched email reply via Zapier Send Webhook...` : `Dispatched email reply via synced Gmail profile...`)
    );
    try {
      const token = localStorage.getItem('gigo_token');
      const response = await fetch(`${API_BASE_URL}/api/mail/send-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          threadId: selectedThreadId,
          bodyText: replyBody
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        addLog(`📬 Email reply dispatched successfully!`);
        setReplyBody('');
        await fetchMailThreads();
      } else {
        addLog(`❌ Failed to send reply: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      addLog(`❌ Error sending reply: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Handler: Generate tailored career follow-up draft via Gemini
  const handleGenerateFollowup = async (threadId: string) => {
    if (!userId || !threadId) return;
    setIsGeneratingFollowup(true);
    addLog(`Wizard: Gemini Pro drafting tailored routine follow-up email...`);
    try {
      const token = localStorage.getItem('gigo_token');
      const response = await fetch(`${API_BASE_URL}/api/mail/generate-followup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ threadId })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setFollowupDraftText(data.draftText);
        setShowFollowupModal(true);
        addLog(`🪄 Tailored career follow-up draft generated successfully.`);
      } else {
        addLog(`❌ Failed to draft follow-up: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      addLog(`❌ Error drafting follow-up: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsGeneratingFollowup(false);
    }
  };

  // Handler: Send the custom follow-up draft
  const handleSendFollowup = async () => {
    if (!userId || !selectedThreadId || !followupDraftText.trim()) return;
    setIsSendingReply(true);
    const isGigoMail = mailBackend === 'gigomail';
    const isZapier = mailBackend === 'zapier';
    addLog(isGigoMail
      ? `Dispatched AI-generated follow-up via GiGO Virtual Mailroom Agent...`
      : (isZapier ? `Dispatched AI-generated follow-up via Zapier Send Webhook...` : `Dispatched AI-generated follow-up via synced Gmail profile...`)
    );
    try {
      const token = localStorage.getItem('gigo_token');
      const response = await fetch(`${API_BASE_URL}/api/mail/send-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          threadId: selectedThreadId,
          bodyText: followupDraftText
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        addLog(`📬 AI-generated career follow-up email sent successfully.`);
        setShowFollowupModal(false);
        setFollowupDraftText('');
        await fetchMailThreads();
      } else {
        addLog(`❌ Failed to send follow-up: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      addLog(`❌ Error sending follow-up: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Memoized computations derived from threads
  const selectedThread = mailThreads.find(t => t.id === selectedThreadId);

  // Filter threads based on active folder state
  const filteredThreads = mailThreads.filter(t => {
    if (activeMailFolder === 'trash') {
      return t.isTrash || t.folder === 'trash';
    }
    // For other folders, skip trashed ones
    if (t.isTrash || t.folder === 'trash') {
      return false;
    }
    if (activeMailFolder === 'inbox') {
      // Inbox (Received): contains recruiter replies or initialized as inbox
      return t.messages?.some((m: any) => m.sender === 'recruiter') || t.folder === 'inbox';
    }
    if (activeMailFolder === 'sent') {
      // Sent Mail: contains candidate replies and NO recruiter replies (has not transitioned to inbox)
      return (t.messages?.some((m: any) => m.sender === 'user' || m.sender === 'candidate') || t.folder === 'sent') &&
             !(t.messages?.some((m: any) => m.sender === 'recruiter') || t.folder === 'inbox');
    }
    // 'all' folder
    return true;
  });

  // Count computations for badges
  const inboxCount = mailThreads.filter(t => !(t.isTrash || t.folder === 'trash') && (t.messages?.some((m: any) => m.sender === 'recruiter') || t.folder === 'inbox')).length;
  const sentCount = mailThreads.filter(t => !(t.isTrash || t.folder === 'trash') && (t.messages?.some((m: any) => m.sender === 'user' || m.sender === 'candidate') || t.folder === 'sent') && !(t.messages?.some((m: any) => m.sender === 'recruiter') || t.folder === 'inbox')).length;
  const allCount = mailThreads.filter(t => !(t.isTrash || t.folder === 'trash')).length;
  const trashCount = mailThreads.filter(t => t.isTrash || t.folder === 'trash').length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page header — matches the header pattern used across GiGO Brain / AI Coach / Resume Builder */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem'
          }}>📬</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Mailroom</h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{allCount} thread{allCount === 1 ? '' : 's'} · {inboxCount} in inbox</p>
          </div>
        </div>
        <span className="badge badge-purple" style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>{mailBackend === 'gigomail' ? 'GiGO Mail' : mailBackend}</span>
      </div>

      {/* Segmented folder control — replaces the old vertical sidebar so the thread list gets more room */}
      <div className="glass-panel" style={{ display: 'flex', gap: '0.35rem', padding: '0.35rem' }}>
        {([
          { id: 'inbox', label: 'Inbox', count: inboxCount },
          { id: 'sent', label: 'Sent', count: sentCount },
          { id: 'all', label: 'All', count: allCount },
          { id: 'trash', label: 'Trash', count: trashCount }
        ] as const).map(folder => (
          <button
            key={folder.id}
            className="btn-glass"
            style={{
              flex: 1,
              justifyContent: 'center',
              gap: '0.4rem',
              padding: '0.55rem 0.5rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: '10px',
              border: 'none',
              background: activeMailFolder === folder.id ? 'var(--primary)' : 'transparent',
              color: activeMailFolder === folder.id ? '#001018' : 'var(--text-secondary)'
            }}
            onClick={() => { setActiveMailFolder(folder.id); setSelectedThreadId(null); }}
          >
            {folder.label}
            {folder.count > 0 && (
              <span style={{
                fontSize: '0.65rem', padding: '0.05rem 0.4rem', borderRadius: '999px',
                background: activeMailFolder === folder.id ? 'rgba(0,16,24,0.2)' : 'rgba(255,255,255,0.08)'
              }}>{folder.count}</span>
            )}
          </button>
        ))}
      </div>

      <main className="mailroom-container" style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.25rem', height: 'calc(100vh - 320px)', minHeight: '560px' }}>

      {/* Folder sidebar removed in favor of the segmented control above; email-connection status moved into the thread list header. */}

      {/* COLUMN 2: THREAD LIST */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, letterSpacing: '0.05em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
              <span className="pulse-dot" style={{ width: '8px', height: '8px', background: activeMailFolder === 'trash' ? '#f87171' : '#d946ef', borderRadius: '50%', boxShadow: activeMailFolder === 'trash' ? '0 0 10px #f87171' : '0 0 10px #d946ef' }}></span>
              {activeMailFolder === 'inbox' ? 'INBOX' : activeMailFolder === 'sent' ? 'SENT MAIL' : activeMailFolder === 'all' ? 'All Emails' : 'Trash'}
            </h2>
            <span style={{ fontSize: '0.7rem', color: mailBackend === 'gigomail' ? 'var(--success)' : (mailBackend === 'zapier' ? '#f97316' : 'var(--text-secondary)'), display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {mailBackend === 'gigomail' ? '🤖' : (mailBackend === 'zapier' ? '⚡' : '🔑')} Connected to {mailBackend === 'gigomail' ? `${userEmail ? userEmail.split('@')[0] : 'username'}@gigo-mail.com` : (mailBackend === 'zapier' ? 'Zapier Automation' : (userEmail || 'Gmail'))}
            </span>
          </div>
          <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{filteredThreads.length}</span>
        </div>

        {/* EMPTY TRASH TRIGGER BAR */}
        {activeMailFolder === 'trash' && filteredThreads.length > 0 && (
          <button
            className="btn-glass"
            style={{
              marginBottom: '1rem',
              width: '100%',
              justifyContent: 'center',
              color: '#f87171',
              borderColor: 'rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.08)',
              fontWeight: 'bold',
              fontSize: '0.75rem',
              padding: '0.5rem'
            }}
            onClick={handleEmptyTrash}
            disabled={isClearingTrash}
          >
            {isClearingTrash ? '🗑️ Purging Trash...' : '🗑️ Empty Trash Now'}
          </button>
        )}

        {/* SYNC ACTIONS */}
        {activeMailFolder !== 'trash' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            <button
              className="btn-glass"
              style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem', borderColor: 'rgba(139, 92, 246, 0.3)' }}
              onClick={() => handleSyncMail(false)}
              disabled={isSyncingMail}
            >
              {isSyncingMail ? 'Syncing...' : '🔄 Sync Inbox'}
            </button>
            <button
              className="btn-glass btn-secondary"
              style={{ 
                justifyContent: 'center', 
                fontSize: '0.8rem', 
                padding: '0.5rem', 
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(15, 13, 35, 0.4))',
                border: '1px solid rgba(236, 72, 153, 0.3)' 
              }}
              onClick={() => handleSyncMail(true)}
              disabled={isSyncingMail}
              title="Get an example reply from an employer"
            >
              {isSyncingMail ? 'Simulating...' : '🤖 Force Reply'}
            </button>
          </div>
        )}

        {/* THREAD CARDS LIST */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
          {filteredThreads.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📬</div>
              <p style={{ margin: 0, lineHeight: 1.4 }}>No email threads here.</p>
              <p style={{ fontSize: '0.72rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                {activeMailFolder === 'trash' 
                  ? 'Deleted conversations will reside here before permanent purge.' 
                  : 'Active vacancy communications will initialize here automatically.'}
              </p>
            </div>
          ) : (
            filteredThreads.map(thread => {
              const isSelected = thread.id === selectedThreadId;
              const lastMessage = thread.messages && thread.messages.length > 0 ? thread.messages[thread.messages.length - 1] : null;
              
              // Status pill styling
              let statusColor = '#eab308';
              let statusText = 'Awaiting Recruiter';
              let statusBg = 'rgba(234, 179, 8, 0.15)';
              
              if (thread.status === 'replied') {
                statusColor = '#a78bfa';
                statusText = 'Recruiter Replied';
                statusBg = 'rgba(167, 139, 250, 0.15)';
              } else if (thread.status === 'interview_offered') {
                statusColor = '#10b981';
                statusText = 'Interview Offered';
                statusBg = 'rgba(16, 185, 129, 0.15)';
              } else if (thread.status === 'rejected') {
                statusColor = '#ef4444';
                statusText = 'Rejected / Closed';
                statusBg = 'rgba(239, 68, 68, 0.15)';
              }

              const isUnread = thread.status === 'replied' || thread.status === 'interview_offered';
              const initials = (thread.companyName || '?').split(/\s+/).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
              const avatarGradients = ['linear-gradient(135deg,#38bdf8,#0284c7)', 'linear-gradient(135deg,#863bff,#6d28d9)', 'linear-gradient(135deg,#10b981,#047857)', 'linear-gradient(135deg,#f59e0b,#b45309)'];
              const avatarGradient = avatarGradients[Math.abs((thread.companyName || '').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0)) % avatarGradients.length];

              return (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  style={{
                    display: 'flex',
                    gap: '0.7rem',
                    alignItems: 'flex-start',
                    padding: '0.85rem',
                    cursor: 'pointer',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: isSelected ? '0 0 12px rgba(56, 189, 248, 0.15)' : 'none',
                    background: isSelected ? 'rgba(56, 189, 248, 0.06)' : 'rgba(15, 13, 35, 0.3)',
                    transition: 'all 0.2s ease',
                    borderRadius: '12px'
                  }}
                >
                  <div className="avatar-badge" style={{ width: '38px', height: '38px', borderRadius: '11px', background: avatarGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.78rem', color: 'var(--text-primary)', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {thread.companyName}
                      </span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                        {thread.updatedAt ? new Date(thread.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600, marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {thread.jobTitle}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {thread.subject}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem' }}>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: statusColor, background: statusBg, padding: '0.12rem 0.45rem', borderRadius: '999px', border: `1px solid ${statusColor}33` }}>
                        {statusText}
                      </span>
                      {thread.isSimulated && (
                        <span title="The real email couldn't be sent (no mail backend configured or the send failed) — this was logged but not actually delivered to the employer." style={{ fontSize: '0.6rem', fontWeight: 700, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '0.12rem 0.45rem', borderRadius: '999px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          ⚠️ Not Delivered
                        </span>
                      )}
                      {lastMessage && (
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                          {lastMessage.sender === 'user' ? 'You replied' : 'They replied'}
                        </span>
                      )}
                    </div>
                  </div>
                  {isUnread && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: '0.3rem' }} />}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* COLUMN 3: ACTIVE THREAD */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '1.25rem' }}>
        {!selectedThread ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', filter: 'drop-shadow(0 0 10px rgba(139,92,246,0.3))' }}>📡</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Communications Sandbox</h3>
            <p style={{ maxWidth: '400px', fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
              Select a career correspondence thread from the folders or lists to view, draft, and dispatch follow-ups or coordinate interviews directly inside your GiGO cockpit.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {selectedThread.isSimulated && (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.78rem', color: '#fde047', lineHeight: 1.4 }}>
                ⚠️ <strong>This application was not actually delivered.</strong> The real email send failed or no mail backend was configured, so this was logged for your records but never reached the employer. Consider re-sending it manually.
              </div>
            )}

            {/* ACTIVE THREAD HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {selectedThread.companyName}
                  </span>
                  <span className="badge badge-pink" style={{ fontSize: '0.75rem' }}>{selectedThread.jobTitle}</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Subject: <span style={{ color: '#d8b4fe' }}>{selectedThread.subject}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  Recruiter Contact: <strong style={{ color: 'var(--text-secondary)' }}>{selectedThread.recruiterName || 'Hiring Team'}</strong> &lt;{selectedThread.recipientEmail}&gt;
                </div>
              </div>

              {/* THREAD ACTION CONTROLS */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {selectedThread.isTrash || selectedThread.folder === 'trash' ? (
                  <button
                    className="btn-glass"
                    style={{
                      color: '#10b981',
                      borderColor: 'rgba(16, 185, 129, 0.4)',
                      background: 'rgba(16, 185, 129, 0.08)',
                      fontWeight: 700,
                      padding: '0.5rem 1rem',
                      fontSize: '0.8rem'
                    }}
                    onClick={() => handleRestoreFromTrash(selectedThread.id)}
                    disabled={isTrashingThread === selectedThread.id}
                  >
                    {isTrashingThread === selectedThread.id ? 'Restoring...' : '🔄 Restore from Trash'}
                  </button>
                ) : (
                  <>
                    <button
                      className="btn-glass"
                      style={{
                        color: '#f87171',
                        borderColor: 'rgba(239, 68, 68, 0.4)',
                        background: 'rgba(239, 68, 68, 0.08)',
                        fontWeight: 700,
                        padding: '0.5rem 1rem',
                        fontSize: '0.8rem'
                      }}
                      onClick={() => handleMoveToTrash(selectedThread.id)}
                      disabled={isTrashingThread === selectedThread.id}
                      title="Move this email thread to trash folder"
                    >
                      {isTrashingThread === selectedThread.id ? 'Deleting...' : '🗑️ Move to Trash'}
                    </button>

                    {/* ROUTINE FOLLOW UP TRIGGER */}
                    <button
                      className="btn-glass"
                      style={{
                        background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(15, 13, 35, 0.4))',
                        border: '1px solid rgba(167, 139, 250, 0.4)',
                        color: '#e9d5ff',
                        fontWeight: 700,
                        padding: '0.5rem 1rem',
                        boxShadow: '0 0 10px rgba(167, 139, 250, 0.1)',
                        fontSize: '0.8rem'
                      }}
                      onClick={() => handleGenerateFollowup(selectedThread.id)}
                      disabled={isGeneratingFollowup}
                    >
                      {isGeneratingFollowup ? '🪄 Drafting...' : '🪄 AI Follow-Up'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* MESSAGES LOG CONTAINER */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', marginBottom: '1.25rem' }}>
              {(!selectedThread.messages || selectedThread.messages.length === 0) ? (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '2rem 0' }}>
                  No logged communications in this thread yet.
                </p>
              ) : (
                selectedThread.messages.map((msg: any) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: isUser ? 'flex-end' : 'flex-start',
                        width: '100%'
                      }}
                    >
                      <div
                        style={{
                          maxWidth: '75%',
                          borderRadius: '12px',
                          padding: '1rem',
                          background: isUser ? 'rgba(76, 29, 149, 0.25)' : 'rgba(30, 41, 59, 0.4)',
                          border: isUser ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(255,255,255,0.06)',
                          boxShadow: isUser ? '0 4px 12px rgba(139, 92, 246, 0.05)' : 'none',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {/* Message Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.25rem', gap: '2rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isUser ? '#d8b4fe' : '#94a3b8' }}>
                            {isUser ? 'YOU (Candidate)' : `${msg.senderName || 'Recruiter'} (Recruiting Team)`}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {new Date(msg.timestamp).toLocaleString()}
                          </span>
                        </div>

                        {/* Message Body */}
                        {isUser ? (
                          <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.5, color: '#f3e8ff' }}>
                            {msg.body}
                          </div>
                        ) : (
                          <div 
                            style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-primary)' }}
                            className="recruiter-email-body"
                            dangerouslySetInnerHTML={{ __html: msg.body }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* MESSAGE INPUT EDITOR FOOTER */}
            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
              {selectedThread.isTrash || selectedThread.folder === 'trash' ? (
                <div style={{ textAlign: 'center', padding: '1.25rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', fontWeight: 500 }}>
                  ⚠️ This email thread is currently in the Trash bin. Replying is disabled. Please restore the thread to dispatch replies.
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <textarea
                        rows={3}
                        className="input-glass"
                        placeholder={`Draft a detailed email response to send from ${userEmail || 'synced address'}...`}
                        style={{ 
                          width: '100%', 
                          resize: 'none', 
                          background: 'var(--bg-dark-card)',
                          border: '1px solid var(--border-glass)',
                          padding: '0.75rem',
                          fontSize: '0.85rem',
                          color: '#f3e8ff',
                          outline: 'none'
                        }}
                        value={replyBody}
                        onChange={(e) => setReplyBody(e.target.value)}
                      />
                    </div>
                    <button
                      className="btn-glass"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(15, 13, 35, 0.4))',
                        borderColor: 'rgba(139, 92, 246, 0.6)',
                        padding: '0.75rem 1.5rem',
                        height: '46px',
                        fontWeight: 700,
                        fontSize: '0.85rem'
                      }}
                      onClick={handleSendReply}
                      disabled={isSendingReply || !replyBody.trim()}
                    >
                      {isSendingReply ? 'Sending...' : 'Send Reply ✉️'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    <span>Dispatches instantly via secure Google SMTP handshake.</span>
                    <span>Secure SSL/TLS encrypted</span>
                  </div>
                </>
              )}
            </div>

          </div>
        )}
      </div>

      {/* AI FOLLOW-UP MODAL */}
      {showFollowupModal && (
        <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 3, 10, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <div className="glass-panel animate-scale-up" style={{ width: '650px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', background: 'var(--bg-dark-surface)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="text-gradient-purple-pink">
                <span>🪄</span> AI Career Correspondence Wizard
              </h2>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.1rem' }}
                onClick={() => { setShowFollowupModal(false); setFollowupDraftText(''); }}
              >
                ✕
              </button>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                COGNITIVE DRAFT SUGGESTED BY GEMINI PRO:
              </label>
              <textarea
                rows={12}
                className="input-glass"
                style={{
                  width: '100%',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                  padding: '0.75rem',
                  background: 'var(--bg-dark-card)'
                }}
                value={followupDraftText}
                onChange={(e) => setFollowupDraftText(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem' }}>
              <button
                className="btn-glass btn-secondary"
                onClick={() => { setShowFollowupModal(false); setFollowupDraftText(''); }}
                disabled={isSendingReply}
              >
                Cancel Draft
              </button>
              <button
                className="btn-glass"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(15, 13, 35, 0.4))',
                  borderColor: '#8b5cf6'
                }}
                onClick={handleSendFollowup}
                disabled={isSendingReply || !followupDraftText.trim()}
              >
                {isSendingReply ? 'Dispatched...' : 'Send Tailored Email 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}

      </main>
    </div>
  );
};
