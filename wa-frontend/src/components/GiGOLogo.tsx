import React from 'react';

export const GiGOLogo: React.FC<{ className?: string; size?: number }> = ({ className, size = 48 }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]"
      >
        <defs>
          <linearGradient id="gigoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06B6D4" /> {/* Neon Cyan */}
            <stop offset="50%" stopColor="#3B82F6" /> {/* Electric Blue */}
            <stop offset="100%" stopColor="#6366F1" /> {/* Deep Indigo */}
          </linearGradient>
        </defs>
        {/* Outer Tech Grid Layer */}
        <circle cx="100" cy="100" r="90" stroke="url(#gigoGradient)" strokeWidth="2" strokeDasharray="6 6" className="opacity-40" />
        {/* Core Stylized Geometric G */}
        <path
          d="M125 70C118 62 108 58 96 58C72 58 54 77 54 100C54 123 72 142 96 142C116 142 128 130 132 112H96V92H154C155 95 155 98 155 102C155 136 131 164 96 164C60 164 30 135 30 100C30 65 60 36 96 36C116 36 134 44 146 58L125 70Z"
          fill="url(#gigoGradient)"
        />
        {/* Inner Glowing Core */}
        <circle cx="100" cy="100" r="10" fill="#06B6D4" className="animate-pulse" />
      </svg>
      
      {/* Creative Typography Styling */}
      <span className="font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 text-3xl font-sans">
        Gi<span className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">GO</span>
      </span>
    </div>
  );
};
