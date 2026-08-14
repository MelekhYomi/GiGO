interface PermissionConsentModalProps {
  icon: string;
  title: string;
  reason: string;
  onAllow: () => void;
  onCancel: () => void;
}

// A GiGO-branded "why we're asking" screen shown before the native browser
// permission prompt, rather than silently calling getUserMedia/geolocation and
// letting the OS-level dialog be the user's only context for what's being asked.
export default function PermissionConsentModal({ icon, title, reason, onAllow, onCancel }: PermissionConsentModalProps) {
  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 10000, background: 'rgba(5, 3, 15, 0.92)', backdropFilter: 'blur(14px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onCancel}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', padding: '2rem', borderRadius: 'var(--radius-lg)', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{icon}</div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.75rem 0' }}>{title}</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>{reason}</p>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn-glass" style={{ flex: 1, justifyContent: 'center', padding: '0.6rem' }} onClick={onCancel}>
            Not Now
          </button>
          <button className="btn-glass btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '0.6rem', fontWeight: 700 }} onClick={onAllow}>
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
