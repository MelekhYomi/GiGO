import { useState } from 'react';

interface ManualDocumentModalProps {
  API_BASE_URL: string;
  userId: string;
  request: { assetType: 'COVER_LETTER' | 'CV' | 'PORTFOLIO'; jobTitle: string; companyName: string; jobId?: string };
  onClose: () => void;
  onSaved: () => void;
}

const LABELS: Record<string, string> = { COVER_LETTER: 'Cover Letter', CV: 'CV / Resume', PORTFOLIO: 'Portfolio' };

export default function ManualDocumentModal({ API_BASE_URL, userId, request, onClose, onSaved }: ManualDocumentModalProps) {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (content.trim().length < 20) {
      alert("Please write at least a few sentences before saving.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/documents/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetType: request.assetType,
          content,
          jobTitle: request.jobTitle,
          companyName: request.companyName,
          jobId: request.jobId
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSaved();
        const wantsMarkApplied = confirm(`Saved. Have you already sent this application to ${request.companyName}? Click OK to mark it as Applied on your Track board.`);
        if (wantsMarkApplied) {
          try {
            await fetch(`${API_BASE_URL}/api/users/${userId}/tasks`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: request.jobTitle,
                company: request.companyName,
                status: 'applied',
                confidence: 70,
                date: 'Today'
              })
            });
          } catch (taskErr) {
            console.error("Failed to log manual application:", taskErr);
          }
        }
        onClose();
      } else {
        alert(data.error || "Failed to save document.");
      }
    } catch (err: any) {
      alert(`Network error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 9998 }}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: '600px', width: '95%' }}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: '#fff' }}>
          ✍️ Write Your Own {LABELS[request.assetType]}
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
          AI generation is temporarily unavailable — your wallet was refunded. Write your own {LABELS[request.assetType].toLowerCase()} for <strong style={{ color: '#fff' }}>{request.jobTitle}</strong> at <strong style={{ color: '#fff' }}>{request.companyName}</strong> below. It's saved to your archive free of charge, and you can apply with it manually.
        </p>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={`Write your ${LABELS[request.assetType].toLowerCase()} here...`}
          rows={12}
          style={{
            width: '100%', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-glass)',
            borderRadius: '10px', padding: '0.85rem', fontSize: '0.85rem', color: '#fff',
            lineHeight: 1.5, resize: 'vertical', fontFamily: 'inherit', marginBottom: '1rem'
          }}
        />
        <button className="btn-glass btn-primary" style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }} onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : `Save ${LABELS[request.assetType]} to Archive`}
        </button>
      </div>
    </div>
  );
}
