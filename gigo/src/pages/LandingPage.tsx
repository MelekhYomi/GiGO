import React, { useState, useEffect } from 'react';
import { GiGOLogo } from '../components/GiGOLogo';
import { OnboardingCard } from '../components/OnboardingCard';
import { AgentTelemetryCards } from '../components/AgentTelemetryCards';

export interface LandingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, onSignUp }) => {
  // Referral form state
  const [friendContact, setFriendContact] = useState('');
  const [friendName, setFriendName] = useState('');
  const [isReferralSubmitted, setIsReferralSubmitted] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Walkthrough details modal toggle
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  // Interactive Cost Calculator state inside walkthrough
  const [calcPace, setCalcPace] = useState<number>(50);

  // System preference theme detection display
  const [systemTheme, setSystemTheme] = useState('dark');
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const listener = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const handleReferralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendContact) return;
    
    // Generate a beautiful, pseudo-randomized ambassador referral code
    const cleanContact = friendContact.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toLowerCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    setReferralCode(`gigo-ambassador-${cleanContact || 'invite'}-${rand}`);
    setIsReferralSubmitted(true);
  };

  const copyReferralLink = () => {
    const link = `https://gigo.vercel.app?ref=${referralCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-brandBg text-brandTextPrimary selection:bg-brandPrimary selection:text-brandBg overflow-x-hidden relative transition-colors duration-300">
      
      {/* Calm Backglow Effect */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-gradient-to-tr from-brandSecondary/8 to-transparent rounded-full blur-[140px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] bg-gradient-to-br from-brandPrimary/8 to-transparent rounded-full blur-[140px]" />
      </div>

      {/* Simplified, Sleek Actionable Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-5 flex justify-between items-center border-b border-brandBorder relative z-10">
        <div className="flex items-center gap-2">
          <GiGOLogo size={38} />
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={() => setShowWalkthrough(true)}
            className="text-sm font-medium text-brandTextSecondary hover:text-brandPrimary transition-colors"
          >
            How it works
          </button>
          <button
            onClick={onSignIn}
            className="px-4 py-2 rounded-xl text-sm font-medium text-brandTextPrimary border border-brandBorder hover:bg-brandCard/40 transition-all"
          >
            Sign in
          </button>
          <button
            onClick={onSignUp}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-brandPrimary to-brandSecondary text-sm font-semibold text-white hover:shadow-[0_0_20px_var(--primary-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Start now
          </button>
        </div>
      </nav>

      {/* Main Focus: Hero Section & Embedded Onboarding (The Act-Now Core) */}
      <header className="max-w-7xl mx-auto px-6 pt-12 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Column: Bold Action copywriting */}
        <div className="lg:col-span-7 space-y-8 text-left">
          
          {/* Welcoming Bonus Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brandPrimary/10 border border-brandPrimary/20 text-[11px] font-semibold text-brandPrimary tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-brandPrimary" />
            Welcome bonus: 250 Pace instantly
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-brandTextPrimary tracking-tight leading-[1.1]">
              Deploy your AI career mind clone,{' '}
              <span className="bg-gradient-to-r from-brandPrimary to-brandSecondary bg-clip-text text-transparent">
                on autopilot
              </span>
            </h1>
            <p className="text-base sm:text-lg text-brandTextSecondary leading-relaxed max-w-xl">
              Record a short voice intro or import your email to start. GiGO scans top global opportunities 24/7, tailors your resume instantly, and drafts applications in the background.
            </p>
          </div>

          {/* Simple Bullet Action Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            <div className="flex items-start gap-2.5 py-1">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brandPrimary shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-brandTextPrimary">No forms required</h4>
                <p className="text-[12px] text-brandTextSecondary">Speak naturally to set up your CV.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 py-1">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brandSecondary shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-brandTextPrimary">Automatic tailoring</h4>
                <p className="text-[12px] text-brandTextSecondary">Bypass writer's block instantly.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 py-1">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brandPrimary shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-brandTextPrimary">Background matcher</h4>
                <p className="text-[12px] text-brandTextSecondary">Scans and indexes live jobs 24/7.</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 py-1">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brandSecondary shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-brandTextPrimary">Zero barriers to start</h4>
                <p className="text-[12px] text-brandTextSecondary">Refuel with Pace only as you apply.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <button
              onClick={onSignUp}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brandPrimary to-brandSecondary text-white font-semibold text-sm hover:shadow-[0_0_25px_var(--primary-glow)] hover:scale-[1.02] active:scale-95 transition-all"
            >
              Claim your 250 Pace sign-up bonus
            </button>
          </div>
        </div>

        {/* Right Column: Embedded Onboarding Micro-Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto relative lg:justify-self-end">
          <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-brandPrimary to-brandSecondary opacity-20 blur-xl"></div>
          <div className="relative">
            <OnboardingCard onGetStarted={onSignUp} />
          </div>
        </div>
      </header>

      {/* AI Agent Team Showcase — always visible, not hidden behind a click */}
      <section className="border-t border-brandBorder relative z-10 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brandPrimary/10 border border-brandPrimary/20 text-[11px] font-semibold text-brandPrimary tracking-wide mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-brandPrimary" />
              Meet your AI agent team
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-brandTextPrimary tracking-tight mb-3">
              Eight agents working your career, around the clock
            </h2>
            <p className="text-sm sm:text-base text-brandTextSecondary max-w-2xl mx-auto leading-relaxed">
              Not one chatbot wearing different hats — real, specialized agents that discover, write, apply, and coach, so you're never starting from a blank page.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🎙️', name: 'Voice Onboarding Agent', desc: 'Just talk. It builds your entire profile — work history, skills, goals — from a short voice note. No forms.' },
              { icon: '🔍', name: 'Job Scout Agent', desc: 'Continuously scans RemoteOK, The Muse, Arbeitnow, and admin-curated boards, filtering out anything below your match threshold.' },
              { icon: '✍️', name: 'Document Composer Agent', desc: 'Writes ATS-optimized CVs, cover letters, and portfolios tailored to each specific job in seconds, grounded in your real history.' },
              { icon: '🚀', name: 'Auto-Apply Agent', desc: 'Submits applications on your behalf for high-confidence matches while you sleep — or review every one manually, your call.' },
              { icon: '📬', name: 'GiGO Mailroom', desc: 'One inbox for every application response. Connect Gmail once — GiGO tracks recruiter replies automatically from there.' },
              { icon: '🧠', name: 'AI Career Coach', desc: 'Chat anytime for career advice grounded in your actual profile and goals, not generic scripts.' },
              { icon: '🎤', name: 'Mock Interview Room', desc: 'Practice voice-to-voice with an AI interviewer tailored to your target role. Free and unlimited.' },
              { icon: '📊', name: 'GiGO Brain', desc: 'Your personal analytics dashboard — match trends, application velocity, and career momentum score at a glance.' },
            ].map((agent) => (
              <div key={agent.name} className="p-5 rounded-2xl bg-brandCard/40 border border-brandBorder space-y-3 text-left hover:border-brandPrimary/40 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brandPrimary/20 to-brandSecondary/20 border border-brandBorder flex items-center justify-center text-xl">
                  {agent.icon}
                </div>
                <h4 className="text-sm font-bold text-brandTextPrimary">{agent.name}</h4>
                <p className="text-[12px] text-brandTextSecondary leading-relaxed">{agent.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* See Inside GiGO — real in-app UI previews, styled with the same tokens as the live app */}
      <section className="border-t border-brandBorder relative z-10 bg-brandCard/25 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brandSecondary/10 border border-brandSecondary/20 text-[11px] font-semibold text-brandSecondary tracking-wide mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-brandSecondary" />
              See inside GiGO
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-brandTextPrimary tracking-tight mb-3">
              A real look at the dashboard you'll be using
            </h2>
            <p className="text-sm sm:text-base text-brandTextSecondary max-w-2xl mx-auto leading-relaxed">
              Not marketing screenshots — this is the actual UI, before you've even signed up.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Mini preview: Track Board */}
            <div className="rounded-2xl bg-brandSurface border border-brandBorder p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brandTextSecondary">Track Board</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandPrimary/10 text-brandPrimary font-semibold">Live</span>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Matched', color: 'bg-brandPrimary', items: ['Backend Eng · Stripe', 'Product Designer · Notion'] },
                  { label: 'Applied', color: 'bg-brandSecondary', items: ['Data Analyst · Flutterwave'] },
                  { label: 'Interviews', color: 'bg-emerald-500', items: ['DevOps Eng · Paystack'] },
                ].map(col => (
                  <div key={col.label}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${col.color}`} />
                      <span className="text-[10px] font-bold uppercase text-brandTextMuted">{col.label}</span>
                    </div>
                    {col.items.map(item => (
                      <div key={item} className="text-[11px] text-brandTextPrimary bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-1.5 mb-1">
                        {item}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Mini preview: Wallet */}
            <div className="rounded-2xl bg-brandSurface border border-brandBorder p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brandTextSecondary">Wallet</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandPrimary/10 text-brandPrimary font-semibold">Pay-as-you-go</span>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-brandPrimary/15 to-brandSecondary/15 border border-brandBorder p-4 mb-3">
                <div className="text-[10px] text-brandTextMuted uppercase font-bold mb-1">Career Momentum</div>
                <div className="text-2xl font-black text-brandTextPrimary">250 <span className="text-sm font-semibold text-brandTextSecondary">Pace</span></div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] text-brandTextSecondary bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-1.5">
                  <span>ATS CV compiled</span><span className="text-brandTextPrimary font-semibold">-5 Pace</span>
                </div>
                <div className="flex justify-between text-[11px] text-brandTextSecondary bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-1.5">
                  <span>Bank transfer top-up</span><span className="text-emerald-400 font-semibold">+200 Pace</span>
                </div>
              </div>
            </div>

            {/* Mini preview: Mailroom */}
            <div className="rounded-2xl bg-brandSurface border border-brandBorder p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brandTextSecondary">Mailroom</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandSecondary/10 text-brandSecondary font-semibold">2 new</span>
              </div>
              <div className="space-y-1.5">
                <div className="bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-2">
                  <div className="flex justify-between text-[11px] font-semibold text-brandTextPrimary mb-0.5">
                    <span>Flutterwave Recruiting</span><span className="text-brandTextMuted font-normal">2h</span>
                  </div>
                  <div className="text-[11px] text-brandTextSecondary truncate">Thanks for applying — next steps for Data Analyst...</div>
                </div>
                <div className="bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-2">
                  <div className="flex justify-between text-[11px] font-semibold text-brandTextPrimary mb-0.5">
                    <span>Paystack Careers</span><span className="text-brandTextMuted font-normal">1d</span>
                  </div>
                  <div className="text-[11px] text-brandTextSecondary truncate">We'd like to schedule an interview for DevOps...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Double-Action: Engaging GiGO Ambassador & Referrals Module */}
      <section className="border-t border-brandBorder relative z-10 bg-brandCard/25 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brandSecondary/10 border border-brandSecondary/20 text-[11px] font-semibold text-brandSecondary tracking-wide mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brandSecondary" />
            Earn rewards, cash & prizes
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold text-brandTextPrimary tracking-tight mb-4">
            Become a GiGO Ambassador and help others get hired
          </h2>
          
          <p className="text-sm sm:text-base text-brandTextSecondary leading-relaxed max-w-2xl mx-auto mb-10">
            Do you know a classmate, friend, or relative looking for work? Even if you don't need a job yourself, recommending them increases your **GiGO Ambassador Score**. Gain points to secure future cash payouts, gadgets, and exclusive rewards!
          </p>

          <div className="max-w-lg mx-auto bg-brandSurface border border-brandBorder rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-brandSecondary/5 rounded-full blur-2xl pointer-events-none" />
            
            {!isReferralSubmitted ? (
              <form onSubmit={handleReferralSubmit} className="space-y-4 text-left relative z-10">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-brandTextSecondary mb-1.5">
                    Friend's Name
                  </label>
                  <input 
                    type="text" 
                    value={friendName}
                    onChange={(e) => setFriendName(e.target.value)}
                    placeholder="e.g. Chidi, Yomi, Tobi" 
                    className="w-full px-4 py-3 rounded-xl bg-brandBg border border-brandBorder text-brandTextPrimary text-sm focus:outline-none focus:border-brandPrimary focus:ring-2 focus:ring-brandPrimary/10 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-brandTextSecondary mb-1.5">
                    Friend's Email Address or Phone Number *
                  </label>
                  <input 
                    type="text" 
                    required
                    value={friendContact}
                    onChange={(e) => setFriendContact(e.target.value)}
                    placeholder="Enter email or WhatsApp number" 
                    className="w-full px-4 py-3 rounded-xl bg-brandBg border border-brandBorder text-brandTextPrimary text-sm focus:outline-none focus:border-brandPrimary focus:ring-2 focus:ring-brandPrimary/10 transition-all"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brandPrimary to-brandSecondary text-white text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_var(--primary-glow)] transition-all"
                >
                  Recommend Job Seeker & Secure Spot 🚀
                </button>
              </form>
            ) : (
              <div className="space-y-6 text-center animate-fade-in relative z-10">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-brandTextPrimary">
                    Ambassador Slot Registered!
                  </h3>
                  <p className="text-xs text-brandTextSecondary leading-relaxed">
                    Awesome job! We have reserved your Ambassador Slot for <strong className="text-brandTextPrimary">{friendName || friendContact}</strong>. When they sign up using your link below, you earn <span className="text-brandPrimary font-bold">+50 Ambassador points</span>.
                  </p>
                </div>

                <div className="p-4 bg-brandBg border border-brandBorder rounded-2xl space-y-2 text-left font-mono text-xs">
                  <div className="text-[10px] text-brandTextMuted uppercase font-extrabold">Your Unique Ambassador Link</div>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      readOnly 
                      value={`https://gigo.vercel.app?ref=${referralCode}`} 
                      className="w-full bg-transparent text-brandTextPrimary outline-none text-xs"
                    />
                    <button 
                      onClick={copyReferralLink}
                      className="px-3 py-1.5 rounded-lg bg-brandPrimary text-white text-[10px] font-bold uppercase transition-all"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-center gap-3">
                  <a 
                    href={`https://api.whatsapp.com/send?text=Hey!%20Register%20on%20GiGO%20to%20claim%20250%20Pace%20for%20automatic%20ATS%20resume%20tailoring%20and%20job%20dispatching!%20Check%20it%20out%3A%20https%3A%2F%2Fgigo.vercel.app%3Fref%3D${referralCode}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#25D366] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90"
                  >
                    Share on WhatsApp
                  </a>
                  <button 
                    onClick={() => {
                      setIsReferralSubmitted(false);
                      setFriendContact('');
                      setFriendName('');
                    }}
                    className="py-2.5 px-4 rounded-xl border border-brandBorder text-brandTextSecondary text-xs font-bold uppercase hover:bg-brandBg"
                  >
                    Invite Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Minimal Footer with dynamic preferences indicator */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-brandBorder flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-brandTextMuted relative z-10">
        <div className="flex flex-wrap gap-4 items-center justify-center sm:justify-start">
          <p>© 2026 GiGO Ecosystem Labs.</p>
          <span className="hidden sm:inline text-brandBorder">•</span>
          <button 
            onClick={() => setShowWalkthrough(true)}
            className="hover:text-brandPrimary transition-colors"
          >
            Walkthrough Details
          </button>
        </div>
        
        {/* Automatic preferences theme sync notice */}
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Device Sync: <strong className="uppercase">{systemTheme} mode</strong></span>
        </div>
      </footer>

      {/* ==================================================== */}
      {/* WALKTHROUGH DETAILS DRAWER / MODAL                   */}
      {/* ==================================================== */}
      {showWalkthrough && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in" onClick={() => setShowWalkthrough(false)}>
          <div 
            className="w-full max-w-4xl bg-brandBg border border-brandBorder rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowWalkthrough(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-2xl font-bold text-brandTextSecondary hover:text-brandTextPrimary"
            >
              &times;
            </button>

            {/* Header */}
            <div className="text-center space-y-2 border-b border-brandBorder pb-4">
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-brandPrimary bg-brandPrimary/10 border border-brandPrimary/20 px-3 py-1 rounded-full">
                Detailed Platform Blueprint
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-brandTextPrimary tracking-tight">
                How GiGO Works & Ecosystem Blueprint
              </h2>
              <p className="text-xs text-brandTextSecondary max-w-xl mx-auto">
                Discover the engineering core, automatic career automation loops, transparent pay-as-you-go metrics, and developer tools.
              </p>
            </div>

            {/* 1. Career Lifecycle loop */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-brandSecondary">
                ⚙️ 4-Stage Career Automation Engine
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-brandCard/40 border border-brandBorder space-y-2 text-left">
                  <div className="text-[9px] font-extrabold text-brandPrimary font-mono">STAGE 01</div>
                  <h4 className="text-xs font-bold text-brandTextPrimary uppercase">Auto Job Finder</h4>
                  <p className="text-[11px] text-brandTextSecondary leading-relaxed">
                    Background scrapers continuously scan top job networks to discover matching roles natively.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-brandCard/40 border border-brandBorder space-y-2 text-left">
                  <div className="text-[9px] font-extrabold text-brandSecondary font-mono">STAGE 02</div>
                  <h4 className="text-xs font-bold text-brandTextPrimary uppercase">Custom CV & Cover Letter</h4>
                  <p className="text-[11px] text-brandTextSecondary leading-relaxed">
                    Generate ATS-optimized resumes (5 Pace) and tailored cover letters (3 Pace) instantly.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-brandCard/40 border border-brandBorder space-y-2 text-left">
                  <div className="text-[9px] font-extrabold text-brandPrimary font-mono">STAGE 03</div>
                  <h4 className="text-xs font-bold text-brandTextPrimary uppercase">Outbound Submissions</h4>
                  <p className="text-[11px] text-brandTextSecondary leading-relaxed">
                    Natively dispatch custom tailored portfolios directly to recruiter email channels in one click.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-brandCard/40 border border-brandBorder space-y-2 text-left">
                  <div className="text-[9px] font-extrabold text-emerald-400 font-mono">STAGE 04</div>
                  <h4 className="text-xs font-bold text-brandTextPrimary uppercase">Practice Room</h4>
                  <p className="text-[11px] text-brandTextSecondary leading-relaxed">
                    Join custom practice voice interview simulators with friendly coaches completely free and unlimited.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Pace Economy & Calculator */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start border-t border-brandBorder pt-6">
              <div className="space-y-4 text-left">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-brandPrimary">
                  🪙 Transparent Career Momentum Strategy
                </h3>
                <p className="text-xs text-brandTextSecondary leading-relaxed">
                  We reject locking candidates behind massive, expensive monthly fees. Our micro-transaction design maintains a <span className="text-brandTextPrimary font-bold">0 Entry Barriers</span>. A tiny amount of Pace is consumed only when compiling assets or submitting applications.
                </p>
                <div className="p-4 rounded-2xl bg-brandPrimary/5 border border-brandPrimary/15 space-y-2">
                  <h4 className="text-xs font-bold text-brandTextPrimary uppercase">Complimentary Welcome Momentum</h4>
                  <p className="text-[11px] text-brandTextSecondary">
                    Create your profile & supply NIN credentials to activate your complimentary <strong className="text-brandTextPrimary">250 Pace</strong> to get started.
                  </p>
                </div>
              </div>

              {/* Momentum Estimator Panel */}
              <div className="p-6 rounded-2xl bg-brandCard/40 border border-brandBorder space-y-5">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brandTextPrimary">Momentum Estimator</h4>
                  <span className="text-[10px] font-bold text-brandPrimary px-2 py-0.5 rounded bg-brandPrimary/10 border border-brandPrimary/20">
                    Pace Utility
                  </span>
                </div>

                <div className="space-y-4 text-left">
                  <div>
                    <div className="flex justify-between text-[11px] font-mono mb-1">
                      <span className="text-brandTextSecondary">Career Momentum Budget</span>
                      <span className="text-brandTextPrimary font-bold">
                        {calcPace} Pace
                      </span>
                    </div>
                    <input 
                      type="range" min="10" max="500" step="10" value={calcPace} 
                      onChange={(e) => setCalcPace(Number(e.target.value))}
                      className="w-full accent-brandPrimary"
                    />
                  </div>

                  <div className="p-3 bg-brandBg border border-brandBorder rounded-xl space-y-2">
                    <div className="text-[10px] text-brandTextMuted uppercase font-bold text-center">Estimated Capabilities:</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded bg-brandCard/20 border border-brandBorder/40">
                        🔍 <strong>{calcPace * 2}</strong> Job Scans
                      </div>
                      <div className="p-2 rounded bg-brandCard/20 border border-brandBorder/40">
                        📄 <strong>{Math.floor(calcPace / 5)}</strong> Tailored CVs
                      </div>
                      <div className="p-2 rounded bg-brandCard/20 border border-brandBorder/40">
                        ✉️ <strong>{Math.floor(calcPace / 3)}</strong> Cover Letters
                      </div>
                      <div className="p-2 rounded bg-brandCard/20 border border-brandBorder/40">
                        🚀 <strong>{Math.floor(calcPace / 10)}</strong> Dispatches
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Live Logs Telemetry */}
            <div className="border-t border-brandBorder pt-6 text-left space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-brandSecondary">
                📊 Operational Telemetry
              </h3>
              <p className="text-xs text-brandTextSecondary">
                Below are real-time backend agent events, scrapers, and telemetry streams verifying compiler output and background runs.
              </p>
              <div className="rounded-2xl overflow-hidden bg-brandCard/30 border border-brandBorder p-2">
                <AgentTelemetryCards />
              </div>
            </div>

            {/* Footer Buttons inside Modal */}
            <div className="flex justify-end pt-4 border-t border-brandBorder">
              <button 
                onClick={() => setShowWalkthrough(false)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brandPrimary to-brandSecondary text-white text-xs font-bold uppercase tracking-wider"
              >
                Got It, Thanks!
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
