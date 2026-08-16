import React from 'react';

// Single source of truth for the GiGO brand mark — same SVG used as the
// favicon/PWA icon (public/favicon.svg), so the mark is identical everywhere
// it appears instead of three different logos across the app.
export const GiGOLogo: React.FC<{ className?: string; size?: number; showWordmark?: boolean }> = ({ className, size = 48, showWordmark = true }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className || ''}`} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <img
        src="/favicon.svg"
        width={size}
        height={size * (46 / 48)}
        alt="GiGO"
        style={{ filter: 'drop-shadow(0 0 12px rgba(134, 59, 255, 0.5))' }}
      />
      {showWordmark && (
        <span
          className="text-gradient-purple-pink"
          style={{ fontWeight: 900, letterSpacing: '-0.02em', fontSize: `${size * 0.65}px`, lineHeight: 1 }}
        >
          GiGO
        </span>
      )}
    </div>
  );
};
