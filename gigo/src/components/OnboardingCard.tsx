import React from 'react';
import { GiGOLogo } from './GiGOLogo';

export interface OnboardingCardProps {
  onGetStarted?: () => void;
}

export const OnboardingCard: React.FC<OnboardingCardProps> = ({ onGetStarted }) => {
  // Voice onboarding requires a real account (the recording is analyzed and saved
  // against a real userId, and immediately kicks off a real background job scraper
  // run). Tapping the mic here takes the visitor into the actual signup + voice
  // capture flow rather than faking a preview with no real account behind it.
  const handleMicTap = () => {
    onGetStarted?.();
  };

  return (
    <div className="max-w-md mx-auto my-8 p-8 rounded-3xl bg-brandSurface/90 backdrop-blur-xl border border-brandBorder shadow-2xl text-brandTextPrimary font-sans relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-brandPrimary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex justify-center mb-6">
        <GiGOLogo size={56} />
      </div>

      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-brandTextPrimary tracking-tight mb-2">
          Stop Hunting for Jobs. Let AI Build Your Empire.
        </h2>
        <p className="text-sm text-brandTextSecondary leading-relaxed">
          Simply record your voice intro, and your personal GiGO assistant will search for jobs, manage your submissions, and guide your search on autopilot.
        </p>
      </div>

      {/* Mic entry point — hands off into the real signup + voice capture flow */}
      <div className="bg-brandCard/60 rounded-2xl p-5 border border-brandBorder mb-6 text-center">
        <label className="block text-xs font-semibold text-brandPrimary uppercase tracking-widest mb-3">
          Tap & Speak Your Story Natively
        </label>

        <button
          onClick={handleMicTap}
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-all duration-300 hover:shadow-[0_0_20px_var(--primary-glow)] hover:scale-105"
          style={{ backgroundImage: 'linear-gradient(to top right, var(--primary), var(--secondary))' }}
        >
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>

        <p className="text-xs text-brandTextSecondary mt-4 italic">
          Supports English, Pidgin, Yoruba, Hausa, Igbo, etc.
        </p>
      </div>

      <div className="space-y-4">
        <button 
          onClick={onGetStarted}
          className="w-full py-4 px-6 rounded-xl text-white font-bold tracking-wide hover:shadow-[0_0_20px_var(--primary-glow)] transition-all duration-300"
          style={{ backgroundImage: 'linear-gradient(to right, var(--primary), var(--secondary))' }}
        >
          Get Started Now
        </button>
        
        <div className="p-4 rounded-xl bg-brandCard/40 border border-brandBorder flex gap-3 items-start">
          <span className="text-xl">💡</span>
          <p className="text-xs text-brandTextSecondary leading-relaxed">
            <strong className="text-brandTextPrimary font-semibold">Zero Barriers Entry:</strong> Your account launches instantly with a starting <span className="text-brandPrimary font-bold">0 Pace Balance</span>. Refuel with Pace only when your assistant discovers a job opportunity you want optimized and submitted.
          </p>
        </div>
      </div>
    </div>
  );
};
