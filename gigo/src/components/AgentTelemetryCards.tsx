import React from 'react';

interface FeatureCardProps {
  icon: string;
  title: string;
  badge: string;
  description: string;
  agentLogic: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, badge, description, agentLogic }) => (
  <div className="p-6 rounded-2xl border border-slate-800 shadow-xl relative group hover:border-slate-700 transition-all duration-300" style={{ backgroundImage: 'linear-gradient(to bottom, #0f172a, #020617)' }}>
    <div className="absolute top-4 right-4 text-[10px] uppercase font-bold tracking-widest bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-full border border-cyan-500/20">
      {badge}
    </div>
    <div className="text-3xl mb-4 p-3 bg-slate-900 rounded-xl w-fit border border-slate-800 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
    <p className="text-sm text-slate-400 leading-relaxed mb-4">{description}</p>
    <div className="pt-3 border-t border-slate-800/80">
      <span className="block text-[11px] font-mono text-indigo-400 font-semibold uppercase tracking-wider mb-1">
        ⚡ Core Autonomous Agent Workflow
      </span>
      <p className="text-xs font-mono text-slate-500 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-900">
        {agentLogic}
      </p>
    </div>
  </div>
);

export const AgentTelemetryCards: React.FC = () => {
  const systemFeatures = [
    {
      icon: "🧠",
      title: "Employment Readiness Engine",
      badge: "Gemini Pro Decision Matrix",
      description: "When you sign up via native voice or raw uploads, the system calculates a dynamic suitability evaluation against open positions.",
      agentLogic: "Evaluates multi-modal input -> Assigns live market score -> Auto-configures specialized application pathways and required checklists."
    },
    {
      icon: "⚡",
      title: "Real-Time Intercept Automation",
      badge: "Workspace Watcher Agent",
      description: "Continuously tracks incoming invitations within your connected workspace environments to respond instantly to interview notifications.",
      agentLogic: "Detects invite email -> Maps calendar slots -> Validates workspace internet connectivity status -> Automates draft execution."
    },
    {
      icon: "📊",
      title: "Autonomous Cost Ledger Optimization",
      badge: "Micro-Token Conversions",
      description: "Tracks operational micro-transaction histories to adjust token allocations relative to background API resource spend dynamically.",
      agentLogic: "Audits user operational volumes -> Adjusts conversion values -> Keeps application infrastructure margins optimized."
    },
    {
      icon: "🎙️",
      title: "Native Multi-Modal Audio Ingestion",
      badge: "Zero-Latency Parsing",
      description: "Listens directly to native audio inputs without utilizing external third-party speech-to-text translation layers.",
      agentLogic: "Streams binary sound arrays -> Invokes Gemini multi-modal reasoning -> Isolates profile entities -> Commits data directly to Firestore."
    },
    {
      icon: "🗄️",
      title: "Continuous 2M Token Context Memory",
      badge: "Vector Memory Bank",
      description: "Piles all historic resumes, certification indices (NIN, NYSC, Degrees), and previous drafts into one massive memory framework.",
      agentLogic: "Maintains full user background context -> Avoids fragmented data silos -> Runs deep reasoning checks across everything simultaneously."
    }
  ];

  return (
    <div className="w-full py-12 px-4 max-w-7xl mx-auto">
      <div className="mb-10 text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Powered by Deep Multi-Agent Autonomy
        </h2>
        <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
          GiGO completely eliminates hidden access barriers and fragmented steps by letting parallel specialized processes work for you.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {systemFeatures.map((feat, idx) => <FeatureCard key={idx} {...feat} />)}
      </div>
    </div>
  );
};
