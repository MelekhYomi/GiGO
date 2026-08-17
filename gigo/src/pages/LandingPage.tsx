import React, { useState, useEffect } from 'react';
import { GiGOLogo } from '../components/GiGOLogo';
import { OnboardingCard } from '../components/OnboardingCard';
import { AgentTelemetryCards } from '../components/AgentTelemetryCards';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080'
  : (import.meta.env.VITE_API_BASE_URL || 'https://gigo-fego.onrender.com');

export interface LandingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
  autoShowWalkthrough?: boolean;
}

const WALKTHROUGH_STEPS = [
  {
    eyebrow: 'Step 1 · Sign Up',
    title: 'Create your account in seconds',
    desc: 'Speak your name, email, and phone number, or type them in — either way your real account launches instantly with a 250 Pace welcome bonus.',
  },
  {
    eyebrow: 'Step 2 · Voice Onboarding',
    title: 'Just talk — GiGO builds your profile',
    desc: 'Real speech-to-profile parsing, powered by Gemini: describe your background out loud and GiGO extracts your role, skills, and experience automatically.',
  },
  {
    eyebrow: 'Step 3 · Career Profile',
    title: 'Or paste your CV to auto-fill it',
    desc: "Prefer typing? Paste your resume and GiGO's AI extracts the same structured profile — role, skills, years of experience — no dictation required.",
  },
  {
    eyebrow: 'Step 4 · Profile & Settings',
    title: 'Everything lives in one real profile',
    desc: 'Whatever you spoke or pasted is saved to your actual Profile & Settings — the same data every tailored CV, cover letter, and match score is built from.',
  },
  {
    eyebrow: 'Step 5 · Your Dashboard',
    title: 'Your career command center',
    desc: 'One home screen for your career score, quick actions, and recent activity — the first thing you see every time you sign in.',
  },
  {
    eyebrow: 'Step 6 · Discovery',
    title: 'GiGO finds matching jobs 24/7',
    desc: 'Background agents scan real job boards continuously and score every listing against your actual profile, so you only see roles worth your time.',
  },
  {
    eyebrow: 'Step 7 · Applying',
    title: 'Tailored CVs, one click to apply',
    desc: 'Every application gets a CV and cover letter tailored to that specific job. Submit it yourself, or let Auto-Apply send high-confidence matches for you.',
  },
  {
    eyebrow: 'Step 8 · Interview prep',
    title: 'Practice interviews for free',
    desc: 'Unlimited AI mock interviews tailored to the role you applied for, with real scoring on substance, delivery, and clarity — not generic questions.',
  },
  {
    eyebrow: 'Step 9 · Track Board',
    title: 'Every application, one board',
    desc: 'Matched, Applied, Interviews — watch every real application move across your board as it actually progresses, no spreadsheets required.',
  },
  {
    eyebrow: 'Step 10 · Mailroom',
    title: 'Every recruiter reply, one inbox',
    desc: 'Connect Gmail once and every response lands in your Mailroom, automatically linked to the right application, so nothing slips through the cracks.',
  },
  {
    eyebrow: 'Step 11 · Wallet & Pace',
    title: 'Pay only for what you use',
    desc: 'No monthly subscription. A small amount of Pace is spent only when you compile a document or submit an application — refuel by bank transfer any time.',
  },
  {
    eyebrow: 'Step 12 · GiGO Brain',
    title: 'Your personal career analytics',
    desc: 'Match trends, skill gaps pulled from real job requirements, and a Mind Clone you can chat with about your own career — grounded in your real data.',
  },
  {
    eyebrow: 'Step 13 · AI Career Coach',
    title: 'Career advice, on demand',
    desc: 'Chat anytime for guidance grounded in your actual profile and goals — not generic scripts copy-pasted for every user.',
  },
];

const FAQ_ITEMS = [
  { q: 'Is GiGO actually free to start?', a: 'Yes. Every account launches with a 250 Pace welcome bonus - enough to try real CV generation and job applications before you spend a naira. You only refuel your wallet when you choose to.' },
  { q: 'Does the AI apply to jobs without asking me?', a: 'Only if you turn on Auto-Apply. By default, GiGO drafts everything and waits for your review. You can switch between full autopilot and manual approval at any time in Settings.' },
  { q: 'Where do the job listings actually come from?', a: "Real job board APIs - RemoteOK, The Muse, Arbeitnow - plus any additional sources an admin configures. Nothing is invented; every listing links back to its original posting." },
  { q: "What happens if GiGO's AI is temporarily down?", a: "You're never stuck. You can write your own CV or cover letter by hand and it's saved to your archive for free, so you can still apply to already-discovered jobs manually." },
  { q: 'How do I pay if I don’t have a card for Paystack?', a: 'Bank transfer works too - transfer to the account shown in your Wallet, send the receipt via WhatsApp, and your balance is credited once verified.' },
  { q: 'Can I use my own Gmail instead of a GiGO-only inbox?', a: "Yes. Connect your Gmail once in Mailroom and GiGO tracks recruiter replies to your applications automatically from your real inbox." },
];

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, onSignUp, autoShowWalkthrough }) => {
  const [publicStats, setPublicStats] = useState<{ waitlistSignups: number; jobsDiscovered: number; documentsGenerated: number } | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/public/stats`)
      .then(res => res.json())
      .then(setPublicStats)
      .catch(err => console.error("Failed to fetch public stats:", err));
  }, []);

  // Referral form state
  const [friendContact, setFriendContact] = useState('');
  const [friendName, setFriendName] = useState('');
  const [isReferralSubmitted, setIsReferralSubmitted] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Walkthrough details modal toggle. The modal now runs a real funnel:
  // screenshot-style walkthrough steps -> a skippable waitlist-interest step
  // -> signup. walkthroughStep indexes into WALKTHROUGH_STEPS; once it runs
  // past the last one, the modal shows the waitlist step instead.
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const [waitlistTiers, setWaitlistTiers] = useState<{ id: string; label: string; priceNGN: number; applicationsPerMonth: number }[]>([]);
  const [selectedWaitlistTier, setSelectedWaitlistTier] = useState<string | null>(null);
  const onWaitlistStep = walkthroughStep >= WALKTHROUGH_STEPS.length;

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/waitlist/tiers`)
      .then(res => res.json())
      .then(setWaitlistTiers)
      .catch(err => console.error("Failed to fetch waitlist tiers:", err));
  }, []);

  // Waitlist-tagged visitors (from the /waitlist link) should see the walkthrough
  // immediately, not require an extra click to discover it exists.
  useEffect(() => {
    if (autoShowWalkthrough) { setShowWalkthrough(true); setWalkthroughStep(0); }
  }, [autoShowWalkthrough]);

  const openWalkthrough = () => { setWalkthroughStep(0); setShowWalkthrough(true); };
  const closeWalkthrough = () => setShowWalkthrough(false);

  // The old single-scroll "platform blueprint" page (automation-engine cards,
  // Pace calculator, live telemetry) is real content, just not a good fit as
  // the main funnel — kept as an optional deeper technical read, linked from
  // the walkthrough instead of gating it.
  const [showDeepDive, setShowDeepDive] = useState(false);
  const [calcPace, setCalcPace] = useState<number>(50);

  // Reaching the end of the funnel (skipping the waitlist step or submitting
  // a tier preference) is the one thing that actually hands off to signup —
  // a real account is required to apply for jobs or get interviews.
  const proceedToSignUp = () => {
    if (selectedWaitlistTier) {
      localStorage.setItem('gigo_pending_waitlist_tier', selectedWaitlistTier);
      localStorage.setItem('gigo_waitlist_flow', 'true');
    }
    setShowWalkthrough(false);
    onSignUp();
  };

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
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] rounded-full blur-[140px]" style={{ backgroundImage: 'linear-gradient(to top right, rgba(134, 59, 255, 0.08), transparent)' }} />
        <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] rounded-full blur-[140px]" style={{ backgroundImage: 'linear-gradient(to bottom right, rgba(56, 189, 248, 0.08), transparent)' }} />
      </div>

      {/* Simplified, Sleek Actionable Navbar */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-5 flex justify-between items-center border-b border-brandBorder relative z-10">
        <div className="flex items-center gap-2">
          <GiGOLogo size={38} />
        </div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={openWalkthrough}
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
            onClick={openWalkthrough}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white hover:shadow-[0_0_20px_var(--primary-glow)] hover:scale-[1.02] active:scale-[0.98] transition-all"
            style={{ backgroundImage: 'linear-gradient(to right, var(--primary), var(--secondary))' }}
          >
            Start now
          </button>
        </div>
      </nav>

      {/* Main Focus: Hero Section & Embedded Onboarding (The Act-Now Core) */}
      <header className="max-w-7xl mx-auto px-6 pt-12 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative z-10">
        
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
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(to right, var(--primary), var(--secondary))' }}
              >
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
              onClick={openWalkthrough}
              className="px-6 py-3.5 rounded-xl text-white font-semibold text-sm hover:shadow-[0_0_25px_var(--primary-glow)] hover:scale-[1.02] active:scale-95 transition-all"
              style={{ backgroundImage: 'linear-gradient(to right, var(--primary), var(--secondary))' }}
            >
              Claim your 250 Pace sign-up bonus
            </button>
          </div>
        </div>

        {/* Right Column: Embedded Onboarding Micro-Card */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto relative lg:justify-self-end">
          <div className="absolute -inset-1.5 rounded-3xl opacity-20 blur-xl" style={{ backgroundImage: 'linear-gradient(to right, var(--primary), var(--secondary))' }}></div>
          <div className="relative">
            <OnboardingCard onGetStarted={openWalkthrough} />
          </div>
        </div>
      </header>

      {/* Real, aggregate-only stats — no PII, computed live from Firestore counts */}
      {publicStats && (
        <div className="border-t border-brandBorder relative z-10 py-6">
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-brandTextPrimary">{publicStats.waitlistSignups.toLocaleString()}</div>
              <div className="text-[11px] text-brandTextSecondary uppercase tracking-wide font-semibold mt-1">Waitlist Signups</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-brandTextPrimary">{publicStats.jobsDiscovered.toLocaleString()}</div>
              <div className="text-[11px] text-brandTextSecondary uppercase tracking-wide font-semibold mt-1">Live Jobs Tracked</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-brandTextPrimary">{publicStats.documentsGenerated.toLocaleString()}</div>
              <div className="text-[11px] text-brandTextSecondary uppercase tracking-wide font-semibold mt-1">Documents Generated</div>
            </div>
          </div>
        </div>
      )}

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
                <div className="w-11 h-11 rounded-xl border border-brandBorder flex items-center justify-center text-xl" style={{ backgroundImage: 'linear-gradient(to bottom right, color-mix(in srgb, var(--primary) 20%, transparent), color-mix(in srgb, var(--secondary) 20%, transparent))' }}>
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
              <div className="rounded-xl border border-brandBorder p-4 mb-3" style={{ backgroundImage: 'linear-gradient(to bottom right, color-mix(in srgb, var(--primary) 15%, transparent), color-mix(in srgb, var(--secondary) 15%, transparent))' }}>
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

      {/* Comparison: GiGO vs. generic job boards */}
      <section className="border-t border-brandBorder relative z-10 py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-brandTextPrimary tracking-tight mb-3">
              Why not just use a regular job board?
            </h2>
            <p className="text-sm sm:text-base text-brandTextSecondary max-w-2xl mx-auto leading-relaxed">
              A job board shows you listings. GiGO does the work around them.
            </p>
          </div>

          <div className="rounded-2xl border border-brandBorder overflow-hidden">
            <div className="grid grid-cols-3 bg-brandCard/40 text-[11px] sm:text-xs font-bold uppercase tracking-wide">
              <div className="px-3 sm:px-5 py-3 text-brandTextSecondary">Capability</div>
              <div className="px-3 sm:px-5 py-3 text-center text-brandTextMuted">Generic Job Board</div>
              <div className="px-3 sm:px-5 py-3 text-center text-brandPrimary">GiGO</div>
            </div>
            {[
              { label: 'Building your CV', board: 'You write it from scratch', gigo: 'Speak it, or AI drafts it tailored per job' },
              { label: 'Finding relevant roles', board: 'You search and filter manually', gigo: 'Agents scan sources 24/7 and pre-filter by match score' },
              { label: 'Submitting applications', board: 'One by one, by hand', gigo: 'Autopilot applies to high-confidence matches, or you review each one' },
              { label: 'Tracking responses', board: 'Scattered across your personal inbox', gigo: 'One Mailroom, automatically linked to each application' },
              { label: 'Interview prep', board: 'Not included', gigo: 'Free unlimited AI mock interviews, tailored to the role' },
              { label: 'Pricing', board: 'Often a flat monthly subscription', gigo: 'Pay only per action - CV, cover letter, or submission' },
            ].map((row, i) => (
              <div key={row.label} className={`grid grid-cols-3 text-[11px] sm:text-xs ${i % 2 === 0 ? 'bg-brandSurface' : 'bg-brandBg'}`}>
                <div className="px-3 sm:px-5 py-3 font-semibold text-brandTextPrimary">{row.label}</div>
                <div className="px-3 sm:px-5 py-3 text-center text-brandTextMuted">{row.board}</div>
                <div className="px-3 sm:px-5 py-3 text-center text-brandTextPrimary font-medium">{row.gigo}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-brandBorder relative z-10 bg-brandCard/25 py-16">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-brandTextPrimary tracking-tight mb-3">
              Questions people actually ask
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <div key={item.q} className="rounded-2xl bg-brandSurface border border-brandBorder overflow-hidden">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-brandTextPrimary pr-4">{item.q}</span>
                  <span className={`text-brandTextSecondary text-lg shrink-0 transition-transform ${openFaqIndex === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaqIndex === i && (
                  <div className="px-5 pb-4 text-[12px] sm:text-sm text-brandTextSecondary leading-relaxed animate-fade-in">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
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
                  className="w-full py-3 px-4 rounded-xl text-white text-xs font-bold uppercase tracking-wider hover:shadow-[0_0_15px_var(--primary-glow)] transition-all"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--primary), var(--secondary))' }}
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in" onClick={closeWalkthrough}>
          <div
            className="w-full max-w-2xl bg-brandBg border border-brandBorder rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeWalkthrough}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-2xl font-bold text-brandTextSecondary hover:text-brandTextPrimary z-10"
            >
              &times;
            </button>

            {!onWaitlistStep ? (
              <>
                {/* Reassurance banner — this is a real walkthrough of the live product, not a marketing reel */}
                <div className="text-center mb-5 space-y-2">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold font-mono uppercase tracking-widest text-brandPrimary bg-brandPrimary/10 border border-brandPrimary/20 px-3 py-1 rounded-full">
                    ● Real product walkthrough — not an ad
                  </span>
                  <div>
                    <button onClick={() => setShowDeepDive(true)} className="text-[11px] text-brandTextSecondary hover:text-brandPrimary underline underline-offset-2 transition-colors">
                      Prefer a deeper technical read instead? →
                    </button>
                  </div>
                </div>

                {/* Step header */}
                <div className="text-center space-y-2 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brandSecondary">
                    {WALKTHROUGH_STEPS[walkthroughStep].eyebrow}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-brandTextPrimary tracking-tight">
                    {WALKTHROUGH_STEPS[walkthroughStep].title}
                  </h2>
                  <p className="text-sm text-brandTextSecondary max-w-lg mx-auto leading-relaxed">
                    {WALKTHROUGH_STEPS[walkthroughStep].desc}
                  </p>
                </div>

                {/* Screenshot-style mockup for the active step — built with the same UI tokens as the live app */}
                <div className="rounded-2xl bg-brandSurface border border-brandBorder p-5 shadow-lg mb-6 min-h-[220px] flex items-center justify-center">
                  {walkthroughStep === 0 && (
                    <div className="w-full max-w-sm space-y-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brandTextSecondary">Create Account</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-semibold">+250 Pace</span>
                      </div>
                      <div className="bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-1.5 text-[11px] text-brandTextSecondary">Full Name</div>
                      <div className="bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-1.5 text-[11px] text-brandTextSecondary">Email Address</div>
                      <div className="bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-1.5 text-[11px] text-brandTextSecondary">Phone Number</div>
                      <div className="flex justify-center pt-1">
                        <span className="text-[10px] px-3 py-1 rounded-full text-white font-bold" style={{ backgroundImage: 'linear-gradient(to right, var(--primary), var(--secondary))' }}>Create Account →</span>
                      </div>
                    </div>
                  )}
                  {walkthroughStep === 1 && (
                    <div className="w-full max-w-sm flex flex-col items-center gap-3 text-center">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brandTextSecondary">🎤 AI Voice Sign-up</span>
                      <p className="text-[11px] text-brandTextSecondary">Tap the mic and state your name, email, phone — and your background, if you like.</p>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg animate-pulse" style={{ backgroundImage: 'linear-gradient(to top right, var(--primary), var(--secondary))' }}>🎙️</div>
                      <div className="w-full bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-2 text-[11px] text-brandTextPrimary text-left">
                        ✨ Extracted: Amara O. · amara@email.com · Frontend Engineer, 4 yrs React
                      </div>
                    </div>
                  )}
                  {walkthroughStep === 2 && (
                    <div className="w-full max-w-sm space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brandTextSecondary">Career Profile</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandPrimary/10 text-brandPrimary font-semibold">Parse & Auto-Fill</span>
                      </div>
                      <div className="bg-brandCard/50 border border-brandBorder rounded-lg px-3 py-2 text-[12px] text-brandTextPrimary">
                        Paste your CV, or fill it in by hand
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-1.5 text-[11px] text-brandTextSecondary">Full Name</div>
                        <div className="bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-1.5 text-[11px] text-brandTextSecondary">Target Role</div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {['React', 'TypeScript', 'Node.js'].map(s => (
                          <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-brandSecondary/10 text-brandSecondary font-semibold">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {walkthroughStep === 3 && (
                    <div className="w-full max-w-sm space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brandTextSecondary">Profile & Settings</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandPrimary/10 text-brandPrimary font-semibold">Saved</span>
                      </div>
                      {[
                        { label: 'Name', v: 'Amara Okafor' },
                        { label: 'Target Role', v: 'Frontend Engineer' },
                        { label: 'Experience', v: '4 years' },
                        { label: 'Skills', v: 'React, TypeScript, Node.js' },
                      ].map(f => (
                        <div key={f.label} className="flex justify-between bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-1.5">
                          <span className="text-[10px] text-brandTextMuted uppercase font-semibold">{f.label}</span>
                          <span className="text-[11px] text-brandTextPrimary font-semibold">{f.v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {walkthroughStep === 4 && (
                    <div className="w-full max-w-sm space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brandTextSecondary">Dashboard</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandPrimary/10 text-brandPrimary font-semibold">Home</span>
                      </div>
                      <div className="rounded-xl border border-brandBorder p-3" style={{ backgroundImage: 'linear-gradient(to bottom right, color-mix(in srgb, var(--primary) 15%, transparent), color-mix(in srgb, var(--secondary) 15%, transparent))' }}>
                        <div className="text-[10px] text-brandTextMuted uppercase font-bold mb-0.5">Career Score</div>
                        <div className="text-2xl font-black text-brandTextPrimary">78<span className="text-sm text-brandTextSecondary">/100</span></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[{ l: 'Applied', v: 12 }, { l: 'Interviews', v: 3 }, { l: 'Docs', v: 8 }].map(s => (
                          <div key={s.l} className="bg-brandCard/50 border border-brandBorder rounded-lg py-1.5 text-center">
                            <div className="text-sm font-black text-brandTextPrimary">{s.v}</div>
                            <div className="text-[9px] text-brandTextMuted uppercase font-semibold">{s.l}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {walkthroughStep === 5 && (
                    <div className="w-full max-w-sm space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brandTextSecondary">Job Radar</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandPrimary/10 text-brandPrimary font-semibold">Live</span>
                      </div>
                      {[
                        { role: 'Backend Eng · Stripe', score: 94 },
                        { role: 'Product Designer · Notion', score: 88 },
                        { role: 'Data Analyst · Flutterwave', score: 81 },
                      ].map(j => (
                        <div key={j.role} className="flex items-center justify-between bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-1.5">
                          <span className="text-[11px] text-brandTextPrimary">{j.role}</span>
                          <span className="text-[10px] font-bold text-emerald-500">{j.score}% match</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {walkthroughStep === 6 && (
                    <div className="w-full max-w-sm space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brandTextSecondary">Application Builder</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandSecondary/10 text-brandSecondary font-semibold">Pay-as-you-go</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-brandTextSecondary bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-1.5">
                        <span>📄 ATS-tailored CV</span><span className="text-brandTextPrimary font-semibold">5 Pace</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-brandTextSecondary bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-1.5">
                        <span>✉️ Tailored cover letter</span><span className="text-brandTextPrimary font-semibold">3 Pace</span>
                      </div>
                      <div className="flex justify-between items-center bg-brandPrimary/5 border border-brandPrimary/15 rounded-lg px-2.5 py-1.5 mt-2">
                        <span className="text-[11px] text-brandTextPrimary font-semibold">Auto-Apply</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-bold">ON</span>
                      </div>
                    </div>
                  )}
                  {walkthroughStep === 7 && (
                    <div className="w-full max-w-sm flex flex-col items-center gap-3 text-center">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brandTextSecondary">Mock Interview Room</span>
                      <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl" style={{ backgroundImage: 'linear-gradient(to top right, var(--primary), var(--secondary))' }}>🎙️</div>
                      <div className="grid grid-cols-3 gap-2 w-full">
                        {[{ label: 'Substance', v: 87 }, { label: 'Delivery', v: 79 }, { label: 'Clarity', v: 92 }].map(m => (
                          <div key={m.label} className="bg-brandCard/50 border border-brandBorder rounded-lg py-2 px-1">
                            <div className="text-sm font-black text-brandTextPrimary">{m.v}</div>
                            <div className="text-[9px] text-brandTextMuted uppercase font-semibold">{m.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {walkthroughStep === 8 && (
                    <div className="w-full max-w-sm space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brandTextSecondary">Track Board</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandPrimary/10 text-brandPrimary font-semibold">Live</span>
                      </div>
                      {[
                        { label: 'Matched', color: 'bg-brandPrimary', items: ['Backend Eng · Stripe'] },
                        { label: 'Applied', color: 'bg-brandSecondary', items: ['Data Analyst · Flutterwave'] },
                        { label: 'Interviews', color: 'bg-emerald-500', items: ['DevOps Eng · Paystack'] },
                      ].map(col => (
                        <div key={col.label}>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${col.color}`} />
                            <span className="text-[10px] font-bold uppercase text-brandTextMuted">{col.label}</span>
                          </div>
                          {col.items.map(item => (
                            <div key={item} className="text-[11px] text-brandTextPrimary bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-1.5 mb-1">{item}</div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  {walkthroughStep === 9 && (
                    <div className="w-full max-w-sm space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brandTextSecondary">Mailroom</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandSecondary/10 text-brandSecondary font-semibold">1 new</span>
                      </div>
                      <div className="bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-2">
                        <div className="flex justify-between text-[11px] font-semibold text-brandTextPrimary mb-0.5">
                          <span>Paystack Careers</span><span className="text-brandTextMuted font-normal">1d</span>
                        </div>
                        <div className="text-[11px] text-brandTextSecondary">We'd like to schedule an interview for DevOps Eng...</div>
                      </div>
                      <div className="flex justify-between text-[11px] bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1.5">
                        <span className="text-emerald-500 font-semibold">✓ Interview scheduled</span>
                      </div>
                    </div>
                  )}
                  {walkthroughStep === 10 && (
                    <div className="w-full max-w-sm space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brandTextSecondary">Wallet</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandPrimary/10 text-brandPrimary font-semibold">Pay-as-you-go</span>
                      </div>
                      <div className="rounded-xl border border-brandBorder p-3 mb-1" style={{ backgroundImage: 'linear-gradient(to bottom right, color-mix(in srgb, var(--primary) 15%, transparent), color-mix(in srgb, var(--secondary) 15%, transparent))' }}>
                        <div className="text-[10px] text-brandTextMuted uppercase font-bold mb-0.5">Career Momentum</div>
                        <div className="text-2xl font-black text-brandTextPrimary">250 <span className="text-sm font-semibold text-brandTextSecondary">Pace</span></div>
                      </div>
                      <div className="flex justify-between text-[11px] text-brandTextSecondary bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-1.5">
                        <span>Bank transfer top-up</span><span className="text-emerald-500 font-semibold">+200 Pace</span>
                      </div>
                    </div>
                  )}
                  {walkthroughStep === 11 && (
                    <div className="w-full max-w-sm space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brandTextSecondary">GiGO Brain</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandPrimary/10 text-brandPrimary font-semibold">Synced</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-brandTextSecondary bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-1.5">
                        <span>Career Momentum Score</span><span className="text-brandTextPrimary font-semibold">78%</span>
                      </div>
                      <div className="bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-2 text-[11px] text-brandTextSecondary">
                        <span className="text-brandTextPrimary font-semibold">Gap detected:</span> GraphQL — required by 3 of your high-score matches
                      </div>
                      <div className="bg-brandPrimary/5 border border-brandPrimary/15 rounded-lg px-2.5 py-1.5 text-[11px] text-brandTextPrimary">💬 Chat with your Mind Clone</div>
                    </div>
                  )}
                  {walkthroughStep === 12 && (
                    <div className="w-full max-w-sm space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-brandTextSecondary">AI Career Coach</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-brandPrimary/10 text-brandPrimary font-semibold">Chat</span>
                      </div>
                      <div className="bg-brandCard/50 border border-brandBorder rounded-lg px-2.5 py-2 text-[11px] text-brandTextSecondary">
                        "Given your React background, is it worth learning Next.js before applying to the Stripe role?"
                      </div>
                      <div className="bg-brandPrimary/5 border border-brandPrimary/15 rounded-lg px-2.5 py-2 text-[11px] text-brandTextPrimary">
                        Worth it — 3 of your matched roles list it as preferred. I can tailor your next CV to lead with it.
                      </div>
                    </div>
                  )}
                </div>

                {/* Step dots + nav */}
                <div className="flex items-center justify-center gap-2 mb-6">
                  {WALKTHROUGH_STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setWalkthroughStep(i)}
                      className={`h-1.5 rounded-full transition-all ${i === walkthroughStep ? 'w-6 bg-brandPrimary' : 'w-1.5 bg-brandBorder'}`}
                      aria-label={`Go to step ${i + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => walkthroughStep === 0 ? closeWalkthrough() : setWalkthroughStep(s => s - 1)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-brandTextSecondary border border-brandBorder hover:bg-brandCard/40 transition-all"
                  >
                    {walkthroughStep === 0 ? 'Close' : '← Back'}
                  </button>
                  <button
                    onClick={() => setWalkthroughStep(s => s + 1)}
                    className="px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider"
                    style={{ backgroundImage: 'linear-gradient(to right, var(--primary), var(--secondary))' }}
                  >
                    {walkthroughStep === WALKTHROUGH_STEPS.length - 1 ? 'Continue →' : 'Next →'}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Waitlist interest step — real, optional, skippable. Signup right after is what actually creates the account. */}
                <div className="text-center space-y-2 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brandSecondary">One quick thing</span>
                  <h2 className="text-2xl sm:text-3xl font-black text-brandTextPrimary tracking-tight">
                    Which plan would you pay for?
                  </h2>
                  <p className="text-sm text-brandTextSecondary max-w-lg mx-auto leading-relaxed">
                    Totally optional — helps us prioritize what to build next. Your account still launches with a free 250 Pace welcome bonus either way.
                  </p>
                </div>

                <div className="space-y-2.5 mb-6">
                  {waitlistTiers.map(tier => (
                    <label
                      key={tier.id}
                      className={`flex justify-between items-center px-4 py-3 rounded-xl border cursor-pointer transition-all ${selectedWaitlistTier === tier.id ? 'border-brandPrimary bg-brandPrimary/10' : 'border-brandBorder bg-brandCard/30 hover:bg-brandCard/50'}`}
                    >
                      <span className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="waitlistTier"
                          checked={selectedWaitlistTier === tier.id}
                          onChange={() => setSelectedWaitlistTier(tier.id)}
                          className="accent-brandPrimary"
                        />
                        <span className="text-sm font-bold text-brandTextPrimary">{tier.label}</span>
                      </span>
                      <span className="text-xs text-brandTextSecondary">₦{tier.priceNGN.toLocaleString()}/mo · {tier.applicationsPerMonth >= 999 ? 'Unlimited' : tier.applicationsPerMonth} apps</span>
                    </label>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={proceedToSignUp}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-brandTextSecondary border border-brandBorder hover:bg-brandCard/40 transition-all"
                  >
                    Skip → Sign Up
                  </button>
                  <button
                    onClick={proceedToSignUp}
                    className="px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider"
                    style={{ backgroundImage: 'linear-gradient(to right, var(--primary), var(--secondary))' }}
                  >
                    Continue to Sign Up →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showDeepDive && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in" onClick={() => setShowDeepDive(false)}>
          <div
            className="w-full max-w-4xl bg-brandBg border border-brandBorder rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto space-y-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowDeepDive(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-2xl font-bold text-brandTextSecondary hover:text-brandTextPrimary"
            >
              &times;
            </button>

            <div className="text-center space-y-2 border-b border-brandBorder pb-4">
              <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-brandPrimary bg-brandPrimary/10 border border-brandPrimary/20 px-3 py-1 rounded-full">
                What GiGO Can Do On Your Dashboard
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-brandTextPrimary tracking-tight">
                A Deeper Technical Tour
              </h2>
              <p className="text-xs text-brandTextSecondary max-w-xl mx-auto">
                For the curious — the engineering core, automatic career automation loops, transparent pay-as-you-go metrics, and live agent telemetry.
              </p>
            </div>

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

            <div className="flex justify-end pt-4 border-t border-brandBorder">
              <button
                onClick={() => setShowDeepDive(false)}
                className="px-5 py-2.5 rounded-xl text-white text-xs font-bold uppercase tracking-wider"
                style={{ backgroundImage: 'linear-gradient(to right, var(--primary), var(--secondary))' }}
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
