import { useState, useEffect } from 'react';

interface LegalDocumentModalProps {
  API_BASE_URL: string;
  docType: 'terms' | 'privacy';
  onClose: () => void;
}

// Minimal markdown-to-JSX renderer for the legal text (headings, bold, paragraphs)
// — avoids pulling in a markdown library for what's a fairly simple document shape.
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('## ')) {
      return <h3 key={i} style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '1.5rem', marginBottom: '0.5rem' }}>{line.slice(3)}</h3>;
    }
    if (line.startsWith('# ')) {
      return <h2 key={i} style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{line.slice(2)}</h2>;
    }
    if (line.trim() === '') return <div key={i} style={{ height: '0.5rem' }} />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 0.4rem 0' }}>
        {parts.map((p, j) => p.startsWith('**') && p.endsWith('**')
          ? <strong key={j} style={{ color: 'var(--text-primary)' }}>{p.slice(2, -2)}</strong>
          : <span key={j}>{p}</span>
        )}
      </p>
    );
  });
}

export default function LegalDocumentModal({ API_BASE_URL, docType, onClose }: LegalDocumentModalProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/legal`)
      .then(res => res.json())
      .then(data => {
        setContent(docType === 'terms' ? data.termsOfService : data.privacyPolicy);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [docType]);

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 9998, background: 'rgba(5, 3, 15, 0.9)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', maxHeight: '85vh', padding: '2rem', borderRadius: 'var(--radius-lg)', position: 'relative', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" style={{ position: 'absolute', top: '1rem', right: '1.25rem', fontSize: '1.5rem' }} onClick={onClose}>&times;</button>
        <div style={{ overflowY: 'auto', paddingRight: '0.5rem' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>Loading...</div>
          ) : (
            renderMarkdown(content)
          )}
        </div>
      </div>
    </div>
  );
}
