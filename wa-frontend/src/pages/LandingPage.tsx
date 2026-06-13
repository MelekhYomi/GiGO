import React from 'react';
import { GiGOLogo } from '../components/GiGOLogo';
import { OnboardingCard } from '../components/OnboardingCard';
import { AgentTelemetryCards } from '../components/AgentTelemetryCards';

export interface LandingPageProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSignIn, onSignUp }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950 overflow-x-hidden">
      
      {/* Navigation Banner */}
      <nav className="w-full max-w-7xl mx-auto px-6 py-5 flex justify-between items-center border-b border-slate-900">
        <GiGOLogo size={40} />
        <div className="flex gap-6 text-sm font-medium text-slate-400">
          <a href="#about" className="hover:text-cyan-400 transition-colors">About</a>
          <a href="#usage" className="hover:text-cyan-400 transition-colors">Usage</a>
          <a href="#telemetry" className="hover:text-cyan-400 transition-colors">Agent Logs</a>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onSignIn}
            className="px-5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white uppercase tracking-wider hover:bg-slate-800 transition-all"
          >
            Sign In
          </button>
          <button 
            onClick={onSignUp}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-bold text-white uppercase tracking-wider hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Hero Split Section */}
      <header className="max-w-7xl mx-auto px-6 pt-12 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-400 font-mono font-bold tracking-wide uppercase">
            🚀 Breaking Down Hidden Career Barriers
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
            Your Personal AI <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">
              Career Consultant
            </span> <br />On Autopilot.
          </h1>
          <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-xl">
            GiGO runs continuous back-end job board scraping, structures multi-modal native audio into clean identity representations, and generates high-converting application assets instantly. One stop to end complex job searches for good.
          </p>
          
          {/* Pay-As-You-Go Financial Blueprint Feature Card (Task 5) */}
          <div id="about" className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 max-w-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-l from-indigo-500 to-blue-600 text-[10px] font-bold tracking-widest text-white uppercase rounded-bl-xl">
              XPRIZE Submission Economics
            </div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider text-indigo-400 mb-1">
              The Transparent Pay-As-You-Go Strategy
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              We reject high upfront monthly subscriptions that lock out qualified candidates. Our micro-transaction model lets users get started for free, maintaining a <span className="text-white font-semibold">₦0 entry point</span>. Small token pools are allocated dynamically only when our system discovers open slots and compiles optimized assets—keeping developer operating margins high and application access fair.
            </p>
          </div>
        </div>

        {/* Embedded Onboarding Module Container */}
        <div className="lg:justify-self-end w-full max-w-md">
          <OnboardingCard onGetStarted={onSignUp} />
        </div>
      </header>


      {/* Dynamic Visual Mockups Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-slate-900 space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-bold font-mono tracking-widest text-cyan-400 uppercase bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            Platform Capabilities Showcase
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            An Inside Look at <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400">GiGO's Ecosystem</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            No empty promises. Here is a visual preview of the powerful terminal-assisted interfaces and automatic intelligence nodes running in the background to accelerate your career.
          </p>
        </div>

        {/* Mockups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Card 1: AI Voice Onboarding Console */}
          <div className="group rounded-3xl bg-slate-900/40 border border-slate-800/80 p-6 flex flex-col justify-between hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.05)] transition-all duration-300 relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400 border border-cyan-500/20 text-xl font-bold">🎙️</span>
                <span className="text-[10px] font-mono text-cyan-400/80 border border-cyan-500/30 px-2 py-0.5 rounded bg-cyan-950/20 font-semibold uppercase">Active Mic</span>
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">AI Multi-Modal Voice Onboarding</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ditch typing tedious resume forms. Click the mic button and speak naturally about your skills, stack, and target roles. Our Gemini 2.5 parser structures your identity tokens dynamically.
              </p>
              
              {/* UI Mockup Frame */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-900 font-mono text-[10px] text-slate-400 space-y-3 relative">
                <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                  <span className="text-[8px] text-slate-500 ml-1">Onboarding Voice_Engine.sh</span>
                </div>
                <div className="space-y-1.5">
                  <p className="text-cyan-400">gigo@local:~$ record_voice_profile --stream</p>
                  <p className="text-slate-500">[AUDIO IN] "Hi, I have 5 years in React and SRE..."</p>
                  <div className="flex items-center gap-1">
                    <div className="w-full h-1 bg-slate-900 rounded overflow-hidden">
                      <div className="h-full bg-cyan-500 w-[75%] animate-pulse"></div>
                    </div>
                    <span className="text-[8px] text-cyan-400">75%</span>
                  </div>
                  <p className="text-emerald-400">✔ Gemini API Structuring: SUCCESSFUL</p>
                  <p className="text-[9px] text-slate-300 font-sans leading-relaxed">
                    <strong>Candidate Name:</strong> (Voice verified) <br />
                    <strong>Profile:</strong> Senior Frontend & SRE Specialist
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Interactive Scraper Matching Node */}
          <div className="group rounded-3xl bg-slate-900/40 border border-slate-800/80 p-6 flex flex-col justify-between hover:border-purple-500/30 hover:shadow-[0_0_30px_rgba(168,85,247,0.05)] transition-all duration-300 relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="p-3 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20 text-xl font-bold">🤖</span>
                <span className="text-[10px] font-mono text-purple-400/80 border border-purple-500/30 px-2 py-0.5 rounded bg-purple-950/20 font-semibold uppercase">Background Scraper</span>
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">Dynamic Multi-board Scraper</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                While you sleep, our specialized back-end scraper agent searches and aggregates open career opportunities from diverse job boards, ranking matches by a custom AI Semantic Score out of 100.
              </p>
              
              {/* UI Mockup Frame */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-900 space-y-3 relative">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-[9px] font-mono text-purple-400 font-bold">MATCHES FOUND (4)</span>
                  <span className="text-[8px] font-mono text-slate-500">Live Daemon Feed</span>
                </div>
                <div className="space-y-2">
                  <div className="p-1.5 rounded bg-slate-900/40 border border-slate-900 flex justify-between items-center">
                    <div>
                      <h5 className="text-[10px] font-bold text-white">Senior Staff SRE</h5>
                      <p className="text-[8px] text-slate-500">Google Inc. • Mountain View, CA</p>
                    </div>
                    <span className="px-1.5 py-0.5 text-[8px] font-bold font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">98% Match</span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-900/40 border border-slate-900 flex justify-between items-center">
                    <div>
                      <h5 className="text-[10px] font-bold text-white">Full Stack Tech Lead</h5>
                      <p className="text-[8px] text-slate-500">Stripe • Remote US</p>
                    </div>
                    <span className="px-1.5 py-0.5 text-[8px] font-bold font-mono rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">94% Match</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Blockchain-grade Payment Ledger */}
          <div className="group rounded-3xl bg-slate-900/40 border border-slate-800/80 p-6 flex flex-col justify-between hover:border-pink-500/30 hover:shadow-[0_0_30px_rgba(236,72,153,0.05)] transition-all duration-300 relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="p-3 bg-pink-500/10 rounded-2xl text-pink-400 border border-pink-500/20 text-xl font-bold">📊</span>
                <span className="text-[10px] font-mono text-pink-400/80 border border-pink-500/30 px-2 py-0.5 rounded bg-pink-950/20 font-semibold uppercase">Micro-Wallet</span>
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">Micro-Ledger & Wallet Economics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A highly transparent, blockchain-inspired pay-as-you-go credit ledger. Sign up for ₦0 upfront fees and get a promotional ₦5,000 NGN balance to immediately query jobs and draft cover letters.
              </p>
              
              {/* UI Mockup Frame */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-900 space-y-3 relative font-mono text-[9px]">
                <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                  <span className="text-slate-500 text-[8px]">REGIONAL LEDGER BALANCE</span>
                  <span className="text-pink-400 font-bold">₦5,000.00</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-slate-400">
                    <span>CREDIT (SIGNUP BONUS)</span>
                    <span className="text-emerald-400 font-bold">+₦5,000.00</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span className="text-[8px]">PROMOTIONAL_GRANT • SUCCESSFUL</span>
                  </div>
                  <div className="border-t border-slate-900 my-1"></div>
                  <div className="flex justify-between text-slate-400">
                    <span>DEBIT (JOB MATCH RUN)</span>
                    <span className="text-red-400 font-bold">-₦150.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: High-Converting Multi-Asset Builder */}
          <div className="group rounded-3xl bg-slate-900/40 border border-slate-800/80 p-6 flex flex-col justify-between hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.05)] transition-all duration-300 relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20 text-xl font-bold">📂</span>
                <span className="text-[10px] font-mono text-blue-400/80 border border-blue-500/30 px-2 py-0.5 rounded bg-blue-950/20 font-semibold uppercase">PDF & SMTP</span>
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">Multi-Asset Compilation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate highly formatted ATS resumes, customized cover letters, and pitch documents tailored to specific target opportunities in seconds. Send emails natively or configure custom SMTP.
              </p>
              
              {/* UI Mockup Frame */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-900 space-y-2.5 relative">
                <div className="flex items-center gap-1.5 border-b border-slate-900 pb-2 text-[9px] font-mono text-slate-400">
                  <span>📄 Target_Cover_Letter.pdf</span>
                </div>
                <div className="space-y-1 font-serif text-[7px] text-slate-400 leading-tight">
                  <p className="font-bold text-[8px] text-white">DEAR HIRING MANAGER AT GOOGLE,</p>
                  <p>I am thrilled to express interest in your Senior SRE opening...</p>
                  <p>In my previous roles, I configured custom multi-cluster orchestration, resulting in a 35% decrease in overall server latencies...</p>
                </div>
                <div className="flex justify-end gap-1 text-[8px] font-mono mt-1">
                  <span className="px-1 rounded bg-slate-900 text-slate-500">Edit</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">Natively Dispatched</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 5: Customizable Developer Settings Center */}
          <div className="group rounded-3xl bg-slate-900/40 border border-slate-800/80 p-6 flex flex-col justify-between hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.05)] transition-all duration-300 relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 border border-emerald-500/20 text-xl font-bold">⚙️</span>
                <span className="text-[10px] font-mono text-emerald-400/80 border border-emerald-500/30 px-2 py-0.5 rounded bg-emerald-950/20 font-semibold uppercase">Settings Center</span>
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">Developer Settings & API Overrides</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Take complete ownership. Fine-tune your identity representation by switching custom cybernetic avatars, setting up custom SMTP configuration relays, or overriding our backend keys with your personal keys.
              </p>
              
              {/* UI Mockup Frame */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-900 space-y-2.5 relative">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2 text-[9px] font-mono text-slate-400">
                  <span>⚙️ API ENDPOINT PREFERENCES</span>
                </div>
                <div className="space-y-1.5 text-[8px] font-mono text-slate-400">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 text-[7px] uppercase font-bold">Personal Gemini API Key</span>
                    <span className="p-1 rounded bg-slate-900 border border-slate-800 text-[7px] text-slate-300 font-mono">AIzaSyB_********************Ym93</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-slate-500 text-[7px] uppercase font-bold">Personal SMTP Outbound Host</span>
                    <span className="p-1 rounded bg-slate-900 border border-slate-800 text-[7px] text-slate-300 font-mono">smtp.gmail.com (Port: 587)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 6: Peer-to-Peer Referral Network */}
          <div className="group rounded-3xl bg-slate-900/40 border border-slate-800/80 p-6 flex flex-col justify-between hover:border-orange-500/30 hover:shadow-[0_0_30px_rgba(249,115,22,0.05)] transition-all duration-300 relative overflow-hidden">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="p-3 bg-orange-500/10 rounded-2xl text-orange-400 border border-orange-500/20 text-xl font-bold">👥</span>
                <span className="text-[10px] font-mono text-orange-400/80 border border-orange-500/30 px-2 py-0.5 rounded bg-orange-950/20 font-semibold uppercase">Incentive Center</span>
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">Multi-Channel Referral Hub</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Help friends and earn real value. Generate dynamic, tracking-enabled referral parameters. Let our backend AI Agent auto-formulate ultra-persuasive pitches, dispatching them to peer contacts via email & WhatsApp.
              </p>
              
              {/* UI Mockup Frame */}
              <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-900 space-y-2 relative font-mono text-[9px]">
                <div className="flex justify-between items-center text-[8px] text-slate-500 border-b border-slate-900 pb-1.5">
                  <span>ACTIVE TEAM ONBOARDING</span>
                  <span className="text-emerald-400 font-bold">Active</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Friend: chidi@dev.com</span>
                    <span className="text-emerald-400 font-bold">COMPLETED</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[8px]">
                    <span>Dispatch: AI_AGENT</span>
                    <span className="text-emerald-400 font-bold">+₦500 NGN Bonus</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Embedded Feature Matrix Framework Section */}
      <section id="telemetry" className="bg-slate-900/30 border-y border-slate-900/60">
        <AgentTelemetryCards />
      </section>

      {/* Unified Landing Page Footer */}
      <footer id="usage" className="w-full max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-900 text-xs text-slate-500">
        <p>© 2026 GiGO Ecosystem Labs. Built using the Gemini API Stack.</p>
        <p className="font-mono">Status: Verified Deployment Platform Active</p>
      </footer>
    </div>
  );
};
