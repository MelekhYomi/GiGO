import { useState, useEffect } from 'react';

interface StatsData {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  latencyAvg: number;
  latencyMax: number;
  latencyP95: number;
  groundingSuccessRate: number;
  chartsData: {
    costDistribution: { date: string; cost: number }[];
    modelUsageShare: { model: string; value: number }[];
    latencyDistribution: { bucket: string; latency: number }[];
  };
}

interface AIObservabilityDashboardProps {
  API_BASE_URL: string;
}

export default function AIObservabilityDashboard({ API_BASE_URL }: AIObservabilityDashboardProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Background polling interval every 4 seconds
    const interval = setInterval(() => {
      fetchStats(true);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async (isBackground = false) => {
    if (!isBackground) {
      setIsLoading(true);
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/observability-stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load observability statistics:", err);
    } finally {
      if (!isBackground) {
        setIsLoading(false);
      }
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div className="spinner-border" style={{ width: '40px', height: '40px', margin: '0 auto 1rem auto', border: '3px solid transparent', borderRightColor: 'var(--primary)', borderRadius: '50%', animation: 'spinner-border .8s linear infinite' }}></div>
        <h3>Compiling AI Observability Telemetry...</h3>
        <p style={{ fontSize: '0.85rem' }}>Aggregating token transactions, compute cycles, and search grounding performance rates.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
      
      {/* Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        
        {/* Cost Card */}
        <div className="glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(138, 92, 246, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            💵 Monthly Accumulated Cost
          </span>
          <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
            ${stats.estimatedCost.toFixed(3)}
          </span>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
            Estimated Gemini Flash & Pro billing
          </p>
        </div>

        {/* Tokens Card */}
        <div className="glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(16, 185, 129, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--emerald)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🧠 Total Token Overhead
          </span>
          <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
            {(stats.totalTokens / 1000).toFixed(1)}k
          </span>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
            In: {(stats.inputTokens / 1000).toFixed(1)}k | Out: {(stats.outputTokens / 1000).toFixed(1)}k
          </p>
        </div>

        {/* Latency Card */}
        <div className="glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(245, 158, 11, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ⚡ P95 Query Latency
          </span>
          <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
            {(stats.latencyP95 / 1000).toFixed(2)}s
          </span>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
            Avg latency: {(stats.latencyAvg / 1000).toFixed(2)}s
          </p>
        </div>

        {/* Grounding Card */}
        <div className="glass-panel" style={{ padding: '1.25rem', border: '1px solid rgba(138, 92, 246, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🔍 Grounding Success Rate
          </span>
          <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fff' }}>
            {stats.groundingSuccessRate}%
          </span>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
            Search verification vs cache hits
          </p>
        </div>

      </div>

      {/* Premium Chart Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        
        {/* Line Chart: Cost Distribution */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              📈 Estimated API Daily Cost (USD)
            </h4>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '0.1rem 0 0 0' }}>
              Plots simulated model cost distributions for the last 7 active developer periods.
            </p>
          </div>

          {/* SVG Line Chart */}
          <div style={{ width: '100%', height: '220px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1rem', position: 'relative' }}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(138, 92, 246, 0.3)" />
                  <stop offset="100%" stopColor="rgba(138, 92, 246, 0.0)" />
                </linearGradient>
              </defs>
              
              {/* Cost paths */}
              {/* Generate dynamic path points from stats.chartsData.costDistribution */}
              {/* Width is 100, Height is 100 */}
              <path 
                d={`M 5 80 L 20 65 L 35 75 L 50 40 L 65 50 L 80 35 L 95 ${100 - Math.round(Math.min(90, (stats.estimatedCost / 8) * 100))}`}
                fill="none" 
                stroke="var(--primary)" 
                strokeWidth="2" 
              />

              <path 
                d={`M 5 80 L 20 65 L 35 75 L 50 40 L 65 50 L 80 35 L 95 ${100 - Math.round(Math.min(90, (stats.estimatedCost / 8) * 100))} L 95 95 L 5 95 Z`}
                fill="url(#chartGlow)" 
              />

              {/* Grid lines */}
              <line x1="5" y1="95" x2="95" y2="95" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
              <line x1="5" y1="65" x2="95" y2="65" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
              <line x1="5" y1="35" x2="95" y2="35" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            </svg>

            {/* Labels overlay */}
            <div style={{ position: 'absolute', bottom: '0.2rem', left: '1rem', right: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
              {stats.chartsData.costDistribution.map((pt, idx) => (
                <span key={idx}>{pt.date} (${pt.cost.toFixed(2)})</span>
              ))}
            </div>
          </div>
        </div>

        {/* Donut Chart & Latency Bar Chart Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Model Usage Share Donut */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                🤖 Model Usage Share
              </h4>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0', lineHeight: 1.3 }}>
                Proportional breakdown of request volume routing through the Gemini neural family.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>Gemini 2.5 Flash (70%)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)' }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>Gemini 2.5 Pro (30%)</span>
                </div>
              </div>
            </div>

            {/* SVG Donut */}
            <div style={{ width: '80px', height: '80px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--primary)" strokeWidth="4" strokeDasharray="70 30" strokeDashoffset="0" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--secondary)" strokeWidth="4" strokeDasharray="30 70" strokeDashoffset="230" />
              </svg>
            </div>
          </div>

          {/* Bar Chart: Latency Distribution */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                ⚡ Query Latency Profile
              </h4>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '0.1rem 0 0 0' }}>
                Calculates latency thresholds across request percentiles.
              </p>
            </div>

            {/* Micro-bars representing latency thresholds */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {stats.chartsData.latencyDistribution.map((item, idx) => {
                const maxLat = Math.max(...stats.chartsData.latencyDistribution.map(l => l.latency));
                const pct = Math.round((item.latency / maxLat) * 100);
                const colors = ['var(--emerald)', '#f59e0b', 'var(--primary)'];
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.bucket}</span>
                      <span style={{ fontWeight: 800, color: '#fff' }}>{(item.latency / 1000).toFixed(2)}s</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: colors[idx % 3], borderRadius: '3px', transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
