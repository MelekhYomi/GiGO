import { useState } from 'react';

type AssetType = 'COVER_LETTER' | 'CV' | 'PORTFOLIO';

interface UploadDocumentModalProps {
  API_BASE_URL: string;
  userId: string;
  request: { assetType: AssetType; jobTitle: string; companyName: string; jobId?: string };
  onClose: () => void;
  onSaved: () => void;
}

const LABELS: Record<string, string> = { COVER_LETTER: 'Cover Letter', CV: 'CV / Resume', PORTFOLIO: 'Portfolio' };

export default function UploadDocumentModal({ API_BASE_URL, userId, request, onClose, onSaved }: UploadDocumentModalProps) {
  const [assetType, setAssetType] = useState<AssetType>(request.assetType);
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [step, setStep] = useState<'upload' | 'confirmApplied'>('upload');
  const [isLoggingApplication, setIsLoggingApplication] = useState(false);
  const [markedApplied, setMarkedApplied] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setError(''); }
  };

  const handleSave = async () => {
    if (!file) {
      setError("Please choose a file first.");
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const fileBase64: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1] || '');
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch(`${API_BASE_URL}/api/users/${userId}/documents/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetType,
          fileBase64,
          fileName: file.name,
          mimeType: file.type,
          jobTitle: request.jobTitle,
          companyName: request.companyName,
          jobId: request.jobId
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onSaved();
        setStep('confirmApplied');
      } else {
        setError(data.error || "Failed to upload document.");
      }
    } catch (err: any) {
      setError(`Network error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkApplied = async () => {
    setIsLoggingApplication(true);
    try {
      await fetch(`${API_BASE_URL}/api/users/${userId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: request.jobTitle, company: request.companyName, status: 'applied', confidence: 70, date: 'Today' })
      });
      setMarkedApplied(true);
    } catch {
      alert("Saved your document, but couldn't log the application to your Track board — you can add it manually there.");
    } finally {
      setIsLoggingApplication(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 9998 }}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: '520px', width: '95%' }}>
        <button className="close-btn" onClick={onClose}>&times;</button>

        {step === 'upload' ? (
          <>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              📤 Upload Your Own {LABELS[assetType]}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
              Already have a {LABELS[assetType].toLowerCase()}? Upload it directly for <strong style={{ color: 'var(--text-primary)' }}>{request.jobTitle}</strong> at <strong style={{ color: 'var(--text-primary)' }}>{request.companyName}</strong> — free, no AI generation needed, saved straight to your archive.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {(['CV', 'COVER_LETTER', 'PORTFOLIO'] as AssetType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  className="btn-glass"
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.72rem', fontWeight: 700, background: assetType === t ? 'var(--primary)' : 'transparent' }}
                  onClick={() => setAssetType(t)}
                >
                  {LABELS[t]}
                </button>
              ))}
            </div>
            <input
              type="file"
              accept=".pdf,.doc,.docx,image/*"
              onChange={handleFileChange}
              style={{ width: '100%', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}
            />
            {file && <div style={{ fontSize: '0.75rem', color: '#10b981', marginBottom: '0.75rem' }}>✓ {file.name} ({(file.size / 1024).toFixed(0)} KB)</div>}
            {error && <div className="auth-error-badge" style={{ marginBottom: '1rem' }}>{error}</div>}
            <button className="btn-glass btn-primary" style={{ width: '100%', padding: '0.75rem', fontWeight: 700 }} onClick={handleSave} disabled={isSaving || !file}>
              {isSaving ? 'Uploading...' : `Save ${LABELS[assetType]} to Archive`}
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem', margin: '0 auto 1rem auto'
            }}>{markedApplied ? '🎯' : '✅'}</div>

            {!markedApplied ? (
              <>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>{LABELS[assetType]} Uploaded</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0', lineHeight: 1.4 }}>
                  Have you already sent this application to <strong style={{ color: 'var(--text-primary)' }}>{request.companyName}</strong>? Mark it as applied to track it on your board.
                </p>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button className="btn-glass" style={{ flex: 1, padding: '0.7rem', fontWeight: 700 }} onClick={onClose} disabled={isLoggingApplication}>Not Yet</button>
                  <button className="btn-glass btn-primary" style={{ flex: 1, padding: '0.7rem', fontWeight: 700 }} onClick={handleMarkApplied} disabled={isLoggingApplication}>
                    {isLoggingApplication ? 'Logging...' : '✓ Yes, Mark Applied'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>Logged on Your Track Board</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0', lineHeight: 1.4 }}>
                  {request.jobTitle} at {request.companyName} is now showing under Applied.
                </p>
                <button className="btn-glass btn-primary" style={{ width: '100%', padding: '0.7rem', fontWeight: 700 }} onClick={onClose}>Done</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
