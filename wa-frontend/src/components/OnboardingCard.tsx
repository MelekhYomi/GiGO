import React from 'react';
import { GiGOLogo } from './GiGOLogo';
import { useAudioStreamer } from '../hooks/useAudioStreamer';

export interface OnboardingCardProps {
  onGetStarted?: () => void;
}

export const OnboardingCard: React.FC<OnboardingCardProps> = ({ onGetStarted }) => {
  // Configured with the actual live Google Cloud Run service endpoint
  const LIVE_BACKEND_URL = 'https://wa-backend-536473631781.us-central1.run.app';

  const {
    isRecording,
    processingStatus,
    extractedData,
    startStreaming,
    stopStreaming
  } = useAudioStreamer(LIVE_BACKEND_URL);

  const handleMicTap = () => {
    if (isRecording) {
      stopStreaming();
    } else {
      startStreaming();
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-8 rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-slate-800 shadow-2xl text-slate-100 font-sans relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex justify-center mb-6">
        <GiGOLogo size={56} />
      </div>

      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-white tracking-tight mb-2">
          Stop Hunting for Jobs. Let AI Build Your Empire.
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Just drop your voice or records here, and your personal autonomous GiGO agent will run deep search matches, handle your applications, and secure your bags instantly on autopilot.
        </p>
      </div>

      {/* Mic Streaming Interface Core */}
      <div className="bg-slate-950/60 rounded-2xl p-5 border border-slate-800/60 mb-6 text-center">
        <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-widest mb-3">
          Tap & Speak Your Story Natively
        </label>
        
        <button
          onClick={handleMicTap}
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ${
            isRecording 
              ? 'bg-red-500 shadow-[0_0_22px_rgba(239,68,68,0.6)] scale-95' 
              : 'bg-gradient-to-tr from-cyan-500 to-blue-600 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105'
          }`}
        >
          {isRecording ? (
            <div className="w-6 h-6 bg-white rounded-sm animate-pulse" />
          ) : (
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>

        {/* Real-time Processing Status Telemetry Readout */}
        <p className="text-xs text-slate-400 mt-4 italic animate-pulse">
          {processingStatus || "Supports English, Pidgin, Yoruba, Hausa, Igbo, etc."}
        </p>
      </div>

      {/* Dynamic Render: Display extracted data the moment Gemini returns it */}
      {extractedData && (
        <div className="mb-6 p-4 rounded-xl bg-cyan-950/20 border border-cyan-800/30 font-mono text-left space-y-2">
          <div className="text-[11px] uppercase tracking-wider font-bold text-cyan-400">⚡ Profile Captured By Gemini:</div>
          <div className="text-xs"><span className="text-slate-500">Name:</span> <span className="text-white font-semibold">{extractedData.name}</span></div>
          <div className="text-xs"><span className="text-slate-500">Experience:</span> <span className="text-white font-semibold">{extractedData.experienceYears} Years</span></div>
          <div className="text-xs"><span className="text-slate-500">Dialect/Accent Identity:</span> <span className="text-indigo-400">{extractedData.identifiedDialectAccent}</span></div>
          <div className="text-[11px] text-slate-500 mt-1">Skills: {extractedData.credentials?.join(', ')}</div>
        </div>
      )}

      <div className="space-y-4">
        <button 
          onClick={onGetStarted}
          className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white font-bold tracking-wide hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300"
        >
          Get Started Now
        </button>
        
        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800/50 flex gap-3 items-start">
          <span className="text-xl">💡</span>
          <p className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-white font-semibold">Zero Barriers Entry:</strong> Your account launches instantly with an immutable <span className="text-cyan-400 font-bold">₦0 & $0 Base Ledger Balance</span>. Top up small micro-tokens only when your autonomous agent discovers a job opportunity you want optimized and submitted.
          </p>
        </div>
      </div>
    </div>
  );
};
