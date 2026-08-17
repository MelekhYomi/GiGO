import React, { useState, useEffect } from 'react';
import OrchestratorControlRoom from './OrchestratorControlRoom';
import AIObservabilityDashboard from './AIObservabilityDashboard';
import RecruiterResponseSandbox from './RecruiterResponseSandbox';
import JobSourcesManager from './JobSourcesManager';
import LegalDocumentsEditor from './LegalDocumentsEditor';
import WaitlistPanel from './WaitlistPanel';
import ManualPaymentAdmin from './ManualPaymentAdmin';
import AdminAccessManagement from './AdminAccessManagement';
import MailDiagnosticsPanel from './MailDiagnosticsPanel';

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
  isRelatedParty?: boolean;
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
  configAllowAlternateMailBackends: boolean;
  setConfigAllowAlternateMailBackends: (val: boolean) => void;
  configScraperIntervalMinutes: string;
  setConfigScraperIntervalMinutes: (val: string) => void;
  configMinMatchScoreThreshold: string;
  setConfigMinMatchScoreThreshold: (val: string) => void;
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
  configAllowAlternateMailBackends,
  setConfigAllowAlternateMailBackends,
  configScraperIntervalMinutes,
  setConfigScraperIntervalMinutes,
  configMinMatchScoreThreshold,
  setConfigMinMatchScoreThreshold,
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
  const [adminTab, setAdminTab] = useState<'activities' | 'financials' | 'applications' | 'candidates' | 'settings' | 'orchestrator' | 'observability' | 'sandbox' | 'jobSources'>('candidates');
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

  // Real P&L statement (backed by actual Paystack-confirmed revenue + logged
  // company expenses — no simulated/projected figures).
  const [plStatement, setPlStatement] = useState<any>(null);
  const [isLoadingPL, setIsLoadingPL] = useState<boolean>(false);
  const [companyExpenses, setCompanyExpenses] = useState<any[]>([]);
  const [newExpenseDate, setNewExpenseDate] = useState<string>('');
  const [newExpenseCategory, setNewExpenseCategory] = useState<'COGS' | 'SG&A' | 'Other'>('COGS');
  const [newExpenseSubcategory, setNewExpenseSubcategory] = useState<string>('Personnel');
  const [newExpenseAmount, setNewExpenseAmount] = useState<string>('');
  const [newExpenseDescription, setNewExpenseDescription] = useState<string>('');
  const [isSubmittingExpense, setIsSubmittingExpense] = useState<boolean>(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState<boolean>(false);
  const [syncedSheetUrl, setSyncedSheetUrl] = useState<string>('');

  const handleSyncToGoogleSheet = async (spreadsheetUrlOrId?: string) => {
    setIsSyncingSheet(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/pl-statement/sync-to-sheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: userEmail || 'admin@gigo.com', spreadsheetUrlOrId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSyncedSheetUrl(data.sheetUrl);
        logAdminAction('PL_SHEET_SYNC', `Synced real P&L statement to Google Sheet: ${data.sheetUrl}`);
        window.open(data.sheetUrl, '_blank');
      } else if (data.needsSpreadsheetId) {
        const svcRes = await fetch(`${API_BASE_URL}/api/admin/pl-statement/sheets-service-account`);
        const svcData = await svcRes.json();
        const url = prompt(
          `First-time setup: create a blank Google Sheet, share it (Editor access) with this service account email:\n\n${svcData.serviceAccountEmail || '(unable to resolve)'}\n\nThen paste the sheet's URL here:`
        );
        if (url) {
          await handleSyncToGoogleSheet(url);
          return;
        }
      } else {
        alert(data.details || data.error || "Failed to sync to Google Sheet.");
      }
    } catch (err: any) {
      alert(`Network error syncing to Google Sheet: ${err.message}`);
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const fetchPLStatement = async () => {
    setIsLoadingPL(true);
    try {
      const [plRes, expRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/pl-statement`),
        fetch(`${API_BASE_URL}/api/admin/expenses`)
      ]);
      if (plRes.ok) setPlStatement(await plRes.json());
      if (expRes.ok) setCompanyExpenses(await expRes.json());
    } catch (err) {
      console.error("Failed to fetch P&L statement:", err);
    } finally {
      setIsLoadingPL(false);
    }
  };

  useEffect(() => {
    if (financialSubTab === 'accounting') {
      fetchPLStatement();
    }
  }, [financialSubTab]);

  const handleAddExpense = async () => {
    const amountUSD = parseFloat(newExpenseAmount);
    if (!newExpenseDate || !amountUSD || amountUSD <= 0) {
      alert("Please provide a valid date and a positive amount.");
      return;
    }
    setIsSubmittingExpense(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: userEmail || 'admin@gigo.com',
          date: newExpenseDate,
          category: newExpenseCategory,
          subcategory: newExpenseSubcategory,
          amountUSD,
          description: newExpenseDescription
        })
      });
      if (res.ok) {
        setNewExpenseDate('');
        setNewExpenseAmount('');
        setNewExpenseDescription('');
        logAdminAction('EXPENSE_LOGGED', `Logged real expense: $${amountUSD} (${newExpenseCategory} / ${newExpenseSubcategory})`);
        await fetchPLStatement();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to log expense.");
      }
    } catch (err: any) {
      alert(`Network error logging expense: ${err.message}`);
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Remove this expense entry? This affects the real P&L calculation.")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/expenses/${id}?adminEmail=${encodeURIComponent(userEmail || 'admin@gigo.com')}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchPLStatement();
      }
    } catch (err) {
      console.error("Failed to delete expense:", err);
    }
  };

  // Ecosystem Security & Access Governance States
  const [frozenUserIds, setFrozenUserIds] = useState<string[]>([]);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(true);
  const [isScraperActive, setIsScraperActive] = useState<boolean>(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean>(false);
  const [isPayoutActive, setIsPayoutActive] = useState<boolean>(true);

  const candidateCount = adminUsers.filter(u => u.role !== 'admin').length;

  // Administrative Audit Trails - real, persisted server-side (admin_audit_logs
  // collection), with the real request IP captured on the backend. Previously
  // this was purely local React state seeded with fabricated example entries
  // and a Math.random()-generated fake IP on every new entry, despite being
  // labeled "Non-repudiable logs" in the UI.
  const [adminAuditLogs, setAdminAuditLogs] = useState<any[]>([]);

  const fetchAuditLog = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/audit-log`);
      if (res.ok) setAdminAuditLogs(await res.json());
    } catch (err) {
      console.error("Failed to fetch admin audit log:", err);
    }
  };

  const logAdminAction = async (action: string, details: string) => {
    addLog(`🛡️ [Audit Trail] Registered admin action: ${action} - ${details}`);
    try {
      await fetch(`${API_BASE_URL}/api/admin/audit-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail: userEmail || 'admin@gigo.com', action, details })
      });
      await fetchAuditLog();
    } catch (err) {
      console.error("Failed to persist admin audit log entry:", err);
    }
  };

  useEffect(() => {
    fetchAdminLogs();
    fetchAdminUsers();
    fetchAuditLog();
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

  const selectAdminTab = (tab: 'activities' | 'financials' | 'applications' | 'candidates' | 'settings' | 'orchestrator' | 'observability' | 'sandbox' | 'jobSources') => {
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
        <div className="glass-panel" style={{ padding: '1.25rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ padding: '0.75rem', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '12px', fontSize: '1.5rem', color: '#8b5cf6' }}>👥</div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ecosystem Candidates</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{adminUsers.length}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
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

        <div className="glass-panel" style={{ padding: '1.25rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ padding: '0.75rem', background: 'rgba(14, 165, 233, 0.15)', borderRadius: '12px', fontSize: '1.5rem', color: '#0ea5e9' }}>💼</div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ecosystem Application Hub</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0ea5e9', marginTop: '0.2rem' }}>{globalApplications.length}</div>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
          <div style={{ padding: '0.75rem', background: 'rgba(236, 72, 153, 0.15)', borderRadius: '12px', fontSize: '1.5rem', color: '#ec4899' }}>💳</div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ledger Records</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ec4899', marginTop: '0.2rem' }}>{globalTransactions.length}</div>
          </div>
        </div>
      </div>

      {/* Content + nav split into a flex row on desktop (nav visually on the
          right via CSS order, content on the left), stacked on mobile with
          nav back to a horizontal scroller on top. The nav's JSX position
          in the tree is unchanged from before (still comes right before the
          tab-content blocks) - only its visual position moves, via `order`,
          which is far lower-risk than physically relocating the huge content
          block below. */}
      <div className="admin-content-row">
        <div
          className="admin-tabs-scroller"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem 1.5rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid var(--border-glass)',
            scrollbarWidth: 'none',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: 'var(--bg-dark-base)',
          }}
        >
          {([
            { id: 'candidates', label: '👥 Candidate Directory' },
            { id: 'applications', label: '💼 Application Hub' },
            { id: 'activities', label: '📊 Activity Stream' },
            { id: 'financials', label: '💳 Financial Ledger' },
            { id: 'orchestrator', label: '🤖 Orchestrator' },
            { id: 'observability', label: '📈 Observability' },
            { id: 'jobSources', label: '🌐 Job Sources' },
            { id: 'sandbox', label: '🧪 Recruiter Sandbox' },
            { id: 'settings', label: '⚙️ System Control' }
          ] as const).map((t) => {
            const isActive = adminTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => selectAdminTab(t.id)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '0.6rem 0.2rem',
                  borderRadius: 0,
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                  background: 'none',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
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

        <div className="admin-content-main">

      {/* TAB 1: ACTIVITIES */}
      {adminTab === 'activities' && (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {/* Continuous Validation Logs */}
          <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', maxHeight: '520px', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
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
                          background: 'var(--bg-dark-card)', 
                          borderLeft: isWarning ? '3px solid #ef4444' : isSuccess ? '3px solid #10b981' : '3px solid #8b5cf6', 
                          borderRadius: '4px',
                          fontSize: '0.75rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.2rem', fontSize: '0.65rem' }}>
                          <span style={{ fontWeight: 700 }}>{log.operator || 'SYSTEM_CORE'}</span>
                          <span>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'N/A'}</span>
                        </div>
                        <div style={{ color: 'var(--text-primary)', lineHeight: 1.4, fontFamily: 'monospace' }}>{log.message}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Continuous Integration Environment Calibration Monitoring */}
          <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
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
          <div style={{ display: 'flex', background: 'var(--bg-dark-card)', borderRadius: '10px', padding: '0.25rem', border: '1px solid var(--border-glass)', width: 'fit-content' }}>
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
            <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
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
                  style={{ flex: 1, minWidth: '240px', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}
                />
                
                {/* Currency Filter Button Group */}
                <div style={{ display: 'flex', background: 'var(--bg-dark-card)', borderRadius: '8px', padding: '0.2rem', border: '1px solid var(--border-glass)' }}>
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
                  <div className="spinner-micro" style={{ width: '40px', height: '40px', border: '3px solid var(--border-glass)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
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
                                <tr key={t.id || idx} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                                  <td style={{ padding: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                    {displayDate ? new Date(displayDate).toLocaleString('en-NG') : 'N/A'}
                                  </td>
                                  <td style={{ padding: '0.75rem' }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{displayName}</div>
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
            // CORPORATE ACCOUNTING / BOOKKEEPING BOARD — real, computed P&L. No simulated
            // or projected figures: revenue comes from actual Paystack-confirmed wallet
            // top-ups, expenses come from real logged spend.
            <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }} className="text-gradient-purple-pink">🏦 GiGO Corporate Bookkeeping — Real P&L Statement</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                    Computed live from actual Paystack-confirmed wallet top-ups and manually logged real expenses — cash basis, matching the Devpost submission template exactly.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {syncedSheetUrl && (
                    <a href={syncedSheetUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.7rem', color: '#10b981', textDecoration: 'underline' }}>
                      Open synced sheet ↗
                    </a>
                  )}
                  <button className="btn-glass" onClick={() => handleSyncToGoogleSheet()} disabled={isSyncingSheet} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}>
                    {isSyncingSheet ? '📤 Syncing...' : '📊 Sync to Google Sheet'}
                  </button>
                  <button className="btn-glass" onClick={fetchPLStatement} disabled={isLoadingPL} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
                    <RefreshIcon /> Refresh
                  </button>
                </div>
              </div>

              {isLoadingPL || !plStatement ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0' }}>
                  <div className="spinner-micro" style={{ width: '40px', height: '40px', border: '3px solid var(--border-glass)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Computing real P&L from live transaction data...</span>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', alignItems: 'flex-start' }}>

                  {/* COLUMN 1: THE REAL P&L SHEET */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', gridColumn: 'span 2' }}>

                    {/* XPRIZE Branded Header Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', borderRadius: '16px 16px 0 0', overflow: 'hidden', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.5)', border: '1px solid var(--border-glass)', borderBottom: 'none' }}>
                      <div style={{ background: '#0b1329', padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Build with Gemini XPRIZE</h2>
                        <span className="badge-glow" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', fontWeight: 800, border: '1px solid rgba(239, 68, 68, 0.3)' }}>CONFIDENTIAL</span>
                      </div>
                      <div style={{ background: '#f25f22', padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>PROFIT & LOSS STATEMENT</span>
                      </div>
                      <div style={{ background: '#00c58e', height: '0.45rem', width: '100%' }}></div>
                      <div style={{ background: 'var(--bg-dark-card)', padding: '0.75rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderBottom: '1px solid var(--border-glass)' }}>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Program Period: <strong style={{ color: 'var(--text-primary)' }}>May 19 - August 17</strong></span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>Currency: <strong style={{ color: '#38bdf8' }}>USD</strong></span>
                      </div>
                    </div>

                    {(() => {
                      const formatUSD = (val: number) => {
                        const isNeg = val < 0;
                        const formatted = Math.abs(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        return isNeg ? `-$${formatted}` : `$${formatted}`;
                      };
                      const r = plStatement.revenue;
                      const e = plStatement.expenses;
                      const p = plStatement.profitLoss;

                      const row = (label: string, data: any, indent = true, bold = false) => (
                        <tr style={{ borderBottom: '1px solid var(--border-glass)' }}>
                          <td style={{ padding: `0.55rem 1rem 0.55rem ${indent ? '1.5rem' : '1rem'}`, color: bold ? '#fff' : '#cbd5e1', fontWeight: bold ? 700 : 400 }}>{label}</td>
                          <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)' }}>{formatUSD(data.may)}</td>
                          <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)' }}>{formatUSD(data.june)}</td>
                          <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)' }}>{formatUSD(data.july)}</td>
                          <td style={{ padding: '0.55rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)' }}>{formatUSD(data.august)}</td>
                          <td style={{ padding: '0.55rem 1rem', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700, background: 'rgba(251, 146, 60, 0.02)' }}>{formatUSD(data.total)}</td>
                        </tr>
                      );

                      return (
                        <div className="table-wrapper" style={{ overflowX: 'auto', border: '1px solid var(--border-glass)', borderRadius: '0 0 16px 16px', background: 'var(--bg-dark-card)' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                            <thead>
                              <tr style={{ background: '#0b1329', borderBottom: '2px solid var(--border-glass)' }}>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-primary)', fontWeight: 800 }}>Description</th>
                                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#fb923c', fontWeight: 800 }}>May</th>
                                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#fb923c', fontWeight: 800 }}>June</th>
                                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#fb923c', fontWeight: 800 }}>July</th>
                                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: '#fb923c', fontWeight: 800 }}>August</th>
                                <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#fb923c', fontWeight: 900, background: 'rgba(251, 146, 60, 0.05)' }}>Full 90 Days</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr style={{ background: '#1e293b' }}><td colSpan={6} style={{ padding: '0.45rem 1rem', fontWeight: 900, color: '#fb923c', fontSize: '0.8rem', letterSpacing: '0.03em' }}>REVENUE</td></tr>
                              {row('Independent Sales (ie. sales of product or service)', r.independent)}
                              {row('Related Party Revenue (ie. see Rules)', r.related)}
                              <tr style={{ background: '#0b1329', borderTop: '2px solid #fb923c', borderBottom: '2px solid #fb923c' }}>
                                <td style={{ padding: '0.65rem 1rem', fontWeight: 800, color: '#fb923c' }}>TOTAL REVENUE</td>
                                <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700 }}>{formatUSD(r.total.may)}</td>
                                <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700 }}>{formatUSD(r.total.june)}</td>
                                <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700 }}>{formatUSD(r.total.july)}</td>
                                <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700 }}>{formatUSD(r.total.august)}</td>
                                <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: '#fb923c', fontWeight: 900, background: 'rgba(251, 146, 60, 0.08)' }}>{formatUSD(r.total.total)}</td>
                              </tr>

                              <tr style={{ background: '#1e293b' }}><td colSpan={6} style={{ padding: '0.45rem 1rem', fontWeight: 900, color: '#f43f5e', fontSize: '0.8rem', letterSpacing: '0.03em' }}>EXPENSES</td></tr>
                              <tr style={{ background: 'rgba(244, 63, 94, 0.03)' }}><td colSpan={6} style={{ padding: '0.35rem 1rem 0.35rem 1.25rem', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', fontSize: '0.7rem' }}>COGS</td></tr>
                              {row('Personnel', e.cogsPersonnel)}
                              {row('Software Subscriptions', e.cogsSoftware)}
                              {row('Tokens', e.cogsTokens)}
                              <tr style={{ background: 'rgba(244, 63, 94, 0.03)' }}><td colSpan={6} style={{ padding: '0.35rem 1rem 0.35rem 1.25rem', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', fontSize: '0.7rem' }}>SG&A</td></tr>
                              {row('Personnel', e.sgaPersonnel)}
                              {row('Software Subscriptions', e.sgaSoftware)}
                              {row('Tokens', e.sgaTokens)}
                              <tr style={{ background: 'rgba(244, 63, 94, 0.03)' }}><td colSpan={6} style={{ padding: '0.35rem 1rem 0.35rem 1.25rem', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', fontSize: '0.7rem' }}>Other Expenses</td></tr>
                              {row('Other expenses (see Legend)', e.otherExpenses)}
                              <tr style={{ background: '#0b1329', borderTop: '2px solid #f43f5e', borderBottom: '2px solid #f43f5e' }}>
                                <td style={{ padding: '0.65rem 1rem', fontWeight: 800, color: '#f43f5e' }}>TOTAL EXPENSES</td>
                                <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700 }}>{formatUSD(e.total.may)}</td>
                                <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700 }}>{formatUSD(e.total.june)}</td>
                                <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700 }}>{formatUSD(e.total.july)}</td>
                                <td style={{ padding: '0.65rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700 }}>{formatUSD(e.total.august)}</td>
                                <td style={{ padding: '0.65rem 1rem', textAlign: 'right', color: '#f43f5e', fontWeight: 900, background: 'rgba(244, 63, 94, 0.08)' }}>{formatUSD(e.total.total)}</td>
                              </tr>

                              <tr style={{ background: p.total >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)', borderTop: '2px solid var(--border-glass)' }}>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: 900, color: p.total >= 0 ? '#10b981' : '#f43f5e', fontSize: '0.85rem' }}>PROFIT (LOSS)</td>
                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 800 }}>{formatUSD(p.may)}</td>
                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 800 }}>{formatUSD(p.june)}</td>
                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 800 }}>{formatUSD(p.july)}</td>
                                <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 800 }}>{formatUSD(p.august)}</td>
                                <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: p.total >= 0 ? '#10b981' : '#f43f5e', fontWeight: 900, background: 'rgba(255,255,255,0.03)' }}>{formatUSD(p.total)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}

                    {/* Legend */}
                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 900, color: '#fb923c', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>LEGEND:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.5 }}><span style={{ color: '#fb923c', marginRight: '0.4rem' }}>■</span> <strong style={{ color: 'var(--text-primary)' }}>COGS</strong> stands for Cost of Goods Sold and includes expenses to produce the service provided by the business.</div>
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.5 }}><span style={{ color: '#fb923c', marginRight: '0.4rem' }}>■</span> <strong style={{ color: 'var(--text-primary)' }}>SG&A</strong> stands for Selling, General, and Adminstrative Expenses and includes expenses to operate the business.</div>
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.5 }}><span style={{ color: '#fb923c', marginRight: '0.4rem' }}>■</span> <strong style={{ color: 'var(--text-primary)' }}>"Other Expenses"</strong> may include expenses like rent, travel, or other expenses not outlined in the P&L. You must explain each expense line in your Devpost submission.</div>
                        <div style={{ fontSize: '0.75rem', color: '#cbd5e1', lineHeight: 1.5 }}><span style={{ color: '#fb923c', marginRight: '0.4rem' }}>■</span> Recorded on a <strong style={{ color: 'var(--text-primary)' }}>cash basis</strong>: revenue when Paystack confirms payment, expenses when logged as actually paid.</div>
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 2: LOG A REAL EXPENSE + AUDIT LIST */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>📝</span> Log a Real Expense
                      </h4>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0' }}>
                        Record actual money spent (hosting, API overage, contractor pay). Updates the P&L immediately.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <input type="date" value={newExpenseDate} onChange={(e) => setNewExpenseDate(e.target.value)} min="2026-05-19" max="2026-08-17" style={{ background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-primary)' }} />
                        <select value={newExpenseCategory} onChange={(e) => { const cat = e.target.value as 'COGS' | 'SG&A' | 'Other'; setNewExpenseCategory(cat); setNewExpenseSubcategory(cat === 'Other' ? 'Other' : 'Personnel'); }} style={{ background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                          <option value="COGS">COGS</option>
                          <option value="SG&A">SG&A</option>
                          <option value="Other">Other Expenses</option>
                        </select>
                        {newExpenseCategory !== 'Other' && (
                          <select value={newExpenseSubcategory} onChange={(e) => setNewExpenseSubcategory(e.target.value)} style={{ background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                            <option value="Personnel">Personnel</option>
                            <option value="Software Subscriptions">Software Subscriptions</option>
                            <option value="Tokens">Tokens</option>
                          </select>
                        )}
                        <input type="number" step="0.01" min="0" placeholder="Amount (USD)" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} style={{ background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-primary)' }} />
                        <input type="text" placeholder="Description (e.g. Render hosting - August)" value={newExpenseDescription} onChange={(e) => setNewExpenseDescription(e.target.value)} style={{ background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-primary)' }} />
                        <button className="btn-glass btn-primary" onClick={handleAddExpense} disabled={isSubmittingExpense} style={{ justifyContent: 'center', fontWeight: 700 }}>
                          {isSubmittingExpense ? 'Logging...' : '+ Log Expense'}
                        </button>
                      </div>
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: '0 0 1rem 0', color: 'var(--text-primary)' }}>📋 Logged Expenses ({companyExpenses.length})</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '320px', overflowY: 'auto' }}>
                        {companyExpenses.length === 0 ? (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No expenses logged yet.</span>
                        ) : (
                          companyExpenses.map((exp) => (
                            <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.7rem' }}>
                              <div>
                                <div style={{ color: 'var(--text-primary)', fontWeight: 700 }}>${Number(exp.amountUSD).toFixed(2)} — {exp.category}/{exp.subcategory}</div>
                                <div style={{ color: 'var(--text-muted)' }}>{exp.date} {exp.description ? `— ${exp.description}` : ''}</div>
                              </div>
                              <button onClick={() => handleDeleteExpense(exp.id)} style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <MailDiagnosticsPanel API_BASE_URL={API_BASE_URL} userEmail={userEmail || 'admin@gigo.com'} />

          <AdminAccessManagement API_BASE_URL={API_BASE_URL} userEmail={userEmail || 'admin@gigo.com'} addLog={addLog} />

          <ManualPaymentAdmin API_BASE_URL={API_BASE_URL} userEmail={userEmail || 'admin@gigo.com'} addLog={addLog} />

          <WaitlistPanel API_BASE_URL={API_BASE_URL} />
        </div>
      )}

      {/* TAB 3: APPLICATION HUB */}
      {adminTab === 'applications' && (
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
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
              style={{ flex: 1, minWidth: '240px', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}
            />
            <select 
              value={appStatusFilter} 
              onChange={(e: any) => setAppStatusFilter(e.target.value)}
              style={{ background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem', fontSize: '0.8rem', color: 'var(--text-primary)', cursor: 'pointer' }}
            >
              <option value="ALL">All Kanban Column Statuses</option>
              <option value="matched">Matched Applications</option>
              <option value="applied">Applied / Submitted</option>
              <option value="interviews">Interviews in Progress</option>
            </select>
          </div>

          {isLoadingGlobalApplications ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0' }}>
              <div className="spinner-micro" style={{ width: '40px', height: '40px', border: '3px solid var(--border-glass)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
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
                          <tr key={app.id || idx} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{app.fullName}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{app.email}</div>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-glow)' }}>{app.title}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{app.company}</div>
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
        <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
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
              style={{ width: '100%', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-primary)' }}
            />
          </div>

          {isLoadingAdminData ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0' }}>
              <div className="spinner-micro" style={{ width: '40px', height: '40px', border: '3px solid var(--border-glass)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
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
                          <tr key={user.userId} style={{ borderBottom: '1px solid var(--border-glass)', background: frozenUserIds.includes(user.userId) ? 'rgba(239, 68, 68, 0.02)' : 'transparent' }}>
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
                                <span
                                  title="Related party revenue must be disclosed separately from arms-length revenue in the P&L (see Devpost rules). Toggle if this account belongs to a team member, family, or pre-existing customer relationship."
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`${API_BASE_URL}/api/admin/users/${user.userId}/set-related-party`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ adminEmail: userEmail, isRelatedParty: !user.isRelatedParty })
                                      });
                                      if (res.ok) {
                                        logAdminAction('RELATED_PARTY_TOGGLE', `Marked ${user.fullName} as ${!user.isRelatedParty ? '' : 'not '}a related party.`);
                                        fetchAdminUsers();
                                      }
                                    } catch (err) {
                                      console.error("Failed to toggle related-party flag:", err);
                                    }
                                  }}
                                  style={{
                                    fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '4px', cursor: 'pointer',
                                    background: user.isRelatedParty ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                                    color: user.isRelatedParty ? '#c084fc' : 'var(--text-muted)',
                                    border: user.isRelatedParty ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)'
                                  }}
                                >
                                  {user.isRelatedParty ? '🔗 Related Party' : '+ Mark Related Party'}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>ID: {user.userId}</div>
                              {user.ninValue && (
                                <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                                  <span>🪪 NIN: <strong style={{ color: 'var(--text-primary)' }}>{user.ninValue}</strong></span>
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
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{user.email}</div>
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
          <LegalDocumentsEditor API_BASE_URL={API_BASE_URL} userEmail={userEmail || 'admin@gigo.com'} addLog={addLog} />

          {/* Global System Configuration */}
          <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
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
                  style={{ background: 'var(--bg-dark-card)', borderColor: 'var(--border-glass)', color: 'var(--text-primary)', height: '42px', borderRadius: '8px', width: '100%', padding: '0.5rem 0.75rem' }}
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
                  style={{ background: 'var(--bg-dark-card)', borderColor: 'var(--border-glass)', color: 'var(--text-primary)', height: '42px', borderRadius: '8px', width: '100%', padding: '0.5rem 0.75rem' }}
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
                  style={{ background: 'var(--bg-dark-card)', borderColor: 'var(--border-glass)', color: 'var(--text-primary)', minHeight: '80px', borderRadius: '8px', width: '100%', padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'block' }}>Strictly invisible on the frontend for standard candidates. Both background and on-demand search engines ingest this template to build exact Boolean constraints.</span>
              </div>

              {/* Global Paystack Gateway Settings Section */}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-glass)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
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
                  style={{ background: 'var(--bg-dark-card)', borderColor: 'var(--border-glass)', color: 'var(--text-primary)', height: '42px', borderRadius: '8px', width: '100%', padding: '0.5rem 0.75rem', outline: 'none' }}
                >
                  <option value="test" style={{ background: 'var(--bg-dark-surface)' }}>Sandbox / Test Environment</option>
                  <option value="live" style={{ background: 'var(--bg-dark-surface)' }}>Production / Live Environment</option>
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
                  border: '1px solid var(--border-glass)', 
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

              {/* Alternate Mail Backend Governance Toggle */}
              <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  ✉️ Alternate Mail Backends
                </label>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.75rem',
                  height: '42px'
                }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Allow Zapier / custom SMTP</span>
                  <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '22px' }}>
                    <input
                      type="checkbox"
                      checked={configAllowAlternateMailBackends}
                      onChange={(e) => setConfigAllowAlternateMailBackends(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: configAllowAlternateMailBackends ? '#a78bfa' : '#334155',
                      transition: '0.3s',
                      borderRadius: '22px',
                      boxShadow: configAllowAlternateMailBackends ? '0 0 8px rgba(167, 139, 250, 0.5)' : 'none'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '16px', width: '16px',
                        left: configAllowAlternateMailBackends ? '24px' : '3px',
                        bottom: '3px',
                        backgroundColor: '#ffffff',
                        transition: '0.3s',
                        borderRadius: '50%'
                      }} />
                    </span>
                  </label>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'block' }}>When off, every candidate is locked to GiGO Mail (the always-on default). Turn on to let candidates opt into Zapier or their own SMTP.</span>
              </div>

              {/* Global Job Discovery Sweep Interval */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  🔍 Job Discovery Sweep Interval
                </label>
                <input
                  type="number"
                  min={5}
                  step={5}
                  className="form-control"
                  value={configScraperIntervalMinutes}
                  onChange={(e) => setConfigScraperIntervalMinutes(e.target.value)}
                  style={{ background: 'var(--bg-dark-card)', borderColor: 'var(--border-glass)', color: 'var(--text-primary)', height: '42px', borderRadius: '8px', width: '100%', padding: '0.5rem 0.75rem', outline: 'none' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'block' }}>Minutes between backend discovery sweeps of the shared job pool. Takes effect on the next scheduled tick — no restart needed.</span>
              </div>

              {/* Minimum Match Score Visibility Threshold */}
              <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  🎯 Minimum Match Score to Show
                </label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  className="form-control"
                  value={configMinMatchScoreThreshold}
                  onChange={(e) => setConfigMinMatchScoreThreshold(e.target.value)}
                  style={{ background: 'var(--bg-dark-card)', borderColor: 'var(--border-glass)', color: 'var(--text-primary)', height: '42px', borderRadius: '8px', width: '100%', padding: '0.5rem 0.75rem', outline: 'none' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'block' }}>Jobs scoring below this against a candidate's profile are excluded server-side — they never reach that candidate's dashboard.</span>
              </div>

              {/* Test / Sandbox Credentials Group */}
              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
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
                    style={{ background: 'var(--bg-dark-card)', borderColor: 'var(--border-glass)', color: 'var(--text-primary)', height: '42px', borderRadius: '8px', width: '100%', padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}
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
                    style={{ background: 'var(--bg-dark-card)', borderColor: 'var(--border-glass)', color: 'var(--text-primary)', height: '42px', borderRadius: '8px', width: '100%', padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              {/* Live / Production Credentials Group */}
              <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
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
                    style={{ background: 'var(--bg-dark-card)', borderColor: 'var(--border-glass)', color: 'var(--text-primary)', height: '42px', borderRadius: '8px', width: '100%', padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}
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
                    style={{ background: 'var(--bg-dark-card)', borderColor: 'var(--border-glass)', color: 'var(--text-primary)', height: '42px', borderRadius: '8px', width: '100%', padding: '0.5rem 0.75rem', fontFamily: 'monospace', fontSize: '0.8rem' }}
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
          <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
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
                style={{ background: 'var(--bg-dark-card)', borderColor: 'var(--border-glass)', color: 'var(--text-primary)', height: '36px', borderRadius: '8px', padding: '0.25rem 0.50rem', fontSize: '0.8rem', flex: 1 }}
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
                style={{ height: '36px', padding: '0 1rem', fontSize: '0.75rem', fontWeight: 700, borderColor: 'var(--primary)', color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer' }}
              >
                ➕ Add Domain
              </button>
            </div>
          </div>

          {/* Ecosystem Security & Governance Flags */}
          <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }} className="text-gradient-purple-pink">🔒 Ecosystem Security & Governance Flags</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0' }}>Enforce global architectural overrides and security rules across all candidate consoles instantly.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              
              {/* Flag 1 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>🎙️ Voice Response Agent</div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>🕵️ Autonomous Scraper Loop</div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>🚧 System Maintenance Mode</div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>💳 Paystack Payout Channel</div>
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
          <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', background: 'var(--bg-dark-card)', border: '1px solid var(--border-glass)', borderRadius: '16px' }}>
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
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                      <td style={{ padding: '0.6rem', fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.6rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
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

      {adminTab === 'jobSources' && (
        <JobSourcesManager API_BASE_URL={API_BASE_URL} userEmail={userEmail || 'admin@gigo.com'} addLog={addLog} />
      )}

        </div>
      </div>

      {/* 🔐 Admin Password Reset Override Modal */}
      {resetPasswordUser && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--bg-dark-card)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            background: 'var(--bg-dark-card)',
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
                        background: 'var(--bg-dark-card)',
                        borderColor: 'var(--border-glass)',
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
                    style={{ flex: 1, height: '42px', justifyContent: 'center', borderColor: 'var(--border-glass)', cursor: 'pointer' }}
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
                  border: '1px solid var(--border-glass)',
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
                    background: 'var(--bg-dark-card)',
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
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', textShadow: '0 0 4px rgba(255,255,255,0.1)' }}>{selectedNINCard.fullName}</div>
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
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {selectedNINCard.fullName.toLowerCase().includes('female') || selectedNINCard.fullName.toLowerCase().includes('mrs') || selectedNINCard.fullName.toLowerCase().includes('miss') ? 'F' : 'M'} (Inferred)
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Date of Birth</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>15 OCT 1996 (Inferred)</div>
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
              border: '1px solid var(--border-glass)',
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
                    color: 'var(--text-primary)',
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
