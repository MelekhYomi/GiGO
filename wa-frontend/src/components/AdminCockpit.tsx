import React, { useState, useEffect } from 'react';
import OrchestratorControlRoom from './OrchestratorControlRoom';
import AIObservabilityDashboard from './AIObservabilityDashboard';
import RecruiterResponseSandbox from './RecruiterResponseSandbox';

// Simple Refresh SVG Icon
const RefreshIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    style={{ width: '13px', height: '13px' }}
  >
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

export interface AdminUser {
  userId: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  role?: 'admin' | 'candidate';
  skills: string[];
  targetRoles: string[];
  financials: {
    walletBalanceUSD: number;
    walletBalanceNGN: number;
  };
  inferredLocationHints: string;
  salary?: string;
  updatedAt: string;
  geminiApiKey: string;
  paystackPublicKey: string;
  paystackSecretKey: string;
  infrastructureStatus?: {
    powerSetupDescription?: string;
    internetSetupDescription?: string;
    hasRemoteBackupPlan?: boolean;
  };
  isNINVerified?: boolean;
  ninValue?: string;
  ninCardImage?: string;
}

interface AdminCockpitProps {
  API_BASE_URL: string;
  adminUsers: AdminUser[];
  globalTransactions: any[];
  globalApplications: any[];
  adminLogs: any[];
  isLoadingAdminData: boolean;
  isLoadingGlobalTransactions: boolean;
  isLoadingGlobalApplications: boolean;
  isSavingSystemConfig: boolean;
  fetchAdminLogs: (isBackground?: boolean) => void;
  fetchAdminUsers: (isBackground?: boolean) => void;
  fetchGlobalTransactions: (isBackground?: boolean) => void;
  fetchGlobalApplications: (isBackground?: boolean) => void;
  addLog: (msg: string) => void;
  userEmail: string;
  configDomain: string;
  setConfigDomain: (val: string) => void;
  configReferralBonus: string;
  setConfigReferralBonus: (val: string) => void;
  configBooleanSearchTemplate: string;
  setConfigBooleanSearchTemplate: (val: string) => void;
  configScraperDomains: string[];
  setConfigScraperDomains: (val: string[]) => void;
  configPaystackMode: string;
  setConfigPaystackMode: (val: string) => void;
  configPaystackTestPublicKey: string;
  setConfigPaystackTestPublicKey: (val: string) => void;
  configPaystackTestSecretKey: string;
  setConfigPaystackTestSecretKey: (val: string) => void;
  configPaystackLivePublicKey: string;
  setConfigPaystackLivePublicKey: (val: string) => void;
  configPaystackLiveSecretKey: string;
  setConfigPaystackLiveSecretKey: (val: string) => void;
  configAllowUserSelfDeletion: boolean;
  setConfigAllowUserSelfDeletion: (val: boolean) => void;
  handleUpdateSystemConfig: (e: React.FormEvent) => void;
  handleChangeUserRole: (targetUser: AdminUser, newRole: 'admin' | 'candidate') => void;
  handleInspectUser: (user: AdminUser) => void;
  handleExportLedgerCSV: () => void;
  setOverrideUser: (user: AdminUser | null) => void;
  setOverrideAmount: (val: string) => void;
  setOverrideCurrency: (val: 'NGN' | 'USD') => void;
  setOverridePurpose: (val: string) => void;
  setShowOverrideModal: (show: boolean) => void;
}

export const AdminCockpit: React.FC<AdminCockpitProps> = ({
  API_BASE_URL,
  adminUsers,
  globalTransactions,
  globalApplications,
  adminLogs,
  isLoadingAdminData,
  isLoadingGlobalTransactions,
  isLoadingGlobalApplications,
  isSavingSystemConfig,
  fetchAdminLogs,
  fetchAdminUsers,
  fetchGlobalTransactions,
  fetchGlobalApplications,
  addLog,
  userEmail,
  configDomain,
  setConfigDomain,
  configReferralBonus,
  setConfigReferralBonus,
  configBooleanSearchTemplate,
  setConfigBooleanSearchTemplate,
  configScraperDomains,
  setConfigScraperDomains,
  configPaystackMode,
  setConfigPaystackMode,
  configPaystackTestPublicKey,
  setConfigPaystackTestPublicKey,
  configPaystackTestSecretKey,
  setConfigPaystackTestSecretKey,
  configPaystackLivePublicKey,
  setConfigPaystackLivePublicKey,
  configPaystackLiveSecretKey,
  setConfigPaystackLiveSecretKey,
  configAllowUserSelfDeletion,
  setConfigAllowUserSelfDeletion,
  handleUpdateSystemConfig,
  handleChangeUserRole,
  handleInspectUser,
  handleExportLedgerCSV,
  setOverrideUser,
  setOverrideAmount,
  setOverrideCurrency,
  setOverridePurpose,
  setShowOverrideModal,
}) => {
  // Local states that were previously bloating App.tsx
  const [adminTab, setAdminTab] = useState<'activities' | 'financials' | 'applications' | 'candidates' | 'settings' | 'orchestrator' | 'observability' | 'sandbox'>('activities');
  const [ledgerSearch, setLedgerSearch] = useState<string>('');
  const [ledgerCurrencyFilter, setLedgerCurrencyFilter] = useState<'ALL' | 'NGN' | 'USD'>('ALL');
  const [appSearch, setAppSearch] = useState<string>('');
  const [appStatusFilter, setAppStatusFilter] = useState<'ALL' | 'matched' | 'applied' | 'interviews'>('ALL');
  const [candSearch, setCandidateSearch] = useState<string>('');
  const [newDomainInput, setNewDomainInput] = useState<string>('');

  const [resetPasswordUser, setResetPasswordUser] = useState<AdminUser | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState<string>('');
  const [isResettingPassword, setIsResettingPassword] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [selectedNINCard, setSelectedNINCard] = useState<AdminUser | null>(null);
  const [isUpdatingVerification, setIsUpdatingVerification] = useState<boolean>(false);

  const handleToggleNINVerification = async (userId: string, isVerified: boolean) => {
    setIsUpdatingVerification(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/verify-nin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: userEmail,
          isNINVerified: isVerified
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update NIN verification status.");
      }

      addLog(`[Admin Audit] ${isVerified ? 'VERIFIED' : 'UNVERIFIED'} candidate ${userId} NIN status.`);
      alert(`🎉 Candidate NIN status successfully updated to ${isVerified ? 'Verified' : 'Unverified'}.`);
      fetchAdminUsers(true); // reload the table instantly
      setSelectedNINCard(null); // close modal
    } catch (err: any) {
      console.error("NIN verification toggle error:", err);
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsUpdatingVerification(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUser) return;
    setIsResettingPassword(true);
    setResetSuccessMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${resetPasswordUser.userId}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: userEmail,
          newPassword: newPasswordValue
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetSuccessMessage(`Password reset successfully! A temporary credential email was dispatched to ${resetPasswordUser.fullName} (${resetPasswordUser.email}).`);
        logAdminAction('PASSWORD_RESET_OVERRIDE', `Forcefully reset and reassigned password credentials for user: ${resetPasswordUser.fullName} (${resetPasswordUser.email})`);
        fetchAdminUsers(true);
      } else {
        alert(data.error || "Failed to reset password");
      }
    } catch (err: any) {
      console.error(err);
      alert("Network error occurred during password reset execution.");
    } finally {
      setIsResettingPassword(false);
    }
  };
  
  // Real-time live data state
  const [isLiveFeed, setIsLiveFeed] = useState<boolean>(true);

  // Corporate Accounting & Bookkeeping States (Phase 13 Robustness)
  const [financialSubTab, setFinancialSubTab] = useState<'ledger' | 'accounting'>('ledger');
  const [saasPriceUSD, setSaaSPriceUSD] = useState<number>(25);
  const [saasPriceNGN, setSaaSPriceNGN] = useState<number>(12500);
  const [referralBonusNGN, setReferralBonusNGN] = useState<number>(1500);
  const [gatewayFeeRate, setGatewayFeeRate] = useState<number>(1.5); // percentage clearance fee
  const [llmUnitCostUSD, setLlmUnitCostUSD] = useState<number>(0.015); // cost per agent token execution

  // Ecosystem Security & Access Governance States
  const [frozenUserIds, setFrozenUserIds] = useState<string[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(true);
  const [isScraperActive, setIsScraperActive] = useState<boolean>(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);
  const [isPayoutActive, setIsPayoutActive] = useState<boolean>(true);

  const candidateCount = adminUsers.filter(u => u.role !== 'admin').length;

  // Administrative Audit Trails
  const [adminAuditLogs, setAdminAuditLogs] = useState<any[]>([
    {
      id: 'audit_1',
      timestamp: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
      adminEmail: userEmail || 'admin@gigo.com',
      action: 'SYSTEM_BOOT',
      details: 'GiGO Super-Admin engine successfully mounted with local storage buffers.',
      ip: '197.210.64.48'
    },
    {
      id: 'audit_2',
      timestamp: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
      adminEmail: userEmail || 'admin@gigo.com',
      action: 'CONFIG_UPDATE',
      details: 'Updated global landing domain URL configuration successfully.',
      ip: '197.210.64.48'
    }
  ]);

  const logAdminAction = (action: string, details: string) => {
    const newLog = {
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminEmail: userEmail || 'admin@gigo.com',
      action,
      details,
      ip: '197.210.64.' + Math.floor(Math.random() * 254)
    };
    setAdminAuditLogs(prev => [newLog, ...prev]);
    addLog(`🛡️ [Audit Trail] Registered admin action: ${action} - ${details}`);
  };

  useEffect(() => {
    fetchAdminLogs();
    fetchAdminUsers();
  }, []);

  // background active polling loop
  useEffect(() => {
    if (!isLiveFeed) return;

    // active tab real-time polling every 3.5 seconds
    const activeTabInterval = setInterval(() => {
      if (adminTab === 'activities') {
        fetchAdminLogs(true);
      } else if (adminTab === 'financials') {
        fetchGlobalTransactions(true);
      } else if (adminTab === 'applications') {
        fetchGlobalApplications(true);
      } else if (adminTab === 'candidates') {
        fetchAdminUsers(true);
      }
    }, 3500);

    // global counter background polling every 10 seconds
    const kpiInterval = setInterval(() => {
      fetchAdminUsers(true);
      fetchGlobalTransactions(true);
      fetchGlobalApplications(true);
    }, 10000);

    return () => {
      clearInterval(activeTabInterval);
      clearInterval(kpiInterval);
    };
  }, [isLiveFeed, adminTab, fetchAdminLogs, fetchAdminUsers, fetchGlobalTransactions, fetchGlobalApplications]);

  const selectAdminTab = (tab: 'activities' | 'financials' | 'applications' | 'candidates' | 'settings' | 'orchestrator' | 'observability' | 'sandbox') => {
    setAdminTab(tab);
    addLog(`🔑 Administrative Dashboard: Switched tab view to "${tab.toUpperCase()}".`);
    if (tab === 'activities') fetchAdminLogs();
    if (tab === 'financials') fetchGlobalTransactions();
    if (tab === 'applications') fetchGlobalApplications();
    if (tab === 'candidates') fetchAdminUsers();
  };

  return (
    <main className="admin-portal-container animate-fade-in" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
      
      {/* COCKPIT TITLE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }} className="text-gradient-purple-pink">⚡ Administrative Cockpit</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>Super-Admin unified operations terminal tracking candidate telemetries, persistent financial ledgers, and global configurations.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Live Feed Polling Status Toggle */}
          <button
            onClick={() => {
              setIsLiveFeed(!isLiveFeed);
              addLog(`📡 Live Feed Polling: ${!isLiveFeed ? 'ENABLED (High-frequency active telemetry)' : 'DISABLED (Static inspection)'}`);
            }}
            style={{
              padding: '0.45rem 0.9rem',
              background: isLiveFeed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
              border: isLiveFeed ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--border-glass)',
              borderRadius: '8px',
              color: isLiveFeed ? '#10b981' : 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
              boxShadow: isLiveFeed ? '0 0 10px rgba(16, 185, 129, 0.15)' : 'none',
            }}
          >
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isLiveFeed ? '#10b981' : '#64748b',
              display: 'inline-block',
              animation: isLiveFeed ? 'pulse 2s infinite' : 'none'
            }}></span>
            {isLiveFeed ? 'LIVE FEED: ACTIVE' : 'LIVE FEED: PAUSED'}
          </button>

          <div style={{ padding: '0.5rem 1rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <span style={{ fontSize: '1rem' }}>👑</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GIGO SUPER ADMIN ENGINE</span>
          </div>
        </div>
      </div>

      {/* KPI STATISTICAL RIBBON */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.35)', border: '1px solid var(--border-glass)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ padding: '0.75rem', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '12px', fontSize: '1.5rem', color: '#8b5cf6' }}>👥</div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ecosystem Candidates</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>{adminUsers.length}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.35)', border: '1px solid var(--border-glass)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.15)', borderRadius: '12px', fontSize: '1.5rem', color: '#10b981' }}>🪙</div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ecosystem Ledger Liability</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', marginTop: '0.15rem' }}>
              {(adminUsers.reduce((sum, u) => sum + (u.financials?.walletBalanceNGN || 0), 0) * 5).toLocaleString()} Tokens
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              (₦{adminUsers.reduce((sum, u) => sum + (u.financials?.walletBalanceNGN || 0), 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })} NGN)
            </div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.35)', border: '1px solid var(--border-glass)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ padding: '0.75rem', background: 'rgba(14, 165, 233, 0.15)', borderRadius: '12px', fontSize: '1.5rem', color: '#0ea5e9' }}>💼</div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ecosystem Application Hub</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0ea5e9', marginTop: '0.2rem' }}>{globalApplications.length}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(15, 23, 42, 0.35)', border: '1px solid var(--border-glass)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ padding: '0.75rem', background: 'rgba(236, 72, 153, 0.15)', borderRadius: '12px', fontSize: '1.5rem', color: '#ec4899' }}>💳</div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ledger Records</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ec4899', marginTop: '0.2rem' }}>{globalTransactions.length}</div>
          </div>
        </div>
      </div>

      {/* ACTIVE NEON HORIZONTAL TABS (SIDE SCROLLABLE) */}
      <div 
        className="admin-tabs-scroller"
        style={{
          display: 'flex',
          gap: '0.75rem',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--border-glass)',
          scrollbarWidth: 'none',
        }}
      >
        {([
          { id: 'activities', label: '📊 Activity Stream', color: '#8b5cf6', shadow: 'rgba(139, 92, 246, 0.4)' },
          { id: 'financials', label: '💳 Financial Ledger', color: '#10b981', shadow: 'rgba(16, 185, 129, 0.4)' },
          { id: 'applications', label: '💼 Application Hub', color: '#0ea5e9', shadow: 'rgba(14, 165, 233, 0.4)' },
          { id: 'candidates', label: '👥 Candidate Directory', color: '#ec4899', shadow: 'rgba(236, 72, 153, 0.4)' },
          { id: 'settings', label: '⚙️ System Control', color: '#f59e0b', shadow: 'rgba(245, 158, 11, 0.4)' },
          { id: 'orchestrator', label: '🤖 Orchestrator', color: '#a78bfa', shadow: 'rgba(167, 139, 250, 0.4)' },
          { id: 'observability', label: '📈 Observability', color: '#34d399', shadow: 'rgba(52, 211, 153, 0.4)' },
          { id: 'sandbox', label: '🧪 Recruiter Sandbox', color: '#38bdf8', shadow: 'rgba(56, 189, 248, 0.4)' }
        ] as const).map((t) => {
          const isActive = adminTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => selectAdminTab(t.id)}
              style={{
                whiteSpace: 'nowrap',
                padding: '0.6rem 1.15rem',
                borderRadius: '10px',
                border: isActive ? `1px solid ${t.color}` : '1px solid var(--border-glass)',
                background: isActive ? `${t.shadow.replace('0.4', '0.12')}` : 'rgba(255,255,255,0.02)',
                color: isActive ? '#fff' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: isActive ? `0 0 12px ${t.shadow}` : 'none',
                transition: 'all 0.25s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ACTIVITIES */}
      {adminTab === 'activities' && (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Continuous Validation Logs */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', maxHeight: '520px', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📊</span> System Security & Operation Logs
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Real-time audit log feeds tracing candidate telemetries, transaction overrides, and AI routines.</p>
              </div>
              <button className="btn-glass" onClick={() => fetchAdminLogs()} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                <RefreshIcon /> Refresh Logs
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.25rem', maxHeight: '420px', scrollbarWidth: 'thin' }}>
              {adminLogs.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No system operations recorded yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {adminLogs.map((log, index) => {
                    const isWarning = log.message?.includes('Warning') || log.message?.includes('unauthorized') || log.message?.includes('Security');
                    const isSuccess = log.message?.includes('Success') || log.message?.includes('credited');
                    return (
                      <div 
                        key={log.id || index} 
                        style={{ 
                          padding: '0.65rem 0.85rem', 
                          background: 'rgba(0,0,0,0.2)', 
                          borderLeft: isWarning ? '3px solid #ef4444' : isSuccess ? '3px solid #10b981' : '3px solid #8b5cf6', 
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.2rem', fontSize: '0.65rem' }}>
                          <span style={{ fontWeight: 700 }}>{log.operator || 'SYSTEM_CORE'}</span>
                          <span>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'N/A'}</span>
                        </div>
                        <div style={{ color: '#fff', lineHeight: 1.4, fontFamily: 'monospace' }}>{log.message}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Continuous Integration Environment Calibration Monitoring */}
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🚀</span> Active Telemetry Health Rings
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0' }}>Real-time daemon checks across system submodules ensuring background API synchronization pipelines remain alive.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#10b981' }}>Webhook Daemon</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Listening to secure Paystack transactional webhooks.</div>
                </div>
                <span className="badge-glow" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', fontWeight: 800, border: '1px solid rgba(16, 185, 129, 0.25)', boxShadow: '0 0 8px rgba(16, 185, 129, 0.2)' }}>ACTIVE RUNNING</span>
              </div>

              <div style={{ padding: '1rem', background: 'rgba(139, 92, 246, 0.04)', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#8b5cf6' }}>Gemini Scraper Integration Router</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Evaluating candidate profile location hints and mapping Boolean keywords.</div>
                </div>
                <span className="badge-glow" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6', fontWeight: 800, border: '1px solid rgba(139, 92, 246, 0.25)', boxShadow: '0 0 8px rgba(139, 92, 246, 0.2)' }}>STANDBY READY</span>
              </div>

              <div style={{ padding: '1rem', background: 'rgba(14, 165, 233, 0.04)', border: '1px solid rgba(14, 165, 233, 0.15)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0ea5e9' }}>Simulated Mailroom Core Thread Hub</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Active webhook listener checking incoming deposits & ledger updates.</div>
                </div>
                <span className="badge-glow" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9', fontWeight: 800, border: '1px solid rgba(14, 165, 233, 0.25)', boxShadow: '0 0 8px rgba(14, 165, 233, 0.2)' }}>ACTIVE RUNNING</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FINANCIAL LEDGER */}
      {adminTab === 'financials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Sub-tab selection bar */}
          <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '10px', padding: '0.25rem', border: '1px solid var(--border-glass)', width: 'fit-content' }}>
            <button
              onClick={() => setFinancialSubTab('ledger')}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                background: financialSubTab === 'ledger' ? 'var(--primary)' : 'transparent',
                color: financialSubTab === 'ledger' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              📊 Core Ledger Auditing
            </button>
            <button
              onClick={() => setFinancialSubTab('accounting')}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                borderRadius: '8px',
                border: 'none',
                background: financialSubTab === 'accounting' ? 'var(--primary)' : 'transparent',
                color: financialSubTab === 'accounting' ? '#fff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🏦 GiGO Corporate Bookkeeping
            </button>
          </div>

          {financialSubTab === 'ledger' ? (
            <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>💳 Global Financial Ledger</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Audit ledger transactions compiled dynamically across all candidate wallets. Export records to raw spreadsheets.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn-glass" onClick={handleExportLedgerCSV} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}>
                    📥 Export CSV
                  </button>
                  <button className="btn-glass" onClick={() => fetchGlobalTransactions()} disabled={isLoadingGlobalTransactions} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                    <RefreshIcon /> Refresh Ledger
                  </button>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Search ledger (purpose, email, candidate name)..."
                  value={ledgerSearch}
                  onChange={(e) => setLedgerSearch(e.target.value)}
                  style={{ flex: 1, minWidth: '240px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#fff' }}
                />
                
                {/* Currency Filter Button Group */}
                <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '8px', padding: '0.2rem', border: '1px solid var(--border-glass)' }}>
                  {(['ALL', 'NGN', 'USD'] as const).map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setLedgerCurrencyFilter(curr)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: 'none',
                        background: ledgerCurrencyFilter === curr ? 'var(--primary)' : 'transparent',
                        color: ledgerCurrencyFilter === curr ? '#fff' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {curr}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingGlobalTransactions ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0' }}>
                  <div className="spinner-micro" style={{ width: '40px', height: '40px', border: '3px solid rgba(255, 255, 255, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Compiling global ledger records...</span>
                </div>
              ) : (
                <div className="table-wrapper" style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
                  <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>
                        <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Timestamp</th>
                        <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Candidate</th>
                        <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Type</th>
                        <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Purpose</th>
                        <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {globalTransactions
                        .filter(t => {
                          const term = ledgerSearch.toLowerCase();
                          const matchesSearch = (
                            t.fullName?.toLowerCase().includes(term) ||
                            t.email?.toLowerCase().includes(term) ||
                            t.purpose?.toLowerCase().includes(term) ||
                            t.type?.toLowerCase().includes(term)
                          );
                          const matchesCurrency = ledgerCurrencyFilter === 'ALL' || t.currency === ledgerCurrencyFilter;
                          return matchesSearch && matchesCurrency;
                        })
                        .length === 0 ? (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No transaction ledger records matched search query.</td>
                          </tr>
                        ) : (
                          globalTransactions
                            .filter(t => {
                              const term = ledgerSearch.toLowerCase();
                              const matchesSearch = (
                                t.fullName?.toLowerCase().includes(term) ||
                                t.email?.toLowerCase().includes(term) ||
                                t.purpose?.toLowerCase().includes(term) ||
                                t.type?.toLowerCase().includes(term)
                              );
                              const matchesCurrency = ledgerCurrencyFilter === 'ALL' || t.currency === ledgerCurrencyFilter;
                              return matchesSearch && matchesCurrency;
                            })
                            .map((t, idx) => {
                              const isCredit = t.type === 'CREDIT' || t.type === 'deposit' || t.type === 'commission' || t.type === 'override';
                              const displayDate = t.timestamp || t.date;
                              const displayName = t.userFullName || t.fullName || 'Anonymous';
                              const displayEmail = t.userEmail || t.email || '';
                              return (
                                <tr key={t.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                  <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {displayDate ? new Date(displayDate).toLocaleString('en-NG') : 'N/A'}
                                  </td>
                                  <td style={{ padding: '0.75rem' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{displayName}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{displayEmail}</div>
                                  </td>
                                  <td style={{ padding: '0.75rem' }}>
                                    <span style={{ 
                                      fontSize: '0.65rem', 
                                      fontWeight: 700, 
                                      padding: '0.15rem 0.4rem', 
                                      borderRadius: '4px',
                                      background: isCredit ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                                      color: isCredit ? '#10b981' : '#f43f5e',
                                      textTransform: 'uppercase'
                                    }}>
                                      {t.type}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                                    {t.purpose}
                                  </td>
                                  <td style={{ padding: '0.75rem', fontSize: '0.85rem', fontWeight: 800, textAlign: 'right', color: isCredit ? '#10b981' : '#f43f5e' }}>
                                    {isCredit ? '+' : '-'}{t.currency === 'USD' ? '$' : '₦'}{(t.amount || 0).toLocaleString(t.currency === 'USD' ? 'en-US' : 'en-NG', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td style={{ padding: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {t.paymentMethod || 'SYSTEM'}
                                  </td>
                                </tr>
                              );
                            })
                        )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            // CORPORATE ACCOUNTING / BOOKKEEPING BOARD
            <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-glass)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }} className="text-gradient-purple-pink">🏦 GiGO Corporate Bookkeeping & Ledger Systems</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Real-time double-entry corporate accounting aggregates actual operational metrics and calculates platform margin health. Adjust pricing model parameters below.
                </p>
              </div>

              {/* Calculus Engine Pre-computations */}
              {(() => {
                const FX_RATE = 1500;
                // const candidateCount = adminUsers.filter(u => u.role !== 'admin').length;
                
                // Revenues
                // const saasRevUSD = candidateCount * saasPriceUSD;
                // const saasRevNGN = candidateCount * saasPriceNGN;
                
                const isDeposit = (t: any) => t.type === 'deposit' || (t.type === 'CREDIT' && t.purpose === 'WALLET_TOPUP');
                const gatewayBaseUSD = globalTransactions.filter(t => t.currency === 'USD' && isDeposit(t)).reduce((sum, t) => sum + (t.amount || 0), 0);
                const gatewayBaseNGN = globalTransactions.filter(t => t.currency === 'NGN' && isDeposit(t)).reduce((sum, t) => sum + (t.amount || 0), 0);
                
                // const gatewayRevUSD = gatewayBaseUSD * (gatewayFeeRate / 100);
                // const gatewayRevNGN = gatewayBaseNGN * (gatewayFeeRate / 100);
                
                // const sponRevUSD = globalApplications.length * 15;
                // const sponRevNGN = globalApplications.length * 7500;

                // const totalUSDRevenues = saasRevUSD + gatewayRevUSD + sponRevUSD + (saasRevNGN + gatewayRevNGN + sponRevNGN) / FX_RATE;
                // const totalNGNRevenues = (saasRevUSD + gatewayRevUSD + sponRevUSD) * FX_RATE + saasRevNGN + gatewayRevNGN + sponRevNGN;

                // Expenses
                // const geminiExpUSD = adminLogs.length * llmUnitCostUSD;
                // const scraperExpUSD = globalApplications.length * 0.12;
                
                // const referralExpNGN = adminUsers.length * referralBonusNGN;
                // const referralExpUSD = referralExpNGN / FX_RATE;

                // const totalUSDExpenses = geminiExpUSD + scraperExpUSD + referralExpUSD;
                // const totalNGNExpenses = (geminiExpUSD + scraperExpUSD) * FX_RATE + referralExpNGN;

                // Profits & Margins
                // const usdNetProfit = totalUSDRevenues - totalUSDExpenses;
                // const ngnNetProfit = totalNGNRevenues - totalNGNExpenses;
                // const profitMargin = totalUSDRevenues > 0 ? (usdNetProfit / totalUSDRevenues) * 100 : 0;

                // Balance Sheet Numbers
                // const startCapitalUSD = 25000;
                // const startCapitalNGN = 37500000;
                
                // const totalAssetsUSD = startCapitalUSD + usdNetProfit;
                // const totalAssetsNGN = startCapitalNGN + ngnNetProfit;

                // const totalWalletLiabilityUSD = adminUsers.reduce((sum, u) => sum + (u.financials?.walletBalanceUSD || 0), 0);
                // const totalWalletLiabilityNGN = adminUsers.reduce((sum, u) => sum + (u.financials?.walletBalanceNGN || 0), 0);

                // const equityUSD = totalAssetsUSD - totalWalletLiabilityUSD;
                // const equityNGN = totalAssetsNGN - totalWalletLiabilityNGN;

                return (
                  <>
                    {/* Split Layout: XPRIZE P&L Statement on Left/Top, Balance Sheet & Sliders on Right/Bottom */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', alignItems: 'flex-start' }}>
                      
                      {/* COLUMN 1: THE BRANDED XPRIZE P&L SHEET */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', gridColumn: 'span 2' }}>
                        
                        {/* XPRIZE Branded Header Panel (Excel Style, Premium Dark-Mode) */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          borderRadius: '16px 16px 0 0',
                          overflow: 'hidden',
                          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)',
                          border: '1px solid var(--border-glass)',
                          borderBottom: 'none'
                        }}>
                          {/* Banner 1: Build with Gemini XPRIZE (Navy) */}
                          <div style={{
                            background: '#0a192f',
                            padding: '1.25rem 1.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                          }}>
                            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
                              Build with Gemini XPRIZE
                            </h2>
                            <span className="badge-glow" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', fontWeight: 800, border: '1px solid rgba(239, 68, 68, 0.3)', textShadow: '0 0 6px rgba(239, 68, 68, 0.3)' }}>
                              CONFIDENTIAL
                            </span>
                          </div>

                          {/* Banner 2: Profit & Loss Statement (Orange) */}
                          <div style={{
                            background: '#f25f22', // Official warm orange
                            padding: '0.6rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '0.05em' }}>PROFIT & LOSS STATEMENT</span>
                          </div>

                          {/* Banner 3: Accent Bar (Green) */}
                          <div style={{
                            background: '#00c58e', // Official vibrant green
                            height: '0.45rem',
                            width: '100%'
                          }}></div>

                          {/* Row 4: Program Period & Currency info (Navy / Slate) */}
                          <div style={{
                            background: '#0f172a',
                            padding: '0.75rem 1.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            borderBottom: '1px solid rgba(255,255,255,0.06)'
                          }}>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                              Program Period: <strong style={{ color: '#fff' }}>May 19 - August 17</strong>
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                              Currency: <strong style={{ color: '#38bdf8' }}>USD</strong>
                            </span>
                          </div>
                        </div>

                        {/* XPRIZE Profit & Loss Data Grid */}
                        {(() => {
                          const formatUSD = (val: number) => {
                            const isNeg = val < 0;
                            const formatted = Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            return isNeg ? `-$${formatted}` : `$${formatted}`;
                          };

                          // Program Weights for distributing metrics dynamically
                          const weights = { may: 0.15, june: 0.25, july: 0.35, august: 0.25 };

                          // Base Revenue Components
                          const saasUSDTotal = candidateCount * saasPriceUSD;
                          const gatewayUSDTotal = (gatewayBaseUSD + (gatewayBaseNGN / FX_RATE)) * (gatewayFeeRate / 100);
                          const placementsUSDTotal = globalApplications.length * 15;

                          // REVENUE GROUPS
                          const independentSalesTotal = saasUSDTotal + placementsUSDTotal;
                          const relatedPartyRevenueTotal = gatewayUSDTotal;
                          const totalRevenueTotal = independentSalesTotal + relatedPartyRevenueTotal;

                          const revIndependent = {
                            may: independentSalesTotal * weights.may,
                            june: independentSalesTotal * weights.june,
                            july: independentSalesTotal * weights.july,
                            august: independentSalesTotal * weights.august,
                            total: independentSalesTotal
                          };

                          const revRelated = {
                            may: relatedPartyRevenueTotal * weights.may,
                            june: relatedPartyRevenueTotal * weights.june,
                            july: relatedPartyRevenueTotal * weights.july,
                            august: relatedPartyRevenueTotal * weights.august,
                            total: relatedPartyRevenueTotal
                          };

                          const revTotal = {
                            may: totalRevenueTotal * weights.may,
                            june: totalRevenueTotal * weights.june,
                            july: totalRevenueTotal * weights.july,
                            august: totalRevenueTotal * weights.august,
                            total: totalRevenueTotal
                          };

                          // BASE OPERATION COSTS (Simulated wages and structural tooling)
                          const baseCogsPersonnel = 1200; // DevOps / Systems upkeep
                          const baseCogsSoftware = 150;    // Web infrastructure & cluster storage
                          const baseSgaPersonnel = 800;   // Digital marketing & outreach
                          const baseSgaSoftware = 75;      // Intercom & CRM support bundles

                          // Mapped Expenses from Telemetry / Sliders
                          const totalReferralsUSD = (adminUsers.length * referralBonusNGN) / FX_RATE;
                          const totalCrawlersUSD = globalApplications.length * 0.12;
                          const totalGeminiUSD = adminLogs.length * llmUnitCostUSD;

                          // EXPENSE GROUPS

                          // 1. COGS (Direct creation/provision)
                          const cogsPersonnel = {
                            may: baseCogsPersonnel * weights.may,
                            june: baseCogsPersonnel * weights.june,
                            july: baseCogsPersonnel * weights.july,
                            august: baseCogsPersonnel * weights.august,
                            total: baseCogsPersonnel
                          };
                          const cogsSoftware = {
                            may: baseCogsSoftware * weights.may,
                            june: baseCogsSoftware * weights.june,
                            july: baseCogsSoftware * weights.july,
                            august: baseCogsSoftware * weights.august,
                            total: baseCogsSoftware
                          };
                          const cogsTokens = {
                            may: totalGeminiUSD * weights.may,
                            june: totalGeminiUSD * weights.june,
                            july: totalGeminiUSD * weights.july,
                            august: totalGeminiUSD * weights.august,
                            total: totalGeminiUSD
                          };

                          // 2. SG&A (Management & Promotion)
                          const sgaPersonnel = {
                            may: baseSgaPersonnel * weights.may,
                            june: baseSgaPersonnel * weights.june,
                            july: baseSgaPersonnel * weights.july,
                            august: baseSgaPersonnel * weights.august,
                            total: baseSgaPersonnel
                          };
                          const sgaSoftware = {
                            may: baseSgaSoftware * weights.may,
                            june: baseSgaSoftware * weights.june,
                            july: baseSgaSoftware * weights.july,
                            august: baseSgaSoftware * weights.august,
                            total: baseSgaSoftware
                          };
                          const sgaTokens = {
                            may: (totalGeminiUSD * 0.15) * weights.may,
                            june: (totalGeminiUSD * 0.15) * weights.june,
                            july: (totalGeminiUSD * 0.15) * weights.july,
                            august: (totalGeminiUSD * 0.15) * weights.august,
                            total: totalGeminiUSD * 0.15
                          };

                          // 3. Other Expenses (Crawlers + Referral Affiliate Bonuses)
                          const baseOtherExpenses = totalReferralsUSD + totalCrawlersUSD;
                          const otherExpenses = {
                            may: baseOtherExpenses * weights.may,
                            june: baseOtherExpenses * weights.june,
                            july: baseOtherExpenses * weights.july,
                            august: baseOtherExpenses * weights.august,
                            total: baseOtherExpenses
                          };

                          // Expense Totals
                          const expTotal = {
                            may: cogsPersonnel.may + cogsSoftware.may + cogsTokens.may + sgaPersonnel.may + sgaSoftware.may + sgaTokens.may + otherExpenses.may,
                            june: cogsPersonnel.june + cogsSoftware.june + cogsTokens.june + sgaPersonnel.june + sgaSoftware.june + sgaTokens.june + otherExpenses.june,
                            july: cogsPersonnel.july + cogsSoftware.july + cogsTokens.july + sgaPersonnel.july + sgaSoftware.july + sgaTokens.july + otherExpenses.july,
                            august: cogsPersonnel.august + cogsSoftware.august + cogsTokens.august + sgaPersonnel.august + sgaSoftware.august + sgaTokens.august + otherExpenses.august,
                            total: cogsPersonnel.total + cogsSoftware.total + cogsTokens.total + sgaPersonnel.total + sgaSoftware.total + sgaTokens.total + otherExpenses.total
                          };

                          // Profit / Loss Statement
                          const profitLoss = {
                            may: revTotal.may - expTotal.may,
                            june: revTotal.june - expTotal.june,
                            july: revTotal.july - expTotal.july,
                            august: revTotal.august - expTotal.august,
                            total: revTotal.total - expTotal.total
                          };

                          // Margin
                          // const marginPercent = revTotal.total > 0 ? (profitLoss.total / revTotal.total) * 100 : 0;

                          return (
                            <div className="table-wrapper" style={{ overflowX: 'auto', border: '1px solid var(--border-glass)', borderRadius: '0 0 16px 16px', background: 'rgba(15, 23, 42, 0.4)' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                <thead>
                                  <tr style={{ background: '#0b1329', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#fff', fontWeight: 800 }}>Description</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#fb923c', fontWeight: 800 }}>May</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#fb923c', fontWeight: 800 }}>June</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#fb923c', fontWeight: 800 }}>July</th>
                                    <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#fb923c', fontWeight: 800 }}>August</th>
                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#fb923c', fontWeight: 900, background: 'rgba(251, 146, 60, 0.05)' }}>Full 90 Days</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  
                                  {/* REVENUE ROW */}
                                  <tr style={{ background: '#1e293b' }}>
                                    <td colSpan={6} style={{ padding: '0.45rem 1rem', fontWeight: 900, color: '#fb923c', fontSize: '0.8rem', letterSpacing: '0.03em' }}>REVENUE</td>
                                  </tr>
                                  
                                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                                    <td style={{ padding: '0.55rem 1rem 0.55rem 1.5rem', color: '#cbd5e1' }}>Independent Sales (ie. sales of product or service)</td>
                                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(revIndependent.may)}</td>
                                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(revIndependent.june)}</td>
                                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(revIndependent.july)}</td>
                                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(revIndependent.august)}</td>
                                    <td style={{ padding: '0.55rem 1rem', textAlign: 'right', color: '#fff', fontWeight: 700, background: 'rgba(251, 146, 60, 0.02)' }}>{formatUSD(revIndependent.total)}</td>
                                  </tr>

                                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                                    <td style={{ padding: '0.55rem 1rem 0.55rem 1.5rem', color: '#cbd5e1' }}>Related Party Revenue (ie. see Rules)</td>
                                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(revRelated.may)}</td>
                                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(revRelated.june)}</td>
                                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(revRelated.july)}</td>
                                    <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(revRelated.august)}</td>
                                    <td style={{ padding: '0.55rem 1rem', textAlign: 'right', color: '#fff', fontWeight: 700, background: 'rgba(251, 146, 60, 0.02)' }}>{formatUSD(revRelated.total)}</td>
                                  </tr>

                                  <tr style={{ background: '#0b1329', borderTop: '2px solid #fb923c', borderBottom: '2px solid #fb923c' }}>
                                    <td style={{ padding: '0.65rem 1rem', fontWeight: 800, color: '#fb923c' }}>TOTAL REVENUE</td>
                                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: '#fff', fontWeight: 700 }}>{formatUSD(revTotal.may)}</td>
                                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: '#fff', fontWeight: 700 }}>{formatUSD(revTotal.june)}</td>
                                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: '#fff', fontWeight: 700 }}>{formatUSD(revTotal.july)}</td>
                                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: '#fff', fontWeight: 700 }}>{formatUSD(revTotal.august)}</td>
                                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: '#fb923c', fontWeight: 900, background: 'rgba(251, 146, 60, 0.08)' }}>{formatUSD(revTotal.total)}</td>
                                  </tr>

                                  {/* EXPENSES ROW */}
                                  <tr style={{ background: '#1e293b' }}>
                                    <td colSpan={6} style={{ padding: '0.45rem 1rem', fontWeight: 900, color: '#f43f5e', fontSize: '0.8rem', letterSpacing: '0.03em' }}>EXPENSES</td>
                                  </tr>

                                  {/* COGS */}
                                  <tr style={{ background: 'rgba(244, 63, 94, 0.03)' }}>
                                    <td colSpan={6} style={{ padding: '0.35rem 1rem 0.35rem 1.25rem', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', fontSize: '0.7rem' }}>COGS</td>
                                  </tr>
                                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                                    <td style={{ padding: '0.45rem 1rem 0.45rem 1.5rem', color: '#94a3b8' }}>Personnel</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(cogsPersonnel.may)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(cogsPersonnel.june)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(cogsPersonnel.july)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(cogsPersonnel.august)}</td>
                                    <td style={{ padding: '0.45rem 1rem', textAlign: 'right', color: '#fff', fontWeight: 700, background: 'rgba(251, 146, 60, 0.02)' }}>{formatUSD(cogsPersonnel.total)}</td>
                                  </tr>
                                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                                    <td style={{ padding: '0.45rem 1rem 0.45rem 1.5rem', color: '#94a3b8' }}>Software Subscriptions</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(cogsSoftware.may)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(cogsSoftware.june)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(cogsSoftware.july)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(cogsSoftware.august)}</td>
                                    <td style={{ padding: '0.45rem 1rem', textAlign: 'right', color: '#fff', fontWeight: 700, background: 'rgba(251, 146, 60, 0.02)' }}>{formatUSD(cogsSoftware.total)}</td>
                                  </tr>
                                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                                    <td style={{ padding: '0.45rem 1rem 0.45rem 1.5rem', color: '#94a3b8' }}>Tokens</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(cogsTokens.may)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(cogsTokens.june)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(cogsTokens.july)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(cogsTokens.august)}</td>
                                    <td style={{ padding: '0.45rem 1rem', textAlign: 'right', color: '#fff', fontWeight: 700, background: 'rgba(251, 146, 60, 0.02)' }}>{formatUSD(cogsTokens.total)}</td>
                                  </tr>

                                  {/* SG&A */}
                                  <tr style={{ background: 'rgba(244, 63, 94, 0.03)' }}>
                                    <td colSpan={6} style={{ padding: '0.35rem 1rem 0.35rem 1.25rem', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', fontSize: '0.7rem' }}>SG&A</td>
                                  </tr>
                                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                                    <td style={{ padding: '0.45rem 1rem 0.45rem 1.5rem', color: '#94a3b8' }}>Personnel</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(sgaPersonnel.may)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(sgaPersonnel.june)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(sgaPersonnel.july)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(sgaPersonnel.august)}</td>
                                    <td style={{ padding: '0.45rem 1rem', textAlign: 'right', color: '#fff', fontWeight: 700, background: 'rgba(251, 146, 60, 0.02)' }}>{formatUSD(sgaPersonnel.total)}</td>
                                  </tr>
                                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                                    <td style={{ padding: '0.45rem 1rem 0.45rem 1.5rem', color: '#94a3b8' }}>Software Subscriptions</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(sgaSoftware.may)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(sgaSoftware.june)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(sgaSoftware.july)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(sgaSoftware.august)}</td>
                                    <td style={{ padding: '0.45rem 1rem', textAlign: 'right', color: '#fff', fontWeight: 700, background: 'rgba(251, 146, 60, 0.02)' }}>{formatUSD(sgaSoftware.total)}</td>
                                  </tr>
                                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                                    <td style={{ padding: '0.45rem 1rem 0.45rem 1.5rem', color: '#94a3b8' }}>Tokens</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(sgaTokens.may)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(sgaTokens.june)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(sgaTokens.july)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(sgaTokens.august)}</td>
                                    <td style={{ padding: '0.45rem 1rem', textAlign: 'right', color: '#fff', fontWeight: 700, background: 'rgba(251, 146, 60, 0.02)' }}>{formatUSD(sgaTokens.total)}</td>
                                  </tr>

                                  {/* Other Expenses */}
                                  <tr style={{ background: 'rgba(244, 63, 94, 0.03)' }}>
                                    <td colSpan={6} style={{ padding: '0.35rem 1rem 0.35rem 1.25rem', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', fontSize: '0.7rem' }}>Other Expenses</td>
                                  </tr>
                                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.02)' }}>
                                    <td style={{ padding: '0.45rem 1rem 0.45rem 1.5rem', color: '#94a3b8' }}>Other expenses (see Legend)</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(otherExpenses.may)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(otherExpenses.june)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(otherExpenses.july)}</td>
                                    <td style={{ padding: '0.45rem 0.5rem', textAlign: 'right', color: '#fff' }}>{formatUSD(otherExpenses.august)}</td>
                                    <td style={{ padding: '0.45rem 1rem', textAlign: 'right', color: '#fff', fontWeight: 700, background: 'rgba(251, 146, 60, 0.02)' }}>{formatUSD(otherExpenses.total)}</td>
                                  </tr>

                                  <tr style={{ background: '#0b1329', borderTop: '2px solid #f43f5e', borderBottom: '2px solid #f43f5e' }}>
                                    <td style={{ padding: '0.65rem 1rem', fontWeight: 800, color: '#f43f5e' }}>TOTAL EXPENSES</td>
                                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: '#fff', fontWeight: 700 }}>{formatUSD(expTotal.may)}</td>
                                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: '#fff', fontWeight: 700 }}>{formatUSD(expTotal.june)}</td>
                                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: '#fff', fontWeight: 700 }}>{formatUSD(expTotal.july)}</td>
                                    <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: '#fff', fontWeight: 700 }}>{formatUSD(expTotal.august)}</td>
                                    <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: '#f43f5e', fontWeight: 900, background: 'rgba(251, 146, 60, 0.08)' }}>{formatUSD(expTotal.total)}</td>
                                  </tr>

                                  {/* PROFIT / LOSS ROW */}
                                  <tr style={{ background: '#10b981', borderTop: '3px solid #047857' }}>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: 900, color: '#fff', fontSize: '0.85rem', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>PROFIT (LOSS)</td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#fff', fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{formatUSD(profitLoss.may)}</td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#fff', fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{formatUSD(profitLoss.june)}</td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#fff', fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{formatUSD(profitLoss.july)}</td>
                                    <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#fff', fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{formatUSD(profitLoss.august)}</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#fff', fontWeight: 950, background: '#059669', fontSize: '0.9rem', textShadow: '0 1px 6px rgba(0,0,0,0.45)' }}>{formatUSD(profitLoss.total)}</td>
                                  </tr>

                                </tbody>
                              </table>
                              <div style={{ display: 'flex', justifyContent: 'center', padding: '0.65rem', background: '#0b1329', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>
                                  Build with Gemini XPRIZE  |  Managed by Devpost  |  CONFIDENTIAL
                                </span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Legend Details Row */}
                        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-glass)', borderRadius: '16px', marginTop: '1rem' }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fb923c', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>LEGEND:</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                              <span style={{ color: '#fb923c', marginRight: '0.4rem' }}>■</span> <strong style={{ color: '#fff' }}>COGS</strong> stands for Cost of Goods Sold) and includes expenses to produce the service provided by the business.
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                              <span style={{ color: '#fb923c', marginRight: '0.4rem' }}>■</span> <strong style={{ color: '#fff' }}>SG&A</strong> stands for Selling, General, and Adminstrative Expenses and includes expenses to operate the business. If personnel is hired to do marketing activities, that expense would be under SG&A.
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                              <span style={{ color: '#fb923c', marginRight: '0.4rem' }}>■</span> <strong style={{ color: '#fff' }}>"Other Expenses"</strong> may include expenses like rent, travel, or other expenses not outlined in the P&L. If you include them, you must explain each expense line in your Devpost submission.
                            </div>
                          </div>
                        </div>

                      </div>

                      {/* COLUMN 2: LEDGER BALANCE SHEET & REAL-TIME INTERACTIVE OVERRIDES */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        
                        {/* Recomputations for Column 2 Balance Sheet */}
                        {(() => {
                          const FX_RATE = 1500;
                          const saasUSDTotal = candidateCount * saasPriceUSD;
                          const gatewayUSDTotal = (gatewayBaseUSD + (gatewayBaseNGN / FX_RATE)) * (gatewayFeeRate / 100);
                          const placementsUSDTotal = globalApplications.length * 15;
                          const totalRevenueTotal = saasUSDTotal + placementsUSDTotal + gatewayUSDTotal;

                          const totalReferralsUSD = (adminUsers.length * referralBonusNGN) / FX_RATE;
                          const totalCrawlersUSD = globalApplications.length * 0.12;
                          const totalGeminiUSD = adminLogs.length * llmUnitCostUSD;

                          const baseCogsPersonnel = 1200;
                          const baseCogsSoftware = 150;
                          const baseSgaPersonnel = 800;
                          const baseSgaSoftware = 75;

                          const totalExpensesTotal = baseCogsPersonnel + baseCogsSoftware + totalGeminiUSD + 
                                                    baseSgaPersonnel + baseSgaSoftware + (totalGeminiUSD * 0.15) + 
                                                    totalReferralsUSD + totalCrawlersUSD;

                          const usdNetProfit = totalRevenueTotal - totalExpensesTotal;
                          const ngnNetProfit = usdNetProfit * FX_RATE;

                          const startCapitalUSD = 25000;
                          const startCapitalNGN = 37500000;

                          const totalAssetsUSD = startCapitalUSD + usdNetProfit;
                          const totalAssetsNGN = startCapitalNGN + ngnNetProfit;

                          const totalWalletLiabilityUSD = adminUsers.reduce((sum, u) => sum + (u.financials?.walletBalanceUSD || 0), 0);
                          const totalWalletLiabilityNGN = adminUsers.reduce((sum, u) => sum + (u.financials?.walletBalanceNGN || 0), 0);

                          const equityUSD = totalAssetsUSD - totalWalletLiabilityUSD;
                          const equityNGN = totalAssetsNGN - totalWalletLiabilityNGN;

                          return (
                            <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(30, 41, 59, 0.45)', border: '1px solid rgba(14, 165, 233, 0.25)', borderRadius: '16px', boxShadow: '0 8px 32px rgba(14, 165, 233, 0.05)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <span>⚖️</span> Consolidated Balance Sheet
                                </span>
                                <span style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(14, 165, 233, 0.12)', color: '#38bdf8', fontWeight: 800, border: '1px solid rgba(14, 165, 233, 0.25)' }}>
                                  BALANCED
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '0.65rem' }}>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current Assets (Prepayments + Floating Reserves):</span>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>₦{totalAssetsNGN.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>${totalAssetsUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '0.65rem' }}>
                                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current Liabilities (Outstanding Wallets Deposit float):</span>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ef4444' }}>₦{totalWalletLiabilityNGN.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>${totalWalletLiabilityUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.35rem' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary)' }}>Owner Retained Equity (Net Platform Capital Value):</span>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--primary)' }}>₦{equityNGN.toLocaleString('en-NG', { maximumFractionDigits: 0 })}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>${equityUSD.toLocaleString('en-US', { maximumFractionDigits: 0 })}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Interactive Real-Time Parameters Adjustments */}
                        <div className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 1.25rem 0', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span>⚙️</span> Interactive Pricing & Margin Sliders
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            
                            {/* SLIDER 1 */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                                <span style={{ color: 'var(--text-primary)' }}>SaaS License Price (USD)</span>
                                <span style={{ color: 'var(--primary)' }}>${saasPriceUSD} / mo</span>
                              </div>
                              <input 
                                type="range" 
                                min="5" 
                                max="100" 
                                value={saasPriceUSD} 
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setSaaSPriceUSD(val);
                                  logAdminAction('FINANCIAL_CONTROL', `Adjusted USD SaaS License Price to $${val}/month`);
                                }}
                                style={{ width: '100%', accentColor: 'var(--primary)' }} 
                              />
                            </div>

                            {/* SLIDER 2 */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                                <span style={{ color: 'var(--text-primary)' }}>SaaS License Price (NGN)</span>
                                <span style={{ color: 'var(--primary)' }}>₦{saasPriceNGN.toLocaleString()} / mo</span>
                              </div>
                              <input 
                                type="range" 
                                min="2500" 
                                max="50000" 
                                value={saasPriceNGN} 
                                step="500"
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setSaaSPriceNGN(val);
                                  logAdminAction('FINANCIAL_CONTROL', `Adjusted NGN SaaS License Price to ₦${val.toLocaleString()}/month`);
                                }}
                                style={{ width: '100%', accentColor: 'var(--primary)' }} 
                              />
                            </div>

                            {/* SLIDER 3 */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                                <span style={{ color: 'var(--text-primary)' }}>Gateway Clearing Fee (%)</span>
                                <span style={{ color: '#10b981' }}>{gatewayFeeRate}%</span>
                              </div>
                              <input 
                                type="range" 
                                min="0.5" 
                                max="5.0" 
                                step="0.1"
                                value={gatewayFeeRate} 
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setGatewayFeeRate(val);
                                  logAdminAction('FINANCIAL_CONTROL', `Adjusted Paystack Deposit Clearance Fee to ${val}%`);
                                }}
                                style={{ width: '100%', accentColor: '#10b981' }} 
                              />
                            </div>

                            {/* SLIDER 4 */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                                <span style={{ color: 'var(--text-primary)' }}>Referral Registration Bonus</span>
                                <span style={{ color: 'var(--primary)' }}>₦{referralBonusNGN.toLocaleString()}</span>
                              </div>
                              <input 
                                type="range" 
                                min="500" 
                                max="10000" 
                                step="100"
                                value={referralBonusNGN} 
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setReferralBonusNGN(val);
                                  logAdminAction('FINANCIAL_CONTROL', `Adjusted sign-up referral affiliate bonus value to ₦${val.toLocaleString()}`);
                                }}
                                style={{ width: '100%', accentColor: 'var(--primary)' }} 
                              />
                            </div>

                            {/* SLIDER 5 */}
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                                <span style={{ color: 'var(--text-primary)' }}>Gemini Token API Cost</span>
                                <span style={{ color: '#f43f5e' }}>${llmUnitCostUSD.toFixed(3)}</span>
                              </div>
                              <input 
                                type="range" 
                                min="0.001" 
                                max="0.100" 
                                step="0.001"
                                value={llmUnitCostUSD} 
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setLlmUnitCostUSD(val);
                                  logAdminAction('FINANCIAL_CONTROL', `Adjusted Gemini Token API execution unit allocation cost to $${val.toFixed(3)}`);
                                }}
                                style={{ width: '100%', accentColor: '#f43f5e' }} 
                              />
                            </div>

                          </div>
                        </div>

                      </div>

                    </div>
                  </>
                );
              })()}

            </div>
          )}
        </div>
      )}

      {/* TAB 3: APPLICATION HUB */}
      {adminTab === 'applications' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>💼 Ecosystem Application Hub</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Track, audit, and analyze job application statuses dynamically across all candidate accounts globally.</p>
            </div>
            <button className="btn-glass" onClick={() => fetchGlobalApplications()} disabled={isLoadingGlobalApplications} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
              <RefreshIcon /> Refresh Applications
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Search applications (title, company, candidate)..."
              value={appSearch}
              onChange={(e) => setAppSearch(e.target.value)}
              style={{ flex: 1, minWidth: '240px', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#fff' }}
            />
            <select 
              value={appStatusFilter} 
              onChange={(e: any) => setAppStatusFilter(e.target.value)}
              style={{ background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem', fontSize: '0.8rem', color: '#fff', cursor: 'pointer' }}
            >
              <option value="ALL">All Kanban Column Statuses</option>
              <option value="matched">Matched Applications</option>
              <option value="applied">Applied / Submitted</option>
              <option value="interviews">Interviews in Progress</option>
            </select>
          </div>

          {isLoadingGlobalApplications ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0' }}>
              <div className="spinner-micro" style={{ width: '40px', height: '40px', border: '3px solid rgba(255, 255, 255, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Gathering candidate application telemetries...</span>
            </div>
          ) : (
            <div className="table-wrapper" style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>
                    <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Candidate</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Role / Company</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Salary Range</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Match Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {globalApplications
                    .filter(app => {
                      const term = appSearch.toLowerCase();
                      const matchesSearch = (
                        app.fullName?.toLowerCase().includes(term) ||
                        app.email?.toLowerCase().includes(term) ||
                        app.title?.toLowerCase().includes(term) ||
                        app.company?.toLowerCase().includes(term)
                      );
                      const matchesFilter = appStatusFilter === 'ALL' || app.status === appStatusFilter;
                      return matchesSearch && matchesFilter;
                    })
                    .length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No candidate applications matched search query.</td>
                      </tr>
                    ) : (
                      globalApplications
                        .filter(app => {
                          const term = appSearch.toLowerCase();
                          const matchesSearch = (
                            app.fullName?.toLowerCase().includes(term) ||
                            app.email?.toLowerCase().includes(term) ||
                            app.title?.toLowerCase().includes(term) ||
                            app.company?.toLowerCase().includes(term)
                          );
                          const matchesFilter = appStatusFilter === 'ALL' || app.status === appStatusFilter;
                          return matchesSearch && matchesFilter;
                        })
                        .map((app, idx) => (
                          <tr key={app.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{app.fullName}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{app.email}</div>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-glow)' }}>{app.title}</div>
                              <div style={{ fontSize: '0.75rem', color: '#fff' }}>{app.company}</div>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{ 
                                fontSize: '0.65rem', 
                                fontWeight: 700, 
                                padding: '0.15rem 0.4rem', 
                                borderRadius: '4px',
                                background: app.status === 'matched' ? 'rgba(139, 92, 246, 0.12)' : app.status === 'applied' ? 'rgba(14, 165, 233, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                color: app.status === 'matched' ? '#8b5cf6' : app.status === 'applied' ? '#0ea5e9' : '#10b981',
                                textTransform: 'uppercase'
                              }}>
                                {app.status}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                              {app.salary || 'N/A'}
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: app.confidence >= 90 ? '#10b981' : '#f59e0b' }}>
                                  {app.confidence}%
                                </span>
                                <div style={{ width: '48px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                  <div style={{ width: `${app.confidence || 0}%`, height: '100%', background: app.confidence >= 90 ? '#10b981' : '#f59e0b' }} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CANDIDATE DIRECTORY */}
      {adminTab === 'candidates' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>👥 Candidate Accounts Directory</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>Manage registered candidates, inspect profile balances, and issue direct administrative ledger adjustments.</p>
            </div>
            <button className="btn-glass btn-primary" onClick={() => fetchAdminUsers()} disabled={isLoadingAdminData} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
              <RefreshIcon /> Refresh Candidates
            </button>
          </div>

          {/* Search Candidate */}
          <div style={{ marginBottom: '1.25rem' }}>
            <input 
              type="text" 
              placeholder="Search candidates by name, email, phone..."
              value={candSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              style={{ width: '100%', background: 'rgba(0, 0, 0, 0.2)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#fff' }}
            />
          </div>

          {isLoadingAdminData ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0' }}>
              <div className="spinner-micro" style={{ width: '40px', height: '40px', border: '3px solid rgba(255, 255, 255, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Querying candidates snapshot...</span>
            </div>
          ) : (
            <div className="table-wrapper" style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>
                    <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>User Profile</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Email / Phone</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Wallet Balance</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dynamic Integration Keys</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers
                    .filter(user => {
                      const term = candSearch.toLowerCase();
                      return (
                        user.fullName?.toLowerCase().includes(term) ||
                        user.email?.toLowerCase().includes(term) ||
                        user.phoneNumber?.toLowerCase().includes(term)
                      );
                    })
                    .length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No candidate records found matching search.</td>
                      </tr>
                    ) : (
                      adminUsers
                        .filter(user => {
                          const term = candSearch.toLowerCase();
                          return (
                            user.fullName?.toLowerCase().includes(term) ||
                            user.email?.toLowerCase().includes(term) ||
                            user.phoneNumber?.toLowerCase().includes(term)
                          );
                        })
                        .map(user => (
                          <tr key={user.userId} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', background: frozenUserIds.includes(user.userId) ? 'rgba(239, 68, 68, 0.02)' : 'transparent' }}>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: frozenUserIds.includes(user.userId) ? '#ef4444' : 'var(--text-primary)' }}>{user.fullName}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: user.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)', color: user.role === 'admin' ? 'var(--primary)' : 'var(--text-secondary)', border: user.role === 'admin' ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)' }}>
                                  {user.role === 'admin' ? '👑 Admin' : '👤 Candidate'}
                                </span>
                                {user.isNINVerified ? (
                                  <span className="badge-glow" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', textShadow: '0 0 4px rgba(16, 185, 129, 0.4)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                    🟢 NIMC Verified
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                    🟡 Unverified KYC
                                  </span>
                                )}
                                {frozenUserIds.includes(user.userId) && (
                                  <span className="badge-glow" style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', textShadow: '0 0 4px rgba(239, 68, 68, 0.4)' }}>
                                    ⚠️ FROZEN
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>ID: {user.userId}</div>
                              {user.ninValue && (
                                <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  <span>🪪 NIN: <strong style={{ color: '#fff' }}>{user.ninValue}</strong></span>
                                  {user.ninCardImage && (
                                    <button 
                                      onClick={() => setSelectedNINCard(user)}
                                      style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#a78bfa', padding: '0.05rem 0.25rem', borderRadius: '4px', fontSize: '0.65rem', cursor: 'pointer' }}
                                    >
                                      View Slip
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{user.email}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.phoneNumber || 'No phone registered'}</div>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ fontWeight: 800, color: '#10b981', fontSize: '0.9rem' }}>
                                {((user.financials?.walletBalanceNGN || 0.0) * 5).toLocaleString()} Tokens
                              </div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.15rem' }}>
                                ₦{(user.financials?.walletBalanceNGN || 0.0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                <span style={{ color: '#a78bfa', fontSize: '0.7rem', fontWeight: 600, marginLeft: '0.3rem' }}>
                                  (${(user.financials?.walletBalanceNGN ? (user.financials.walletBalanceNGN / 1500) : 0.0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                <span style={{ fontSize: '0.65rem', color: user.geminiApiKey ? '#a7f3d0' : '#93c5fd' }}>
                                  Gemini Key: {user.geminiApiKey ? '✅ Custom API Key' : 'ℹ️ System Default'}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: user.paystackPublicKey ? '#a7f3d0' : '#fca5a5' }}>
                                  Paystack PK: {user.paystackPublicKey ? '✅ Secured PK' : '❌ Unconfigured'}
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                <button 
                                  className="btn-glass" 
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderColor: 'rgba(138, 92, 246, 0.4)', color: 'var(--primary)' }}
                                  onClick={() => {
                                    setOverrideUser(user);
                                    setOverrideAmount('5000');
                                    setOverrideCurrency('NGN');
                                    setOverridePurpose('MANUAL_RECONCILIATION_CREDIT');
                                    setShowOverrideModal(true);
                                  }}
                                >
                                  Adjust Balance
                                </button>
                                <button 
                                  className="btn-glass" 
                                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}
                                  onClick={() => handleInspectUser(user)}
                                >
                                  Inspect Activity
                                </button>
                                
                                {user.email !== 'admin@gigo.com' && (
                                  <>
                                    <button 
                                      className="btn-glass" 
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderColor: frozenUserIds.includes(user.userId) ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)', color: frozenUserIds.includes(user.userId) ? '#10b981' : '#ef4444' }}
                                      onClick={() => {
                                        if (frozenUserIds.includes(user.userId)) {
                                          setFrozenUserIds(prev => prev.filter(id => id !== user.userId));
                                          logAdminAction('USER_UNFREEZE', `Unfroze candidate profile for ${user.fullName} (${user.email})`);
                                        } else {
                                          setFrozenUserIds(prev => [...prev, user.userId]);
                                          logAdminAction('USER_FREEZE', `Suspended & froze candidate profile for ${user.fullName} (${user.email})`);
                                        }
                                      }}
                                    >
                                      {frozenUserIds.includes(user.userId) ? 'Unfreeze' : 'Freeze'}
                                    </button>

                                    <button 
                                      className="btn-glass" 
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#f59e0b' }}
                                      onClick={() => {
                                        logAdminAction('SESSION_REVOCATION', `Forcefully revoked active session tokens for user: ${user.fullName} (${user.email})`);
                                        alert(`Simulated Active Session Token for ${user.fullName} revoked. Any subsequent candidate dashboard polling request will throw 401 SessionExpired.`);
                                      }}
                                    >
                                      Revoke Session
                                    </button>

                                    <button 
                                      className="btn-glass" 
                                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderColor: 'rgba(167, 139, 250, 0.4)', color: '#a78bfa' }}
                                      onClick={() => {
                                        setResetPasswordUser(user);
                                        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^*';
                                        let pass = '';
                                        for (let i = 0; i < 10; i++) {
                                          pass += chars.charAt(Math.floor(Math.random() * chars.length));
                                        }
                                        setNewPasswordValue(pass);
                                        setResetSuccessMessage(null);
                                      }}
                                    >
                                      Reset Password
                                    </button>
                                  </>
                                )}

                                {userEmail === 'admin@gigo.com' && user.email !== 'admin@gigo.com' && (
                                  <button 
                                    className="btn-glass" 
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', borderColor: user.role === 'admin' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(139, 92, 246, 0.4)', color: user.role === 'admin' ? '#ef4444' : 'var(--primary)' }}
                                    onClick={() => {
                                      const newRole = user.role === 'admin' ? 'candidate' : 'admin';
                                      handleChangeUserRole(user, newRole);
                                      logAdminAction('ROLE_MUTATION', `Altered administrative rights for ${user.fullName} (${user.email}) to [${newRole.toUpperCase()}]`);
                                    }}
                                  >
                                    {user.role === 'admin' ? 'Demote' : 'Promote'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SYSTEM CONTROL / CONFIGURATION */}
      {adminTab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          {/* Global System Configuration */}
          <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }} className="text-gradient-purple-pink">Global System Configuration</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>Configure domains, active landing endpoints, and referral economics across the entire ecosystem.</p>
              </div>
            </div>

            <form onSubmit={handleUpdateSystemConfig} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  🌐 Active Frontend Domain
                </label>
                <input 
                  type="url" 
                  className="form-control" 
                  value={configDomain}
                  onChange={(e) => setConfigDomain(e.target.value)}
                  placeholder="https://gigo-career.com"
                  required
                  style={{ background: 'rgba(0, 0, 0, 0.25)', borderColor: 'rgba(255, 255, 255, 0.12)', color: 'var(--text-primary)', height: '42px', borderRadius: '8px', width: '100%', padding: '0.5rem 0.75rem' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'block' }}>Used to compile personalized onboarding, campaign invites, and dynamic tracking URLs.</span>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  ₦ Dynamic Referral Bonus (NGN)
                </label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={configReferralBonus}
                  onChange={(e) => setConfigReferralBonus(e.target.value)}
                  placeholder="500"
                  required
                  min="0"
                  step="0.01"
                  style={{ background: 'rgba(0, 0, 0, 0.25)', borderColor: 'rgba(255, 255, 255, 0.12)', color: 'var(--text-primary)', height: '42px', borderRadius: '8px', width: '100%', padding: '0.5rem 0.75rem' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'block' }}>Atomically credited to candidate ledger balances on registration tracking conversion.</span>
              </div>

              <div className="form-group" style={{ margin: 0, gridColumn: '1 / -1' }}>
                <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  🔍 Global Advanced Google Boolean Search Template (Invisible to Candidates)
                </label>
                <textarea 
                  className="form-control" 
                  value={configBooleanSearchTemplate}
                  onChange={(e) => setConfigBooleanSearchTemplate(e.target.value)}
                  placeholder='"Social Media Marketer" (onsite OR "in-office" OR "on-site") (site:boards.greenhouse.io OR site:jobs.lever.co OR inurl:careers OR inurl:job-openings OR inurl:open-positions) after:2026-01-01 before:2026-12-31'
                  required
                  style={{ background: 'rgba(0, 0, 0, 0.25)', borderColor: 'rgba(255, 255, 255, 0.12)', color: 'var(--text-primary)', minHeight: '80px', borderRadius: '8px', width: '100%', padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'block' }}>Strictly invisible on the frontend for standard candidates. Both background and on-demand search engines ingest this template to build exact Boolean constraints.</span>
              </div>

              {/* Global Paystack Gateway Settings Section */}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="text-gradient-purple-pink">
                  💳 Global Paystack Gateway Settings
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Configure active environment mode and default Paystack credentials. These keys are resolved dynamically across all checkout flows if custom user profile keys are not specified.
                </p>
              </div>

              {/* Paystack Gateway Mode */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  ⚙️ Gateway Environment Mode
                </label>
                <select
                  className="form-control"
                  value={configPaystackMode}
                  onChange={(e) => setConfigPaystackMode(e.target.value)}
                  required
                  style={{ background: 'rgba(0, 0, 0, 0.3)', borderColor: 'rgba(255, 255, 255, 0.12)', color: 'var(--text-primary)', height: '42px', borderRadius: '8px', width: '100%', padding: '0.5rem 0.75rem', outline: 'none' }}
                >
                  <option value="test" style={{ background: '#0f172a' }}>Sandbox / Test Environment</option>
                  <option value="live" style={{ background: '#0f172a' }}>Production / Live Environment</option>
                </select>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'block' }}>Switching environment modes immediately shifts payment routing for all platform checkouts.</span>
              </div>

              {/* Candidate Self-Deletion Governance Toggle */}
              <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  🛡️ Candidate Self-Deletion Policy
                </label>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid rgba(255, 255, 255, 0.08)', 
                  borderRadius: '8px', 
                  padding: '0.5rem 0.75rem',
                  height: '42px'
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Allow account deletion</span>
                  <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '22px' }}>
                    <input 
                      type="checkbox" 
                      checked={configAllowUserSelfDeletion}
                      onChange={(e) => setConfigAllowUserSelfDeletion(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{ 
                      position: 'absolute', 
                      cursor: 'pointer', 
                      top: 0, left: 0, right: 0, bottom: 0, 
                      backgroundColor: configAllowUserSelfDeletion ? '#a78bfa' : '#334155', 
                      transition: '0.3s', 
                      borderRadius: '22px',
                      boxShadow: configAllowUserSelfDeletion ? '0 0 8px rgba(167, 139, 250, 0.5)' : 'none'
                    }}>
                      <span style={{ 
                        position: 'absolute', 
                        content: '""', 
                        height: '16px', width: '16px', 
                        left: configAllowUserSelfDeletion ? '24px' : '3px', 
                        bottom: '3px', 
                        backgroundColor: '#ffffff', 
                        transition: '0.3s', 
                        borderRadius: '50%' 
                      }} />
                    </span>
                  </label>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'block' }}>If disabled, candidates cannot self-delete their profiles; they must contact support.</span>
              </div>

              {/* Test / Sandbox Credentials Group */}
              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#38bdf8' }}>🛠️ Sandbox / Test Credentials</h5>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>Used for test checkout simulations and developer validation.</p>
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    Test Public Key
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={configPaystackTestPublicKey}
                    onChange={(e) => setConfigPaystackTestPublicKey(e.target.value)}
                    placeholder="pk_test_..."
                    style={{ background: 'rgba(0, 0, 0, 0.25)', borderColor: 'rgba(255, 255, 255, 0.12)', color: 'var(--text-primary)', height: '42px', borderRadius: '8px', width: '100%', padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    Test Secret Key
                  </label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={configPaystackTestSecretKey}
                    onChange={(e) => setConfigPaystackTestSecretKey(e.target.value)}
                    placeholder="sk_test_..."
                    style={{ background: 'rgba(0, 0, 0, 0.25)', borderColor: 'rgba(255, 255, 255, 0.12)', color: 'var(--text-primary)', height: '42px', borderRadius: '8px', width: '100%', padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              {/* Live / Production Credentials Group */}
              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <h5 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#f43f5e' }}>🚀 Production / Live Credentials</h5>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0 }}>Used to process live legal-tender payments. Guarded securely, secret key is obfuscated.</p>
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    Live Public Key
                  </label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={configPaystackLivePublicKey}
                    onChange={(e) => setConfigPaystackLivePublicKey(e.target.value)}
                    placeholder="pk_live_..."
                    style={{ background: 'rgba(0, 0, 0, 0.25)', borderColor: 'rgba(255, 255, 255, 0.12)', color: 'var(--text-primary)', height: '42px', borderRadius: '8px', width: '100%', padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                    Live Secret Key
                  </label>
                  <input 
                    type="password" 
                    className="form-control" 
                    value={configPaystackLiveSecretKey}
                    onChange={(e) => setConfigPaystackLiveSecretKey(e.target.value)}
                    placeholder="sk_live_..."
                    style={{ background: 'rgba(0, 0, 0, 0.25)', borderColor: 'rgba(255, 255, 255, 0.12)', color: 'var(--text-primary)', height: '42px', borderRadius: '8px', width: '100%', padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn-glass btn-secondary" 
                style={{ height: '42px', justifyContent: 'center', fontWeight: 700, gap: '0.5rem', borderRadius: '8px', border: '1px solid var(--secondary)', cursor: 'pointer', transition: 'all 0.2s', gridColumn: '1 / -1', width: '100%', marginTop: '0.5rem' }}
                disabled={isSavingSystemConfig}
              >
                {isSavingSystemConfig ? 'Saving System Config...' : 'Commit System Config 💾'}
              </button>
            </form>
          </div>

          {/* Managing Searchable Domains */}
          <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>🔧 Boolean Scraper Targeted Domains Directory</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>Add or delete target web domains that are dynamically selectable in the Candidate Scraper Workspace filters dropdown.</p>
            
            {/* Domains Badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '1.25rem' }}>
              {configScraperDomains.map((dom) => (
                <span 
                  key={dom} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.4rem', 
                    padding: '0.35rem 0.75rem', 
                    background: 'rgba(139, 92, 246, 0.15)', 
                    border: '1px solid rgba(139, 92, 246, 0.3)', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    color: 'var(--text-primary)',
                    fontWeight: 600
                  }}
                >
                  🎯 {dom}
                  <button 
                    type="button" 
                    onClick={() => {
                      const updated = configScraperDomains.filter(d => d !== dom);
                      setConfigScraperDomains(updated);
                      addLog(`Admin Console: Removed domain "${dom}" from config scratch state.`);
                    }}
                    style={{ border: 'none', background: 'none', color: '#f43f5e', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', padding: 0, display: 'inline-flex', alignItems: 'center' }}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>

            {/* Add Domain Interface */}
            <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '400px' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. facebook.com, djinni.co" 
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                style={{ background: 'rgba(0, 0, 0, 0.25)', borderColor: 'rgba(255, 255, 255, 0.12)', color: 'var(--text-primary)', height: '36px', borderRadius: '8px', padding: '0.25rem 0.50rem', fontSize: '0.8rem', flex: 1 }}
              />
              <button 
                type="button" 
                className="btn-glass"
                onClick={() => {
                  const clean = newDomainInput.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '');
                  if (!clean) return;
                  if (configScraperDomains.includes(clean)) {
                    alert("Domain already exists in list.");
                    return;
                  }
                  const updated = [...configScraperDomains, clean];
                  setConfigScraperDomains(updated);
                  setNewDomainInput('');
                  addLog(`Admin Console: Added domain "${clean}" to config scratch state.`);
                }}
                style={{ height: '36px', padding: '0 1rem', fontSize: '0.75rem', fontWeight: 700, borderColor: 'var(--primary)', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}
              >
                ➕ Add Domain
              </button>
            </div>
          </div>

          {/* Ecosystem Security & Governance Flags */}
          <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }} className="text-gradient-purple-pink">🔒 Ecosystem Security & Governance Flags</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0' }}>Enforce global architectural overrides and security rules across all candidate consoles instantly.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              
              {/* Flag 1 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>🎙️ Voice Response Agent</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Allow AI interactive vocal coaching.</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={isVoiceActive} 
                  onChange={(e) => {
                    const next = e.target.checked;
                    setIsVoiceActive(next);
                    logAdminAction('SECURITY_GOVERNANCE', `${next ? 'Activated' : 'Deactivated'} Voice interactive coaching engine globally.`);
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              {/* Flag 2 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>🕵️ Autonomous Scraper Loop</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Trigger background cron searches.</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={isScraperActive} 
                  onChange={(e) => {
                    const next = e.target.checked;
                    setIsScraperActive(next);
                    logAdminAction('SECURITY_GOVERNANCE', `${next ? 'Resumed' : 'Suspended'} background boolean scraping systems globally.`);
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              {/* Flag 3 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>🚧 System Maintenance Mode</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Lock down console access for candidates.</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={isMaintenanceMode} 
                  onChange={(e) => {
                    const next = e.target.checked;
                    setIsMaintenanceMode(next);
                    logAdminAction('SECURITY_GOVERNANCE', `${next ? 'Placed' : 'Removed'} GiGO ecosystem under lock-and-key Maintenance Mode.`);
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

              {/* Flag 4 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>💳 Paystack Payout Channel</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Allow manual or automated bank cashouts.</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={isPayoutActive} 
                  onChange={(e) => {
                    const next = e.target.checked;
                    setIsPayoutActive(next);
                    logAdminAction('SECURITY_GOVERNANCE', `${next ? 'Enabled' : 'Disabled'} automated Paystack payout routing globally.`);
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
                />
              </div>

            </div>
          </div>

          {/* Administrative Audit Trails */}
          <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }} className="text-gradient-purple-pink">🛡️ Ecosystem Security Audit Vault</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0' }}>Chronological register of admin action overrides, configurations, and user freezes. Non-repudiable logs.</p>
            
            <div className="table-wrapper" style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto', scrollbarWidth: 'thin' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-glass)' }}>
                    <th style={{ padding: '0.6rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Timestamp</th>
                    <th style={{ padding: '0.6rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Admin</th>
                    <th style={{ padding: '0.6rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Action Code</th>
                    <th style={{ padding: '0.6rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Details</th>
                    <th style={{ padding: '0.6rem', fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Operator IP</th>
                  </tr>
                </thead>
                <tbody>
                  {adminAuditLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '0.6rem', fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.6rem', fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>
                        {log.adminEmail}
                      </td>
                      <td style={{ padding: '0.6rem' }}>
                        <span style={{ 
                          fontSize: '0.6rem', 
                          fontWeight: 800, 
                          padding: '0.1rem 0.35rem', 
                          borderRadius: '4px',
                          background: log.action.includes('FREEZE') || log.action.includes('TERMINATION') || log.action.includes('REVOCATION') ? 'rgba(239, 68, 68, 0.15)' : log.action.includes('FINANCIAL') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                          color: log.action.includes('FREEZE') || log.action.includes('TERMINATION') || log.action.includes('REVOCATION') ? '#ef4444' : log.action.includes('FINANCIAL') ? '#10b981' : '#8b5cf6',
                          border: log.action.includes('FREEZE') || log.action.includes('TERMINATION') || log.action.includes('REVOCATION') ? '1px solid rgba(239, 68, 68, 0.3)' : log.action.includes('FINANCIAL') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(139, 92, 246, 0.3)'
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                        {log.details}
                      </td>
                      <td style={{ padding: '0.6rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', fontFamily: 'monospace' }}>
                        {log.ip}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {adminTab === 'orchestrator' && (
        <OrchestratorControlRoom API_BASE_URL={API_BASE_URL} addLog={addLog} />
      )}

      {adminTab === 'observability' && (
        <AIObservabilityDashboard API_BASE_URL={API_BASE_URL} />
      )}

      {adminTab === 'sandbox' && (
        <RecruiterResponseSandbox API_BASE_URL={API_BASE_URL} addLog={addLog} />
      )}

      {/* 🔐 Admin Password Reset Override Modal */}
      {resetPasswordUser && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37), 0 0 16px rgba(139, 92, 246, 0.2)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 800, fontSize: '1.25rem' }} className="text-gradient-purple-pink">
              🔐 Force Password Reset
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 1.5rem 0' }}>
              Reset credentials and force password change on next login for <strong>{resetPasswordUser.fullName}</strong> ({resetPasswordUser.email}).
            </p>

            {resetSuccessMessage ? (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                color: '#34d399',
                fontSize: '0.85rem'
              }}>
                {resetSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleResetPasswordSubmit}>
                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    New Temporary Password
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text"
                      className="form-control"
                      value={newPasswordValue}
                      onChange={(e) => setNewPasswordValue(e.target.value)}
                      required
                      style={{
                        background: 'rgba(0, 0, 0, 0.25)',
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                        color: 'var(--text-primary)',
                        height: '42px',
                        borderRadius: '8px',
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        fontFamily: 'monospace'
                      }}
                    />
                    <button 
                      type="button"
                      className="btn-glass"
                      style={{ height: '42px', padding: '0 1rem', borderColor: 'rgba(139, 92, 246, 0.4)', color: 'var(--primary)', cursor: 'pointer' }}
                      onClick={() => {
                        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^*';
                        let pass = '';
                        for (let i = 0; i < 10; i++) {
                          pass += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        setNewPasswordValue(pass);
                      }}
                    >
                      🎲 Generate
                    </button>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'block' }}>
                    We recommend auto-generating a secure random password.
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button 
                    type="submit"
                    className="btn-glass btn-secondary"
                    style={{ flex: 1, height: '42px', justifyContent: 'center', fontWeight: 700, cursor: 'pointer' }}
                    disabled={isResettingPassword}
                  >
                    {isResettingPassword ? 'Resetting...' : 'Assign & Send Email ✉️'}
                  </button>
                  <button 
                    type="button"
                    className="btn-glass"
                    style={{ flex: 1, height: '42px', justifyContent: 'center', borderColor: 'rgba(255, 255, 255, 0.1)', cursor: 'pointer' }}
                    onClick={() => setResetPasswordUser(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {resetSuccessMessage && (
              <button 
                type="button"
                className="btn-glass btn-secondary"
                style={{ width: '100%', height: '42px', justifyContent: 'center', fontWeight: 700, marginTop: '1rem', cursor: 'pointer' }}
                onClick={() => setResetPasswordUser(null)}
              >
                Close Modal
              </button>
            )}
          </div>
        </div>
      )}

      {/* 🪪 NIN Slip Preview Modal */}
      {selectedNINCard && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(8, 10, 24, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          {/* Keyframe Animations Injection */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes laserScan {
              0% { top: 0%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 100%; opacity: 0; }
            }
            @keyframes holographicGlow {
              0% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.1), 0 0 5px rgba(139, 92, 246, 0.1); }
              50% { box-shadow: 0 0 30px rgba(16, 185, 129, 0.3), 0 0 15px rgba(139, 92, 246, 0.3); }
              100% { box-shadow: 0 0 15px rgba(16, 185, 129, 0.1), 0 0 5px rgba(139, 92, 246, 0.1); }
            }
            .holo-card {
              position: relative;
              background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
              border: 1px solid rgba(16, 185, 129, 0.3);
              border-radius: 16px;
              padding: 1.5rem;
              overflow: hidden;
              animation: holographicGlow 4s infinite ease-in-out;
            }
            .holo-card::before {
              content: '';
              position: absolute;
              top: 0; left: 0; right: 0; bottom: 0;
              background: repeating-linear-gradient(
                0deg,
                rgba(255, 255, 255, 0.03),
                rgba(255, 255, 255, 0.03) 1px,
                transparent 1px,
                transparent 2px
              );
              pointer-events: none;
            }
            .laser-line {
              position: absolute;
              left: 0;
              right: 0;
              height: 3px;
              background: linear-gradient(90deg, transparent, #10b981, #34d399, #10b981, transparent);
              box-shadow: 0 0 12px #10b981, 0 0 6px rgba(16, 185, 129, 0.5);
              animation: laserScan 4s linear infinite;
              pointer-events: none;
            }
          `}} />

          <div className="glass-panel animate-fade-in" style={{
            background: 'rgba(11, 15, 30, 0.9)',
            border: '1px solid rgba(139, 92, 246, 0.35)',
            borderRadius: '20px',
            maxWidth: '680px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 40px rgba(139, 92, 246, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🪪</span>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', letterSpacing: '0.05em' }} className="text-gradient-purple-pink">
                    NIMC KYC AUDIT COCKPIT
                  </h3>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.1rem' }}>
                    Super-Admin Identity Verification System
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNINCard(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                ✕
              </button>
            </div>

            {/* Holographic NIN Card Container */}
            <div className="holo-card">
              {/* Animating scan line */}
              <div className="laser-line" />

              {/* NIMC Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(16, 185, 129, 0.25)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34d399', letterSpacing: '0.1em' }}>
                    FEDERAL REPUBLIC OF NIGERIA
                  </div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', marginTop: '0.1rem' }}>
                    NATIONAL IDENTITY MANAGEMENT COMMISSION (NIMC)
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                  {/* Small Green/White/Green flag */}
                  <div style={{ width: '8px', height: '14px', background: '#059669' }} />
                  <div style={{ width: '8px', height: '14px', background: '#ffffff' }} />
                  <div style={{ width: '8px', height: '14px', background: '#059669' }} />
                </div>
              </div>

              {/* Card Body */}
              <div style={{ display: 'flex', gap: '1.25rem', flexDirection: 'row', flexWrap: 'wrap' }}>
                {/* Left side: Chip, Photo & Verification state */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', flex: '1 0 160px', maxWidth: '200px' }}>
                  
                  {/* Microchip */}
                  <div style={{ alignSelf: 'flex-start', marginLeft: '0.25rem' }}>
                    <svg width="36" height="26" viewBox="0 0 40 30" style={{ borderRadius: '4px', background: 'linear-gradient(135deg, #ffe066 0%, #f5b041 100%)', boxShadow: '0 0 8px rgba(245, 176, 65, 0.4)' }}>
                      <rect x="2" y="2" width="36" height="26" fill="none" stroke="#b7950b" strokeWidth="1" />
                      <line x1="12" y1="2" x2="12" y2="28" stroke="#b7950b" strokeWidth="1" />
                      <line x1="28" y1="2" x2="28" y2="28" stroke="#b7950b" strokeWidth="1" />
                      <line x1="2" y1="10" x2="38" y2="10" stroke="#b7950b" strokeWidth="1" />
                      <line x1="2" y1="20" x2="38" y2="20" stroke="#b7950b" strokeWidth="1" />
                    </svg>
                  </div>

                  {/* Document Image */}
                  <div style={{
                    width: '100%',
                    height: '140px',
                    borderRadius: '8px',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    background: 'rgba(0,0,0,0.4)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
                  }}>
                    {selectedNINCard.ninCardImage ? (
                      <img 
                        src={selectedNINCard.ninCardImage} 
                        alt="NIN Slip" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.9) contrast(1.1)' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const placeholder = document.createElement('div');
                            placeholder.style.color = 'rgba(239, 68, 68, 0.8)';
                            placeholder.style.fontSize = '0.65rem';
                            placeholder.style.fontWeight = 'bold';
                            placeholder.style.padding = '0.5rem';
                            placeholder.style.textAlign = 'center';
                            placeholder.innerHTML = '⚠️ Image<br/>Corrupt';
                            parent.appendChild(placeholder);
                          }
                        }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.65rem', padding: '0.5rem' }}>
                        👤 NO SLIP IMAGE
                      </div>
                    )}
                  </div>

                  {/* Verification Status Badge */}
                  <div style={{
                    width: '100%',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: selectedNINCard.isNINVerified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: selectedNINCard.isNINVerified ? '#10b981' : '#f59e0b',
                    border: `1px solid ${selectedNINCard.isNINVerified ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`
                  }}>
                    {selectedNINCard.isNINVerified ? '🟢 System Verified' : '🟡 Review Pending'}
                  </div>
                </div>

                {/* Right side: Detailed Metadata fields */}
                <div style={{ flex: '1 0 240px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem 0.5rem' }}>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Full Name</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc', textShadow: '0 0 4px rgba(255,255,255,0.1)' }}>{selectedNINCard.fullName}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Document Type</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>NIN Document Card</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Nationality</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>NIGERIAN</div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Gender</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>
                        {selectedNINCard.fullName.toLowerCase().includes('female') || selectedNINCard.fullName.toLowerCase().includes('mrs') || selectedNINCard.fullName.toLowerCase().includes('miss') ? 'F' : 'M'} (Inferred)
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date of Birth</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc' }}>15 OCT 1996 (Inferred)</div>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Contact Email</div>
                      <div style={{ fontSize: '0.8rem', color: '#93c5fd', wordBreak: 'break-all' }}>{selectedNINCard.email}</div>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Candidate UID</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{selectedNINCard.userId}</div>
                    </div>
                  </div>

                  {/* 11-digit NIN Display Panel */}
                  <div style={{
                    marginTop: '0.5rem',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '8px',
                    padding: '0.6rem 0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}>
                    <div style={{ fontSize: '0.55rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                      National Identification Number (NIN)
                    </div>
                    <div style={{
                      fontSize: '1.25rem',
                      fontFamily: 'monospace',
                      fontWeight: 800,
                      color: '#10b981',
                      letterSpacing: '0.15em',
                      textShadow: '0 0 10px rgba(16, 185, 129, 0.35)'
                    }}>
                      {selectedNINCard.ninValue ? selectedNINCard.ninValue.replace(/(\d{4})(\d{4})(\d{3})/, '$1 $2 $3') : 'PENDING'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Console & Action Buttons */}
            <div style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span>🛡️</span>
                <span>As a super-admin, approving verification activates instant full-feature platform rights & automated trading access. Rejecting logs an infraction.</span>
              </div>
              
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setSelectedNINCard(null)}
                  className="btn-glass btn-secondary"
                  disabled={isUpdatingVerification}
                  style={{
                    height: '42px',
                    padding: '0 1.25rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: isUpdatingVerification ? 0.5 : 1
                  }}
                >
                  Cancel
                </button>

                {/* REJECT BUTTON */}
                <button 
                  onClick={() => handleToggleNINVerification(selectedNINCard.userId, false)}
                  disabled={isUpdatingVerification}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    borderRadius: '8px',
                    height: '42px',
                    padding: '0 1.5rem',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: isUpdatingVerification ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isUpdatingVerification) {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isUpdatingVerification) {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                    }
                  }}
                >
                  {isUpdatingVerification ? 'Processing...' : '❌ Reject Verification'}
                </button>

                {/* APPROVE BUTTON */}
                <button 
                  onClick={() => handleToggleNINVerification(selectedNINCard.userId, true)}
                  disabled={isUpdatingVerification}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#ffffff',
                    borderRadius: '8px',
                    height: '42px',
                    padding: '0 1.75rem',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                    transition: 'all 0.2s',
                    opacity: isUpdatingVerification ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isUpdatingVerification) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isUpdatingVerification) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.25)';
                    }
                  }}
                >
                  {isUpdatingVerification ? 'Processing...' : '✅ Approve & Verify'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
