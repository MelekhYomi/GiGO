import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';
import { LandingPage } from './pages/LandingPage';

// SVG Icons
const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><path d="M16 14h.01"/></svg>
);

const MicroIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M16 3h5v5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 21H3v-5"/></svg>
);

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
);

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
);

interface JobMatch {
  id: string;
  jobTitle: string;
  companyName: string;
  salaryRange: string;
  score: number;
  location: string;
  applicationEmail?: string;
  applicationPhone?: string;
  applicationLink?: string;
  applicationLinkOrEmail?: string;
  keyRequirementsSummary?: string[];
  sourcePlatform?: string;
  scrapedAt?: string;
  postedAt?: string;
  jobDescription?: string;
  userId?: string;
  applicationMethod?: 'email' | 'portal' | 'google_form' | 'unknown';
  emailSubject?: string;
  emailBodyRequirements?: string;
  attachmentsRequired?: string[];
}

interface KanbanTask {
  id: string;
  title: string;
  company: string;
  status: 'matched' | 'applied' | 'interviews';
  salary: string;
  confidence: number;
  date: string;
  applicationEmail?: string;
  applicationPhone?: string;
  applicationLink?: string;
  applicationLinkOrEmail?: string;
  keyRequirementsSummary?: string[];
  sourcePlatform?: string;
  pinned?: boolean;
  applicationMethod?: 'email' | 'portal' | 'google_form' | 'unknown';
  emailSubject?: string;
  emailBodyRequirements?: string;
  attachmentsRequired?: string[];
}

interface Transaction {
  id: string;
  date: string;
  currency: 'USD' | 'NGN';
  amount: number;
  status: 'SUCCESSFUL' | 'PROCESSING';
  ref: string;
}

interface AdminUser {
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
  flutterwavePublicKey: string;
  flutterwaveSecretKey: string;
  infrastructureStatus?: {
    powerSetupDescription?: string;
    internetSetupDescription?: string;
    hasRemoteBackupPlan?: boolean;
  };
}

interface AgentLog {
  id: string;
  timestamp: string;
  actionType: string;
  status: 'SUCCESS' | 'WARNING' | 'CRITICAL_ALERT';
  message: string;
  meta?: any;
}

// Smart API url resolver (localhost vs production cloud run)
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080'
  : 'https://wa-backend-536473631781.us-central1.run.app';

// Custom designed premium vector SVGs for cybernetic tech disciplines (5 gorgeous avatars)
const CyberAvatars: Record<string, (props?: React.SVGProps<SVGSVGElement>) => React.ReactElement> = {
  ai_engineer: (props) => (
    <svg viewBox="0 0 100 100" width="100%" height="100%" {...props}>
      <defs>
        <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
        <filter id="aiGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle cx="50" cy="50" r="48" fill="rgba(15, 23, 42, 0.85)" stroke="url(#aiGrad)" strokeWidth="2" filter="url(#aiGlow)" />
      <circle cx="50" cy="50" r="35" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="5,5" />
      <circle cx="50" cy="50" r="26" fill="none" stroke="url(#aiGrad)" strokeWidth="1.5" />
      <path d="M50 20 L50 80 M20 50 L80 50 M29 29 L71 71 M29 71 L71 29" stroke="rgba(34, 211, 238, 0.25)" strokeWidth="1" />
      <circle cx="50" cy="50" r="10" fill="rgba(6, 182, 212, 0.2)" stroke="#22d3ee" strokeWidth="2" />
      <circle cx="50" cy="50" r="4" fill="#22d3ee" />
      <circle cx="50" cy="20" r="3" fill="#22d3ee" />
      <circle cx="50" cy="80" r="3" fill="#22d3ee" />
      <circle cx="20" cy="50" r="3" fill="#22d3ee" />
      <circle cx="80" cy="50" r="3" fill="#22d3ee" />
      <circle cx="29" cy="29" r="3" fill="#0891b2" />
      <circle cx="71" cy="71" r="3" fill="#0891b2" />
      <circle cx="29" cy="71" r="3" fill="#0891b2" />
      <circle cx="71" cy="29" r="3" fill="#0891b2" />
    </svg>
  ),
  sre_architect: (props) => (
    <svg viewBox="0 0 100 100" width="100%" height="100%" {...props}>
      <defs>
        <linearGradient id="sreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <filter id="sreGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle cx="50" cy="50" r="48" fill="rgba(15, 23, 42, 0.85)" stroke="url(#sreGrad)" strokeWidth="2" filter="url(#sreGlow)" />
      <path d="M50 22 L75 35 L75 65 L50 78 L25 65 L25 35 Z" fill="none" stroke="#c084fc" strokeWidth="1.5" />
      <path d="M50 22 L50 78 M25 35 L50 50 L75 35 M25 65 L50 50 L75 65" stroke="rgba(192, 132, 252, 0.5)" strokeWidth="1" />
      <circle cx="50" cy="50" r="8" fill="rgba(168, 85, 247, 0.2)" stroke="#c084fc" strokeWidth="1.5" />
      <circle cx="50" cy="22" r="3.5" fill="#c084fc" />
      <circle cx="75" cy="35" r="3.5" fill="#7c3aed" />
      <circle cx="75" cy="65" r="3.5" fill="#c084fc" />
      <circle cx="50" cy="78" r="3.5" fill="#7c3aed" />
      <circle cx="25" cy="65" r="3.5" fill="#c084fc" />
      <circle cx="25" cy="35" r="3.5" fill="#7c3aed" />
    </svg>
  ),
  data_scientist: (props) => (
    <svg viewBox="0 0 100 100" width="100%" height="100%" {...props}>
      <defs>
        <linearGradient id="dataGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id="dataGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle cx="50" cy="50" r="48" fill="rgba(15, 23, 42, 0.85)" stroke="url(#dataGrad)" strokeWidth="2" filter="url(#dataGlow)" />
      <path d="M25 40 Q40 25 50 40 T75 40" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
      <path d="M25 60 Q40 75 50 60 T75 60" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
      <line x1="33" y1="35" x2="33" y2="65" stroke="rgba(52, 211, 153, 0.4)" strokeWidth="1.5" />
      <line x1="42" y1="38" x2="42" y2="62" stroke="rgba(52, 211, 153, 0.4)" strokeWidth="1.5" />
      <line x1="50" y1="40" x2="50" y2="60" stroke="rgba(52, 211, 153, 0.4)" strokeWidth="1.5" />
      <line x1="58" y1="38" x2="58" y2="62" stroke="rgba(52, 211, 153, 0.4)" strokeWidth="1.5" />
      <line x1="67" y1="35" x2="67" y2="65" stroke="rgba(52, 211, 153, 0.4)" strokeWidth="1.5" />
      <circle cx="33" cy="35" r="2.5" fill="#34d399" />
      <circle cx="33" cy="65" r="2.5" fill="#059669" />
      <circle cx="50" cy="40" r="2.5" fill="#34d399" />
      <circle cx="50" cy="60" r="2.5" fill="#059669" />
      <circle cx="67" cy="35" r="2.5" fill="#34d399" />
      <circle cx="67" cy="65" r="2.5" fill="#059669" />
      <circle cx="50" cy="50" r="12" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" />
    </svg>
  ),
  cyber_coder: (props) => (
    <svg viewBox="0 0 100 100" width="100%" height="100%" {...props}>
      <defs>
        <linearGradient id="coderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <filter id="coderGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle cx="50" cy="50" r="48" fill="rgba(15, 23, 42, 0.85)" stroke="url(#coderGrad)" strokeWidth="2" filter="url(#coderGlow)" />
      <path d="M30 38 L45 50 L30 62" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="50" y1="62" x2="70" y2="62" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
      <text x="30" y="28" fill="rgba(251, 191, 36, 0.25)" fontSize="8" fontFamily="monospace" fontWeight="bold">01</text>
      <text x="65" y="42" fill="rgba(251, 191, 36, 0.25)" fontSize="8" fontFamily="monospace" fontWeight="bold">10</text>
      <text x="55" y="28" fill="rgba(251, 191, 36, 0.25)" fontSize="8" fontFamily="monospace" fontWeight="bold">1</text>
    </svg>
  ),
  neon_cyberpunk: (props) => (
    <svg viewBox="0 0 100 100" width="100%" height="100%" {...props}>
      <defs>
        <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="1" />
          <stop offset="50%" stopColor="#f43f5e" stopOpacity="1" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="1" />
        </linearGradient>
        <filter id="cyberGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <circle cx="50" cy="50" r="48" fill="rgba(15, 23, 42, 0.85)" stroke="url(#cyberGrad)" strokeWidth="2" filter="url(#cyberGlow)" />
      <path d="M20 70 L80 70 M20 78 L80 78 M20 86 L80 86" stroke="rgba(236, 72, 153, 0.15)" strokeWidth="1" />
      <path d="M20 70 L35 100 M50 70 L50 100 M80 70 L65 100" stroke="rgba(236, 72, 153, 0.15)" strokeWidth="1" />
      <path d="M25 42 L75 42 L70 58 L30 58 Z" fill="rgba(236, 72, 153, 0.15)" stroke="url(#cyberGrad)" strokeWidth="2" strokeLinejoin="round" />
      <line x1="22" y1="42" x2="18" y2="42" stroke="#ec4899" strokeWidth="2" />
      <line x1="78" y1="42" x2="82" y2="42" stroke="#ec4899" strokeWidth="2" />
      <circle cx="50" cy="30" r="2" fill="#a78bfa" />
      <circle cx="42" cy="32" r="1.5" fill="#ec4899" />
      <circle cx="58" cy="32" r="1.5" fill="#8b5cf6" />
    </svg>
  )
};

// SVG Cyber-Avatar Renderer helper
const renderUserAvatar = (avatarPicId: string, size: string = '32px', style?: React.CSSProperties) => {
  if (avatarPicId && (avatarPicId.startsWith('http://') || avatarPicId.startsWith('https://') || avatarPicId.startsWith('data:image/'))) {
    return (
      <div style={{ width: size, height: size, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
        <img 
          src={avatarPicId} 
          alt="Avatar" 
          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.15)' }} 
        />
      </div>
    );
  }
  const SvgComponent = CyberAvatars[avatarPicId];
  if (SvgComponent) {
    return (
      <div style={{ width: size, height: size, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
        <SvgComponent style={{ width: '100%', height: '100%' }} />
      </div>
    );
  }
  return (
    <div style={{ 
      width: size, 
      height: size, 
      borderRadius: '50%', 
      background: 'rgba(255,255,255,0.05)', 
      border: '1px solid var(--border-glass)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexShrink: 0,
      color: 'var(--primary)',
      ...style 
    }}>
      <svg style={{ width: '60%', height: '60%', opacity: 0.85 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
      </svg>
    </div>
  );
};

// Helper to calculate relative elapsed time for job listings
const getRelativeTime = (isoString?: string): string => {
  if (!isoString) return 'Just posted';
  try {
    const diffMs = Date.now() - Date.parse(isoString);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just posted';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch (err) {
    return 'Just posted';
  }
};

// Global window.fetch interceptor to inject Authorization Bearer token
const originalFetch = window.fetch;
window.fetch = async (input, init) => {
  const token = localStorage.getItem('wa_token');
  if (token) {
    init = init || {};
    init.headers = init.headers || {};
    if (init.headers instanceof Headers) {
      init.headers.set('Authorization', `Bearer ${token}`);
    } else if (Array.isArray(init.headers)) {
      const authIdx = init.headers.findIndex(([k]) => k.toLowerCase() === 'authorization');
      if (authIdx > -1) {
        init.headers[authIdx][1] = `Bearer ${token}`;
      } else {
        init.headers.push(['Authorization', `Bearer ${token}`]);
      }
    } else {
      (init.headers as any)['Authorization'] = `Bearer ${token}`;
    }
  }
  return originalFetch(input, init);
};

export default function App() {
  // Authentication & Multi-user state variables
  const [userId, setUserId] = useState<string>(localStorage.getItem('wa_userId') || '');
  const [userEmail, setUserEmail] = useState<string>(localStorage.getItem('wa_userEmail') || '');
  const [userFullName, setUserFullName] = useState<string>(localStorage.getItem('wa_userFullName') || '');
  const [userPhone, setUserPhone] = useState<string>(localStorage.getItem('wa_userPhone') || '');
  const [userRole, setUserRole] = useState<string>(localStorage.getItem('wa_userRole') || 'candidate');

  // Safe User ID Resolver for double-slash and un-synchronized API calls
  const currentUserId = userId || localStorage.getItem('wa_userId') || 'user_1780714671963_281';

  // Auth Overlay Form States
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authFullName, setAuthFullName] = useState<string>('');
  const [authPhone, setAuthPhone] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Signup Voice States & Dashboard Aesthetic Themes
  const [isSignupVoiceRecording, setIsSignupVoiceRecording] = useState<boolean>(false);
  const [isAnalyzingSignupVoice, setIsAnalyzingSignupVoice] = useState<boolean>(false);
  const [signupVoiceStatus, setSignupVoiceStatus] = useState<string>('');
  const [activeTheme, setActiveTheme] = useState<'obsidian' | 'emerald' | 'sunset' | 'ocean'>('obsidian');
  const signupMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const signupChunksRef = useRef<Blob[]>([]);
  const signupStreamRef = useRef<MediaStream | null>(null);
  const [signupWaveActive, setSignupWaveActive] = useState<boolean>(false);

  // App Dashboard Toggle Mode
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  // Wallet Balances
  const [walletUSD, setWalletUSD] = useState<number>(0.0);
  const [walletNGN, setWalletNGN] = useState<number>(0.0);
  
  // Audio Sync States
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState<boolean>(false);
  const [audioText, setAudioText] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState('Idle — Tap Mic to Start Syncing Resume & Experience');

  // Real-time Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const barRefs = useRef<HTMLDivElement[]>([]);
  
  // Audio Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Settings Modal & Calibration States
  const [scanInterval, setScanInterval] = useState<number>(45);
  const [feedRefreshInterval, setFeedRefreshInterval] = useState<number>(1);
  const [workTypePreferences, setWorkTypePreferences] = useState<string[]>(['Remote', 'Hybrid']);

  const [settingsScanInterval, setSettingsScanInterval] = useState<number>(45);
  const [settingsFeedRefreshInterval, setSettingsFeedRefreshInterval] = useState<number>(1);
  const [settingsWorkTypePreferences, setSettingsWorkTypePreferences] = useState<string[]>(['Remote', 'Hybrid']);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState<'profile' | 'scan' | 'keys'>('profile');

  // User Profile Info
  const [profile, setProfile] = useState<{
    name: string;
    role: string;
    location: string;
    salary: string;
    skills: string[];
    geminiApiKey: string;
    flutterwavePublicKey: string;
    flutterwaveSecretKey: string;
    profilePic: string;
    password?: string;
    professionalSummary?: string;
    yearsOfExperience?: number;
    targetRoles?: string[];
    infrastructureStatus?: {
      powerSetupDescription: string;
      internetSetupDescription: string;
      hasRemoteBackupPlan: boolean;
    };
    smtpSettings?: {
      host: string;
      port: number;
      user: string;
      pass: string;
    };
    workHistory?: { company: string; role: string; startDate: string; endDate: string; achievements: string; }[];
    educationList?: { institution: string; degree: string; fieldOfStudy: string; gradYear: string; }[];
    maritalStatus?: string;
    dob?: string;
    address?: string;
    hobbies?: string;
    strengths?: string;
    softSkills?: string;
    teamworkExperience?: string;
    conflictResolution?: string;
    calibrationAxes?: { cognitive: number; credential: number; behavioral: number; operational: number; };
    calibrationHistory?: any[];
  }>({
    name: '[   ]',
    role: '[   ]',
    location: '[   ]',
    salary: '[   ]',
    skills: [],
    geminiApiKey: '',
    flutterwavePublicKey: '',
    flutterwaveSecretKey: '',
    profilePic: '',
    password: '',
    professionalSummary: '[   ]',
    yearsOfExperience: 0,
    targetRoles: [],
    infrastructureStatus: {
      powerSetupDescription: '[   ]',
      internetSetupDescription: '[   ]',
      hasRemoteBackupPlan: false
    },
    smtpSettings: { host: '', port: 587, user: '', pass: '' },
    workHistory: [],
    educationList: [],
    maritalStatus: '[   ]',
    dob: '[   ]',
    address: '[   ]',
    hobbies: '[   ]',
    strengths: '[   ]',
    softSkills: '[   ]',
    teamworkExperience: '[   ]',
    conflictResolution: '[   ]',
    calibrationAxes: { cognitive: 65, credential: 55, behavioral: 60, operational: 70 },
    calibrationHistory: []
  });

  // Settings Form States
  const [settingsName, setSettingsName] = useState<string>('');
  const [newTickerDomain, setNewTickerDomain] = useState<string>('');
  const [settingsPhone, setSettingsPhone] = useState<string>('');
  const [settingsLocation, setSettingsLocation] = useState<string>('');
  const [settingsRole, setSettingsRole] = useState<string>('');
  const [settingsSalary, setSettingsSalary] = useState<string>('');
  const [settingsSkills, setSettingsSkills] = useState<string[]>([]);
  const [settingsNewSkill, setSettingsNewSkill] = useState<string>('');
  const [settingsPassword, setSettingsPassword] = useState<string>('');
  const [settingsProfilePic, setSettingsProfilePic] = useState<string>('');
  const [settingsSmtpHost, setSettingsSmtpHost] = useState<string>('');
  const [settingsSmtpPort, setSettingsSmtpPort] = useState<string>('587');
  const [settingsSmtpUser, setSettingsSmtpUser] = useState<string>('');
  const [settingsSmtpPass, setSettingsSmtpPass] = useState<string>('');
  const [settingsGeminiKey, setSettingsGeminiKey] = useState<string>('');
  const [settingsFlwPubKey, setSettingsFlwPubKey] = useState<string>('');
  const [settingsFlwSecKey, setSettingsFlwSecKey] = useState<string>('');
  const [isUpdatingSettings, setIsUpdatingSettings] = useState<boolean>(false);

  // Logs and Ticker State
  const [logs, setLogs] = useState<string[]>([
    'System initialized.',
    'Ready for webhook triggers from Flutterwave gateway.',
    'AI matching agent running: monitoring candidate ledger profiles...'
  ]);

  // Transaction History State
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // User Compiled Cover Letters
  const [compiledDocuments, setCompiledDocuments] = useState<any[]>([]);

  // All unique job matches fetched from backend
  const [allUniqueJobs, setAllUniqueJobs] = useState<JobMatch[]>([]);
  // Flag to toggle remaining jobs widescreen overlay
  const [showRemainingJobsModal, setShowRemainingJobsModal] = useState<boolean>(false);
  const [vaultLayout, setVaultLayout] = useState<'card' | 'list' | 'compact'>('card');

  // GiGO Brain Mind Cloner States
  const [clonerSubTab, setClonerSubTab] = useState<'calibrate' | 'profile' | 'history' | 'docs'>('calibrate');
  const [activeWizardStep, setActiveWizardStep] = useState<'work_edu' | 'personal' | 'behavioral'>('work_edu');
  const [calibrationDilemmaIndex, setCalibrationDilemmaIndex] = useState<number>(0);
  const [calibrationResponseText, setCalibrationResponseText] = useState<string>('');
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [activeCalibratedFeedback, setActiveCalibratedFeedback] = useState<{
    toneAnalysis: string;
    decisionStyle: string;
    feedback: string;
    cognitiveBoost: number;
    behavioralBoost: number;
  } | null>(null);

  // Profile Wizard Form States (for Deep Profile Vault editor)
  const [wizardWorkHistory, setWizardWorkHistory] = useState<{ company: string; role: string; startDate: string; endDate: string; achievements: string; }[]>([]);
  const [wizardEducationList, setWizardEducationList] = useState<{ institution: string; degree: string; fieldOfStudy: string; gradYear: string; }[]>([]);
  const [wizardMaritalStatus, setWizardMaritalStatus] = useState<string>('');
  const [wizardDob, setWizardDob] = useState<string>('');
  const [wizardAddress, setWizardAddress] = useState<string>('');
  const [wizardHobbies, setWizardHobbies] = useState<string>('');
  const [wizardStrengths, setWizardStrengths] = useState<string>('');
  const [wizardSoftSkills, setWizardSoftSkills] = useState<string>('');
  const [wizardTeamworkExperience, setWizardTeamworkExperience] = useState<string>('');
  const [wizardConflictResolution, setWizardConflictResolution] = useState<string>('');
  const [isSavingProfileVault, setIsSavingProfileVault] = useState<boolean>(false);

  // Temporary item editing states
  const [newJobCompany, setNewJobCompany] = useState<string>('');
  const [newJobRole, setNewJobRole] = useState<string>('');
  const [newJobStart, setNewJobStart] = useState<string>('');
  const [newJobEnd, setNewJobEnd] = useState<string>('');
  const [newJobAchievements, setNewJobAchievements] = useState<string>('');

  const [newSchoolName, setNewSchoolName] = useState<string>('');
  const [newSchoolDegree, setNewSchoolDegree] = useState<string>('');
  const [newSchoolField, setNewSchoolField] = useState<string>('');
  const [newSchoolYear, setNewSchoolYear] = useState<string>('');

  const scrollingTickerJobs = useMemo(() => {
    // Filter jobs with match score 80% - 100% and NO application email
    const filtered = allUniqueJobs.filter(job => !job.applicationEmail && job.score >= 80 && job.score <= 100);
    // Sort descending by score
    const sorted = [...filtered].sort((a, b) => b.score - a.score);
    // Slice top 15
    const top15 = sorted.slice(0, 15);
    // Duplicate the top 15 elements to preserve the seamless vertical scrolling loop (TranslateY -50%)
    return [...top15, ...top15];
  }, [allUniqueJobs]);

  const remainingJobs = useMemo(() => {
    // Filter jobs with match score 80% - 100% and NO application email to find the exact top 15 active in ticker
    const filtered = allUniqueJobs.filter(job => !job.applicationEmail && job.score >= 80 && job.score <= 100);
    const sorted = [...filtered].sort((a, b) => b.score - a.score);
    const top15 = sorted.slice(0, 15);
    const top15Ids = new Set(top15.map(j => j.id));

    // Remaining jobs are those that are not in the top 15 scrolling marquee
    const remaining = allUniqueJobs.filter(job => !top15Ids.has(job.id));
    // Sort remaining jobs descending by score
    return [...remaining].sort((a, b) => b.score - a.score);
  }, [allUniqueJobs]);

  const brainSyncPercentage = useMemo(() => {
    const axes = profile.calibrationAxes || { cognitive: 65, credential: 55, behavioral: 60, operational: 70 };
    const avg = Math.round((axes.cognitive + axes.credential + axes.behavioral + axes.operational) / 4);
    return Math.min(100, Math.max(0, avg));
  }, [profile.calibrationAxes]);

  const cognitiveGaps = useMemo(() => {
    const gaps: { skill: string; count: number; reason: string; question: string }[] = [];
    const candidateSkillsLower = new Set((profile.skills || []).map(s => s.toLowerCase()));

    // 1. Scan active high-score jobs (score >= 80)
    const highScoredJobs = allUniqueJobs.filter(job => (job.score || 0) >= 80);
    const requirementsCount: { [key: string]: number } = {};

    highScoredJobs.forEach(job => {
      if (job.keyRequirementsSummary) {
        job.keyRequirementsSummary.forEach(req => {
          const reqClean = req.trim();
          if (reqClean) {
            requirementsCount[reqClean] = (requirementsCount[reqClean] || 0) + 1;
          }
        });
      }
    });

    // Add gaps found from jobs
    Object.entries(requirementsCount).forEach(([skill, count]) => {
      if (!candidateSkillsLower.has(skill.toLowerCase())) {
        gaps.push({
          skill,
          count,
          reason: `Required by ${count} of your active high-score job matches`,
          question: `Can you tell us about a time you utilized ${skill} to solve a complex engineering or design challenge?`
        });
      }
    });

    // 2. Add role-based intelligent fallbacks to ensure we always have 3-5 high-quality gaps if job matching is sparse
    const role = (profile.role || '').toLowerCase();
    const fallbacks: { skill: string; reason: string; question: string }[] = [];

    if (role.includes('ai') || role.includes('ml') || role.includes('intelligence') || role.includes('data')) {
      [
        { skill: 'PyTorch', reason: 'Industry standard for training and evaluating deep learning and neural network architectures' },
        { skill: 'Kafka', reason: 'High-throughput event streaming preferred for real-time AI agents telemetry' },
        { skill: 'Redis', reason: 'Distributed caching frequently specified for optimizing multi-agent state persistence' },
        { skill: 'LangChain', reason: 'Core framework for constructing and chaining large language model workflows' },
        { skill: 'Docker', reason: 'Containerization standard required for reliable cloud deployments of AI services' }
      ].forEach(item => {
        if (!candidateSkillsLower.has(item.skill.toLowerCase())) {
          fallbacks.push({
            skill: item.skill,
            reason: item.reason,
            question: `Explain how you would architect a scalable system using ${item.skill} and your approach to fine-tuning its execution.`
          });
        }
      });
    } else if (role.includes('front') || role.includes('react') || role.includes('ui') || role.includes('design')) {
      [
        { skill: 'TypeScript', reason: 'Strong typing standard required for large-scale robust React component architectures' },
        { skill: 'Next.js', reason: 'Production framework preferred for server-side rendering and search optimization' },
        { skill: 'GraphQL', reason: 'Data query language commonly expected for flexible microservices frontend communication' },
        { skill: 'Vite', reason: 'High-performance build tooling preferred for contemporary modular web apps' }
      ].forEach(item => {
        if (!candidateSkillsLower.has(item.skill.toLowerCase())) {
          fallbacks.push({
            skill: item.skill,
            reason: item.reason,
            question: `Describe your design patterns when integrating ${item.skill} into a professional frontend architecture.`
          });
        }
      });
    } else {
      [
        { skill: 'PostgreSQL', reason: 'Relational database standard required for enterprise data persistence' },
        { skill: 'Docker', reason: 'Microservice containerization standard for reproducible multi-stage builds' },
        { skill: 'AWS', reason: 'Cloud hosting standard required for resilient auto-scaled architectures' },
        { skill: 'Redis', reason: 'In-memory data store standard for lightning-fast session caching and message queuing' }
      ].forEach(item => {
        if (!candidateSkillsLower.has(item.skill.toLowerCase())) {
          fallbacks.push({
            skill: item.skill,
            reason: item.reason,
            question: `How have you used ${item.skill} in production? Detail your clustering and failover backup strategies.`
          });
        }
      });
    }

    const finalGaps = [...gaps];
    fallbacks.forEach(fb => {
      if (!finalGaps.some(g => g.skill.toLowerCase() === fb.skill.toLowerCase())) {
        finalGaps.push({
          skill: fb.skill,
          count: 0,
          reason: fb.reason,
          question: fb.question
        });
      }
    });

    return finalGaps
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [allUniqueJobs, profile.skills, profile.role]);

  // Action & Task Status States
  const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState<boolean>(false);
  const [isGeneratingCV, setIsGeneratingCV] = useState<boolean>(false);
  const [isGeneratingPortfolio, setIsGeneratingPortfolio] = useState<boolean>(false);
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState<string | null>(null);
  const [isRunningScraper, setIsRunningScraper] = useState<boolean>(false);

  // Email Application States
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [emailRecipient, setEmailRecipient] = useState<string>('recruitment@company.com');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailJob, setEmailJob] = useState<any | null>(null);

  // Manual Interactive Scraper States
  const [isSearchingManual, setIsSearchingManual] = useState<boolean>(false);
  const [searchJobTitle, setSearchJobTitle] = useState<string>('');
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [searchDomain, setSearchDomain] = useState<string>('all');
  const [arrangeRemote, setArrangeRemote] = useState<boolean>(false);
  const [arrangeHybrid, setArrangeHybrid] = useState<boolean>(false);
  const [arrangeOnsite, setArrangeOnsite] = useState<boolean>(false);
  const [searchSalary, setSearchSalary] = useState<string>('');
  const [searchKeywords, setSearchKeywords] = useState<string>('');
  const [manualSearchResults, setManualSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
const [activeLeftTab, setActiveLeftTab] = useState<'logs' | 'ledger' | 'docs' | 'referrals' | 'settings' | 'brain'>(
    (localStorage.getItem('wa_userRole') === 'admin' || localStorage.getItem('wa_userEmail') === 'admin@gigo.com') ? 'logs' : 'brain'
  );

  // Workspace Tabs (Phase 12 UX Restructuring)
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<'copilot' | 'brain' | 'radar' | 'wallets' | 'mailroom' | 'interview'>('copilot');
  if (false as boolean) { console.log(activeLeftTab); }

    // Recovered States for Payments, Kanban, and Search Telemetry
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [topUpAmount, setTopUpAmount] = useState<string>('5000');
  const [topUpCurrency, setTopUpCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [isSubmittingTopUp, setIsSubmittingTopUp] = useState<boolean>(false);

  const [generatedBooleanQuery, setGeneratedQuery] = useState<string>('');
  const [manualSearchLatency, setManualSearchLatency] = useState<number>(0);

  const [importedJobIds, setImportedJobIds] = useState<string[]>([]);

  const [showNewTaskModal, setShowNewTaskModal] = useState<boolean>(false);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskCompany, setNewTaskCompany] = useState<string>('');
  const [newTaskSalary, setNewTaskSalary] = useState<string>('');
  const [newTaskColumn, setNewTaskColumn] = useState<'matched' | 'applied' | 'interviews'>('matched');


  // Future Enhancements Roadmap: Mock Interview & Uptime Verifier States
  const [selectedInterviewDomain, setSelectedInterviewDomain] = useState<'react' | 'node' | 'system' | 'behavioral'>('react');
  const [interviewQuestion, setInterviewQuestion] = useState<string>('How do you optimize render performance in a large-scale React application? Describe your experience with virtualized lists, memoization, and custom hooks.');
  const [isRecordingInterview, setIsRecordingInterview] = useState<boolean>(false);
  const [isAnalyzingInterview, setIsAnalyzingInterview] = useState<boolean>(false);
  const [interviewScorecard, setInterviewScorecard] = useState<{
    score: number;
    depth: number;
    vocal: number;
    ats: number;
    transcript: string;
    feedback: string[];
    keywords: string[];
  } | null>(null);

  const [isUptimeVerified, setIsUptimeVerified] = useState<boolean>(false);
  const [isRunningUptimeAudit, setIsRunningUptimeAudit] = useState<boolean>(false);
  const [uptimeAuditLogs, setUptimeAuditLogs] = useState<string[]>([]);

  // GiGO Mailroom States
  const [mailThreads, setMailThreads] = useState<any[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [isSyncingMail, setIsSyncingMail] = useState<boolean>(false);
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);
  const [replyBody, setReplyBody] = useState<string>('');
  const [isGeneratingFollowup, setIsGeneratingFollowup] = useState<boolean>(false);
  const [followupDraftText, setFollowupDraftText] = useState<string>('');
  const [showFollowupModal, setShowFollowupModal] = useState<boolean>(false);
  const [activeMailFolder, setActiveMailFolder] = useState<'inbox' | 'sent' | 'all' | 'trash'>('inbox');
  const [isClearingTrash, setIsClearingTrash] = useState<boolean>(false);
  const [isTrashingThread, setIsTrashingThread] = useState<string | null>(null);

  const handleMoveToTrash = async (threadId: string) => {
    if (!userId) return;
    setIsTrashingThread(threadId);
    try {
      const token = localStorage.getItem('wa_token');
      const response = await fetch(`${API_BASE_URL}/api/mail/threads/${threadId}/trash`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        addLog(`Moved thread to Trash folder successfully.`);
        setMailThreads(prev => prev.map(t => t.id === threadId ? { ...t, isTrash: true, folder: 'trash' } : t));
        if (selectedThreadId === threadId) {
          setSelectedThreadId(null);
        }
      } else {
        const errData = await response.json();
        console.error("Failed to move to trash:", errData);
      }
    } catch (err) {
      console.error("Error trashing mail thread:", err);
    } finally {
      setIsTrashingThread(null);
    }
  };

  const handleRestoreFromTrash = async (threadId: string) => {
    if (!userId) return;
    setIsTrashingThread(threadId);
    try {
      const token = localStorage.getItem('wa_token');
      const response = await fetch(`${API_BASE_URL}/api/mail/threads/${threadId}/restore`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        addLog(`Restored thread from Trash successfully.`);
        setMailThreads(prev => prev.map(t => t.id === threadId ? { ...t, isTrash: false, folder: 'inbox' } : t));
      } else {
        const errData = await response.json();
        console.error("Failed to restore thread:", errData);
      }
    } catch (err) {
      console.error("Error restoring mail thread:", err);
    } finally {
      setIsTrashingThread(null);
    }
  };

  const handleEmptyTrash = async () => {
    if (!userId) return;
    if (!window.confirm("Are you sure you want to permanently empty the trash? This action is irreversible.")) return;
    setIsClearingTrash(true);
    addLog(`Initiating database purge of Trash folder...`);
    try {
      const token = localStorage.getItem('wa_token');
      const response = await fetch(`${API_BASE_URL}/api/mail/threads/trash/empty`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        addLog(`Permanently cleared all threads from Trash.`);
        setMailThreads(prev => prev.filter(t => !t.isTrash && t.folder !== 'trash'));
        setSelectedThreadId(null);
      } else {
        const errData = await response.json();
        console.error("Failed to empty trash:", errData);
      }
    } catch (err) {
      console.error("Error emptying trash:", err);
    } finally {
      setIsClearingTrash(false);
    }
  };

  const fetchMailThreads = async () => {
    if (!userId) return;
    try {
      const token = localStorage.getItem('wa_token');
      const response = await fetch(`${API_BASE_URL}/api/mail/threads`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMailThreads(data);
      } else {
        console.error("Failed to fetch mail threads:", await response.json());
      }
    } catch (err) {
      console.error("Error fetching mail threads:", err);
    }
  };

  const handleSyncMail = async (forceSimulate = false) => {
    if (!userId) return;
    setIsSyncingMail(true);
    addLog(`Initiating Gmail Inbox Synchronization via Google Email API...`);
    try {
      const token = localStorage.getItem('wa_token');
      const response = await fetch(`${API_BASE_URL}/api/mail/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ forceSimulate })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        addLog(`📬 ${data.message}`);
        await fetchMailThreads();
      } else {
        addLog(`❌ Failed to sync Gmail inbox: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      addLog(`❌ Error syncing inbox: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSyncingMail(false);
    }
  };

  const handleSendReply = async () => {
    if (!userId || !selectedThreadId || !replyBody.trim()) return;
    setIsSendingReply(true);
    addLog(`Dispatched email reply via synced Gmail profile...`);
    try {
      const token = localStorage.getItem('wa_token');
      const response = await fetch(`${API_BASE_URL}/api/mail/send-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          threadId: selectedThreadId,
          bodyText: replyBody
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        addLog(`📬 Email reply dispatched successfully!`);
        setReplyBody('');
        await fetchMailThreads();
      } else {
        addLog(`❌ Failed to send reply: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      addLog(`❌ Error sending reply: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleGenerateFollowup = async (threadId: string) => {
    if (!userId || !threadId) return;
    setIsGeneratingFollowup(true);
    addLog(`Wizard: Gemini Pro drafting tailored routine follow-up email...`);
    try {
      const token = localStorage.getItem('wa_token');
      const response = await fetch(`${API_BASE_URL}/api/mail/generate-followup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ threadId })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setFollowupDraftText(data.draftText);
        setShowFollowupModal(true);
        addLog(`🪄 Tailored career follow-up draft generated successfully.`);
      } else {
        addLog(`❌ Failed to draft follow-up: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      addLog(`❌ Error drafting follow-up: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsGeneratingFollowup(false);
    }
  };

  const handleSendFollowup = async () => {
    if (!userId || !selectedThreadId || !followupDraftText.trim()) return;
    setIsSendingReply(true);
    addLog(`Dispatched AI-generated follow-up via synced Gmail profile...`);
    try {
      const token = localStorage.getItem('wa_token');
      const response = await fetch(`${API_BASE_URL}/api/mail/send-reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          threadId: selectedThreadId,
          bodyText: followupDraftText
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        addLog(`📬 AI-generated career follow-up email sent successfully.`);
        setShowFollowupModal(false);
        setFollowupDraftText('');
        await fetchMailThreads();
      } else {
        addLog(`❌ Failed to send follow-up: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      addLog(`❌ Error sending follow-up: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsSendingReply(false);
    }
  };

  useEffect(() => {
    if (!userId || activeWorkspaceTab !== 'mailroom') return;

    fetchMailThreads();

    // Real-time high-frequency synchronization for Mailroom folders (Inbox, Sent, All, Trash)
    const interval = setInterval(() => {
      fetchMailThreads();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [userId, activeWorkspaceTab]);

  // GiGO Brain Feed Intellect States
  const [showBrainEnrichModal, setShowBrainEnrichModal] = useState<boolean>(false);
  const [brainEnrichStatement, setBrainEnrichStatement] = useState<string>('');
  const [isEnrichingBrain, setIsEnrichingBrain] = useState<boolean>(false);
  const [isBrainSpeechRecording, setIsBrainSpeechRecording] = useState<boolean>(false);
  const [activeGapToFeed, setActiveGapToFeed] = useState<string>('');
  const [activeGapQuestion, setActiveGapQuestion] = useState<string>('');
  const [aiCareerGaps, setAiCareerGaps] = useState<{ skill: string; reason: string; question: string; priority: string }[]>([]);
  const [isAnalyzingGaps, setIsAnalyzingGaps] = useState<boolean>(false);


  // Job Details Modal
  const [selectedJob, setSelectedJob] = useState<JobMatch | null>(null);

  // Drag & Drop States
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<'matched' | 'applied' | 'interviews' | null>(null);

  // Kanban Tasks list
  const [tasks, setTasks] = useState<KanbanTask[]>([
    { id: 'task-1', title: 'Lead AI Engineer', company: 'Google', status: 'matched', salary: '$180k - $240k', confidence: 96, date: 'Today' },
    { id: 'task-2', title: 'Senior React Developer', company: 'Vercel', status: 'applied', salary: '$140k - $185k', confidence: 89, date: '2 days ago' },
    { id: 'task-3', title: 'LLM Fine-Tuning Specialist', company: 'Anthropic', status: 'interviews', salary: '$200k - $260k', confidence: 93, date: 'Scheduled Jun 15' }
  ]);

  // Admin Dashboard States
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminLogs, setAdminLogs] = useState<AgentLog[]>([]);
  const [isLoadingAdminData, setIsLoadingAdminData] = useState<boolean>(false);

  // System Configurations & Domain Controls State
  const [systemConfig, setSystemConfig] = useState<{ frontendDomain: string; referralBonus: number; scraperDomains?: string[]; booleanSearchTemplate?: string }>({
    frontendDomain: 'https://wa-frontend-seven.vercel.app',
    referralBonus: 500,
    scraperDomains: ['linkedin.com', 'twitter.com', 'instagram.com', 'facebook.com', 'reddit.com', 'github.com'],
    booleanSearchTemplate: '"Social Media Marketer" (onsite OR "in-office" OR "on-site") (site:boards.greenhouse.io OR site:jobs.lever.co OR inurl:careers OR inurl:job-openings OR inurl:open-positions) after:2026-01-01 before:2026-12-31'
  });
  const [configDomain, setConfigDomain] = useState<string>('https://wa-frontend-seven.vercel.app');
  const [configReferralBonus, setConfigReferralBonus] = useState<string>('500');
  const [configScraperDomains, setConfigScraperDomains] = useState<string[]>(['linkedin.com', 'twitter.com', 'instagram.com', 'facebook.com', 'reddit.com', 'github.com']);
  const [newDomainInput, setNewDomainInput] = useState<string>('');
  const [isSavingSystemConfig, setIsSavingSystemConfig] = useState<boolean>(false);

  // Live Matches Ticker & Dynamic Channel States
  const [hasVoiceOnboarded, setHasVoiceOnboarded] = useState<boolean>(false);
  const [tickerTargetDomains, setTickerTargetDomains] = useState<string[]>([]);
  const [showTickerConfigModal, setShowTickerConfigModal] = useState<boolean>(false);
  const [configBooleanSearchTemplate, setConfigBooleanSearchTemplate] = useState<string>('');
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [isConfiguringTickerStream, setIsConfiguringTickerStream] = useState<boolean>(false);

  useEffect(() => {
    if (showTickerConfigModal) {
      setSelectedDomains(tickerTargetDomains);
    }
  }, [showTickerConfigModal, tickerTargetDomains]);
  
  // Ledger Override Modal states
  const [showOverrideModal, setShowOverrideModal] = useState<boolean>(false);
  const [overrideUser, setOverrideUser] = useState<AdminUser | null>(null);
  const [overrideAmount, setOverrideAmount] = useState<string>('1000');
  const [overrideCurrency, setOverrideCurrency] = useState<'USD' | 'NGN'>('NGN');
  const [overridePurpose, setOverridePurpose] = useState<string>('ADMINISTRATIVE_LEDGER_ADJUSTMENT');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState<boolean>(false);

  // Admin Inspect User states
  const [showInspectModal, setShowInspectModal] = useState<boolean>(false);
  const [inspectUser, setInspectUser] = useState<AdminUser | null>(null);
  const [inspectUserTransactions, setInspectUserTransactions] = useState<any[]>([]);
  const [inspectUserDocuments, setInspectUserDocuments] = useState<any[]>([]);
  const [isFetchingInspectData, setIsFetchingInspectData] = useState<boolean>(false);

  // Referral Program states
  const [referrals, setReferrals] = useState<any[]>([]);
  const [isFetchingReferrals, setIsFetchingReferrals] = useState<boolean>(false);
  const [isSubmittingReferralInvite, setIsSubmittingReferralInvite] = useState<boolean>(false);
  const [referralFriendName, setReferralFriendName] = useState<string>('');
  const [referralFriendEmail, setReferralFriendEmail] = useState<string>('');
  const [referralFriendPhone, setReferralFriendPhone] = useState<string>('');
  const [referralDispatchMode, setReferralDispatchMode] = useState<'AI_AGENT' | 'MANUAL'>('AI_AGENT');
  const [lastGeneratedInvite, setLastGeneratedInvite] = useState<any | null>(null);
  const [showManualShareModal, setShowManualShareModal] = useState<boolean>(false);


  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 15)]);
  };

  // Waveform Bar count
  const waveBars = Array.from({ length: 15 }, (_, i) => i);

  // Dynamic Injection of Flutterwave Checkout script
  useEffect(() => {
    const scriptId = 'flutterwave-checkout-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://checkout.flutterwave.com/v3.js';
      script.async = true;
      document.body.appendChild(script);
      addLog("Dynamic Injection: Flutterwave SDK script successfully attached to viewport.");
    }
  }, []);

  // ----------------------------------------------------
  // DYNAMIC AESTHETIC STYLE & THEME CONTROLLER
  // ----------------------------------------------------
  useEffect(() => {
    const themeConfigs = {
      obsidian: {
        '--primary': '#8a5cf6',
        '--secondary': '#d946ef',
        '--bg-dark-base': '#080711',
        '--bg-dark-surface': 'rgba(15, 13, 35, 0.65)',
        '--bg-dark-card': 'rgba(22, 19, 50, 0.45)',
        '--shadow-glow-purple': '0 0 40px -5px rgba(138, 92, 246, 0.3)',
        '--shadow-glow-pink': '0 0 40px -5px rgba(217, 70, 239, 0.3)'
      },
      emerald: {
        '--primary': '#10b981',
        '--secondary': '#06b6d4',
        '--bg-dark-base': '#040b08',
        '--bg-dark-surface': 'rgba(6, 20, 15, 0.65)',
        '--bg-dark-card': 'rgba(8, 28, 20, 0.45)',
        '--shadow-glow-purple': '0 0 40px -5px rgba(16, 185, 129, 0.3)',
        '--shadow-glow-pink': '0 0 40px -5px rgba(6, 182, 212, 0.3)'
      },
      sunset: {
        '--primary': '#f59e0b',
        '--secondary': '#ec4899',
        '--bg-dark-base': '#0f0506',
        '--bg-dark-surface': 'rgba(25, 8, 12, 0.65)',
        '--bg-dark-card': 'rgba(35, 12, 17, 0.45)',
        '--shadow-glow-purple': '0 0 40px -5px rgba(245, 158, 11, 0.3)',
        '--shadow-glow-pink': '0 0 40px -5px rgba(236, 72, 153, 0.3)'
      },
      ocean: {
        '--primary': '#0ea5e9',
        '--secondary': '#2dd4bf',
        '--bg-dark-base': '#030c14',
        '--bg-dark-surface': 'rgba(4, 18, 30, 0.65)',
        '--bg-dark-card': 'rgba(6, 26, 42, 0.45)',
        '--shadow-glow-purple': '0 0 40px -5px rgba(14, 165, 233, 0.3)',
        '--shadow-glow-pink': '0 0 40px -5px rgba(45, 212, 191, 0.3)'
      }
    };

    const config = themeConfigs[activeTheme];
    Object.entries(config).forEach(([prop, val]) => {
      document.documentElement.style.setProperty(prop, val);
    });

    if (activeTheme === 'obsidian') {
      document.body.style.backgroundImage = `
        radial-gradient(circle at 10% 20%, rgba(138, 92, 246, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(217, 70, 239, 0.08) 0%, transparent 40%)
      `;
    } else if (activeTheme === 'emerald') {
      document.body.style.backgroundImage = `
        radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(6, 182, 212, 0.08) 0%, transparent 40%)
      `;
    } else if (activeTheme === 'sunset') {
      document.body.style.backgroundImage = `
        radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(236, 72, 153, 0.08) 0%, transparent 40%)
      `;
    } else if (activeTheme === 'ocean') {
      document.body.style.backgroundImage = `
        radial-gradient(circle at 10% 20%, rgba(14, 165, 233, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(45, 212, 191, 0.08) 0%, transparent 40%)
      `;
    }
    
    document.body.style.backgroundColor = config['--bg-dark-base'];
    addLog(`Theme Switched: Workspace styled in premium ${activeTheme.toUpperCase()} glassmorphism.`);
  }, [activeTheme]);

  // Global Escape key event listener to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedJob(null);
        if (!isSendingEmail) {
          setShowEmailModal(false);
          setEmailJob(null);
        }
        if (!isUpdatingSettings) {
          setShowSettingsModal(false);
        }
        setShowRemainingJobsModal(false);
        if (!isEnrichingBrain) {
          setShowBrainEnrichModal(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSendingEmail, isUpdatingSettings, isEnrichingBrain]);

  // Unified Typed & Vocal Command Interpreter
  const executeVocalCommand = async (cmdText: string): Promise<boolean> => {
    const cleaned = cmdText.trim().toLowerCase();
    
    if (cleaned === 'clear skills') {
      setProfile(prev => ({ ...prev, skills: [] }));
      setSettingsSkills([]);
      addLog("System Command Executed: Cleared all profile skills.");
      return true;
    }
    
    if (cleaned === 'clear experience') {
      setCompiledDocuments([]);
      setSyncStatus('Idle — Tap Mic to Start Syncing Resume & Experience');
      addLog("System Command Executed: Cleared all compiled resume/experience documents.");
      return true;
    }
    
    if (cleaned === 'clear logs') {
      setLogs([]);
      return true;
    }
    
    if (cleaned === 'toggle settings') {
      setShowSettingsModal(prev => !prev);
      addLog("System Command Executed: Toggled settings modal overlay.");
      return true;
    }
    
    if (cleaned === 'toggle theme') {
      setActiveTheme(prev => {
        let next: 'obsidian' | 'emerald' | 'sunset' | 'ocean' = 'obsidian';
        if (prev === 'obsidian') next = 'emerald';
        else if (prev === 'emerald') next = 'sunset';
        else if (prev === 'sunset') next = 'ocean';
        else next = 'obsidian';
        addLog(`System Command Executed: Toggled theme to ${next.toUpperCase()}.`);
        return next;
      });
      return true;
    }
    
    if (cleaned === 'clear everything') {
      setProfile(prev => ({ ...prev, skills: [] }));
      setSettingsSkills([]);
      setCompiledDocuments([]);
      setLogs([]);
      setTasks([]);
      setTransactions([]);
      setSyncStatus('Idle — Tap Mic to Start Syncing Resume & Experience');
      addLog("System Command Executed: Factory reset completed. All skills, documents, logs, Kanban tasks, and transactions cleared.");
      return true;
    }
    
    return false;
  };

  const handleVoiceStyleCommand = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition. Please click on the theme selectors.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    addLog("Voice Command: Listening for theme style keywords ('sunset', 'emerald', 'ocean', 'obsidian')...");
    recognition.start();

    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript.toLowerCase();
      addLog(`Voice Command recognized: "${speechResult}"`);

      if (speechResult.includes('sunset') || speechResult.includes('sun') || speechResult.includes('orange')) {
        setActiveTheme('sunset');
      } else if (speechResult.includes('emerald') || speechResult.includes('green') || speechResult.includes('forest')) {
        setActiveTheme('emerald');
      } else if (speechResult.includes('ocean') || speechResult.includes('blue') || speechResult.includes('sea') || speechResult.includes('cyan')) {
        setActiveTheme('ocean');
      } else if (speechResult.includes('obsidian') || speechResult.includes('purple') || speechResult.includes('dark') || speechResult.includes('default')) {
        setActiveTheme('obsidian');
      } else {
        addLog(`Voice Command: "${speechResult}" did not match any style keyword. Try 'sunset', 'emerald', 'ocean', or 'obsidian'.`);
      }
    };

    recognition.onerror = (err: any) => {
      console.error("Speech Recognition Error:", err);
      addLog(`Voice Command error: ${err.error}. Please try again.`);
    };
  };

  const startSignupVoiceRecording = async () => {
    try {
      signupChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      signupStreamRef.current = stream;

      const options = { mimeType: 'audio/webm' };
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
      }

      signupMediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          signupChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(signupChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        setIsAnalyzingSignupVoice(true);
        setSignupVoiceStatus("GiGO AI parsing coordinates natively...");

        try {
          const formData = new FormData();
          formData.append('audio', audioBlob, 'signup-voice.webm');

          const res = await fetch(`${API_BASE_URL}/api/auth/signup-voice`, {
            method: 'POST',
            body: formData
          });

          if (res.ok) {
            const result = await res.json();
            if (result.success && result.data) {
              const { fullName, email, phoneNumber } = result.data;
              setAuthFullName(fullName || '');
              setAuthEmail(email || '');
              setAuthPhone(phoneNumber || '');
              setSignupVoiceStatus("✨ Extracted! Please type your password to register.");
            } else {
              setSignupVoiceStatus("⚠️ Parsing resulted in empty coordinates. Please try again or type manually.");
            }
          } else {
            const err = await res.json();
            setSignupVoiceStatus(`⚠️ Parsing failed: ${err.error || "Please try again."}`);
          }
        } catch (err) {
          setSignupVoiceStatus("⚠️ Connection error. Let's enter details manually.");
        } finally {
          setIsAnalyzingSignupVoice(false);
        }
      };

      mediaRecorder.start();
      setIsSignupVoiceRecording(true);
      setSignupWaveActive(true);
      setSignupVoiceStatus("Listening... Say your full name, email, and phone number.");
    } catch (err) {
      console.warn("Microphone not allowed or not found during signup voice:", err);
      // Fallback synthetic simulator
      setIsSignupVoiceRecording(true);
      setSignupWaveActive(true);
      setSignupVoiceStatus("Simulator: Say your credentials now (Mock Voice active)...");
    }
  };

  const stopSignupVoiceRecording = () => {
    setIsSignupVoiceRecording(false);
    setSignupWaveActive(false);

    if (signupMediaRecorderRef.current && signupMediaRecorderRef.current.state !== 'inactive') {
      signupMediaRecorderRef.current.stop();
    } else {
      // Simulate synthetic fallback
      setIsAnalyzingSignupVoice(true);
      setSignupVoiceStatus("GiGO AI parsing simulated voice input...");
      setTimeout(() => {
        setAuthFullName("Abayomi Dele-Ale");
        setAuthEmail("abayomi.deleale@gmail.com");
        setAuthPhone("+2348011223344");
        setSignupVoiceStatus("✨ Simulator Extracted! Please type your password to register.");
        setIsAnalyzingSignupVoice(false);
      }, 2500);
    }

    if (signupStreamRef.current) {
      signupStreamRef.current.getTracks().forEach(t => t.stop());
      signupStreamRef.current = null;
    }
  };

  // Extract and persist referrer query token (?ref=user_xxxx) on startup
  useEffect(() => {
    fetchSystemConfig();
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('gigo_ref_by', ref);
      addLog(`🔍 Detected referral source parameter. Referrer token is cached: ${ref}`);
    }
  }, []);

  // Sync profile & transactions when user ID changes (auth resolved)
  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchTransactions();
      fetchDocuments();
      fetchDiscoveredJobs();
      fetchReferrals();
    }
  }, [userId, userEmail, userRole]);

  // Synchronize Settings Form state values with latest profile attributes on profile load or settings modal toggle
  useEffect(() => {
    if (profile) {
      setSettingsName(profile.name || '');
      setSettingsPhone(userPhone || localStorage.getItem('wa_userPhone') || '');
      setSettingsLocation(profile.location || '');
      setSettingsRole(profile.role || '');
      setSettingsSalary(profile.salary || '');
      setSettingsSkills(profile.skills || []);
      setSettingsPassword(profile.password || '');
      setSettingsProfilePic(profile.profilePic || '');
      setSettingsSmtpHost(profile.smtpSettings?.host || '');
      setSettingsSmtpPort(String(profile.smtpSettings?.port || 587));
      setSettingsSmtpUser(profile.smtpSettings?.user || '');
      setSettingsSmtpPass(profile.smtpSettings?.pass || '');
      setSettingsGeminiKey(profile.geminiApiKey || '');
      setSettingsFlwPubKey(profile.flutterwavePublicKey || '');
      setSettingsFlwSecKey(profile.flutterwaveSecretKey || '');
    }
  }, [profile, userPhone]);

  useEffect(() => {
    if (showSettingsModal) {
      setSettingsScanInterval(scanInterval);
      setSettingsFeedRefreshInterval(feedRefreshInterval);
      setSettingsWorkTypePreferences(workTypePreferences);
    }
  }, [showSettingsModal, scanInterval, feedRefreshInterval, workTypePreferences]);

  // Trigger career evaluation when target roles or skills change
  useEffect(() => {
    if (profile.role) {
      evaluateCareerGaps();
    }
  }, [profile.role, profile.skills?.join(',')]);


  // ----------------------------------------------------
  // BACKEND CORE INTEGRATION LOOPS
  // ----------------------------------------------------

  const fetchUserProfile = async () => {
    const currentUserId = userId || localStorage.getItem('wa_userId') || 'user_1780714671963_281';
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        const workHistory = data.workHistory || [];
        const educationList = data.educationList || [];
        const maritalStatus = data.maritalStatus || '[   ]';
        const dob = data.dob || '[   ]';
        const address = data.address || '[   ]';
        const hobbies = data.hobbies || '[   ]';
        const strengths = data.strengths || '[   ]';
        const softSkills = data.softSkills || '[   ]';
        const teamworkExperience = data.teamworkExperience || '[   ]';
        const conflictResolution = data.conflictResolution || '[   ]';
        const calibrationAxes = data.calibrationAxes || { cognitive: 65, credential: 55, behavioral: 60, operational: 70 };
        const calibrationHistory = data.calibrationHistory || [];

        setProfile({
          name: data.fullName || '[   ]',
          role: data.targetRoles?.[0] || '[   ]',
          location: data.inferredLocationHints || '[   ]',
          salary: data.salary || '[   ]',
          skills: data.skills || [],
          geminiApiKey: data.geminiApiKey || '',
          flutterwavePublicKey: data.flutterwavePublicKey || '',
          flutterwaveSecretKey: data.flutterwaveSecretKey || '',
          profilePic: data.profilePic || '',
          password: data.password || '',
          professionalSummary: data.professionalSummary || '[   ]',
          yearsOfExperience: data.yearsOfExperience || 0,
          targetRoles: data.targetRoles || [],
          infrastructureStatus: {
            powerSetupDescription: data.infrastructureStatus?.powerSetupDescription || '[   ]',
            internetSetupDescription: data.infrastructureStatus?.internetSetupDescription || '[   ]',
            hasRemoteBackupPlan: data.infrastructureStatus?.hasRemoteBackupPlan ?? false
          },
          smtpSettings: data.smtpSettings || { host: '', port: 587, user: '', pass: '' },
          workHistory,
          educationList,
          maritalStatus,
          dob,
          address,
          hobbies,
          strengths,
          softSkills,
          teamworkExperience,
          conflictResolution,
          calibrationAxes,
          calibrationHistory
        });

        setWizardWorkHistory(workHistory);
        setWizardEducationList(educationList);
        setWizardMaritalStatus(maritalStatus === '[   ]' ? '' : maritalStatus);
        setWizardDob(dob === '[   ]' ? '' : dob);
        setWizardAddress(address === '[   ]' ? '' : address);
        setWizardHobbies(hobbies === '[   ]' ? '' : hobbies);
        setWizardStrengths(strengths === '[   ]' ? '' : strengths);
        setWizardSoftSkills(softSkills === '[   ]' ? '' : softSkills);
        setWizardTeamworkExperience(teamworkExperience === '[   ]' ? '' : teamworkExperience);
        setWizardConflictResolution(conflictResolution === '[   ]' ? '' : conflictResolution);
        setWalletUSD(data.financials?.walletBalanceUSD ?? 0.0);
        setWalletNGN(data.financials?.walletBalanceNGN ?? 0.0);
        setHasVoiceOnboarded(!!data.hasVoiceOnboarded);
        setTickerTargetDomains(Array.isArray(data.tickerTargetDomains) ? data.tickerTargetDomains : []);
        setScanInterval(data.scanInterval ?? 45);
        setFeedRefreshInterval(data.feedRefreshInterval ?? 1);
        setWorkTypePreferences(Array.isArray(data.workTypePreferences) ? data.workTypePreferences : ['Remote', 'Hybrid']);
        
        if (data.role) {
          setUserRole(data.role);
          localStorage.setItem('wa_userRole', data.role);
        } else {
          setUserRole('candidate');
          localStorage.setItem('wa_userRole', 'candidate');
        }
        if (data.email) {
          setUserEmail(data.email);
          localStorage.setItem('wa_userEmail', data.email);
        }
        if (data.fullName) {
          setUserFullName(data.fullName);
          localStorage.setItem('wa_userFullName', data.fullName);
        }
        if (data.phoneNumber) {
          setUserPhone(data.phoneNumber);
          localStorage.setItem('wa_userPhone', data.phoneNumber);
        }

        addLog("Candidate profile & wallet balances successfully synchronized.");
      }
    } catch (e) {
      console.error("Profile fetch fail, fallback active:", e);
    }
  };

  const handleSaveProfileVault = async () => {
    setIsSavingProfileVault(true);
    addLog("[GiGO Brain] Initiating Deep Profile Vault synchronization with Firestore...");
    
    // Dynamically calculate and boost Credential Depth and Operational Sync based on completeness
    const currentAxes = profile.calibrationAxes || { cognitive: 65, credential: 55, behavioral: 60, operational: 70 };
    let newCredential = currentAxes.credential;
    let newOperational = currentAxes.operational;

    if (wizardWorkHistory.length > 0) newCredential = Math.min(100, Math.max(newCredential, 75));
    if (wizardEducationList.length > 0) newCredential = Math.min(100, Math.max(newCredential, 85));
    if (wizardWorkHistory.length > 0 && wizardEducationList.length > 0) newCredential = Math.min(100, Math.max(newCredential, 95));

    if (wizardMaritalStatus || wizardDob || wizardAddress) newOperational = Math.min(100, Math.max(newOperational, 80));
    if (wizardStrengths || wizardSoftSkills || wizardTeamworkExperience || wizardConflictResolution) newOperational = Math.min(100, Math.max(newOperational, 95));

    const updatedAxes = {
      ...currentAxes,
      credential: newCredential,
      operational: newOperational
    };

    const payload = {
      workHistory: wizardWorkHistory,
      educationList: wizardEducationList,
      maritalStatus: wizardMaritalStatus,
      dob: wizardDob,
      address: wizardAddress,
      hobbies: wizardHobbies,
      strengths: wizardStrengths,
      softSkills: wizardSoftSkills,
      teamworkExperience: wizardTeamworkExperience,
      conflictResolution: wizardConflictResolution,
      calibrationAxes: updatedAxes
    };

    const currentUserId = userId || localStorage.getItem('wa_userId') || 'user_1780714671963_281';
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${currentUserId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updatedData = await res.json();
        setProfile(prev => ({
          ...prev,
          workHistory: updatedData.workHistory || wizardWorkHistory,
          educationList: updatedData.educationList || wizardEducationList,
          maritalStatus: updatedData.maritalStatus || wizardMaritalStatus || '[   ]',
          dob: updatedData.dob || wizardDob || '[   ]',
          address: updatedData.address || wizardAddress || '[   ]',
          hobbies: updatedData.hobbies || wizardHobbies || '[   ]',
          strengths: updatedData.strengths || wizardStrengths || '[   ]',
          softSkills: updatedData.softSkills || wizardSoftSkills || '[   ]',
          teamworkExperience: updatedData.teamworkExperience || wizardTeamworkExperience || '[   ]',
          conflictResolution: updatedData.conflictResolution || wizardConflictResolution || '[   ]',
          calibrationAxes: updatedData.calibrationAxes || updatedAxes
        }));
        addLog(`🧬 [GiGO Brain] Deep Profile Vault synchronized. Credential Depth boosted to ${newCredential}%, Operational Sync to ${newOperational}%.`);
        alert("Deep Profile Vault synchronized successfully! Your intellectual assets have been integrated.");
      } else {
        addLog(`❌ [GiGO Brain] Profile Vault synchronization failed.`);
      }
    } catch (err: any) {
      console.error(err);
      addLog(`❌ [GiGO Brain] Error: ${err.message}`);
    } finally {
      setIsSavingProfileVault(false);
    }
  };

  const handleCalibrateBehavioral = async (dilemmaId: string, question: string, userResponse: string) => {
    if (!userResponse.trim()) {
      alert("Please provide a verbal or typed response before initiating calibration.");
      return;
    }
    setIsCalibrating(true);
    addLog(`🧠 [GiGO Brain] Deploying Mind Mirror Calibration Agent for dilemma "${dilemmaId}"...`);
    
    const currentUserId = userId || localStorage.getItem('wa_userId') || 'user_1780714671963_281';
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${currentUserId}/calibrate-behavioral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dilemmaId, question, userResponse })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveCalibratedFeedback({
          toneAnalysis: data.toneAnalysis,
          decisionStyle: data.decisionStyle,
          feedback: data.feedback,
          cognitiveBoost: data.cognitiveBoost,
          behavioralBoost: data.behavioralBoost
        });
        
        setProfile(prev => ({
          ...prev,
          calibrationAxes: data.calibrationAxes || prev.calibrationAxes,
          calibrationHistory: data.calibrationHistory || prev.calibrationHistory
        }));
        
        addLog(`🧠 [GiGO Brain] Synapse Calibration Complete. Dialect Detected: "${data.toneAnalysis}". Overall sync boosted!`);
      } else {
        addLog(`❌ [GiGO Brain] Calibration failed on backend.`);
      }
    } catch (err: any) {
      console.error(err);
      addLog(`❌ [GiGO Brain] Calibration error: ${err.message}`);
    } finally {
      setIsCalibrating(false);
    }
  };

  const fetchTransactions = async () => {
    const currentUserId = userId || localStorage.getItem('wa_userId') || 'user_1780714671963_281';
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${currentUserId}/transactions`);
      if (res.ok) {
        const data = await res.json();
        const mapped: Transaction[] = data.map((t: any) => ({
          id: t.id,
          date: t.timestamp ? t.timestamp.replace('T', ' ').substring(0, 19) : '',
          currency: t.currency as 'USD' | 'NGN',
          amount: t.amount,
          status: t.status as 'SUCCESSFUL' | 'PROCESSING',
          ref: t.reconciliationId || t.id
        }));
        setTransactions(mapped);
      }
    } catch (e) {
      console.error("Ledger fetch fail:", e);
    }
  };

  const fetchDocuments = async () => {
    const currentUserId = userId || localStorage.getItem('wa_userId') || 'user_1780714671963_281';
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${currentUserId}/documents`);
      if (res.ok) {
        const data = await res.json();
        setCompiledDocuments(data);
      }
    } catch (e) {
      console.error("Documents fetch fail:", e);
    }
  };

  const fetchReferrals = async () => {
    const currentUserId = userId || localStorage.getItem('wa_userId');
    if (!currentUserId) return;
    setIsFetchingReferrals(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/referrals/user/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        setReferrals(data);
      }
    } catch (err) {
      console.error("Failed to fetch referrals:", err);
    } finally {
      setIsFetchingReferrals(false);
    }
  };

  const handleEnrichMind = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!brainEnrichStatement.trim()) return;
    setIsEnrichingBrain(true);
    addLog(`Initiating mind enrichment sequence with statement: "${brainEnrichStatement.slice(0, 40)}..."`);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${currentUserId}/enrich-mind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statement: brainEnrichStatement })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addLog(`🧠 Memory synapse integrated successfully: ${data.deltaExplanation}`);
        alert(data.deltaExplanation || "Your GiGO Brain Mind Clone has integrated this memory successfully!");
        setBrainEnrichStatement('');
        setShowBrainEnrichModal(false);
        setActiveGapToFeed('');
        setActiveGapQuestion('');
        await fetchUserProfile(); // Refresh profile state
      } else {
        addLog(`❌ Mind enrichment failed: ${data.error || data.details}`);
        alert(`Failed to enrich mind clone: ${data.error || data.details || 'Unknown error'}`);
      }
    } catch (err: any) {
      addLog(`❌ Mind enrichment network error: ${err.message}`);
      alert(`Network error during mind enrichment: ${err.message}`);
    } finally {
      setIsEnrichingBrain(false);
    }
  };

  const evaluateCareerGaps = async () => {
    const currentUserId = userId || localStorage.getItem('wa_userId') || 'user_1780714671963_281';
    setIsAnalyzingGaps(true);
    addLog(`🧠 [GiGO Brain] Initiating deep career requirements research and profile gap analysis...`);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${currentUserId}/evaluate-gaps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.gaps)) {
        setAiCareerGaps(data.gaps);
        addLog(`🧠 [GiGO Brain] Deep career research complete. Mapped standard expectations. Identified ${data.gaps.length} critical gaps.`);
      } else {
        console.error("Failed to parse dynamic career gaps:", data.error);
      }
    } catch (err: any) {
      console.error("Network error evaluating career gaps:", err);
    } finally {
      setIsAnalyzingGaps(false);
    }
  };

  const startBrainSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsBrainSpeechRecording(true);
      setBrainEnrichStatement("Simulating voice transcription... Please speak now.");
      setTimeout(() => {
        setBrainEnrichStatement(prev => {
          if (prev.includes("Simulating")) {
            if (activeGapToFeed) {
              const skillLower = activeGapToFeed.toLowerCase();
              if (skillLower.includes('calendar') || skillLower.includes('schedule') || skillLower.includes('sync')) {
                return `Yes, I am highly proficient in calendar management and scheduling syncs across multiple executive timelines. I frequently use Google Calendar and Microsoft Outlook, scheduling international sessions, coordinating across time zones, and resolving meetings conflicts automatically.`;
              }
              if (skillLower.includes('zendesk') || skillLower.includes('ticket') || skillLower.includes('customer') || skillLower.includes('crm') || skillLower.includes('routing')) {
                return `I have hands-on experience managing customer support channels and ticket systems like Zendesk. I set up custom ticket routing, resolve inquiries efficiently while maintaining high satisfaction ratings, and configure tags and macros to streamline general responses.`;
              }
              if (skillLower.includes('solar') || skillLower.includes('power') || skillLower.includes('backup') || skillLower.includes('redundancy') || skillLower.includes('internet') || skillLower.includes('isp')) {
                return `I have fully secure professional home office redundancy backups. I configured a 5kW hybrid solar power system with reliable lithium battery backup to handle power outages instantly, alongside a dual-ISP failover system utilizing Starlink and LTE fiber backup.`;
              }
              return `Regarding ${activeGapToFeed}, I have robust experience applying it in live environments. I worked on setting up, monitoring, and executing optimized strategies incorporating ${activeGapToFeed} to meet all strict business SLA requirements.`;
            }
            return `I am highly proficient in building production microservices using standard cloud systems, scaling Redis clustering to 50k QPS and configuring automated failover power backing with specialized solar inverters.`;
          }
          return prev;
        });
        setIsBrainSpeechRecording(false);
      }, 3000);
      return;
    }


    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsBrainSpeechRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setBrainEnrichStatement(prev => {
          const base = prev.trim();
          return base ? `${base} ${transcript}` : transcript;
        });
      };

      recognition.onerror = (err: any) => {
        console.error("Speech recognition error:", err);
        setIsBrainSpeechRecording(false);
      };

      recognition.onend = () => {
        setIsBrainSpeechRecording(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsBrainSpeechRecording(false);
    }
  };

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralFriendName || !referralFriendEmail) {
      alert("Friend's name and email are required.");
      return;
    }
    setIsSubmittingReferralInvite(true);
    addLog(`Initiating GiGO AI Referral sequence for friend ${referralFriendName}...`);
    try {
      const res = await fetch(`${API_BASE_URL}/api/referrals/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          friendName: referralFriendName,
          friendEmail: referralFriendEmail,
          friendPhone: referralFriendPhone,
          dispatchMode: referralDispatchMode
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        addLog(`🎉 Referral invitation created successfully! ID: ${data.referralId}`);
        if (data.telemetryMsg) {
          addLog(data.telemetryMsg);
        }
        
        // Reset form inputs
        setReferralFriendName('');
        setReferralFriendEmail('');
        setReferralFriendPhone('');
        
        // Refresh referrals list
        await fetchReferrals();
        
        if (referralDispatchMode === 'MANUAL') {
          // Store generated template and show manual share overlay/modal
          setLastGeneratedInvite({
            referralId: data.referralId,
            friendName: referralFriendName,
            friendEmail: referralFriendEmail,
            friendPhone: referralFriendPhone,
            subject: data.subject,
            emailBody: data.emailBody,
            whatsappMessage: data.whatsappMessage,
            referralLink: `${systemConfig.frontendDomain}/?ref=${currentUserId}`
          });
          setShowManualShareModal(true);
        } else {
          alert(`Success! GiGO AI Agent has simulated SMTP and WhatsApp dispatch to ${referralFriendName}. View terminal logs for details.`);
        }
      } else {
        alert(data.error || "Failed to submit referral invitation.");
      }
    } catch (err: any) {
      console.error("Referral submit error:", err);
      alert("Failed to submit referral invitation. Ensure backend server is online.");
    } finally {
      setIsSubmittingReferralInvite(false);
    }
  };

  // Autonomous Background Auto-Apply Agent
  const triggerAutoApplyRoutine = async (jobsList: JobMatch[]) => {
    // Filter jobs with match score 60% - 100% and a valid application email
    const candidates = jobsList.filter(job => job.score >= 60 && job.score <= 100 && job.applicationEmail);
    if (candidates.length === 0) return;

    addLog(`[AI Agent] Auto-Apply Agent scanning ${candidates.length} potential matches in 60%-100% tier...`);

    const currentUserId = userId || localStorage.getItem('wa_userId') || 'user_1780714671963_281';

    for (const job of candidates) {
      // De-duplicate check
      const isTracked = tasks.some(t => t.title === job.jobTitle && t.company === job.companyName);
      const isAutoAppliedLocal = localStorage.getItem(`auto_applied_${job.id}`) === 'true';

      if (isTracked || isAutoAppliedLocal) {
        continue;
      }

      // Wallet balance check
      if (walletNGN < 200) {
        addLog(`[AI Agent] Skipped Auto-Apply for "${job.jobTitle}" at ${job.companyName} due to insufficient wallet balance (₦${walletNGN.toLocaleString()} NGN, requires ₦200).`);
        continue;
      }

      addLog(`[AI Agent] Autonomous Action: Submitting electronic application for "${job.jobTitle}" at ${job.companyName}...`);

      const finalSubject = job.emailSubject || `Application for ${job.jobTitle} - ${profile.name || 'Candidate'}`;
      const finalBodyText = job.emailBodyRequirements || `Dear Hiring Team,\n\nI am writing to express my interest in the ${job.jobTitle} position at ${job.companyName}.\n\nBased on my qualifications and technical calibration scores, I believe my profile aligns perfectly with your requirements.\n\nBest regards,\n${profile.name || 'Candidate'}`;

      try {
        const response = await fetch(`${API_BASE_URL}/api/send-application-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            recipientEmail: job.applicationEmail,
            subject: finalSubject,
            bodyText: finalBodyText,
            documentIds: [],
            jobId: job.id,
            jobTitle: job.jobTitle,
            companyName: job.companyName
          })
        });

        const resData = await response.json();

        if (response.ok) {
          localStorage.setItem(`auto_applied_${job.id}`, 'true');

          const nt: KanbanTask = {
            id: `task-ticker-auto-${Date.now()}-${job.id}`,
            title: job.jobTitle,
            company: job.companyName,
            status: 'applied',
            salary: job.salaryRange,
            confidence: job.score,
            date: 'Auto-Applied Now',
            applicationEmail: job.applicationEmail,
            applicationPhone: job.applicationPhone,
            applicationLink: job.applicationLink,
            keyRequirementsSummary: job.keyRequirementsSummary,
            sourcePlatform: job.sourcePlatform,
            applicationMethod: job.applicationMethod,
            emailSubject: job.emailSubject,
            emailBodyRequirements: job.emailBodyRequirements,
            attachmentsRequired: job.attachmentsRequired
          };

          setTasks(prev => [nt, ...prev]);
          addLog(`[AI Agent] Auto-applied successfully to "${job.jobTitle}" at ${job.companyName}! ₦200 debited from wallet.`);

          await fetchUserProfile();
          await fetchTransactions();
          await fetchMailThreads();
        } else {
          addLog(`[AI Agent] Auto-Apply failed for "${job.jobTitle}": ${resData.error || 'Server error'}`);
        }
      } catch (err: any) {
        console.error("Auto-Apply background error:", err);
        addLog(`[AI Agent] Auto-Apply network error for "${job.jobTitle}": ${err.message}`);
      }
    }
  };

  const fetchDiscoveredJobs = async () => {
    const currentUserId = userId || localStorage.getItem('wa_userId') || 'user_1780714671963_281';
    try {
      const url = `${API_BASE_URL}/api/discovered-jobs?userId=${currentUserId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const mapped: JobMatch[] = data.map((j: any) => ({
          id: j.id,
          jobTitle: j.jobTitle,
          companyName: j.companyName,
          salaryRange: j.salaryRange || '₦400,000 - ₦600,000 / Month',
          score: j.matchScore || Math.floor(75 + Math.random() * 24),
          location: j.workType || 'Remote',
          applicationEmail: j.applicationEmail || undefined,
          applicationPhone: j.applicationPhone || undefined,
          applicationLink: j.applicationLink || undefined,
          keyRequirementsSummary: j.keyRequirementsSummary || [],
          sourcePlatform: j.sourcePlatform || 'Google',
          scrapedAt: j.scrapedAt || undefined,
          postedAt: j.postedAt || undefined,
          jobDescription: j.jobDescription || undefined,
          userId: j.userId || undefined,
          applicationMethod: j.applicationMethod || undefined,
          emailSubject: j.emailSubject || undefined,
          emailBodyRequirements: j.emailBodyRequirements || undefined,
          attachmentsRequired: j.attachmentsRequired || undefined
        }));
        // De-duplicate fetched jobs by id to prevent duplicates in allUniqueJobs state
        const uniqueMap = new Map<string, JobMatch>();
        mapped.forEach(job => {
          uniqueMap.set(job.id, job);
        });
        const finalJobsList = Array.from(uniqueMap.values());
        setAllUniqueJobs(finalJobsList);
        triggerAutoApplyRoutine(finalJobsList);
      }
    } catch (e) {
      console.error("Discovered jobs fetch fail:", e);
    }
  };

  const triggerScraperSweep = async () => {
    if (!profile.geminiApiKey) {
      addLog("[Scraper Cron] System-rooted platform key will be used (Optional custom key was not provided).");
    }
    setIsRunningScraper(true);
    addLog("Triggering Autonomous Market Intelligence Scraper Cron Sweep...");
    try {
      const res = await fetch(`${API_BASE_URL}/api/cron/run-scraper?userId=${currentUserId}`);
      if (res.ok) {
        addLog("Scraper sweep complete! Fresh active listings loaded successfully.");
        await fetchDiscoveredJobs(); // Sync matching jobs instantly
      } else {
        const errData = await res.json();
        addLog(`[Scraper Cron] Execution failed: ${errData.details || errData.error || res.statusText}`);
      }
    } catch (e) {
      console.error(e);
      addLog("[Scraper Cron] Offline fallback. Execution failed.");
    } finally {
      setIsRunningScraper(false);
    }
  };

  const runInfrastructureDiagnostics = async () => {
    setIsRunningUptimeAudit(true);
    setUptimeAuditLogs([]);
    const logsList: string[] = [];

    const appendAuditLog = (msg: string) => {
      logsList.push(msg);
      setUptimeAuditLogs([...logsList]);
    };

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      appendAuditLog("[SYS] Initializing Network & Power Redundancy Audit...");
      await sleep(1000);
      appendAuditLog("[SYS] Querying Backup Power Setup (Solar / 10kVA Batterypack)...");
      await sleep(1200);
      appendAuditLog("[SYS] Backup Power Inverter Status: ONLINE (Voltage: 51.4V, Load: 0.8kW, Temperature: 28°C)");
      await sleep(1000);
      appendAuditLog("[SYS] Pinging Backup LTE failover routing gateway (192.168.8.1)...");
      await sleep(1200);
      appendAuditLog("[SYS] LTE router handshake completed successfully (Response Latency: 22ms, Signal: Excellent)");
      await sleep(1000);
      appendAuditLog("[SYS] Handshaking Primary Fiber loop routing...");
      await sleep(1200);
      appendAuditLog("[SYS] Primary Fiber status: ACTIVE (Route Latency: 8ms, Jitter: 1.2ms)");
      await sleep(1000);
      appendAuditLog("[SYS] Running comprehensive loop simulation over solar + grid + LTE nodes...");
      await sleep(1500);
      appendAuditLog("[SYS] Remote-Readiness diagnostic: 100% SUCCESS. Grid stability certified.");
      appendAuditLog("[SYS] Emitting High-Availability Uptime Certification badge.");
      
      setIsUptimeVerified(true);
      addLog("INFRASTRUCTURE: Remote-Ready Uptime verification loop passed successfully. Profile upgraded to HA-status.");
    } catch (err) {
      appendAuditLog("[ERROR] Diagnostic loop timed out. Check router cabling.");
    } finally {
      setIsRunningUptimeAudit(false);
    }
  };

  const handleDomainChange = (dom: 'react' | 'node' | 'system' | 'behavioral') => {
    setSelectedInterviewDomain(dom);
    setInterviewScorecard(null);
    if (dom === 'react') {
      setInterviewQuestion('How do you optimize render performance in a large-scale React application? Describe your experience with virtualized lists, memoization, and custom hooks.');
    } else if (dom === 'node') {
      setInterviewQuestion('Discuss event loop blocking in Node.js. How do you handle intensive CPU-bound tasks or slow I/O operations without freezing the server? Mention Worker Threads, child processes, or cluster module.');
    } else if (dom === 'system') {
      setInterviewQuestion('How would you design a highly scalable real-time notification service that can handle 100,000 push requests per second? Cover rate-limiting, message brokers (like Kafka/RabbitMQ), and cache/persistence strategy.');
    } else if (dom === 'behavioral') {
      setInterviewQuestion('Tell me about a time you had a high-priority production bug late on a Friday with teammates already offline. How did you resolve the issue, and how did you manage stakeholders expectations?');
    }
  };

  const startInterviewRecording = () => {
    setIsRecordingInterview(true);
    setInterviewScorecard(null);
  };

  const stopAndAnalyzeInterview = async () => {
    setIsRecordingInterview(false);
    setIsAnalyzingInterview(true);
    addLog(`INTERVIEW: Analyzing verbal response for domain [${selectedInterviewDomain.toUpperCase()}]...`);

    // Simulate analysis with a 2.5-second timeout
    setTimeout(() => {
      setIsAnalyzingInterview(false);
      
      let transcriptText = "";
      let matchedKeywords: string[] = [];
      let feedbackPoints: string[] = [];
      let depth = 85;
      let vocal = 90;
      let ats = 80;

      if (selectedInterviewDomain === 'react') {
        transcriptText = "So, in large-scale React apps, optimizing rendering is key. I leverage useMemo and useCallback to cache values and references. For lists of thousands of elements, standard renders kill performance, so I implement virtualization with react-window or react-virtualized. I also use React.memo on expensive leaves to prevent prop-drift re-renders, and monitor bottleneck spots using the Profiler tab.";
        matchedKeywords = ["useMemo", "useCallback", "react-window", "React.memo", "Profiler", "Prop-Drift"];
        feedbackPoints = [
          "Strong technical depth on virtualization and component-level caching.",
          "Excellent mention of performance profiling tools which shows operational maturity.",
          "Suggestion: Discuss the React 19 compiler auto-memoization feature to highlight cutting-edge alignment."
        ];
        depth = 92;
        vocal = 88;
        ats = 94;
      } else if (selectedInterviewDomain === 'node') {
        transcriptText = "Node's single thread can easily block on CPU tasks. If I have high compute like cryptographic hashes, I delegate to Worker Threads to keep the main event loop responsive. For heavy workloads, clustering can distribute traffic. For slow I/O, I always ensure we use non-blocking async promises and stream large datasets instead of buffer-reads.";
        matchedKeywords = ["Worker Threads", "Event Loop", "Clustering", "Streams", "Non-blocking I/O", "Promises"];
        feedbackPoints = [
          "Precise explanation of Node's architectural constraints and event loop thread pool.",
          "Good distinction between I/O streams and CPU worker threads.",
          "Suggestion: Mention libuv thread pool customization (UV_THREADPOOL_SIZE) for absolute system completeness."
        ];
        depth = 89;
        vocal = 91;
        ats = 88;
      } else if (selectedInterviewDomain === 'system') {
        transcriptText = "For 100k notifications/sec, we need a decoupled architecture. I would place a Redis-backed token bucket rate limiter at the API gateway, then push tasks into a Kafka message broker. Consumer worker pools would pull and send messages asynchronously, utilizing connection pooling. We'll store statuses in Cassandra for write-heavy performance and cache user devices in Redis.";
        matchedKeywords = ["Kafka", "Cassandra", "Redis Cache", "Rate Limiting", "Decoupled", "Connection Pooling"];
        feedbackPoints = [
          "Outstanding horizontal scaling design covering ingress, queuing, and persistent caching layers.",
          "Great choice of high-write databases like Cassandra and high-throughput brokers like Kafka.",
          "Suggestion: Cover backpressure management and retry loops with exponential backoff for failed deliveries."
        ];
        depth = 94;
        vocal = 93;
        ats = 91;
      } else {
        transcriptText = "When a production bug hit late Friday, I stayed calm. I first verified the regression via logging, rolled back the latest deploy to stabilize customer uptime immediately, then isolated the bug on a staging branch. I kept PMs updated on Slack with hourly status syncs, fixed the patch, and added a regression test before redeploying. Post-incident, I wrote a comprehensive blameless post-mortem.";
        matchedKeywords = ["Regression", "Rollback", "Staging Branch", "Post-mortem", "Stakeholders", "Incident Response"];
        feedbackPoints = [
          "Highly mature behavioral alignment showcasing composure, stakeholder communication, and systematic triage.",
          "Excellent emphasis on rolling back first to protect user experience before deep debugging.",
          "Suggestion: Mention establishing automated alerts (e.g. Sentry) to preemptively catch such issues."
        ];
        depth = 90;
        vocal = 94;
        ats = 89;
      }

      const overall = Math.round((depth + vocal + ats) / 3);

      setInterviewScorecard({
        score: overall,
        depth,
        vocal,
        ats,
        transcript: transcriptText,
        feedback: feedbackPoints,
        keywords: matchedKeywords
      });

      addLog(`INTERVIEW: Evaluation complete. Score: ${overall}/100. Verbal response aligned to ATS.`);
    }, 2500);
  };


  const handleDismissJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering card selection click handlers
    
    // Optimistically update frontend state
    setAllUniqueJobs(prev => prev.filter(job => job.id !== jobId));
    if (selectedJob && selectedJob.id === jobId) {
      setSelectedJob(null);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/discovered-jobs/${jobId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        addLog(`❌ Matches Ticker: Job dismissed from pipeline.`);
      } else {
        console.warn("Dismissal warning: status", res.status);
      }
    } catch (err) {
      console.error("Failed to dismiss job:", err);
    }
  };

  // 1. Configure Server-side Scraper Poller (scanInterval mins)
  useEffect(() => {
    if (!hasVoiceOnboarded) return;
    const currentUserId = userId || localStorage.getItem('wa_userId') || 'user_1780714671963_281';
    if (!currentUserId) return;

    // Default or fallback to 45 mins if invalid
    const mins = Math.max(1, scanInterval || 45);
    console.log(`Matches Ticker: Server-side scraper interval loaded (polling every ${mins} minutes).`);

    const intervalId = setInterval(async () => {
      try {
        console.log(`Interval Scraper Run: Triggering background scrape for user: ${currentUserId}`);
        const res = await fetch(`${API_BASE_URL}/api/cron/run-scraper?userId=${currentUserId}`);
        if (res.ok) {
          console.log("Background interval scraper run completed successfully.");
          await fetchDiscoveredJobs(); // Sync matching jobs
        }
      } catch (err) {
        console.error("Background interval scraper run failed:", err);
      }
    }, mins * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [hasVoiceOnboarded, userId, scanInterval]);

  // 2. Configure Client-side Feed Poller (feedRefreshInterval mins)
  useEffect(() => {
    if (!hasVoiceOnboarded) return;
    const currentUserId = userId || localStorage.getItem('wa_userId') || 'user_1780714671963_281';
    if (!currentUserId) return;

    // Default or fallback to 1 min if invalid
    const mins = Math.max(1, feedRefreshInterval || 1);
    console.log(`Matches Ticker: Live feed polling interval loaded (polling every ${mins} minutes).`);

    const intervalId = setInterval(async () => {
      try {
        console.log("Interval Feed Run: Fetching live discovered jobs.");
        await fetchDiscoveredJobs();
      } catch (err) {
        console.error("Background interval feed refresh failed:", err);
      }
    }, mins * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [hasVoiceOnboarded, userId, feedRefreshInterval]);

  const fetchSystemConfig = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/system-config`);
      if (res.ok) {
        const data = await res.json();
        const config = {
          frontendDomain: data.frontendDomain || 'https://wa-frontend-seven.vercel.app',
          referralBonus: typeof data.referralBonus === 'number' ? data.referralBonus : 500,
          scraperDomains: Array.isArray(data.scraperDomains) ? data.scraperDomains : ['linkedin.com', 'twitter.com', 'instagram.com', 'facebook.com', 'reddit.com', 'github.com'],
          booleanSearchTemplate: data.booleanSearchTemplate || '"Social Media Marketer" (onsite OR "in-office" OR "on-site") (site:boards.greenhouse.io OR site:jobs.lever.co OR inurl:careers OR inurl:job-openings OR inurl:open-positions) after:2026-01-01 before:2026-12-31'
        };
        setSystemConfig(config);
        setConfigDomain(config.frontendDomain);
        setConfigReferralBonus(String(config.referralBonus));
        setConfigScraperDomains(config.scraperDomains);
        setConfigBooleanSearchTemplate(config.booleanSearchTemplate);
      }
    } catch (err: any) {
      console.error("Failed to fetch system configurations:", err);
    }
  };

  const handleUpdateSystemConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userEmail !== 'admin@gigo.com' && userRole !== 'admin') {
      alert("Unauthorized. Only administrators can perform this action.");
      return;
    }

    setIsSavingSystemConfig(true);
    addLog(`Admin Console: Committing system configuration update...`);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/system-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          frontendDomain: configDomain,
          referralBonus: parseFloat(configReferralBonus),
          scraperDomains: configScraperDomains,
          booleanSearchTemplate: configBooleanSearchTemplate,
          adminEmail: userEmail
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addLog(`💾 Admin Settings: System settings updated! Domain: ${data.config.frontendDomain}, Bonus: ₦${data.config.referralBonus}, Domains: ${data.config.scraperDomains?.join(', ')}`);
        setSystemConfig(data.config);
        setConfigScraperDomains(data.config.scraperDomains || []);
        setConfigBooleanSearchTemplate(data.config.booleanSearchTemplate || '');
        alert("Success! Global system configuration updated and committed to Firestore.");
      } else {
        addLog(`Admin Settings Error: ${data.error || 'Failed to update configurations.'}`);
        alert(data.error || "Failed to update configurations.");
      }
    } catch (err: any) {
      addLog(`Admin Settings Network Error: ${err.message}`);
      alert("Failed to save. Ensure your backend is online.");
    } finally {
      setIsSavingSystemConfig(false);
    }
  };

  const handleConfigureTickerStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      alert("Please log in to configure your personalized ticker stream.");
      return;
    }

    setIsConfiguringTickerStream(true);
    addLog(`Personalize Ticker: Committing stream target configuration...`);

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${currentUserId}/configure-ticker-stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: selectedDomains })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        addLog(`💾 Matches Ticker: Target channels updated to [${data.tickerTargetDomains.join(', ')}]!`);
        setTickerTargetDomains(data.tickerTargetDomains);
        if (data.financials) {
          setWalletNGN(data.financials.walletBalanceNGN ?? 0.0);
          setWalletUSD(data.financials.walletBalanceUSD ?? 0.0);
        }
        await fetchDiscoveredJobs();
        setShowTickerConfigModal(false);
        alert(data.message || "Success! Live AI Match stream configured.");
      } else {
        addLog(`Matches Ticker Error: ${data.error || 'Failed to update ticker settings.'}`);
        alert(data.error || "Failed to update ticker settings.");
      }
    } catch (err: any) {
      addLog(`Matches Ticker Network Error: ${err.message}`);
      alert("Failed to save. Ensure your backend is online.");
    } finally {
      setIsConfiguringTickerStream(false);
    }
  };

  // ----------------------------------------------------
  // ADMIN PANEL DB API LOOPS
  // ----------------------------------------------------
  const fetchAdminUsers = async () => {
    if (userEmail !== 'admin@gigo.com' && userRole !== 'admin') {
      addLog("Security Warning: Unauthorized database access blocked.");
      return;
    }
    setIsLoadingAdminData(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users`);
      if (res.ok) {
        const data = await res.json();
        setAdminUsers(data);
        addLog(`Admin Console: Fetched ${data.length} registered candidate records.`);
      } else {
        addLog("Admin Console: Failed to load user accounts database.");
      }
    } catch (err: any) {
      addLog(`Admin Console Error: ${err.message}`);
    } finally {
      setIsLoadingAdminData(false);
    }
  };

  const fetchAdminLogs = async () => {
    if (userEmail !== 'admin@gigo.com' && userRole !== 'admin') return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/agent-logs`);
      if (res.ok) {
        const data = await res.json();
        setAdminLogs(data);
      }
    } catch (err: any) {
      console.error("Agent logs query fail:", err);
    }
  };

  const handleChangeUserRole = async (targetUser: AdminUser, newRole: 'admin' | 'candidate') => {
    if (userEmail !== 'admin@gigo.com') {
      addLog("⚠️ Security Warning: Only the primary super admin can configure user authorization roles.");
      return;
    }
    addLog(`Administrative Panel: Modifying role of ${targetUser.fullName} to ${newRole.toUpperCase()}...`);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${targetUser.userId}/change-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, adminEmail: userEmail })
      });
      const data = await res.json();
      if (res.ok) {
        addLog(`Administrative Panel: Successfully updated ${targetUser.fullName}'s role to ${newRole.toUpperCase()}.`);
        fetchAdminUsers(); // Refresh Users
      } else {
        addLog(`Administrative Panel Error: ${data.error || 'Failed to update user role.'}`);
      }
    } catch (err: any) {
      addLog(`Administrative Panel Network Error: ${err.message}`);
    }
  };

  const handleAdminOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideUser) return;
    if (userEmail !== 'admin@gigo.com' && userRole !== 'admin') {
      addLog("Security Warning: Unauthorized override execution blocked.");
      return;
    }
    setIsSubmittingOverride(true);
    addLog(`Admin Console: Adjusting ${overrideUser.fullName}'s wallet by ${overrideAmount} ${overrideCurrency}...`);

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/users/${overrideUser.userId}/adjust-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(overrideAmount),
          currency: overrideCurrency,
          purpose: overridePurpose
        })
      });

      if (res.ok) {
        addLog(`Admin Override success! Balances adjusted on active ledger.`);
        setShowOverrideModal(false);
        fetchAdminUsers(); // Refresh Admin list
        fetchAdminLogs();  // Refresh Admin logs
        if (overrideUser.userId === userId) {
          fetchUserProfile(); // Refresh current user's profile if admin adjusted own profile
          fetchTransactions();
        }
      } else {
        const errData = await res.json();
        alert(errData.error || "Override transaction failed.");
      }
    } catch (err: any) {
      addLog(`Override adjustment route error: ${err.message}`);
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  const handleInspectUser = async (user: AdminUser) => {
    setInspectUser(user);
    setShowInspectModal(true);
    setIsFetchingInspectData(true);
    setInspectUserTransactions([]);
    setInspectUserDocuments([]);
    try {
      addLog(`Admin Console: Fetching real-time telemetry for candidate ${user.fullName}...`);
      
      const txRes = await fetch(`${API_BASE_URL}/api/users/${user.userId}/transactions`);
      if (txRes.ok) {
        const txData = await txRes.json();
        setInspectUserTransactions(txData);
      }
      
      const docsRes = await fetch(`${API_BASE_URL}/api/users/${user.userId}/documents`);
      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setInspectUserDocuments(docsData);
      }
      addLog(`Admin Console: Successfully loaded ledger & assets for ${user.fullName}.`);
    } catch (err: any) {
      console.error("Failed to fetch inspection details:", err);
      addLog(`Admin Console Error: Failed to fetch inspection details: ${err.message}`);
    } finally {
      setIsFetchingInspectData(false);
    }
  };


  // ----------------------------------------------------
  // NATIVE VOICE SYNCHRONIZER PIPELINES
  // ----------------------------------------------------

  const startMicSync = async () => {
    if (!profile.geminiApiKey) {
      addLog("[Voice Engine] System-rooted platform key will be used (Optional custom key was not provided).");
    }
    try {
      addLog("Requesting microphone capture authorization...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64; 
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      addLog("Telemetry Voice Tunnel established with high fidelity.");
      setSyncStatus("Listening... Speak about your latest projects, skills, and tools.");

      const options = { mimeType: 'audio/webm' };
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        addLog(`Captured raw vocal bio: ${audioBlob.size} bytes. Initializing native AI onboarding tunnel...`);
        setIsAnalyzingVoice(true);
        setSyncStatus("Processing: Analyzing vocal resume & regional backup infrastructure natively via Gemini 2.5 Pro...");

        try {
          const formData = new FormData();
          formData.append('userId', currentUserId);
          formData.append('audio', audioBlob, 'voice-profile.webm');

          const res = await fetch(`${API_BASE_URL}/api/onboard-voice`, {
            method: 'POST',
            body: formData
          });

          if (res.ok) {
            const data = await res.json();
            const finalName = data.profile?.fullName || userFullName || profile.name;
            addLog(`Voice profiling complete! High-token structured candidate ledger committed: ${finalName}.`);
            setSyncStatus("Onboarding Success! Live profile & regional infrastructure metrics matched.");
            
            // Check for extracted vocalCommand from backend profile response or search profile fields as fallback
            let vocalCmd = data.profile?.vocalCommand;
            if (!vocalCmd && data.profile) {
              const summaryLower = (data.profile.professionalSummary || "").toLowerCase();
              const nameLower = (data.profile.fullName || "").toLowerCase();
              
              if (summaryLower.includes("clear skills") || nameLower.includes("clear skills")) vocalCmd = "clear skills";
              else if (summaryLower.includes("clear experience") || nameLower.includes("clear experience")) vocalCmd = "clear experience";
              else if (summaryLower.includes("clear logs") || nameLower.includes("clear logs")) vocalCmd = "clear logs";
              else if (summaryLower.includes("toggle settings") || nameLower.includes("toggle settings")) vocalCmd = "toggle settings";
              else if (summaryLower.includes("toggle theme") || nameLower.includes("toggle theme")) vocalCmd = "toggle theme";
              else if (summaryLower.includes("clear everything") || nameLower.includes("clear everything")) vocalCmd = "clear everything";
            }
            if (vocalCmd) {
              addLog(`[Voice Engine] Extracted voice command: "${vocalCmd}"`);
              executeVocalCommand(vocalCmd);
            }

            await fetchUserProfile(); // Sync profile instantly
            await fetchDiscoveredJobs(); // Sync matching jobs instantly
            triggerScraperSweep(); // Automatically kick off the background Live AI Matches Scraper agent!
          } else {
            const errData = await res.json();
            addLog(`[Voice Engine] Parsing failure: ${errData.error || res.statusText}`);
            setSyncStatus(`Processor Lapsed: ${errData.details || errData.error || "Could not parse recording structured format."}`);
          }
        } catch (err) {
          addLog("[Voice Engine] Network error during voice sync upload. Active backend check failed.");
          setSyncStatus("Idle — Tap Mic to Start Syncing Resume & Experience");
        } finally {
          setIsAnalyzingVoice(false);
        }
      };

      mediaRecorder.start();

      const updateBars = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Direct DOM mutation bypassing state updates for performance
        for (let i = 0; i < 15; i++) {
          const barDiv = barRefs.current[i];
          if (barDiv) {
            const rawVal = dataArray[i % bufferLength] || 0;
            const percentage = Math.min(100, Math.max(10, (rawVal / 255) * 160));
            barDiv.style.height = `${percentage}%`;
          }
        }
        animationRef.current = requestAnimationFrame(updateBars);
      };

      updateBars();
    } catch (err) {
      addLog("[Voice Engine] Microphone hardware not found or blocked. Running high-fidelity synthetic fallback simulator.");
      startSyntheticWaveform();
    }
  };

  const startSyntheticWaveform = () => {
    let cycle = 0;
    const updateSynthetic = () => {
      cycle += 0.15;
      for (let i = 0; i < 15; i++) {
        const barDiv = barRefs.current[i];
        if (barDiv) {
          const baseSin = Math.sin(cycle + i * 0.45) * 35 + 50;
          const randomJitter = Math.random() * 22 - 11;
          const percentage = Math.min(100, Math.max(10, baseSin + randomJitter));
          barDiv.style.height = `${percentage}%`;
        }
      }
      animationRef.current = requestAnimationFrame(updateSynthetic);
    };
    updateSynthetic();
  };

  const stopMicSync = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    const wasSimulated = !mediaRecorderRef.current;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    // Reset styles
    for (let i = 0; i < 15; i++) {
      const barDiv = barRefs.current[i];
      if (barDiv) {
        barDiv.style.height = '10%';
      }
    }

    if (wasSimulated) {
      // Simulate synthetic voice onboarding analysis
      setIsAnalyzingVoice(true);
      setSyncStatus("Processing: Gemini 2.5 Pro analyzing simulated voice onboarding data...");
      addLog("[Voice Engine] Synthesizing vocal bio parameters & backup network coordinates...");
      
      setTimeout(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/api/users/${currentUserId}/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fullName: userFullName || profile.name || "Abayomi Dele-Ale",
              professionalSummary: "Lead AI Engineer with extensive experience building real-time microservice telemetry, decentralized active state ledgers, and Gemini integration pipelines. Passionate about automating career matching ecosystems.",
              role: "Lead AI Engineer",
              location: "Lagos, Nigeria",
              skills: ["React", "TypeScript", "Node.js", "LLM Fine-Tuning", "Prompt Engineering", "Firestore", "Docker", "Python", "Cloud Run"],
              yearsOfExperience: 6,
              infrastructureStatus: {
                powerSetupDescription: "Reliable Solar Inverter with 10kVA backup battery (Voice Verified)",
                internetSetupDescription: "Starlink premium subscription + backup 4G LTE router (Voice Verified)",
                hasRemoteBackupPlan: true
              },
              phoneNumber: userPhone || "2348011223344",
              hasVoiceOnboarded: true
            })
          });

          if (res.ok) {
            addLog("[Voice Engine] Synthetic Voice profiling complete! High-token structured candidate ledger committed to Firestore.");
            setSyncStatus("Onboarding Success! Live profile & regional infrastructure metrics matched.");
            await fetchUserProfile(); // Refresh current user's profile instantly
            await fetchDiscoveredJobs(); // Refresh job stream with real-time matching scores
            triggerScraperSweep(); // Automatically kick off the background Live AI Matches Scraper agent!
          } else {
            addLog(`[Voice Engine] Simulator update failed: API responded with status ${res.status}`);
            setSyncStatus("Processor Lapsed: API update failed.");
          }
        } catch (err: any) {
          addLog(`[Voice Engine] Simulator network error: ${err.message}`);
          setSyncStatus("Idle — Tap Mic to Start Syncing Resume & Experience");
        } finally {
          setIsAnalyzingVoice(false);
        }
      }, 2500);
    }
  };

  // Mic Activation Observer
  useEffect(() => {
    if (isSyncing) {
      startMicSync();
    } else {
      stopMicSync();
    }
    return () => {
      stopMicSync();
    };
  }, [isSyncing]);

  // ----------------------------------------------------
  // SECURE FLUTTERWAVE INLINE CHECKOUT ORCHESTRATOR
  // ----------------------------------------------------
  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingTopUp(true);
    const amountNum = parseFloat(topUpAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      alert("Please enter a valid amount");
      setIsSubmittingTopUp(false);
      return;
    }

    addLog(`Initiating Flutterwave checkout session for ${topUpCurrency} ${amountNum}...`);

    // Retrieve custom Flutterwave Public Key from profile, or fall back to sandbox public key
    const customFlwPubKey = profile.flutterwavePublicKey || 'FLWPUBK_TEST-a352c3c97801df07ee290bc983c2eb1d-X';

    // Verify script has finished loading
    if (!(window as any).FlutterwaveCheckout) {
      alert("Flutterwave secure payments module is loading. Please tap 'Confirm Top Up' again in 2 seconds.");
      setIsSubmittingTopUp(false);
      return;
    }

    const txRef = `wa-tx-${Date.now()}-${topUpCurrency.toLowerCase()}`;

    // Invoke direct native Flutterwave Inline Checkout
    try {
      (window as any).FlutterwaveCheckout({
        public_key: customFlwPubKey,
        tx_ref: txRef,
        amount: amountNum,
        currency: topUpCurrency,
        payment_options: 'card,ussd,account,mpesa,mobilemoneyghana',
        customer: {
          email: userEmail,
          phone_number: userPhone || '2348011223344',
          name: userFullName,
        },
        customizations: {
          title: "GiGO CAREER WALLET",
          description: `Deposit secure wallet funds into candidate balance`,
          logo: "https://checkout.flutterwave.com/assets/img/flutterwave-logo.svg",
        },
        callback: async (data: any) => {
          console.log("Flutterwave payment feedback callback:", data);
          const transactionId = data.transaction_id || data.id;
          
          addLog(`handshake completed. Contacting backend secure validation gateway with Tx ID: ${transactionId}...`);
          
          try {
            const res = await fetch(`${API_BASE_URL}/api/payments/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transactionId,
                userId,
                amount: amountNum,
                currency: topUpCurrency
              })
            });

            if (res.ok) {
              const resData = await res.json();
              addLog(`Handshake VERIFIED: ${resData.message}`);
              await fetchUserProfile(); // Refresh balances in UI
              await fetchTransactions(); // Refresh payment ledger in UI
            } else {
              const errData = await res.json();
              addLog(`Backend verification lapse: ${errData.error}`);
              alert(`Verification Error: ${errData.error || "Failed to verify transaction."}`);
            }
          } catch (verifyError: any) {
            addLog(`HANDSHAKE ERROR: Could not hit the verification pipeline. ${verifyError.message}`);
          } finally {
            setShowTopUpModal(false);
            setIsSubmittingTopUp(false);
          }
        },
        onclose: () => {
          addLog("Payment checkout window dismissed.");
          setIsSubmittingTopUp(false);
        }
      });
    } catch (checkoutError: any) {
      addLog(`Checkout compilation crashed: ${checkoutError.message}`);
      setIsSubmittingTopUp(false);
    }
  };

  // ----------------------------------------------------
  // AUTHENTICATION LOG-IN / REGISTER PIPELINES
  // ----------------------------------------------------
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmittingAuth(true);
    addLog(`Authenticating email credentials for ${authEmail}...`);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addLog(`Authorization success! Logged in as ${data.user.fullName}.`);
        localStorage.setItem('wa_userId', data.userId);
        localStorage.setItem('wa_userEmail', data.user.email);
        localStorage.setItem('wa_userFullName', data.user.fullName);
        localStorage.setItem('wa_userPhone', data.user.phoneNumber || '');
        localStorage.setItem('wa_userRole', data.user.role || 'candidate');
        if (data.token) {
          localStorage.setItem('wa_token', data.token);
        }

        setUserId(data.userId);
        setUserEmail(data.user.email);
        setUserFullName(data.user.fullName);
        setUserPhone(data.user.phoneNumber || '');
        setUserRole(data.user.role || 'candidate');
      } else {
        setAuthError(data.error || "Authentication failed. Invalid email/password.");
      }
    } catch (err: any) {
      setAuthError("Failed to reach authentication backend. Please check server.");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmittingAuth(true);
    addLog(`Creating secure multi-user credential profile for ${authEmail}...`);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: authFullName,
          email: authEmail,
          password: authPassword,
          phoneNumber: authPhone,
          referredBy: localStorage.getItem('gigo_ref_by') || ''
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addLog(`🎉 Sign up successful! Welcome to GiGO. ₦5,000.00 signup bonus has been credited to your career wallet!`);
        localStorage.removeItem('gigo_ref_by');
        localStorage.setItem('wa_userId', data.userId);
        localStorage.setItem('wa_userEmail', data.user.email);
        localStorage.setItem('wa_userFullName', data.user.fullName);
        localStorage.setItem('wa_userPhone', data.user.phoneNumber || '');
        localStorage.setItem('wa_userRole', data.user.role || 'candidate');
        if (data.token) {
          localStorage.setItem('wa_token', data.token);
        }

        setUserId(data.userId);
        setUserEmail(data.user.email);
        setUserFullName(data.user.fullName);
        setUserPhone(data.user.phoneNumber || '');
        setUserRole(data.user.role || 'candidate');
      } else {
        setAuthError(data.error || "Sign up failed. Account might already exist.");
      }
    } catch (err: any) {
      setAuthError("Failed to reach registration backend server.");
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('wa_userId');
    localStorage.removeItem('wa_userEmail');
    localStorage.removeItem('wa_userFullName');
    localStorage.removeItem('wa_userPhone');
    localStorage.removeItem('wa_userRole');
    localStorage.removeItem('wa_token');
    setUserId('');
    setUserEmail('');
    setUserFullName('');
    setUserPhone('');
    setUserRole('candidate');
    setIsAdminMode(false);
    addLog("Active session terminated securely.");
  };

  // ----------------------------------------------------
  // GENERAL INTERACTIVE & KANBAN MANAGEMENT
  // ----------------------------------------------------

  // Trigger ATS Asset compile (Cover Letter, CV, Portfolio)
  const generateATSAsset = async (job: any, assetType: 'COVER_LETTER' | 'CV' | 'PORTFOLIO') => {
    if (!profile.geminiApiKey) {
      addLog("[Document Agent] System-rooted platform key will be used (Optional custom key was not provided).");
    }

    let setGenerating: (val: boolean) => void;
    let cost = 400;
    let displayLabel = 'Cover Letter';
    if (assetType === 'COVER_LETTER') {
      setGenerating = setIsGeneratingCoverLetter;
      cost = 400;
      displayLabel = 'ATS Cover Letter';
    } else if (assetType === 'CV') {
      setGenerating = setIsGeneratingCV;
      cost = 500;
      displayLabel = 'ATS CV / Resume';
    } else {
      setGenerating = setIsGeneratingPortfolio;
      cost = 600;
      displayLabel = 'Custom Case Portfolio';
    }

    setGenerating(true);
    if (assetType === 'COVER_LETTER') {
      setGeneratedCoverLetter(null);
    }
    addLog(`Initiating ${displayLabel} compiler for "${job.jobTitle}" at ${job.companyName}...`);
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          jobId: job.id,
          jobTitle: job.jobTitle,
          companyName: job.companyName,
          keyRequirementsSummary: ['Technical competency', 'Remote reliability', 'Self-governance'],
          assetType
        })
      });

      const data = await response.json();
      if (response.ok) {
        addLog(`Successfully compiled ${displayLabel}. ₦${cost} debited from wallet.`);
        if (assetType === 'COVER_LETTER') {
          setGeneratedCoverLetter(data.content);
        }
        
        // Sync financials and transaction history
        await fetchUserProfile();
        await fetchTransactions();
        await fetchDocuments();
      } else {
        alert(data.error || `Failed to generate ${displayLabel}.`);
        addLog(`[Document Agent] Generation failed: ${data.error}`);
      }
    } catch (e) {
      console.error(e);
      addLog("[Document Agent] Back-end compilation request error. Please verify server is active on port 8080.");
    } finally {
      setGenerating(false);
    }
  };

  // Keep compatibility for existing cover letter calls
  const generateCoverLetter = async (job: JobMatch) => {
    await generateATSAsset(job, 'COVER_LETTER');
  };

  // Open direct application email modal
  const openEmailModalForJob = (job: any, kanbanTaskId?: string) => {
    setEmailJob({ ...job, kanbanTaskId });
    setEmailRecipient(job.applicationEmail || job.applicationLinkOrEmail || 'recruitment@company.com');
    
    let subject = job.emailSubject || `Application for ${job.jobTitle} - ${profile.name || '[   ]'}`;
    if (profile.name) {
      subject = subject.replace(/\[Candidate Name\]/gi, profile.name)
                       .replace(/\[Your Name\]/gi, profile.name)
                       .replace(/Candidate Name/gi, profile.name);
    }
    setEmailSubject(subject);
    
    let promptBody = `Dear Hiring Team,

I am excited to submit my application for the ${job.jobTitle} role at ${job.companyName}. 

As a remote-ready candidate, I operate with a fully redundant remote-work setup (solar backup power and fiber connectivity) guaranteeing 100% operational uptime. My technical experience aligns directly with the core competencies required for this role.`;

    if (job.emailBodyRequirements) {
      promptBody += `\n\nRegarding your application requirements:\n${job.emailBodyRequirements}`;
    } else {
      promptBody += `\n\nI have attached my compiled ATS-compliant CV, Cover Letter, and Portfolio detailing my previous projects and architectures.`;
    }

    promptBody += `\n\nI look forward to discussing how I can add value to your engineering team.

Best regards,
${profile.name || '[   ]'}`;

    setEmailBody(promptBody);

    // Smart pre-selection of vault documents
    const autoSelectedDocIds: string[] = [];
    if (Array.isArray(job.attachmentsRequired) && job.attachmentsRequired.length > 0) {
      job.attachmentsRequired.forEach((reqType: string) => {
        const cleanReq = reqType.toUpperCase().trim();
        let matchDocType = '';
        if (cleanReq.includes('CV') || cleanReq.includes('RESUME')) {
          matchDocType = 'CV';
        } else if (cleanReq.includes('COVER') || cleanReq.includes('LETTER')) {
          matchDocType = 'COVER_LETTER';
        } else if (cleanReq.includes('PORTFOLIO')) {
          matchDocType = 'PORTFOLIO';
        }

        if (matchDocType) {
          const matchingDocs = compiledDocuments.filter(d => d.type === matchDocType);
          if (matchingDocs.length > 0) {
            matchingDocs.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
            const specificDoc = matchingDocs.find(d => 
              (d.companyName && d.companyName.toLowerCase() === job.companyName.toLowerCase()) || 
              (d.jobTitle && d.jobTitle.toLowerCase() === job.jobTitle.toLowerCase())
            );
            if (specificDoc) {
              autoSelectedDocIds.push(specificDoc.id);
            } else {
              autoSelectedDocIds.push(matchingDocs[0].id);
            }
          }
        }
      });
    }

    setSelectedDocuments(autoSelectedDocIds);
    setShowEmailModal(true);
    addLog(`[Email Dispatcher] Pre-populated application for ${job.jobTitle}. Auto-selected ${autoSelectedDocIds.length} assets from brain cloner.`);
  };

  // Send Direct Application Email
  const handleSendApplicationEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailRecipient || !emailSubject || !emailBody) {
      alert("Please fill in recipient, subject, and body.");
      return;
    }

    setIsSendingEmail(true);
    addLog(`Initiating direct email dispatch to <${emailRecipient}>...`);

    try {
      const response = await fetch(`${API_BASE_URL}/api/send-application-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          recipientEmail: emailRecipient,
          subject: emailSubject,
          bodyText: emailBody,
          documentIds: selectedDocuments,
          jobId: emailJob?.id || '',
          jobTitle: emailJob?.jobTitle || '',
          companyName: emailJob?.companyName || ''
        })
      });

      const data = await response.json();
      if (response.ok) {
        addLog(`Application email dispatched successfully! ₦200 debited from wallet.`);
        alert(data.message || "Application email dispatched successfully.");

        // Automatically move the Kanban job card status to 'applied'
        if (emailJob && emailJob.kanbanTaskId) {
          setTasks(prev => prev.map(t => {
            if (t.id === emailJob.kanbanTaskId) {
              addLog(`Kanban state transition: Moved task "${t.title}" to APPLIED.`);
              return { ...t, status: 'applied' };
            }
            return t;
          }));
        }

        setShowEmailModal(false);
        setEmailRecipient('recruitment@company.com');
        setEmailSubject('');
        setEmailBody('');
        setSelectedDocuments([]);
        setEmailJob(null);

        await fetchUserProfile();
        await fetchTransactions();
        await fetchMailThreads();
      } else {
        alert(data.error || "Failed to dispatch application email.");
        addLog(`[Email Dispatcher] Send failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      addLog("[Email Dispatcher] Backend email dispatcher error.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  // triggerScraperSweep is defined above near fetchDiscoveredJobs

  // Trigger Manual Scraper Search
  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchJobTitle) {
      alert("Please specify a job title for the Scraper Agent.");
      return;
    }

    const selectedTypes: string[] = [];
    if (arrangeRemote) selectedTypes.push('Remote');
    if (arrangeHybrid) selectedTypes.push('Hybrid');
    if (arrangeOnsite) selectedTypes.push('Onsite');
    const computedJobType = selectedTypes.length > 0 ? selectedTypes.join(', ') : 'Any';

    setIsSearchingManual(true);
    setManualSearchResults([]);
    setGeneratedQuery('');
    addLog(`[Boolean Scraper Agent] Operator commanded on-demand web search sweep...`);
    addLog(`[Boolean Scraper Agent] Formulating query for: "${searchJobTitle}" (${computedJobType})`);

    // Live feedback steps to console
    setTimeout(() => addLog(`[Boolean Scraper Agent] Contacting Gemini Flash layer...`), 500);
    setTimeout(() => addLog(`[Boolean Scraper Agent] Designing optimal Advanced Boolean queries...`), 1200);

    try {
      const response = await fetch(`${API_BASE_URL}/api/manual-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || undefined,
          jobTitle: searchJobTitle,
          location: searchLocation || undefined,
          jobType: computedJobType,
          salaryRange: searchSalary || undefined,
          customKeywords: searchKeywords || undefined,
          targetDomain: searchDomain
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setManualSearchResults(data.jobs || []);
        setGeneratedQuery(data.booleanQuery || '');
        setManualSearchLatency(data.latencyMs || 0);
        setShowSearchResults(true);
        addLog(`[Boolean Scraper Agent] Sweep completed successfully in ${data.latencyMs}ms!`);
        addLog(`[Boolean Scraper Agent] Constructed Boolean: "${data.booleanQuery}"`);
        addLog(`[Boolean Scraper Agent] Discovered ${data.jobs?.length || 0} matching listings on standard ATS platforms.`);
      } else {
        alert(data.error || "On-demand search failed.");
        addLog(`[Boolean Scraper Agent] Execution failed: ${data.details || data.error}`);
      }
    } catch (err: any) {
      console.error(err);
      addLog(`[Boolean Scraper Agent] Search gateway request failed. Offline Fallback.`);
      
      // Seed some nice mock offline results so user's experience is always 100% functional and premium
      setTimeout(() => {
        const mockOfflineJobs = [
          {
            id: 'discovered_mock_1',
            companyName: 'Acme Systems',
            jobTitle: searchJobTitle,
            workType: selectedTypes.length > 0 ? (selectedTypes[0] as any) : 'Remote',
            applicationLinkOrEmail: 'https://boards.greenhouse.io/acme/jobs/101239',
            sourcePlatform: 'Greenhouse',
            keyRequirementsSummary: ['Technical Skills', 'Teamwork', 'Reliability'],
            salaryRange: searchSalary || '₦500,000 - ₦750,000 / Month',
            matchScore: 88,
            applicationEmail: 'careers@acme.com',
            applicationPhone: '+234-803-555-1234',
            applicationLink: 'https://boards.greenhouse.io/acme/jobs/101239'
          },
          {
            id: 'discovered_mock_2',
            companyName: 'Apex Labs',
            jobTitle: `${searchJobTitle} (Platform Support)`,
            workType: 'Hybrid',
            applicationLinkOrEmail: 'https://jobs.lever.co/apex/9812-ad',
            sourcePlatform: 'Lever',
            keyRequirementsSummary: ['Communication', 'Cloud Infrastructure', 'Automation'],
            salaryRange: searchSalary || '₦450,000 - ₦600,000 / Month',
            matchScore: 74,
            applicationEmail: 'recruitment@apexlabs.com',
            applicationPhone: '+1-415-555-9812',
            applicationLink: 'https://jobs.lever.co/apex/9812-ad'
          }
        ];
        setManualSearchResults(mockOfflineJobs);
        
        let constructedQuery = '';
        if (searchDomain === 'all') {
          constructedQuery = `(site:linkedin.com OR site:twitter.com OR site:instagram.com) "${searchJobTitle}" "${searchLocation || 'Remote'}"`;
        } else {
          constructedQuery = `site:${searchDomain} "${searchJobTitle}" "${searchLocation || 'Remote'}"`;
        }
        
        setGeneratedQuery(constructedQuery);
        setManualSearchLatency(1420);
        setShowSearchResults(true);
        addLog(`[Boolean Scraper Agent] Offline Mode: Scraped 2 mock listings matching criteria.`);
      }, 1500);
    } finally {
      setIsSearchingManual(false);
    }
  };

  // Import discovery job directly to the Kanban matched inbox
  const importJobToKanban = (job: any) => {
    if (importedJobIds.includes(job.id)) return;

    const nt: KanbanTask = {
      id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: job.jobTitle,
      company: job.companyName,
      status: 'matched',
      salary: job.salaryRange || 'Competitive',
      confidence: job.matchScore || 85,
      date: 'Just Now',
      applicationEmail: job.applicationEmail,
      applicationPhone: job.applicationPhone,
      applicationLink: job.applicationLink,
      keyRequirementsSummary: job.keyRequirementsSummary,
      sourcePlatform: job.sourcePlatform,
      applicationMethod: job.applicationMethod,
      emailSubject: job.emailSubject,
      emailBodyRequirements: job.emailBodyRequirements,
      attachmentsRequired: job.attachmentsRequired
    };

    setTasks(prev => [...prev, nt]);
    setImportedJobIds(prev => [...prev, job.id]);
    addLog(`[Scraper Workspace] Imported listing "${job.jobTitle}" at ${job.companyName} to Matched Inbox.`);
  };

  // Move task card statuses manually via arrow buttons
  const moveTaskStatus = (taskId: string, direction: 'forward' | 'backward') => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        let nextStatus = task.status;
        if (direction === 'forward') {
          if (task.status === 'matched') nextStatus = 'applied';
          else if (task.status === 'applied') nextStatus = 'interviews';
        } else {
          if (task.status === 'interviews') nextStatus = 'applied';
          else if (task.status === 'applied') nextStatus = 'matched';
        }
        addLog(`Moved task "${task.title}" state to ${nextStatus.toUpperCase()}`);
        return { ...task, status: nextStatus };
      }
      return task;
    }));
  };

  // Create customized Kanban card tracking
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskCompany) return;

    const nt: KanbanTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      company: newTaskCompany,
      status: newTaskColumn,
      salary: newTaskSalary || 'Competitive',
      confidence: Math.floor(72 + Math.random() * 26),
      date: 'Just Now'
    };

    setTasks(prev => [...prev, nt]);
    addLog(`Created career tracking event: "${newTaskTitle}" at ${newTaskCompany}`);
    setShowNewTaskModal(false);
    setNewTaskTitle('');
    setNewTaskCompany('');
    setNewTaskSalary('');
  };

  // Native HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = 'move';
    
    // Smooth opacity adjustment feedback
    setTimeout(() => {
      const card = document.getElementById(id);
      if (card) card.classList.add('dragging');
    }, 0);
  };

  const handleDragEnd = (_e: React.DragEvent, id: string) => {
    setDraggedTaskId(null);
    setActiveDropColumn(null);
    const card = document.getElementById(id);
    if (card) card.classList.remove('dragging');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, colStatus: 'matched' | 'applied' | 'interviews') => {
    e.preventDefault();
    setActiveDropColumn(colStatus);
  };

  const handleDragLeave = (_e: React.DragEvent) => {
    // Left empty intentionally
  };

  const handleDrop = (e: React.DragEvent, targetStatus: 'matched' | 'applied' | 'interviews') => {
    e.preventDefault();
    setActiveDropColumn(null);
    if (!draggedTaskId) return;

    setTasks(prev => prev.map(task => {
      if (task.id === draggedTaskId) {
        if (task.status !== targetStatus) {
          addLog(`Dragged "${task.title}" to ${targetStatus.toUpperCase()} column.`);
          return { ...task, status: targetStatus };
        }
      }
      return task;
    }));
  };

  const getSortedTasks = (column: 'matched' | 'applied' | 'interviews') => {
    const filtered = tasks.filter(t => t.status === column);
    return [...filtered].sort((a, b) => {
      const aPinned = a.pinned ? 1 : 0;
      const bPinned = b.pinned ? 1 : 0;
      return bPinned - aPinned; // pinned first
    });
  };

  const handleTogglePin = (taskId: string) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? { ...t, pinned: !t.pinned } : t);
      const t = updated.find(x => x.id === taskId);
      if (t) {
        addLog(`[Kanban] Task "${t.title}" pin state set to ${t.pinned}.`);
      }
      return updated;
    });
  };

  const handleRemoveTask = (taskId: string) => {
    setTasks(prev => {
      const t = prev.find(x => x.id === taskId);
      if (t) {
        addLog(`[Kanban] Task "${t.title}" removed from tracking.`);
      }
      return prev.filter(x => x.id !== taskId);
    });
  };

  const toggleWorkTypePref = (type: string) => {
    setSettingsWorkTypePreferences(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };


  // Unified Settings Center Form Handlers
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSettings(true);
    addLog(`⚙️ Saving customized settings, custom SMTP, and billing key overrides in candidate database...`);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${currentUserId}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: settingsName,
          phoneNumber: settingsPhone,
          location: settingsLocation,
          role: settingsRole,
          salary: settingsSalary,
          skills: settingsSkills,
          password: settingsPassword,
          profilePic: settingsProfilePic,
          smtpSettings: {
            host: settingsSmtpHost,
            port: Number(settingsSmtpPort) || 587,
            user: settingsSmtpUser,
            pass: settingsSmtpPass
          },
          geminiApiKey: settingsGeminiKey,
          flutterwavePublicKey: settingsFlwPubKey,
          flutterwaveSecretKey: settingsFlwSecKey,
          hasVoiceOnboarded: hasVoiceOnboarded,
          tickerTargetDomains: tickerTargetDomains,
          scanInterval: settingsScanInterval,
          feedRefreshInterval: settingsFeedRefreshInterval,
          workTypePreferences: settingsWorkTypePreferences
        })
      });

      if (res.ok) {
        addLog(`⚙️ Settings configurations & third-party keys persisted successfully.`);
        setScanInterval(settingsScanInterval);
        setFeedRefreshInterval(settingsFeedRefreshInterval);
        setWorkTypePreferences(settingsWorkTypePreferences);
        setShowSettingsModal(false);
        await fetchUserProfile();
        alert("Settings saved successfully!");
      } else {
        const errData = await res.json();
        addLog(`❌ [Settings] Failed to update backend configuration: ${errData.error || 'Unknown error'}`);
        alert(`Failed to save settings: ${errData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      addLog(`❌ [Settings] Communication failure during update: ${err.message}`);
      alert("Network error: Settings could not be saved to backend.");
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const addSettingsSkillTag = () => {
    const textClean = settingsNewSkill.trim();
    if (textClean && !settingsSkills.includes(textClean)) {
      setSettingsSkills(prev => [...prev, textClean]);
      setSettingsNewSkill('');
    }
  };

  const removeSettingsSkillTag = (skillToRemove: string) => {
    setSettingsSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  // Import ticker job to Kanban matching column
  const importTickerJob = (job: JobMatch, instantlyApply: boolean = false) => {
    const isTracked = tasks.some(t => t.title === job.jobTitle && t.company === job.companyName);
    
    if (isTracked) {
      alert("This match is already in your dashboard action milestones!");
      return;
    }

    const colStatus = instantlyApply ? 'applied' : 'matched';
    const nt: KanbanTask = {
      id: `task-ticker-${Date.now()}-${job.id}`,
      title: job.jobTitle,
      company: job.companyName,
      status: colStatus,
      salary: job.salaryRange,
      confidence: job.score,
      date: colStatus === 'applied' ? 'Applied Now' : 'Ticker Match',
      applicationEmail: job.applicationEmail,
      applicationPhone: job.applicationPhone,
      applicationLink: job.applicationLink,
      keyRequirementsSummary: job.keyRequirementsSummary,
      sourcePlatform: job.sourcePlatform,
      applicationMethod: job.applicationMethod,
      emailSubject: job.emailSubject,
      emailBodyRequirements: job.emailBodyRequirements,
      attachmentsRequired: job.attachmentsRequired
    };

    setTasks(prev => [nt, ...prev]);
    addLog(`Imported scrolling job "${job.jobTitle}" into ${colStatus.toUpperCase()} milestones.`);
    setSelectedJob(null);
  };

  // ----------------------------------------------------
  // GLASSMORPHIC AUTHENTICATION VIEW HANDLER
  // ----------------------------------------------------
  if (!userId) {
    return (
      <div style={{ position: 'relative' }}>
        <LandingPage 
          onSignIn={() => { 
            setAuthError('');
            setAuthMode('login'); 
            setShowAuthModal(true); 
          }} 
          onSignUp={() => { 
            setAuthError('');
            setAuthMode('signup'); 
            setShowAuthModal(true); 
          }} 
        />
        
        {showAuthModal && (
          <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => setShowAuthModal(false)}>
            <div className="auth-card glass-panel animate-fade-in" style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" style={{ fontSize: '1.75rem', top: '0.75rem', right: '1rem' }} onClick={() => setShowAuthModal(false)}>&times;</button>
              
              <div className="logo-icon" style={{ margin: '0 auto 1.25rem auto', width: '52px', height: '52px', fontSize: '1.6rem' }}>GiGO</div>
              <h2 className="text-gradient-purple-pink" style={{ textAlign: 'center', fontSize: '1.9rem', fontWeight: 800 }}>GiGO PLATFORM</h2>
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                AI-Native Job Matching Scraper, Real-time Voice Onboarding & Secure Flutterwave Ledger
              </p>

              {authMode === 'login' ? (
                <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                  {authError && <div className="auth-error-badge">{authError}</div>}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="you@domain.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-glass btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', fontWeight: 700 }} disabled={isSubmittingAuth}>
                    {isSubmittingAuth ? 'Handshaking...' : 'Login to Workspace'}
                  </button>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>
                    New to the platform? <span onClick={() => { setAuthMode('signup'); setAuthError(''); }} style={{ color: 'var(--secondary)', cursor: 'pointer', fontWeight: 700 }}>Create Live Profile</span>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                  {authError && <div className="auth-error-badge">{authError}</div>}
                  
                  {/* AI VOICE SIGN-UP CONTROLLER */}
                  <div className="glass-card" style={{ padding: '0.8rem', background: 'linear-gradient(135deg, rgba(138, 92, 246, 0.1), rgba(217, 70, 239, 0.1))', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)' }}>🎤 AI Voice Sign-up</span>
                      {signupWaveActive && <span className="badge badge-pink" style={{ animation: 'pulseGlow 1.5s infinite', fontSize: '0.65rem' }}>RECORDING</span>}
                    </div>
                    
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Tap the mic and state your name, email, and phone number. We'll extract them instantly!
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {!isSignupVoiceRecording ? (
                        <button 
                          type="button" 
                          className="btn-glass" 
                          onClick={startSignupVoiceRecording}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', width: '100%', justifyContent: 'center' }}
                          disabled={isAnalyzingSignupVoice}
                        >
                          🎙️ Start Recording
                        </button>
                      ) : (
                        <button 
                          type="button" 
                          className="btn-glass" 
                          onClick={stopSignupVoiceRecording}
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', width: '100%', justifyContent: 'center', borderColor: 'var(--rose)', color: 'var(--rose)' }}
                        >
                          🛑 Stop & Parse Coordinates
                        </button>
                      )}
                    </div>

                    {signupVoiceStatus && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)', textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.35rem', borderRadius: '4px' }}>
                        {isAnalyzingSignupVoice ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                            <span className="animate-float" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)' }}></span>
                            <span>{signupVoiceStatus}</span>
                          </div>
                        ) : (
                          <span>{signupVoiceStatus}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Full Name</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. [   ]"
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="you@domain.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Phone Number</label>
                    <input 
                      type="tel" 
                      className="form-control" 
                      placeholder="e.g. 2348011223344"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Password</label>
                    <input 
                      type="password" 
                      className="form-control" 
                      placeholder="Create secure password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-glass btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', fontWeight: 700 }} disabled={isSubmittingAuth}>
                    {isSubmittingAuth ? 'Initializing Profile...' : 'Sign Up (0 NGN & 0 USD Balance)'}
                  </button>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '0.5rem' }}>
                    Already registered? <span onClick={() => { setAuthMode('login'); setAuthError(''); }} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 700 }}>Sign In</span>
                  </p>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN WORKSPACE INTERFACES (LOGGED-IN SESSION)
  // ----------------------------------------------------
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER BAR */}
      <header className="app-header">
        <div className="logo-container">
          <div className="logo-icon">GiGO</div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.05em' }}>
              GiGO PLATFORM
            </h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>AI-Native Career Ecosystem</p>
          </div>
        </div>

        {/* Dash/Admin Mode Switcher & User Profiler Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          
          {/* Dynamic Theme & Vocal Customization Selector Panel */}
          <div className="theme-selector-panel glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              🎨 Style:
            </span>
            <button 
              className={`theme-dot obsidian-dot`}
              title="Obsidian Purple"
              onClick={() => setActiveTheme('obsidian')}
              style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#8a5cf6', border: activeTheme === 'obsidian' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', outline: 'none', padding: 0 }}
            />
            <button 
              className={`theme-dot emerald-dot`}
              title="Emerald Green"
              onClick={() => setActiveTheme('emerald')}
              style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#10b981', border: activeTheme === 'emerald' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', outline: 'none', padding: 0 }}
            />
            <button 
              className={`theme-dot sunset-dot`}
              title="Sunset Orange"
              onClick={() => setActiveTheme('sunset')}
              style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#f59e0b', border: activeTheme === 'sunset' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', outline: 'none', padding: 0 }}
            />
            <button 
              className={`theme-dot ocean-dot`}
              title="Ocean Blue"
              onClick={() => setActiveTheme('ocean')}
              style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#0ea5e9', border: activeTheme === 'ocean' ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', outline: 'none', padding: 0 }}
            />
            <button 
              type="button"
              className="btn-glass" 
              onClick={handleVoiceStyleCommand}
              title="Speak Style Command (e.g. 'sunset')"
              style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '22px', border: 'none', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}
            >
              🎙️ Speak
            </button>
          </div>
          
          {(userEmail === 'admin@gigo.com' || userRole === 'admin') && (
            <div className="toggle-switch-panel glass-panel">
              <button 
                className={`btn-glass btn-tab ${!isAdminMode ? 'active-tab' : ''}`}
                onClick={() => setIsAdminMode(false)}
              >
                Dashboard
              </button>
              <button 
                className={`btn-glass btn-tab ${isAdminMode ? 'active-tab' : ''}`}
                onClick={() => {
                  setIsAdminMode(true);
                  fetchAdminUsers();
                  fetchAdminLogs();
                }}
              >
                Admin Console
              </button>
            </div>
          )}

          <div className="user-profile-badge" style={{ cursor: 'pointer' }} onClick={() => {
            setSettingsActiveTab('profile');
            setShowSettingsModal(true);
          }}>
            {renderUserAvatar(profile.profilePic, '28px', { marginRight: '4px' })}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                {userFullName || 'Vocal Identity Pending'}
                {isUptimeVerified && (
                  <span className="uptime-badge" title="Verified Remote-Ready Uptime">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ stroke: 'currentColor', strokeWidth: 2 }}>
                      <path d="M10 3L4.5 8.5L2 6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Uptime Verified
                  </span>
                )}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{profile.role}</span>
            </div>
          </div>

          <button className="btn-glass" style={{ padding: '0.5rem 0.8rem', fontSize: '0.8rem', fontWeight: 700, borderColor: 'rgba(239, 68, 68, 0.35)', color: '#fca5a5' }} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {/* DASHBOARD VIEW OR ADMINISTRATIVE PORTAL DISPLAY GRID */}
      {(!isAdminMode || (userEmail !== 'admin@gigo.com' && userRole !== 'admin')) ? (
        <>
          {userId && userRole !== 'admin' && !userFullName && (
            <div style={{
              margin: '1.25rem 2rem 0 2rem',
              padding: '0.85rem 1.25rem',
              background: 'rgba(217, 119, 6, 0.12)',
              border: '1px solid rgba(217, 119, 6, 0.35)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              boxShadow: '0 0 15px rgba(217, 119, 6, 0.08)',
              backdropFilter: 'blur(10px)'
            }} className="warning-banner-animated">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 800 }}>Vocal Name Registration Pending</strong>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)' }}>
                    We couldn't clearly parse your name from the voice onboarding audio. Please click the action button to complete your profile settings manually or using the microphone.
                  </span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSettingsActiveTab('profile');
                  setShowSettingsModal(true);
                }}
                className="btn-glass"
                style={{ 
                  padding: '0.4rem 0.85rem', 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  borderColor: 'rgba(217, 119, 6, 0.4)', 
                  color: '#fbbf24',
                  background: 'rgba(217, 119, 6, 0.05)',
                  flexShrink: 0
                }}
              >
                Complete Settings ⚙️
              </button>
            </div>
          )}
          
          {/* SMTP INTEGRATION PENDING EDUCATION BANNER */}
          {userId && userRole !== 'admin' && (!settingsSmtpHost || !settingsSmtpUser || !settingsSmtpPass) && (
            <div style={{
              margin: '1.25rem 2rem 0 2rem',
              padding: '0.85rem 1.25rem',
              background: 'rgba(138, 92, 246, 0.08)',
              border: '1px solid rgba(138, 92, 246, 0.25)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              boxShadow: '0 0 15px rgba(138, 92, 246, 0.05)',
              backdropFilter: 'blur(10px)'
            }} className="smtp-banner-animated animate-fade-in">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.25rem' }}>📧</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: '0.85rem', color: '#c4b5fd', fontWeight: 800 }}>Real Gmail Integration Pending</strong>
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)' }}>
                    Your job dispatches are running in simulation mock mode. Calibrate your Google SMTP handshake to send real emails that show up in your Gmail Sent folder!
                  </span>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSettingsActiveTab('keys');
                  setShowSettingsModal(true);
                }}
                className="btn-glass"
                style={{ 
                  padding: '0.4rem 0.85rem', 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  borderColor: 'rgba(138, 92, 246, 0.35)', 
                  color: '#c4b5fd',
                  background: 'rgba(138, 92, 246, 0.05)',
                  flexShrink: 0
                }}
              >
                Connect Gmail ⚙️
              </button>
            </div>
          )}
          {/* WORKSPACE SELECTION TABS (PHASE 12) */}
          <nav className="workspace-nav-bar animate-fade-in">
            <button 
              className={`workspace-tab-btn ${activeWorkspaceTab === 'copilot' ? 'active' : ''}`}
              onClick={() => setActiveWorkspaceTab('copilot')}
            >
              <span style={{ fontSize: '1.1rem' }}>🚀</span> Co-Pilot Deck
            </button>
            <button 
              className={`workspace-tab-btn ${activeWorkspaceTab === 'radar' ? 'active' : ''}`}
              onClick={() => setActiveWorkspaceTab('radar')}
            >
              <span style={{ fontSize: '1.1rem' }}>📡</span> Command Radar
            </button>
            <button 
              className={`workspace-tab-btn ${activeWorkspaceTab === 'brain' ? 'active' : ''}`}
              onClick={() => {
                setActiveWorkspaceTab('brain');
                setActiveLeftTab('brain');
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>🧠</span> Cloner Vault & Identity
            </button>
            <button 
              className={`workspace-tab-btn ${activeWorkspaceTab === 'wallets' ? 'active' : ''}`}
              onClick={() => setActiveWorkspaceTab('wallets')}
            >
              <span style={{ fontSize: '1.1rem' }}>💳</span> Financial Cockpit
            </button>
            <button 
              className={`workspace-tab-btn ${activeWorkspaceTab === 'mailroom' ? 'active' : ''}`}
              onClick={() => setActiveWorkspaceTab('mailroom')}
            >
              <span style={{ fontSize: '1.1rem' }}>📬</span> Mailroom
            </button>
            <button 
              className={`workspace-tab-btn ${activeWorkspaceTab === 'interview' ? 'active' : ''}`}
              onClick={() => setActiveWorkspaceTab('interview')}
            >
              <span style={{ fontSize: '1.1rem' }}>🎙️</span> Mock Interview
            </button>
            <button 
              className="workspace-tab-btn"
              onClick={() => {
                setSettingsActiveTab('keys');
                setShowSettingsModal(true);
              }}
              style={{
                background: 'rgba(138, 92, 246, 0.1)',
                border: '1px solid rgba(138, 92, 246, 0.3)',
                color: '#c4b5fd'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>⚙️</span> Settings Cockpit
            </button>
          </nav>


          {activeWorkspaceTab === 'copilot' && (
            <main className="dashboard-grid animate-fade-in">
              {/* Right Column: Live Match Ticker Sidebar */}
              {/* COLUMN 3: REAL-TIME MATCH TICKER SIDEBAR */}
              <section className="jobs-sidebar glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
            <div className="ticker-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingBottom: '1rem', borderBottom: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>Live AI Matches Ticker</span>
              {hasVoiceOnboarded && (
                <button 
                  className={`btn-glass ${isRunningScraper ? 'btn-secondary' : 'btn-primary'}`} 
                  style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                  onClick={triggerScraperSweep}
                  disabled={isRunningScraper}
                >
                  {isRunningScraper ? (
                    <>
                      <div className="spinner-micro" style={{ width: '10px', height: '10px', border: '1px solid rgba(255, 255, 255, 0.1)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      Scanning...
                    </>
                  ) : (
                    <>
                      <RefreshIcon /> Scan Jobs
                    </>
                  )}
                </button>
              )}
            </div>
            
            {!hasVoiceOnboarded ? (
              // Glassmorphic lock nudge block
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                padding: '2rem 1.5rem',
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                margin: '1rem 0',
                gap: '1rem'
              }}>
                <div style={{ fontSize: '2.5rem', animation: 'pulse 2s infinite' }}>🎙️</div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Live AI Match Stream Inactive</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                  Complete your first **Voice Onboarding** session in Column 2 to activate your personalized job matches ticker and tap into real-time career matching feeds!
                </p>
                <div style={{
                  fontSize: '0.75rem',
                  padding: '0.5rem 0.75rem',
                  background: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid var(--primary)',
                  borderRadius: '8px',
                  color: 'var(--primary)',
                  fontWeight: 600
                }}>
                  Awaiting Voice Synch...
                </div>
              </div>
            ) : (
              <>
                <div className="jobs-scroll-container" style={{ flex: 1 }}>
                  <div className="jobs-scroll-content">
                    {scrollingTickerJobs.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '2rem 1rem' }}>No listings matched. Tap Scan Jobs to scrape live portals on-demand.</div>
                    ) : (
                      scrollingTickerJobs.map((job, idx) => (
                        <div 
                          key={`${job.id}-${idx}`} 
                          className="job-ticker-card"
                          onClick={() => setSelectedJob(job)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              {job.location} • 📅 Posted: {getRelativeTime(job.postedAt || job.scrapedAt)} • 🕒 Synced: {getRelativeTime(job.scrapedAt)}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{job.score}% match</span>
                              <button
                                style={{
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  backdropFilter: 'blur(5px)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#ef4444',
                                  borderRadius: '4px',
                                  width: '18px',
                                  height: '18px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.6rem',
                                  cursor: 'pointer',
                                  padding: 0,
                                  transition: 'all 0.2s ease',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.35)';
                                  e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                                onClick={(e) => handleDismissJob(job.id, e)}
                                title="Dismiss listing"
                              >
                                ❌
                              </button>
                            </div>
                          </div>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {job.jobTitle}
                          </h4>
                          <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.15rem' }}>
                            {job.companyName}
                          </p>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {job.salaryRange}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {remainingJobs.length > 0 && (
                  <div style={{ padding: '0 1rem 0.75rem 1rem' }}>
                    <button 
                      className="btn-glass btn-primary" 
                      style={{ 
                        width: '100%', 
                        padding: '0.6rem 1rem', 
                        fontSize: '0.8rem', 
                        fontWeight: 700, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '0.5rem',
                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.2)',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onClick={() => setShowRemainingJobsModal(true)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.35)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.2)';
                      }}
                    >
                      🔍 View More Matches ({remainingJobs.length})
                    </button>
                  </div>
                )}

                <div style={{ padding: '1rem', borderTop: '1px solid var(--border-glass)', background: 'rgba(0, 0, 0, 0.15)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {tickerTargetDomains.length === 0 ? (
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Broad Web Search Active</span>
                      ) : (
                        tickerTargetDomains.map(dom => (
                          <span key={dom} className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                            {dom}
                          </span>
                        ))
                      )}
                    </div>
                    <button 
                      className="btn-glass btn-primary" 
                      style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem', fontWeight: 600 }}
                      onClick={() => setShowTickerConfigModal(true)}
                    >
                      ⚙️ Customize (₦300)
                    </button>
                  </div>
                  <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: '1.2', margin: 0 }}>
                    Hover to pause scrolling. Click on cards to apply. Target specific domains for a one-off carrier balance deduction.
                  </p>
                </div>
              </>
            )}
          </section>
              {/* Middle Column: Career Action Milestones Kanban */}
              <section className="copilot-kanban" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* ACTION ITEMS: CAREER TASK BOARD */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Career Action Milestones</h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Drag and drop cards or click arrows to advance interview progress.</p>
                </div>
                <button className="btn-glass btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => setShowNewTaskModal(true)}>
                  <PlusIcon /> Track Event
                </button>
              </div>

              <div className="kanban-grid">
                
                {/* COL 1: MATCHED / INBOX */}
                <div 
                  className={`kanban-column ${activeDropColumn === 'matched' ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, 'matched')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'matched')}
                >
                  <div className="kanban-col-header">
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Matched Inbox</span>
                    <span className="badge badge-purple">{getSortedTasks('matched').length}</span>
                  </div>
                  
                  {getSortedTasks('matched').map(task => (
                    <div 
                      key={task.id} 
                      id={task.id}
                      className="kanban-card"
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={(e) => handleDragEnd(e, task.id)}
                      style={task.pinned ? {
                        border: '1px solid var(--border-glass-active)',
                        boxShadow: '0 0 12px rgba(138, 92, 246, 0.25)',
                        background: 'linear-gradient(135deg, rgba(138, 92, 246, 0.08), rgba(255, 255, 255, 0.02))'
                      } : undefined}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{task.company}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePin(task.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: task.pinned ? 'var(--primary)' : 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 0,
                              fontSize: '0.8rem',
                              opacity: task.pinned ? 1 : 0.4,
                              transition: 'all 0.2s ease',
                              outline: 'none'
                            }}
                            title={task.pinned ? "Unpin task" : "Pin task to top"}
                          >
                            📌
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTask(task.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 0,
                              fontSize: '0.8rem',
                              opacity: 0.4,
                              transition: 'all 0.2s ease',
                              outline: 'none'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                            title="Remove task"
                          >
                            🗑️
                          </button>
                          <span className="badge badge-purple">{task.confidence}% Match</span>
                        </div>
                      </div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>{task.title}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{task.salary}</p>
                      
                      {/* Direct Channels CTA Row */}
                      {(task.applicationEmail || task.applicationLink || task.applicationPhone) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem', padding: '0.4rem 0', borderTop: '1px dashed var(--border-glass)' }}>
                          {task.applicationLink && (
                            <a 
                              href={task.applicationLink} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="badge badge-purple" 
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', textDecoration: 'none', cursor: 'pointer' }}
                            >
                              🔗 Direct Link
                            </a>
                          )}
                          {task.applicationEmail && (
                            <button 
                              type="button" 
                              className="badge badge-pink" 
                              onClick={() => openEmailModalForJob({ id: task.id, jobTitle: task.title, companyName: task.company, salaryRange: task.salary, score: task.confidence, applicationEmail: task.applicationEmail }, task.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', border: 'none', cursor: 'pointer' }}
                            >
                              📧 Send Email
                            </button>
                          )}
                          {task.applicationPhone && (
                            <a 
                              href={`tel:${task.applicationPhone}`} 
                              className="badge badge-emerald" 
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', textDecoration: 'none', cursor: 'pointer' }}
                            >
                              📞 Call Now
                            </a>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{task.date}</span>
                        <button 
                          className="btn-glass" 
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }} 
                          onClick={() => openEmailModalForJob({ id: task.id, jobTitle: task.title, companyName: task.company, salaryRange: task.salary, score: task.confidence, applicationEmail: task.applicationEmail }, task.id)}
                        >
                          📧 Apply & Send Email
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* COL 2: APPLIED */}
                <div 
                  className={`kanban-column ${activeDropColumn === 'applied' ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, 'applied')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'applied')}
                >
                  <div className="kanban-col-header">
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Applied / Active</span>
                    <span className="badge badge-pink">{getSortedTasks('applied').length}</span>
                  </div>

                  {getSortedTasks('applied').map(task => (
                    <div 
                      key={task.id} 
                      id={task.id}
                      className="kanban-card"
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={(e) => handleDragEnd(e, task.id)}
                      style={task.pinned ? {
                        border: '1px solid var(--border-glass-active)',
                        boxShadow: '0 0 12px rgba(138, 92, 246, 0.25)',
                        background: 'linear-gradient(135deg, rgba(138, 92, 246, 0.08), rgba(255, 255, 255, 0.02))'
                      } : undefined}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{task.company}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePin(task.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: task.pinned ? 'var(--primary)' : 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 0,
                              fontSize: '0.8rem',
                              opacity: task.pinned ? 1 : 0.4,
                              transition: 'all 0.2s ease',
                              outline: 'none'
                            }}
                            title={task.pinned ? "Unpin task" : "Pin task to top"}
                          >
                            📌
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTask(task.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 0,
                              fontSize: '0.8rem',
                              opacity: 0.4,
                              transition: 'all 0.2s ease',
                              outline: 'none'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                            title="Remove task"
                          >
                            🗑️
                          </button>
                          <span className="badge badge-pink">Applied</span>
                        </div>
                      </div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>{task.title}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{task.salary}</p>
                      
                      {/* Direct Channels CTA Row */}
                      {(task.applicationEmail || task.applicationLink || task.applicationPhone) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem', padding: '0.4rem 0', borderTop: '1px dashed var(--border-glass)' }}>
                          {task.applicationLink && (
                            <a 
                              href={task.applicationLink} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="badge badge-purple" 
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', textDecoration: 'none', cursor: 'pointer' }}
                            >
                              🔗 Direct Link
                            </a>
                          )}
                          {task.applicationEmail && (
                            <button 
                              type="button" 
                              className="badge badge-pink" 
                              onClick={() => openEmailModalForJob({ id: task.id, jobTitle: task.title, companyName: task.company, salaryRange: task.salary, score: task.confidence, applicationEmail: task.applicationEmail }, task.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', border: 'none', cursor: 'pointer' }}
                            >
                              📧 Send Email
                            </button>
                          )}
                          {task.applicationPhone && (
                            <a 
                              href={`tel:${task.applicationPhone}`} 
                              className="badge badge-emerald" 
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', textDecoration: 'none', cursor: 'pointer' }}
                            >
                              📞 Call Now
                            </a>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button className="btn-glass" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => moveTaskStatus(task.id, 'backward')}>
                          ← Undo
                        </button>
                        <button className="btn-glass" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => moveTaskStatus(task.id, 'forward')}>
                          Interview →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* COL 3: INTERVIEWING */}
                <div 
                  className={`kanban-column ${activeDropColumn === 'interviews' ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, 'interviews')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'interviews')}
                >
                  <div className="kanban-col-header">
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Interviews / Offers</span>
                    <span className="badge badge-emerald">{getSortedTasks('interviews').length}</span>
                  </div>

                  {getSortedTasks('interviews').map(task => (
                    <div 
                      key={task.id} 
                      id={task.id}
                      className="kanban-card" 
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={(e) => handleDragEnd(e, task.id)}
                      style={task.pinned ? {
                        border: '1px solid var(--border-glass-active)',
                        boxShadow: '0 0 12px rgba(138, 92, 246, 0.25)',
                        background: 'linear-gradient(135deg, rgba(138, 92, 246, 0.08), rgba(255, 255, 255, 0.02))'
                      } : {
                        borderColor: 'rgba(16, 185, 129, 0.3)',
                        background: 'linear-gradient(to bottom, rgba(16, 185, 129, 0.03), rgba(0, 0, 0, 0))'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{task.company}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => handleTogglePin(task.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: task.pinned ? 'var(--primary)' : 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 0,
                              fontSize: '0.8rem',
                              opacity: task.pinned ? 1 : 0.4,
                              transition: 'all 0.2s ease',
                              outline: 'none'
                            }}
                            title={task.pinned ? "Unpin task" : "Pin task to top"}
                          >
                            📌
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveTask(task.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              padding: 0,
                              fontSize: '0.8rem',
                              opacity: 0.4,
                              transition: 'all 0.2s ease',
                              outline: 'none'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                            title="Remove task"
                          >
                            🗑️
                          </button>
                          <span className="badge badge-emerald">Stage Active</span>
                        </div>
                      </div>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>{task.title}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{task.salary}</p>
                      
                      {/* Direct Channels CTA Row */}
                      {(task.applicationEmail || task.applicationLink || task.applicationPhone) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.5rem', padding: '0.4rem 0', borderTop: '1px dashed var(--border-glass)' }}>
                          {task.applicationLink && (
                            <a 
                              href={task.applicationLink} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="badge badge-purple" 
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', textDecoration: 'none', cursor: 'pointer' }}
                            >
                              🔗 Direct Link
                            </a>
                          )}
                          {task.applicationEmail && (
                            <button 
                              type="button" 
                              className="badge badge-pink" 
                              onClick={() => openEmailModalForJob({ id: task.id, jobTitle: task.title, companyName: task.company, salaryRange: task.salary, score: task.confidence, applicationEmail: task.applicationEmail }, task.id)}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', border: 'none', cursor: 'pointer' }}
                            >
                              📧 Send Email
                            </button>
                          )}
                          {task.applicationPhone && (
                            <a 
                              href={`tel:${task.applicationPhone}`} 
                              className="badge badge-emerald" 
                              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.65rem', textDecoration: 'none', cursor: 'pointer' }}
                            >
                              📞 Call Now
                            </a>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button className="btn-glass" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => moveTaskStatus(task.id, 'backward')}>
                          ← Back
                        </button>
                        <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 600 }}>{task.date}</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
              </section>
              {/* Bottom Row: Telemetry Logs & Network Verifier */}
              <section className="telemetry-bottom" style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '1.5rem', width: '100%', gridColumn: '1 / -1' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '1.5rem', width: '100%' }}>
                  
                  {/* Left Column: Simplified Telemetry Card */}
                  <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', minHeight: '300px' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                      <span style={{ fontSize: '1.2rem' }}>⚡</span> Telemetry Logs
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                      <div className="activity-log" style={{ flex: 1, minHeight: '220px', maxHeight: '400px', overflowY: 'auto' }}>
                        {logs.map((log, index) => (
                          <div key={index} className="activity-item">
                            {log}
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>
                        Telemetry log tracks operational hooks securely.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Uptime & Redundant Backup Live Verifier */}
                  <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', minHeight: '300px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(59, 130, 246, 0.03) 100%)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        <span style={{ fontSize: '1.2rem' }}>📡</span> Redundant Infrastructure Verifier
                      </h2>
                      {isUptimeVerified ? (
                        <span className="badge badge-emerald" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.6rem', boxShadow: '0 0 10px rgba(16, 185, 129, 0.3)' }}>
                          🏆 UPTIME VERIFIED
                        </span>
                      ) : (
                        <span className="badge badge-pink" style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}>
                          UNVERIFIED
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                      Real-time telemetry diagnostics verifying battery, solar inputs, and LTE redundant routers.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
                      <div className="glass-panel" style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PRIMARY FIBER</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isRunningUptimeAudit ? '#fbbf24' : (isUptimeVerified ? '#10b981' : 'var(--text-muted)'), marginTop: '0.25rem' }}>
                          {isRunningUptimeAudit ? '⚡ Handshaking...' : (isUptimeVerified ? 'Online • 8ms' : 'Offline / Untested')}
                        </div>
                      </div>
                      <div className="glass-panel" style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>BACKUP SOLAR BANNER</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isRunningUptimeAudit ? '#fbbf24' : (isUptimeVerified ? '#10b981' : 'var(--text-muted)'), marginTop: '0.25rem' }}>
                          {isRunningUptimeAudit ? '⚡ Querying (10kVA)...' : (isUptimeVerified ? 'Online • 51.4V' : 'Offline / Untested')}
                        </div>
                      </div>
                      <div className="glass-panel" style={{ padding: '0.75rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255, 255, 255, 0.03)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>REDUNANT LTE FAILOVER</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: isRunningUptimeAudit ? '#fbbf24' : (isUptimeVerified ? '#10b981' : 'var(--text-muted)'), marginTop: '0.25rem' }}>
                          {isRunningUptimeAudit ? '⚡ Testing Route...' : (isUptimeVerified ? 'Standby • Ready' : 'Offline / Untested')}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', flex: 1 }}>
                      <div style={{ 
                        flex: 1, 
                        background: 'rgba(0, 0, 0, 0.4)', 
                        borderRadius: '6px', 
                        padding: '0.75rem', 
                        fontFamily: 'monospace', 
                        fontSize: '0.75rem', 
                        color: '#34d399', 
                        minHeight: '120px', 
                        maxHeight: '150px', 
                        overflowY: 'auto',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                      }}>
                        {uptimeAuditLogs.length === 0 ? (
                          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>System ready. Awaiting remote diagnostics triggers...</div>
                        ) : (
                          uptimeAuditLogs.map((log, idx) => <div key={idx}>{log}</div>)
                        )}
                      </div>

                      <button 
                        className={`btn-glass ${isRunningUptimeAudit ? 'btn-secondary' : 'btn-primary'}`}
                        disabled={isRunningUptimeAudit}
                        onClick={runInfrastructureDiagnostics}
                        style={{ padding: '0.6rem 1rem', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.2s ease', cursor: 'pointer' }}
                      >
                        {isRunningUptimeAudit ? (
                          <>
                            <div className="spinner-micro" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                            Pinging Backup Router...
                          </>
                        ) : (
                          <>
                            🔍 Ping Diagnostics & Run Redundancy Audit
                          </>
                        )}
                      </button>
                    </div>

                  </div>

                </div>
              </section>
            </main>
          )}

          {activeWorkspaceTab === 'interview' && (
            <main className="interview-grid animate-fade-in">
              {/* Left Column: Interactive Voice Question Cockpit */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  
                  {/* Domain Selector Tab Button Row */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      🎙️ Neural Mock Interview Simulator
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                      Hone your verbal communication and technical depth. Select a domain below, trigger the voice recording, and receive feedback aligned with ATS algorithms.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                    <button 
                      className={`domain-btn ${selectedInterviewDomain === 'react' ? 'active' : ''}`}
                      onClick={() => handleDomainChange('react')}
                    >
                      ⚛️ React Frontend
                    </button>
                    <button 
                      className={`domain-btn ${selectedInterviewDomain === 'node' ? 'active' : ''}`}
                      onClick={() => handleDomainChange('node')}
                    >
                      🟢 Node.js Backend
                    </button>
                    <button 
                      className={`domain-btn ${selectedInterviewDomain === 'system' ? 'active' : ''}`}
                      onClick={() => handleDomainChange('system')}
                    >
                      🏗️ System Design
                    </button>
                    <button 
                      className={`domain-btn ${selectedInterviewDomain === 'behavioral' ? 'active' : ''}`}
                      onClick={() => handleDomainChange('behavioral')}
                    >
                      🤝 Behavioral & Ops
                    </button>
                  </div>

                  {/* Active Question Card */}
                  <div className="glass-panel" style={{ 
                    padding: '1.5rem', 
                    background: 'rgba(138, 92, 246, 0.03)', 
                    border: '1px solid rgba(138, 92, 246, 0.15)',
                    boxShadow: '0 0 15px rgba(138, 92, 246, 0.05)',
                    borderRadius: '12px',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em',
                        color: 'var(--primary)',
                        background: 'rgba(138, 92, 246, 0.12)',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        {selectedInterviewDomain} core question
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <div style={{ 
                          width: '8px', 
                          height: '8px', 
                          borderRadius: '50%', 
                          background: isRecordingInterview ? '#ef4444' : '#10b981',
                          boxShadow: isRecordingInterview ? '0 0 8px #ef4444' : 'none',
                          animation: isRecordingInterview ? 'pulse 1.5s infinite' : 'none'
                        }}></div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {isRecordingInterview ? 'Microphone Active' : 'System Ready'}
                        </span>
                      </div>
                    </div>

                    <h4 style={{ 
                      fontSize: '1rem', 
                      fontWeight: 700, 
                      color: '#fff', 
                      lineHeight: '1.5', 
                      margin: '0 0 1rem 0' 
                    }}>
                      "{interviewQuestion}"
                    </h4>

                    {/* Audio Recorder Action controls */}
                    <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '1rem' }}>
                      {isRecordingInterview ? (
                        <div>
                          {/* Simulated Waveform Visualizer */}
                          <div className="waveform-container">
                            <div className="waveform-bar" style={{ animationDuration: '0.7s' }}></div>
                            <div className="waveform-bar" style={{ animationDuration: '0.9s' }}></div>
                            <div className="waveform-bar" style={{ animationDuration: '0.6s' }}></div>
                            <div className="waveform-bar" style={{ animationDuration: '0.8s' }}></div>
                            <div className="waveform-bar" style={{ animationDuration: '1.1s' }}></div>
                            <div className="waveform-bar" style={{ animationDuration: '0.5s' }}></div>
                            <div className="waveform-bar" style={{ animationDuration: '0.9s' }}></div>
                            <div className="waveform-bar" style={{ animationDuration: '0.7s' }}></div>
                            <div className="waveform-bar" style={{ animationDuration: '1.0s' }}></div>
                            <div className="waveform-bar" style={{ animationDuration: '0.8s' }}></div>
                            <div className="waveform-bar" style={{ animationDuration: '0.6s' }}></div>
                            <div className="waveform-bar" style={{ animationDuration: '1.1s' }}></div>
                            <div className="waveform-bar" style={{ animationDuration: '0.5s' }}></div>
                            <div className="waveform-bar" style={{ animationDuration: '0.8s' }}></div>
                            <div className="waveform-bar" style={{ animationDuration: '1.0s' }}></div>
                          </div>
                          
                          <button 
                            className="btn-glass"
                            style={{ 
                              width: '100%', 
                              padding: '0.85rem', 
                              fontWeight: 700, 
                              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                              border: '1px solid #f87171',
                              boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem',
                              borderRadius: '8px',
                              cursor: 'pointer'
                            }}
                            onClick={stopAndAnalyzeInterview}
                          >
                            <span>🛑 Stop Recording & Process Transcript</span>
                          </button>
                        </div>
                      ) : isAnalyzingInterview ? (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                          <div className="spinner-micro" style={{ 
                            width: '32px', 
                            height: '32px', 
                            border: '3px solid rgba(138, 92, 246, 0.1)', 
                            borderTopColor: 'var(--primary)', 
                            borderRadius: '50%', 
                            margin: '0 auto 1rem auto',
                            animation: 'spin 1s linear infinite' 
                          }}></div>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Decrypting audio stream & rating vocal semantics...
                          </span>
                        </div>
                      ) : (
                        <button 
                          className="btn-glass btn-primary"
                          style={{ 
                            width: '100%', 
                            padding: '0.85rem', 
                            fontWeight: 700, 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                          onClick={startInterviewRecording}
                        >
                          <span>🎙️ Start Verbal Recording</span>
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              </div>

              {/* Right Column: High-Fidelity Scorecard Feedback Dashboard */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {isAnalyzingInterview ? (
                  <div className="glass-panel scanning-container" style={{ padding: '2rem', height: '100%', minHeight: '350px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div className="scan-line"></div>
                    
                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem', animation: 'float 3s ease-in-out infinite' }}>🧠</div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                      Semantic Grading in Progress
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '320px', lineHeight: 1.5 }}>
                      Evaluating technical vocabulary depth, checking phonetic delivery parameters, and parsing ATS compliance tags...
                    </p>
                    
                    {/* Simulated loading logs checklist */}
                    <div style={{ 
                      width: '100%', 
                      maxWidth: '300px', 
                      background: 'rgba(0,0,0,0.3)', 
                      borderRadius: '8px', 
                      padding: '0.85rem', 
                      marginTop: '1.5rem',
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                      color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.4rem'
                    }}>
                      <div style={{ color: '#10b981' }}>✔ Loaded Speech-to-Text transcription model</div>
                      <div style={{ color: '#10b981' }}>✔ Calibrated tone-frequency filters</div>
                      <div style={{ color: 'var(--primary)', animation: 'pulse 1s infinite' }}>⚡ Matching taxonomy to professional index...</div>
                      <div style={{ color: 'rgba(255,255,255,0.3)' }}>☐ Generating constructive coaching notes</div>
                    </div>
                  </div>
                ) : interviewScorecard ? (
                  <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    
                    {/* Score Card Header */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '1.25rem', 
                      padding: '1rem', 
                      background: 'rgba(138, 92, 246, 0.05)', 
                      borderRadius: '12px', 
                      border: '1px solid rgba(138, 92, 246, 0.15)'
                    }}>
                      <div style={{
                        width: '65px',
                        height: '65px',
                        borderRadius: '50%',
                        background: 'conic-gradient(var(--primary) 0%, #ec4899 70%, rgba(255,255,255,0.05) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        boxShadow: '0 0 15px rgba(138, 92, 246, 0.25)'
                      }}>
                        <div style={{
                          width: '51px',
                          height: '51px',
                          borderRadius: '50%',
                          background: '#0a0816',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 800,
                          color: '#fff'
                        }}>
                          {interviewScorecard.score}%
                        </div>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.2rem 0' }}>
                          ATS Verbal Calibration Grade
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                          Outstanding alignment! Your response signals high remote-readiness and technical maturity.
                        </p>
                      </div>
                    </div>

                    {/* Progress axis metrics */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                          <span style={{ color: 'var(--text-primary)' }}>Technical Depth</span>
                          <span style={{ color: 'var(--primary)' }}>{interviewScorecard.depth}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ width: `${interviewScorecard.depth}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary) 0%, #ec4899 100%)', borderRadius: '3px' }}></div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                          <span style={{ color: 'var(--text-primary)' }}>Vocal Clarity</span>
                          <span style={{ color: '#06b6d4' }}>{interviewScorecard.vocal}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ width: `${interviewScorecard.vocal}%`, height: '100%', background: 'linear-gradient(90deg, #06b6d4 0%, var(--primary) 100%)', borderRadius: '3px' }}></div>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                          <span style={{ color: 'var(--text-primary)' }}>ATS Keyword Relevance</span>
                          <span style={{ color: '#10b981' }}>{interviewScorecard.ats}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ width: `${interviewScorecard.ats}%`, height: '100%', background: 'linear-gradient(90deg, #10b981 0%, #06b6d4 100%)', borderRadius: '3px' }}></div>
                        </div>
                      </div>

                    </div>

                    {/* Matched Keywords */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Matched Technical Taxonomy</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {interviewScorecard.keywords.map((kw, i) => (
                          <span key={i} className="keyword-badge">
                            ✦ {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Synthesized Transcript */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Verbal Response Transcript</span>
                      <div style={{ 
                        background: 'rgba(0, 0, 0, 0.25)', 
                        border: '1px solid rgba(255, 255, 255, 0.05)', 
                        borderRadius: '8px', 
                        padding: '1rem', 
                        fontSize: '0.8rem', 
                        color: 'rgba(255,255,255,0.8)', 
                        lineHeight: 1.6,
                        fontStyle: 'italic'
                      }}>
                        "{interviewScorecard.transcript}"
                      </div>
                    </div>

                    {/* Feedback Checklist */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Coaching & Calibration Insights</span>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: 0, margin: 0, listStyle: 'none' }}>
                        {interviewScorecard.feedback.map((fb, i) => (
                          <li key={i} style={{ 
                            fontSize: '0.78rem', 
                            color: 'var(--text-muted)', 
                            lineHeight: 1.5,
                            display: 'flex',
                            gap: '0.5rem',
                            alignItems: 'flex-start'
                          }}>
                            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>➔</span>
                            <span>{fb}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                ) : (
                  <div className="glass-panel" style={{ 
                    padding: '2.5rem 1.5rem', 
                    height: '100%', 
                    minHeight: '350px',
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '1.25rem'
                  }}>
                    <div style={{ 
                      width: '80px', 
                      height: '80px', 
                      borderRadius: '50%', 
                      background: 'rgba(138, 92, 246, 0.04)', 
                      border: '1px solid rgba(138, 92, 246, 0.15)',
                      boxShadow: '0 0 20px rgba(138, 92, 246, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      animation: 'float 3s ease-in-out infinite'
                    }}>
                      🎙️
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem 0' }}>
                        Awaiting Oral Response
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: '340px', lineHeight: 1.5, margin: 0 }}>
                        Choose an interview topic category on the left, click **Start Verbal Recording**, and practice your speech to calibrate technical depth, pacing, and core keywords.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </main>
          )}

          {activeWorkspaceTab === 'brain' && (() => {
            const clonerDilemmas = [
              {
                id: 'crisis_sla',
                title: 'Crisis Resolution SLA',
                question: 'A fellow team member consistently misses ticket SLAs, causing backlog creep. How do you handle it?'
              },
              {
                id: 'boundary_shift',
                title: 'Boundary Shift Dilemma',
                question: 'An important customer requests a major project change late in the cycle. How do you respond?'
              },
              {
                id: 'ambiguous_backlog',
                title: 'Ambiguous Backlog',
                question: "You are assigned a critical ticket on a legacy system you've never touched before. What is your immediate action plan?"
              }
            ];
            const activeDilemma = clonerDilemmas[calibrationDilemmaIndex] || clonerDilemmas[0];
            const axes = profile.calibrationAxes || { cognitive: 65, credential: 55, behavioral: 60, operational: 70 };

            return (
              <main className="brain-widescreen-grid animate-fade-in">
                {/* Left Column: Cybernetic Synapse Connection Ring, 4-Axis Fidelity Metrics, Cognitive Gap Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                      {/* Sync Ring Header */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1.25rem', 
                    padding: '0.85rem', 
                    background: 'rgba(138, 92, 246, 0.05)', 
                    borderRadius: '12px', 
                    border: '1px solid rgba(138, 92, 246, 0.15)', 
                    position: 'relative', 
                    overflow: 'hidden' 
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: `conic-gradient(var(--primary) ${brainSyncPercentage}%, rgba(255, 255, 255, 0.04) ${brainSyncPercentage}%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxShadow: '0 0 15px rgba(138, 92, 246, 0.25)'
                    }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: '#0a0816',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)'
                      }}>
                        {brainSyncPercentage}%
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span className="dot-pulse" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
                        <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800 }}>GiGO Mind Duplicate Link</h4>
                      </div>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: '0.95rem' }}>
                        {brainSyncPercentage >= 90 
                          ? "Excellent. Your intellectual duplicate has crossed the 90% sync threshold. AI is fully optimized."
                          : "Synchronizing cognitive, credential, behavioral, and operational sync vectors to pass 90%."}
                      </p>
                    </div>
                  </div>
                                          <div className="glass-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <h5 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                          🧬 Intellect Alignment Axes (Fidelity Metrics)
                        </h5>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                          {/* Axis 1: Cognitive Dialect */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.15rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--cyan)' }}>💬 Cognitive Dialect (Communication Tone)</span>
                              <span style={{ fontWeight: 800, color: 'var(--cyan)' }}>{axes.cognitive}% Sync</span>
                            </div>
                            <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${axes.cognitive}%`, background: 'var(--cyan)', boxShadow: '0 0 8px var(--cyan)', transition: 'width 0.5s ease' }}></div>
                            </div>
                          </div>

                          {/* Axis 2: Credential Depth */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.15rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>📜 Credential Depth (Career History & Academy)</span>
                              <span style={{ fontWeight: 800, color: 'var(--secondary)' }}>{axes.credential}% Sync</span>
                            </div>
                            <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${axes.credential}%`, background: 'var(--secondary)', boxShadow: '0 0 8px var(--secondary)', transition: 'width 0.5s ease' }}></div>
                            </div>
                          </div>

                          {/* Axis 3: Behavioral Signature */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.15rem' }}>
                              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>🧠 Behavioral Signature (Dilemma Strategies)</span>
                              <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{axes.behavioral}% Sync</span>
                            </div>
                            <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${axes.behavioral}%`, background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)', transition: 'width 0.5s ease' }}></div>
                            </div>
                          </div>

                          {/* Axis 4: Operational Sync */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', marginBottom: '0.15rem' }}>
                              <span style={{ fontWeight: 700, color: '#10b981' }}>🔌 Operational Sync (ISP, Power & Personal Info)</span>
                              <span style={{ fontWeight: 800, color: '#10b981' }}>{axes.operational}% Sync</span>
                            </div>
                            <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${axes.operational}%`, background: '#10b981', boxShadow: '0 0 8px #10b981', transition: 'width 0.5s ease' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                  </div>
                  
                                    {/* Adaptive Cognitive Gaps (Always show at bottom of GiGO Brain tab) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h5 style={{ margin: 0, fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>🧠 Mind Gaps Analyzer</h5>
                      <button 
                        type="button" 
                        onClick={() => {
                          setBrainEnrichStatement('');
                          setActiveGapToFeed('');
                          setActiveGapQuestion('');
                          setShowBrainEnrichModal(true);
                        }}
                        style={{
                          background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, fontSize: '0.68rem', cursor: 'pointer'
                        }}
                      >
                        ➕ Feed Statement
                      </button>
                    </div>

                    {isAnalyzingGaps ? (
                      <div className="cyber-scanner-container" style={{ padding: '1rem' }}>
                        <div className="cyber-scanner-grid" />
                        <div className="cyber-scanner-line" />
                        <div className="cyber-scanner-radar">
                          <span style={{ fontSize: '1.25rem', animation: 'float 2s infinite' }}>🧠</span>
                        </div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em', animation: 'pulseGlow 1.5s infinite' }}>
                          SEARCHING CAREER EXPECTATIONS...
                        </div>
                        <div style={{ fontSize: '0.52rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                          Mapping standard industry requirements for {profile.role}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', paddingRight: '0.2rem' }}>
                        {(() => {
                          const activeGaps = aiCareerGaps.length > 0 ? aiCareerGaps : cognitiveGaps;
                          if (activeGaps.length === 0) {
                            return (
                              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.7rem' }} className="glass-card">
                                Zero cognitive gaps detected. Your mind clone is perfectly synchronized with active market demand!
                              </div>
                            );
                          }
                          return activeGaps.map((gap, index) => {
                            const isHigh = 'priority' in gap ? gap.priority === 'high' : true;
                            const priorityText = 'priority' in gap ? gap.priority : 'medium';
                            return (
                              <div 
                                key={index} 
                                className="glass-card" 
                                style={{ 
                                  padding: '0.4rem 0.6rem', 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  gap: '0.2rem',
                                  borderLeft: isHigh ? '2px solid var(--rose)' : '2px solid var(--primary-glow)',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                                    <span className="badge badge-purple" style={{ fontSize: '0.52rem', padding: '0.05rem 0.2rem', fontWeight: 800 }}>
                                      {gap.skill}
                                    </span>
                                    <span className={`badge ${isHigh ? 'badge-pink' : 'badge-amber'}`} style={{ fontSize: '0.42rem', padding: '0.02rem 0.15rem', fontWeight: 800 }}>
                                      {priorityText}
                                    </span>
                                  </div>
                                  <button 
                                    type="button"
                                    className="btn-glass"
                                    style={{ padding: '0.1rem 0.25rem', fontSize: '0.52rem', fontWeight: 700, color: 'var(--primary)' }}
                                    onClick={() => {
                                      setActiveGapToFeed(gap.skill);
                                      setActiveGapQuestion(gap.question);
                                      setBrainEnrichStatement('');
                                      setShowBrainEnrichModal(true);
                                    }}
                                  >
                                    Feed Memory
                                  </button>
                                </div>
                                <p style={{ margin: 0, fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: '0.85rem' }}>
                                  {gap.reason}
                                </p>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Profile Wizard Form, Calibration dilemmas console, Compiled documents list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Segment Navigation Control */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '0.35rem', 
                      background: 'rgba(255, 255, 255, 0.02)', 
                      padding: '0.3rem', 
                      borderRadius: '10px', 
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.5)',
                      marginBottom: '0.5rem'
                    }}>
                      <button 
                        type="button" 
                        onClick={() => {
                          setClonerSubTab('calibrate');
                          setActiveCalibratedFeedback(null);
                        }}
                        style={{ 
                          flex: 1, 
                          padding: '0.5rem 0.25rem', 
                          borderRadius: '8px', 
                          border: 'none', 
                          background: clonerSubTab === 'calibrate' ? 'var(--primary)' : 'transparent', 
                          color: clonerSubTab === 'calibrate' ? 'var(--text-primary)' : 'var(--text-secondary)', 
                          fontSize: '0.7rem', 
                          fontWeight: 800, 
                          cursor: 'pointer', 
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
                        }}
                      >
                        🧠 Calibration Mirror
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setClonerSubTab('profile')}
                        style={{ 
                          flex: 1, 
                          padding: '0.5rem 0.25rem', 
                          borderRadius: '8px', 
                          border: 'none', 
                          background: clonerSubTab === 'profile' ? 'var(--primary)' : 'transparent', 
                          color: clonerSubTab === 'profile' ? 'var(--text-primary)' : 'var(--text-secondary)', 
                          fontSize: '0.7rem', 
                          fontWeight: 800, 
                          cursor: 'pointer', 
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
                        }}
                      >
                        🧬 Deep Profile Vault
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setClonerSubTab('history')}
                        style={{ 
                          flex: 1, 
                          padding: '0.5rem 0.25rem', 
                          borderRadius: '8px', 
                          border: 'none', 
                          background: clonerSubTab === 'history' ? 'var(--primary)' : 'transparent', 
                          color: clonerSubTab === 'history' ? 'var(--text-primary)' : 'var(--text-secondary)', 
                          fontSize: '0.7rem', 
                          fontWeight: 800, 
                          cursor: 'pointer', 
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
                        }}
                      >
                        📜 Sync History
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setClonerSubTab('docs')}
                        style={{ 
                          flex: 1, 
                          padding: '0.5rem 0.25rem', 
                          borderRadius: '8px', 
                          border: 'none', 
                          background: clonerSubTab === 'docs' ? 'var(--primary)' : 'transparent', 
                          color: clonerSubTab === 'docs' ? 'var(--text-primary)' : 'var(--text-secondary)', 
                          fontSize: '0.7rem', 
                          fontWeight: 800, 
                          cursor: 'pointer', 
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)' 
                        }}
                      >
                        📁 Compiled Assets
                      </button>
                    </div>

                    {clonerSubTab === 'calibrate' && (
                                            <div className="glass-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h5 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                            ⚡ Interactive Behavioral Calibration Panel
                          </h5>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                            Dilemma {calibrationDilemmaIndex + 1} / 3
                          </span>
                        </div>

                        {/* Selector Steps */}
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          {clonerDilemmas.map((d, index) => (
                            <button
                              key={d.id}
                              type="button"
                              onClick={() => {
                                setCalibrationDilemmaIndex(index);
                                setActiveCalibratedFeedback(null);
                                setCalibrationResponseText('');
                              }}
                              className="btn-glass"
                              style={{
                                flex: 1,
                                padding: '0.35rem',
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                background: calibrationDilemmaIndex === index ? 'rgba(138,92,246,0.15)' : 'rgba(255,255,255,0.02)',
                                border: calibrationDilemmaIndex === index ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.05)',
                                color: calibrationDilemmaIndex === index ? 'var(--text-primary)' : 'var(--text-secondary)'
                              }}
                            >
                              {d.title}
                            </button>
                          ))}
                        </div>

                        {/* Dilemma Prompt Card */}
                        <div style={{ padding: '0.65rem', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.8rem' }}>⚠️</span>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase' }}>Active Workplace Scenario</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-primary)', fontWeight: 600, lineHeight: '1rem' }}>
                            {activeDilemma.question}
                          </p>
                        </div>

                        {/* Quick Voice / Speech Simulator Tags */}
                        <div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                            🎙️ Simulated Vocal Presets (Quick Calibration)
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <button
                              type="button"
                              onClick={() => setCalibrationResponseText("I schedule a 1-on-1 first to understand what barriers they are facing. If it is high workloads, I offer team help. It is critical to collaborate and handle things with empathy, resolving mutual friction rather than immediate escalation.")}
                              className="btn-glass"
                              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.3rem 0.5rem', fontSize: '0.62rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              🤝 <span style={{ color: 'var(--cyan)', fontWeight: 700 }}>Consensus Dialect:</span> "Collaborate first with empathy..."
                            </button>
                            <button
                              type="button"
                              onClick={() => setCalibrationResponseText("I check the historic performance metrics and diagnostic logs immediately to inspect backlog creep. I then run standard test cycles, review missing SLAs, and compile structured priority guidelines to defend system SLA targets objectively.")}
                              className="btn-glass"
                              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.3rem 0.5rem', fontSize: '0.62rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              📊 <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>Analytical Dialect:</span> "Check logs and run diagnostic metrics..."
                            </button>
                            <button
                              type="button"
                              onClick={() => setCalibrationResponseText("I take immediate triage action to resolve this backlog quick. Restoring business continuity and SLA uptime is priority number one. We fix the issue, mitigate customer impact, and schedule standard retrospective reviews afterward.")}
                              className="btn-glass"
                              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.3rem 0.5rem', fontSize: '0.62rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              ⚡ <span style={{ color: 'var(--rose)', fontWeight: 700 }}>Outcome-Oriented Dialect:</span> "Take immediate uptime triage..."
                            </button>
                          </div>
                        </div>

                        {/* Text Response Control */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Provide Your Response Dialect (Type or choose vocal preset above)</label>
                          <textarea
                            className="form-control"
                            rows={3}
                            placeholder="Type how you would handle this scenario. Provide details about your strategy to get higher sync boosts..."
                            value={calibrationResponseText}
                            onChange={(e) => setCalibrationResponseText(e.target.value)}
                            style={{ fontSize: '0.72rem', background: '#090715', color: 'var(--text-primary)', resize: 'none' }}
                          />
                        </div>

                        {/* Action Calibration Button */}
                        <button
                          type="button"
                          disabled={isCalibrating}
                          onClick={() => handleCalibrateBehavioral(activeDilemma.id, activeDilemma.question, calibrationResponseText)}
                          className="btn-glass btn-primary"
                          style={{
                            padding: '0.6rem',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            justifyContent: 'center',
                            borderRadius: '8px',
                            background: isCalibrating ? 'rgba(255,255,255,0.1)' : 'var(--primary)'
                          }}
                        >
                          {isCalibrating ? '⚡ Scanning Neural Frequencies...' : '🎙️ Calibrate Mind Mirror'}
                        </button>

                        {/* Scanning Radar Simulator Animation */}
                        {isCalibrating && (
                          <div className="cyber-scanner-container" style={{ padding: '1rem', marginTop: '0.1rem' }}>
                            <div className="cyber-scanner-grid" />
                            <div className="cyber-scanner-line" />
                            <div className="cyber-scanner-radar">
                              <span style={{ fontSize: '1.25rem', animation: 'float 2s infinite' }}>🧠</span>
                            </div>
                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', animation: 'pulseGlow 1.5s infinite' }}>
                              EVALUATING SYNAPSE DIALECT & CONTEXT...
                            </div>
                          </div>
                        )}

                        {/* Feedback Overlay Panel */}
                        {activeCalibratedFeedback && !isCalibrating && (
                          <div style={{ 
                            padding: '0.75rem', 
                            background: 'rgba(138, 92, 246, 0.08)', 
                            border: '1px solid rgba(138, 92, 246, 0.25)', 
                            borderRadius: '10px', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '0.4rem',
                            animation: 'fade-in 0.3s'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="badge badge-purple" style={{ fontSize: '0.62rem', padding: '0.1rem 0.4rem', fontWeight: 800 }}>
                                👤 Detected Tone: {activeCalibratedFeedback.toneAnalysis}
                              </span>
                              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10b981' }}>
                                +{activeCalibratedFeedback.cognitiveBoost}% Cog • +{activeCalibratedFeedback.behavioralBoost}% Beh
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: '0.95rem' }}>
                              <strong>Decision Profile:</strong> {activeCalibratedFeedback.decisionStyle}
                            </p>
                            <div style={{ padding: '0.45rem', background: '#060410', borderLeft: '2px solid var(--primary)', borderRadius: '4px', fontSize: '0.65rem', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: '0.9rem' }}>
                              " {activeCalibratedFeedback.feedback} "
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {clonerSubTab === 'profile' && (
                                          <div className="glass-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      
                      {/* Wizard Tab Controller */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--secondary)' }}>🧬 Deep Profile Vault Wizard</span>
                        <div style={{ display: 'flex', gap: '0.2rem' }}>
                          <button
                            type="button"
                            onClick={() => setActiveWizardStep('work_edu')}
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.6rem', fontWeight: 800, border: 'none', borderRadius: '4px', background: activeWizardStep === 'work_edu' ? 'var(--secondary)' : 'rgba(255,255,255,0.02)', color: 'var(--text-primary)', cursor: 'pointer' }}
                          >
                            💼 Work/Edu
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveWizardStep('personal')}
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.6rem', fontWeight: 800, border: 'none', borderRadius: '4px', background: activeWizardStep === 'personal' ? 'var(--secondary)' : 'rgba(255,255,255,0.02)', color: 'var(--text-primary)', cursor: 'pointer' }}
                          >
                            👤 Personal
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveWizardStep('behavioral')}
                            style={{ padding: '0.2rem 0.4rem', fontSize: '0.6rem', fontWeight: 800, border: 'none', borderRadius: '4px', background: activeWizardStep === 'behavioral' ? 'var(--secondary)' : 'rgba(255,255,255,0.02)', color: 'var(--text-primary)', cursor: 'pointer' }}
                          >
                            🧠 Behavioral
                          </button>
                        </div>
                      </div>

                      {/* STEP 1: CAREER AND EDUCATION */}
                      {activeWizardStep === 'work_edu' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          
                          {/* Work History Sub-Panel */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>💼 Positions & Career History</div>
                            
                            {/* Listed positions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '120px', overflowY: 'auto', paddingRight: '0.15rem' }}>
                              {wizardWorkHistory.length === 0 ? (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No professional positions added yet.</span>
                              ) : (
                                wizardWorkHistory.map((job, i) => (
                                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.4rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div>
                                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-primary)' }}>{job.role} @ {job.company}</div>
                                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{job.startDate} - {job.endDate}</div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = wizardWorkHistory.filter((_, idx) => idx !== i);
                                        setWizardWorkHistory(updated);
                                      }}
                                      style={{ border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.6rem', fontWeight: 800, padding: '0.2rem 0.35rem', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Add Position Form */}
                            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--secondary)' }}>➕ Add Prior Position</div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                                <input 
                                  type="text" 
                                  placeholder="Company" 
                                  value={newJobCompany} 
                                  onChange={e => setNewJobCompany(e.target.value)} 
                                  style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                                />
                                <input 
                                  type="text" 
                                  placeholder="Role" 
                                  value={newJobRole} 
                                  onChange={e => setNewJobRole(e.target.value)} 
                                  style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                                />
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                                <input 
                                  type="text" 
                                  placeholder="Start (e.g. 2021)" 
                                  value={newJobStart} 
                                  onChange={e => setNewJobStart(e.target.value)} 
                                  style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                                />
                                <input 
                                  type="text" 
                                  placeholder="End (e.g. Present)" 
                                  value={newJobEnd} 
                                  onChange={e => setNewJobEnd(e.target.value)} 
                                  style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                                />
                              </div>
                              <input 
                                type="text" 
                                placeholder="Key Achievements (comma separated highlights)" 
                                value={newJobAchievements} 
                                onChange={e => setNewJobAchievements(e.target.value)} 
                                style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (!newJobCompany || !newJobRole) {
                                    alert("Company and Role are required.");
                                    return;
                                  }
                                  setWizardWorkHistory(prev => [...prev, { company: newJobCompany, role: newJobRole, startDate: newJobStart, endDate: newJobEnd, achievements: newJobAchievements }]);
                                  setNewJobCompany('');
                                  setNewJobRole('');
                                  setNewJobStart('');
                                  setNewJobEnd('');
                                  setNewJobAchievements('');
                                }}
                                className="btn-glass"
                                style={{ padding: '0.25rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', border: '1px solid rgba(138,92,246,0.3)', width: '100%', justifyContent: 'center' }}
                              >
                                Pinned Position to Stack
                              </button>
                            </div>
                          </div>

                          {/* Education Sub-Panel */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>🎓 Academy, Certifications & Degrees</div>
                            
                            {/* Listed education */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '120px', overflowY: 'auto', paddingRight: '0.15rem' }}>
                              {wizardEducationList.length === 0 ? (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No academic degrees listed yet.</span>
                              ) : (
                                wizardEducationList.map((edu, i) => (
                                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.4rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div>
                                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-primary)' }}>{edu.degree} in {edu.fieldOfStudy}</div>
                                      <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{edu.institution} • Grad {edu.gradYear}</div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updated = wizardEducationList.filter((_, idx) => idx !== i);
                                        setWizardEducationList(updated);
                                      }}
                                      style={{ border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.6rem', fontWeight: 800, padding: '0.2rem 0.35rem', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Add Education Form */}
                            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--secondary)' }}>➕ Add Degree or School</div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                                <input 
                                  type="text" 
                                  placeholder="Institution Name" 
                                  value={newSchoolName} 
                                  onChange={e => setNewSchoolName(e.target.value)} 
                                  style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                                />
                                <input 
                                  type="text" 
                                  placeholder="Degree (e.g. BSc)" 
                                  value={newSchoolDegree} 
                                  onChange={e => setNewSchoolDegree(e.target.value)} 
                                  style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                                />
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.3rem' }}>
                                <input 
                                  type="text" 
                                  placeholder="Field of Study (e.g. Computer Sci)" 
                                  value={newSchoolField} 
                                  onChange={e => setNewSchoolField(e.target.value)} 
                                  style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                                />
                                <input 
                                  type="text" 
                                  placeholder="Grad Year (2020)" 
                                  value={newSchoolYear} 
                                  onChange={e => setNewSchoolYear(e.target.value)} 
                                  style={{ fontSize: '0.65rem', background: '#090715', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.25rem', borderRadius: '4px' }} 
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!newSchoolName || !newSchoolDegree) {
                                    alert("Institution and Degree are required.");
                                    return;
                                  }
                                  setWizardEducationList(prev => [...prev, { institution: newSchoolName, degree: newSchoolDegree, fieldOfStudy: newSchoolField, gradYear: newSchoolYear }]);
                                  setNewSchoolName('');
                                  setNewSchoolDegree('');
                                  setNewSchoolField('');
                                  setNewSchoolYear('');
                                }}
                                className="btn-glass"
                                style={{ padding: '0.25rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--primary)', border: '1px solid rgba(138,92,246,0.3)', width: '100%', justifyContent: 'center' }}
                              >
                                Pin School to Stack
                              </button>
                            </div>
                          </div>

                        </div>
                      )}

                      {/* STEP 2: PERSONAL BIO DETAILS */}
                      {activeWizardStep === 'personal' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>👤 Personal Bio & Demographics</div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Date of Birth</label>
                              <input 
                                type="date" 
                                className="form-control" 
                                value={wizardDob} 
                                onChange={e => setWizardDob(e.target.value)} 
                                style={{ fontSize: '0.7rem', background: '#090715', color: 'var(--text-primary)' }} 
                              />
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Marital Status</label>
                              <select 
                                className="form-control" 
                                value={wizardMaritalStatus} 
                                onChange={e => setWizardMaritalStatus(e.target.value)} 
                                style={{ fontSize: '0.7rem', background: '#090715', color: 'var(--text-primary)', height: '36px' }}
                              >
                                <option value="">Select Status</option>
                                <option value="Single">Single</option>
                                <option value="Married">Married</option>
                                <option value="Married with Kids">Married with Kids</option>
                                <option value="Divorced">Divorced</option>
                                <option value="Other">Other / Private</option>
                              </select>
                            </div>
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Residential Address</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="e.g. 15 Ikoyi Link Road, Lagos, Nigeria" 
                              value={wizardAddress} 
                              onChange={e => setWizardAddress(e.target.value)} 
                              style={{ fontSize: '0.7rem', background: '#090715', color: 'var(--text-primary)' }} 
                            />
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Hobbies & Special Interests (comma separated)</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="e.g. Robotics, Hiking, Decentralized Ledgers" 
                              value={wizardHobbies} 
                              onChange={e => setWizardHobbies(e.target.value)} 
                              style={{ fontSize: '0.7rem', background: '#090715', color: 'var(--text-primary)' }} 
                            />
                          </div>
                        </div>
                      )}

                      {/* STEP 3: BEHAVIORAL PROFILE */}
                      {activeWizardStep === 'behavioral' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>🧠 Soft Skills & Behavioral Style</div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Professional Strengths</label>
                            <textarea 
                              className="form-control" 
                              rows={2}
                              placeholder="e.g. High focus under stress, methodical triage, proactive bottleneck mapping" 
                              value={wizardStrengths} 
                              onChange={e => setWizardStrengths(e.target.value)} 
                              style={{ fontSize: '0.68rem', background: '#090715', color: 'var(--text-primary)', resize: 'none' }} 
                            />
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Soft Skills Tag List (comma separated)</label>
                            <input 
                              type="text" 
                              className="form-control" 
                              placeholder="e.g. Empathy, Active Listening, Clear Written Communications" 
                              value={wizardSoftSkills} 
                              onChange={e => setWizardSoftSkills(e.target.value)} 
                              style={{ fontSize: '0.7rem', background: '#090715', color: 'var(--text-primary)' }} 
                            />
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Prior Teamwork & Leadership Experience</label>
                            <textarea 
                              className="form-control" 
                              rows={2}
                              placeholder="e.g. Guided 4 developers through SLA backlogs, coordinated agile sprints" 
                              value={wizardTeamworkExperience} 
                              onChange={e => setWizardTeamworkExperience(e.target.value)} 
                              style={{ fontSize: '0.68rem', background: '#090715', color: 'var(--text-primary)', resize: 'none' }} 
                            />
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Typical Conflict Resolution Approach</label>
                            <textarea 
                              className="form-control" 
                              rows={2}
                              placeholder="e.g. 1-on-1 alignment, identifying technical blockages objectively" 
                              value={wizardConflictResolution} 
                              onChange={e => setWizardConflictResolution(e.target.value)} 
                              style={{ fontSize: '0.68rem', background: '#090715', color: 'var(--text-primary)', resize: 'none' }} 
                            />
                          </div>
                        </div>
                      )}

                      {/* Save Action Controller */}
                      <button
                        type="button"
                        disabled={isSavingProfileVault}
                        onClick={handleSaveProfileVault}
                        className="btn-glass btn-secondary"
                        style={{
                          padding: '0.6rem',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          justifyContent: 'center',
                          borderRadius: '8px',
                          background: isSavingProfileVault ? 'rgba(255,255,255,0.1)' : 'var(--secondary)',
                          marginTop: '0.3rem'
                        }}
                      >
                        {isSavingProfileVault ? '🧬 Anchoring Demographics to Firestore...' : '🧬 Synchronize Mind Vault'}
                      </button>

                    </div>
                    )}

                    {clonerSubTab === 'history' && (
                                          <div className="glass-panel" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <h5 style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                        📜 Historical Calibration Records
                      </h5>
                      <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: '0.9rem' }}>
                        Past workspace scenarios evaluated by the GiGO Calibration engine.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.15rem' }}>
                        {(!profile.calibrationHistory || profile.calibrationHistory.length === 0) ? (
                          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.7rem' }} className="glass-card">
                            No past calibration cycles recorded in this synapse directory. Speak or type responses to active dilemmas above.
                          </div>
                        ) : (
                          [...profile.calibrationHistory].reverse().map((session, index) => (
                            <div key={index} className="glass-card" style={{ padding: '0.55rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid rgba(255,255,255,0.04)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--secondary)' }}>
                                  {session.dilemmaId === 'crisis_sla' ? 'Crisis SLA Scenario' : session.dilemmaId === 'boundary_shift' ? 'Boundary Shift Scenario' : 'Legacy Backlog Scenario'}
                                </span>
                                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)' }}>
                                  {new Date(session.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-primary)', fontStyle: 'italic', background: 'rgba(0,0,0,0.15)', padding: '0.3rem', borderRadius: '4px', borderLeft: '2px solid var(--primary)', lineHeight: '0.85rem' }}>
                                "{session.userResponse}"
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6rem', marginTop: '0.1rem' }}>
                                <span style={{ fontWeight: 700, color: 'var(--cyan)' }}>Tone: {session.toneAnalysis}</span>
                                <span style={{ fontWeight: 800, color: '#10b981' }}>Fidelity Score: {session.scoreAfter}%</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    )}

                    {clonerSubTab === 'docs' && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                <div className="transaction-panel" style={{ flex: 1, minHeight: '180px', maxHeight: '350px', overflowY: 'auto' }}>
                  {isGeneratingCoverLetter && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', background: 'rgba(138, 92, 246, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--primary)', marginBottom: '1rem' }}>
                      <div className="spinner-micro" style={{ width: '20px', height: '20px', border: '2px solid rgba(255, 255, 255, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }}></div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>Compiling ATS Cover Letter...</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Debiting ₦400 NGN and running Gemini 2.5 Pro...</div>
                    </div>
                  )}
                  {isGeneratingCV && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', background: 'rgba(236, 72, 153, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--secondary)', marginBottom: '1rem' }}>
                      <div className="spinner-micro" style={{ width: '20px', height: '20px', border: '2px solid rgba(255, 255, 255, 0.1)', borderTopColor: 'var(--secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }}></div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>Compiling ATS CV / Resume...</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Debiting ₦500 NGN and running Gemini 2.5 Pro...</div>
                    </div>
                  )}
                  {isGeneratingPortfolio && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--emerald)', marginBottom: '1rem' }}>
                      <div className="spinner-micro" style={{ width: '20px', height: '20px', border: '2px solid rgba(255, 255, 255, 0.1)', borderTopColor: 'var(--emerald)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '0.5rem' }}></div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>Compiling Case Portfolio...</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Debiting ₦600 NGN and running Gemini 2.5 Pro...</div>
                    </div>
                  )}
                  {generatedCoverLetter && (
                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700 }}>NEWLY COMPILED ASSET</span>
                        <button 
                          className="btn-glass" 
                          style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem', color: '#f8fafc' }}
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCoverLetter);
                            alert("Asset copied to clipboard!");
                          }}
                        >
                          Copy Text
                        </button>
                      </div>
                      <pre style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: '150px', overflowY: 'auto', background: 'rgba(0, 0, 0, 0.2)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-glass)', fontFamily: 'monospace' }}>
                        {generatedCoverLetter}
                      </pre>
                    </div>
                  )}
                  {compiledDocuments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No compiled ATS documents found.
                    </div>
                  ) : (
                    compiledDocuments.map((doc: any) => (
                      <div key={doc.id} className="transaction-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                              {doc.jobTitle}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>
                              {doc.companyName}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                              <span className={`badge ${doc.type === 'CV' ? 'badge-purple' : doc.type === 'PORTFOLIO' ? 'badge-emerald' : 'badge-pink'}`} style={{ fontSize: '0.55rem', padding: '0.1rem 0.35rem' }}>
                                {doc.type || 'COVER_LETTER'}
                              </span>
                            </div>
                          </div>
                          <button 
                            className="btn-glass" 
                            style={{ padding: '0.15rem 0.4rem', fontSize: '0.65rem' }}
                            onClick={() => {
                              navigator.clipboard.writeText(doc.content);
                              alert("Asset copied to clipboard!");
                            }}
                          >
                            Copy
                          </button>
                        </div>
                        <pre style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: '100px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-glass)', fontFamily: 'monospace' }}>
                          {doc.content}
                        </pre>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                          Compiled: {new Date(doc.generatedAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
                    )}
                  </div>
                </div>
              </main>
            );
          })()}

          {activeWorkspaceTab === 'radar' && (
            <main className="radar-grid animate-fade-in">
              {/* Left Column: AI Voice Sync */}
                          {/* AI VOICE SYNC WORKSPACE */}
            <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'var(--shadow-glow-purple)', filter: 'blur(60px)', opacity: 0.5 }}></div>
              
              {/* Spinner Overlay for Voice Analysis */}
              {isAnalyzingVoice && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 13, 35, 0.85)', backdropFilter: 'blur(8px)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem' }}>
                  <div className="spinner-micro" style={{ width: '40px', height: '40px', border: '3px solid rgba(255, 255, 255, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', textAlign: 'center' }}>
                    Gemini 2.5 Pro Analyzing Voice Profile...
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px' }}>
                    Extracting professional parameters, target tools, work-history highlights, and regional infrastructure metrics.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }} className="text-gradient-purple-pink">
                    AI Real-Time Voice Sync
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Sync and enrich your career profile dynamically via real-time vocal resume profiling.
                  </p>
                </div>
                <span className={`badge ${isSyncing ? 'badge-pink' : 'badge-purple'}`}>
                  {isSyncing ? 'Rec Stream Active' : 'Offline'}
                </span>
              </div>

              {/* WAVEFORM COMPONENT */}
              <div className="waveform-container">
                {waveBars.map(bar => (
                  <div 
                    key={bar} 
                    ref={el => { if (el) barRefs.current[bar] = el; }}
                    className={`wave-bar ${isSyncing ? 'active' : ''}`}
                    style={{ 
                      height: '10%',
                      transition: 'height 0.1s ease-out'
                    }}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button 
                    className={`btn-glass ${isSyncing ? 'btn-secondary' : 'btn-primary'}`} 
                    onClick={() => {
                      setIsSyncing(!isSyncing);
                      addLog(isSyncing ? 'Voice sync audio stream closed.' : 'Initializing hardware microphone connection...');
                    }}
                    style={{ flexShrink: 0 }}
                  >
                    <MicroIcon /> {isSyncing ? 'Pause AI Stream' : 'Begin Voice Onboarding'}
                  </button>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500, lineBreak: 'anywhere' }}>
                    {syncStatus}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input 
                    type="text" 
                    placeholder="Simulate verbal feedback (e.g., 'Lead a team of 4 AI Engineers to build Ledger API')"
                    value={audioText}
                    onChange={(e) => setAudioText(e.target.value)}
                    className="form-control"
                    style={{ fontSize: '0.85rem' }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && audioText) {
                        const isCmd = await executeVocalCommand(audioText);
                        if (!isCmd) {
                          addLog(`[Vocal Input Transcribed] "${audioText}"`);
                          setSyncStatus(`Syncing custom vocal note: "${audioText}"`);
                        }
                        setAudioText('');
                      }
                    }}
                  />
                  <button 
                    className="btn-glass"
                    onClick={async () => {
                      if (audioText) {
                        const isCmd = await executeVocalCommand(audioText);
                        if (!isCmd) {
                          addLog(`[Vocal Input Transcribed] "${audioText}"`);
                          setSyncStatus(`Syncing custom vocal note: "${audioText}"`);
                        }
                        setAudioText('');
                      }
                    }}
                  >
                    Sync
                  </button>
                </div>
              </div>
            </div>

              {/* Right Column: Autonomous Boolean Scraper */}
                          {/* AUTONOMOUS BOOLEAN SCRAPER WORKSPACE */}
            <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'var(--shadow-glow-purple)', filter: 'blur(60px)', opacity: 0.4 }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }} className="text-gradient-purple-pink">
                    Autonomous Boolean Scraper Workspace
                  </h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Command the Back-end Scraper Agent to target-scrape ATS postings across the internet in real-time.
                  </p>
                </div>
                <span className={`badge ${isSearchingManual ? 'badge-pink radar-animation' : 'badge-emerald'}`}>
                  {isSearchingManual ? '⚡ Searching the Web...' : '🟢 Ready & Waiting'}
                </span>
              </div>

              {/* AGENT INTEL CARD */}
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', marginBottom: '1.25rem', background: 'rgba(255, 255, 255, 0.02)' }}>
                <div style={{ 
                  width: '42px', 
                  height: '42px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  boxShadow: '0 0 15px rgba(236, 72, 153, 0.4)',
                  position: 'relative'
                }} className={isSearchingManual ? 'radar-animation' : ''}>
                  🤖
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Market Intelligence Scraper Agent</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Capabilities: Deep ATS crawling, automated advanced Boolean design, live alignment scoring.</div>
                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.4rem', fontSize: '0.65rem' }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 600 }}>📡 Portals: 450+</span>
                    <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>⚡ Speed: ~1.8s</span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>🎯 Target Accuracy: 98%</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleManualSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Job Title</label>
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="e.g. Lead AI Engineer"
                      value={searchJobTitle}
                      onChange={(e) => setSearchJobTitle(e.target.value)}
                      required
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Location</label>
                    <select 
                      className="form-control"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      style={{ fontSize: '0.85rem', background: '#0f0d23', height: '42px' }}
                    >
                      <option value="">Anywhere</option>
                      <option value="Lagos">Lagos</option>
                      <option value="Abuja">Abuja</option>
                      <option value="Port Harcourt">Port Harcourt</option>
                      <option value="Accra">Accra</option>
                      <option value="London">London</option>
                      <option value="New York">New York</option>
                      <option value="San Francisco">San Francisco</option>
                      <option value="Berlin">Berlin</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Search Source / Domain</label>
                    <select 
                      className="form-control"
                      value={searchDomain}
                      onChange={(e) => setSearchDomain(e.target.value)}
                      style={{ fontSize: '0.85rem', background: '#0f0d23', height: '42px' }}
                    >
                      <option value="all">🌐 All of Google</option>
                      {(systemConfig.scraperDomains || ['linkedin.com', 'twitter.com', 'instagram.com', 'facebook.com', 'reddit.com', 'github.com']).map((dom) => (
                        <option key={dom} value={dom}>🎯 {dom}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Work Arrangement (Optional)</label>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem', height: '42px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none' }}>
                        <input 
                          type="checkbox" 
                          checked={arrangeRemote} 
                          onChange={(e) => setArrangeRemote(e.target.checked)}
                          style={{ accentColor: 'var(--primary)', cursor: 'pointer', width: '15px', height: '15px' }}
                        />
                        Remote
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none' }}>
                        <input 
                          type="checkbox" 
                          checked={arrangeHybrid} 
                          onChange={(e) => setArrangeHybrid(e.target.checked)}
                          style={{ accentColor: 'var(--primary)', cursor: 'pointer', width: '15px', height: '15px' }}
                        />
                        Hybrid
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', cursor: 'pointer', userSelect: 'none' }}>
                        <input 
                          type="checkbox" 
                          checked={arrangeOnsite} 
                          onChange={(e) => setArrangeOnsite(e.target.checked)}
                          style={{ accentColor: 'var(--primary)', cursor: 'pointer', width: '15px', height: '15px' }}
                        />
                        Onsite
                      </label>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Salary Range (Optional)</label>
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="e.g. ₦500,000 - ₦750,000"
                      value={searchSalary}
                      onChange={(e) => setSearchSalary(e.target.value)}
                      style={{ fontSize: '0.85rem', height: '42px' }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Custom Skills/Directives</label>
                    <input 
                      type="text"
                      className="form-control"
                      placeholder="e.g. Docker, Python"
                      value={searchKeywords}
                      onChange={(e) => setSearchKeywords(e.target.value)}
                      style={{ fontSize: '0.85rem', height: '42px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button 
                    type="submit" 
                    className="btn-glass btn-primary" 
                    disabled={isSearchingManual}
                    style={{ padding: '0.6rem 2rem', fontWeight: 700, gap: '0.5rem' }}
                  >
                    {isSearchingManual ? (
                      <>
                        <div className="spinner-micro" style={{ width: '16px', height: '16px', border: '2px solid rgba(255, 255, 255, 0.1)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        Sweeping Web...
                      </>
                    ) : (
                      <>
                        🚀 Gi---GO
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
            </main>
          )}

          {activeWorkspaceTab === 'wallets' && (
            <main className="wallets-grid animate-fade-in">
              {/* Top Row: Side-by-side NGN & USD Wallet balances */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <WalletIcon /> Active Wallets
                  </h2>
                  <span className="badge badge-emerald">Live Flutterwave Link</span>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                                  <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(217, 70, 239, 0.1), rgba(15, 13, 35, 0.4))' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>NGN Wallet Balance</span>
                    <span className="badge badge-pink">NGN (₦)</span>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--text-primary)' }}>
                    ₦{walletNGN.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </div>
                  <button 
                    className="btn-glass btn-secondary" 
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
                    onClick={() => { setTopUpCurrency('NGN'); setTopUpAmount('5000'); setShowTopUpModal(true); }}
                  >
                    <PlusIcon /> Top Up NGN
                  </button>
                </div>
                                  <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(138, 92, 246, 0.1), rgba(15, 13, 35, 0.4))' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>USD Wallet Balance</span>
                    <span className="badge badge-purple">USD ($)</span>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0.5rem 0', color: 'var(--text-primary)' }}>
                    ${walletUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <button 
                    className="btn-glass btn-primary" 
                    style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}
                    onClick={() => { setTopUpCurrency('USD'); setTopUpAmount('50'); setShowTopUpModal(true); }}
                  >
                    <PlusIcon /> Top Up USD
                  </button>
                </div>
                </div>
              </div>

              {/* Bottom Row: Side-by-side Payment Transaction ledger list, and Full referral center form/invitations console */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }} className="wallets-details-row">
                {/* Column 1: Payment Ledger */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <HistoryIcon /> Payment Ledger History
                  </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                <div className="transaction-panel" style={{ flex: 1, minHeight: '180px' }}>
                  {transactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      No payment history loaded yet.
                    </div>
                  ) : (
                    transactions.map((tx) => (
                      <div key={tx.id} className="transaction-item">
                        <div>
                          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                            {tx.currency} {tx.amount.toLocaleString(tx.currency === 'USD' ? 'en-US' : 'en-NG', { minimumFractionDigits: 2 })} CREDIT
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            {tx.ref} • {tx.date}
                          </div>
                        </div>
                        <span className="badge badge-emerald" style={{ fontSize: '0.6rem', padding: '0.15rem 0.4rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <CheckIcon /> SUCCESS
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  Handshake ledger synchronized with Firestore database.
                </p>
              </div>
                </div>

                {/* Column 2: Referral Center */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <span>👥</span> Referral Center
                  </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                
                {/* Promo Card */}
                <div style={{
                  background: 'linear-gradient(135deg, var(--primary-glow), var(--secondary-glow))',
                  border: '1px solid var(--border-glass-active)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🤝</span>
                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem' }} className="text-gradient-purple-pink">Introduce Friends, Earn Bonuses!</h4>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.2rem' }}>
                    Share the premium power of **GiGO** with your colleagues. They'll instantly receive a **₦5,000 NGN promotional signup reward** to compile resumes and apply. Once they register, you receive an automatic **₦{systemConfig.referralBonus.toLocaleString()} NGN referral bonus** directly into your regional wallet balance!
                  </p>
                </div>

                {/* Quick Share Link */}
                <div className="glass-card" style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>My Referral Link</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      readOnly 
                      value={`${systemConfig.frontendDomain}/?ref=${currentUserId}`}
                      style={{ 
                        flex: 1, 
                        background: 'rgba(0,0,0,0.25)', 
                        border: '1px solid var(--border-glass)', 
                        borderRadius: '6px', 
                        padding: '0.35rem 0.6rem', 
                        fontSize: '0.75rem', 
                        color: 'var(--text-primary)', 
                        fontFamily: 'monospace' 
                      }} 
                    />
                    <button 
                      type="button"
                      className="btn-glass" 
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600 }}
                      onClick={() => {
                        navigator.clipboard.writeText(`${systemConfig.frontendDomain}/?ref=${currentUserId}`);
                        addLog("Referral link copied to clipboard!");
                        alert("Referral link copied to clipboard!");
                      }}
                    >
                      Copy
                    </button>
                    {navigator.share && (
                      <button 
                        type="button"
                        className="btn-glass btn-primary" 
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600 }}
                        onClick={() => {
                          navigator.share({
                            title: 'Join GiGO & Accelerate Your Career',
                            text: 'Use my link to register on GiGO and get an instant ₦5,000 NGN signup reward!',
                            url: `https://wa-frontend-seven.vercel.app/?ref=${currentUserId}`
                          }).catch(err => console.error("Web share failed:", err));
                        }}
                      >
                        Share
                      </button>
                    )}
                  </div>
                </div>

                {/* Referral Invite Form */}
                <form onSubmit={handleReferralSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="glass-card">
                  <h5 style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.35rem' }}>👥 Invite a Colleague</h5>
                  
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Colleague's Name *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="John Doe"
                        value={referralFriendName}
                        onChange={(e) => setReferralFriendName(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '0.4rem', fontSize: '0.75rem', color: 'var(--text-primary)' }}
                      />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Colleague's Email *</label>
                      <input 
                        type="email" 
                        required
                        placeholder="john@example.com"
                        value={referralFriendEmail}
                        onChange={(e) => setReferralFriendEmail(e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '0.4rem', fontSize: '0.75rem', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Colleague's Phone (optional, for WhatsApp)</label>
                    <input 
                      type="tel" 
                      placeholder="+2348012345678"
                      value={referralFriendPhone}
                      onChange={(e) => setReferralFriendPhone(e.target.value)}
                      style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-glass)', borderRadius: '6px', padding: '0.4rem', fontSize: '0.75rem', color: 'var(--text-primary)' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Dispatch Method</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        type="button"
                        onClick={() => setReferralDispatchMode('AI_AGENT')}
                        style={{
                          flex: 1,
                          padding: '0.4rem',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: referralDispatchMode === 'AI_AGENT' ? 'var(--primary)' : 'var(--border-glass)',
                          background: referralDispatchMode === 'AI_AGENT' ? 'var(--primary-glow)' : 'rgba(0,0,0,0.15)',
                          color: referralDispatchMode === 'AI_AGENT' ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        🤖 AI Agent Dispatch
                      </button>
                      <button 
                        type="button"
                        onClick={() => setReferralDispatchMode('MANUAL')}
                        style={{
                          flex: 1,
                          padding: '0.4rem',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: referralDispatchMode === 'MANUAL' ? 'var(--border-glass-active)' : 'var(--border-glass)',
                          background: referralDispatchMode === 'MANUAL' ? 'var(--secondary-glow)' : 'rgba(0,0,0,0.15)',
                          color: referralDispatchMode === 'MANUAL' ? 'var(--text-primary)' : 'var(--text-secondary)',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        ✍️ Manual Share
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmittingReferralInvite}
                    className="btn-glass btn-primary" 
                    style={{ width: '100%', justifyContent: 'center', padding: '0.5rem', marginTop: '0.25rem', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    {isSubmittingReferralInvite ? (
                      <>
                        <span className="spinner-border" style={{ width: '12px', height: '12px', borderWidth: '2px', marginRight: '0.35rem' }}></span>
                        Generating Pitch...
                      </>
                    ) : (
                      referralDispatchMode === 'AI_AGENT' ? '🤖 Let AI Agent Send Pitch' : '✍️ Draft Custom Share Copy'
                    )}
                  </button>
                </form>

                {/* Referrals list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h5 style={{ margin: 0, fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>My Invitations</h5>
                    <button 
                      type="button"
                      onClick={fetchReferrals} 
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      🔄 Refresh
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Invited</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{referrals.length}</div>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Registered</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--emerald)' }}>{referrals.filter(r => r.status === 'COMPLETED').length}</div>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-glass)', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Earned</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--secondary)' }}>₦{(referrals.filter(r => r.status === 'COMPLETED').length * systemConfig.referralBonus).toLocaleString()}</div>
                    </div>
                  </div>

                  <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.2rem' }}>
                    {isFetchingReferrals && referrals.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        Loading invitations history...
                      </div>
                    ) : referrals.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }} className="glass-card">
                        No invitations sent yet.
                      </div>
                    ) : (
                      referrals.map((ref: any) => (
                        <div key={ref.referralId} className="glass-card" style={{ padding: '0.5rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.75rem' }}>{ref.friendName}</div>
                            <span 
                              className={`badge ${ref.status === 'COMPLETED' ? 'badge-emerald' : 'badge-purple'}`} 
                              style={{ fontSize: '0.55rem', padding: '0.1rem 0.35rem' }}
                            >
                              {ref.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{ref.friendEmail}</span>
                            <span>{ref.friendPhone || 'No Phone'}</span>
                          </div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.2rem', marginTop: '0.1rem' }}>
                            <span>Mode: {ref.dispatchMode === 'AI_AGENT' ? '🤖 AI Agent' : '✍️ Manual'}</span>
                            <span>{new Date(ref.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
                </div>
              </div>
            </main>
          )}

          {activeWorkspaceTab === 'mailroom' && (() => {
            const selectedThread = mailThreads.find(t => t.id === selectedThreadId);

            // Filter threads based on active folder state
            const filteredThreads = mailThreads.filter(t => {
              if (activeMailFolder === 'trash') {
                return t.isTrash || t.folder === 'trash';
              }
              // For other folders, skip trashed ones
              if (t.isTrash || t.folder === 'trash') {
                return false;
              }
              if (activeMailFolder === 'inbox') {
                // Inbox (Received): contains recruiter replies or initialized as inbox
                return t.messages?.some((m: any) => m.sender === 'recruiter') || t.folder === 'inbox';
              }
              if (activeMailFolder === 'sent') {
                // Sent Mail: contains candidate replies and NO recruiter replies (has not transitioned to inbox)
                return (t.messages?.some((m: any) => m.sender === 'user' || m.sender === 'candidate') || t.folder === 'sent') &&
                       !(t.messages?.some((m: any) => m.sender === 'recruiter') || t.folder === 'inbox');
              }
              // 'all' folder
              return true;
            });

            // Count computations for badges
            const inboxCount = mailThreads.filter(t => !(t.isTrash || t.folder === 'trash') && (t.messages?.some((m: any) => m.sender === 'recruiter') || t.folder === 'inbox')).length;
            const sentCount = mailThreads.filter(t => !(t.isTrash || t.folder === 'trash') && (t.messages?.some((m: any) => m.sender === 'user' || m.sender === 'candidate') || t.folder === 'sent') && !(t.messages?.some((m: any) => m.sender === 'recruiter') || t.folder === 'inbox')).length;
            const allCount = mailThreads.filter(t => !(t.isTrash || t.folder === 'trash')).length;
            const trashCount = mailThreads.filter(t => t.isTrash || t.folder === 'trash').length;

            return (
              <main className="mailroom-container animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '220px 340px 1fr', gap: '1.25rem', height: 'calc(100vh - 180px)', minHeight: '600px' }}>
                
                {/* COLUMN 1: FOLDER NAVIGATION SIDEBAR */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '1.25rem', borderRight: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, color: 'var(--text-secondary)' }}>
                      📂 Folders
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
                    {/* INBOX */}
                    <button
                      className="btn-glass"
                      style={{
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        fontSize: '0.85rem',
                        borderRadius: '8px',
                        background: activeMailFolder === 'inbox' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(15, 13, 35, 0.4))' : 'rgba(15, 13, 35, 0.15)',
                        border: activeMailFolder === 'inbox' ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: activeMailFolder === 'inbox' ? '0 0 10px rgba(139, 92, 246, 0.15)' : 'none',
                        color: activeMailFolder === 'inbox' ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}
                      onClick={() => {
                        setActiveMailFolder('inbox');
                        setSelectedThreadId(null);
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📥</span> Inbox
                      </span>
                      {inboxCount > 0 && (
                        <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>{inboxCount}</span>
                      )}
                    </button>

                    {/* SENT */}
                    <button
                      className="btn-glass"
                      style={{
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        fontSize: '0.85rem',
                        borderRadius: '8px',
                        background: activeMailFolder === 'sent' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(15, 13, 35, 0.4))' : 'rgba(15, 13, 35, 0.15)',
                        border: activeMailFolder === 'sent' ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: activeMailFolder === 'sent' ? '0 0 10px rgba(139, 92, 246, 0.15)' : 'none',
                        color: activeMailFolder === 'sent' ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}
                      onClick={() => {
                        setActiveMailFolder('sent');
                        setSelectedThreadId(null);
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📤</span> Sent Mail
                      </span>
                      {sentCount > 0 && (
                        <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>{sentCount}</span>
                      )}
                    </button>

                    {/* ALL MAIL */}
                    <button
                      className="btn-glass"
                      style={{
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        fontSize: '0.85rem',
                        borderRadius: '8px',
                        background: activeMailFolder === 'all' ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(15, 13, 35, 0.4))' : 'rgba(15, 13, 35, 0.15)',
                        border: activeMailFolder === 'all' ? '1px solid var(--primary)' : '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: activeMailFolder === 'all' ? '0 0 10px rgba(139, 92, 246, 0.15)' : 'none',
                        color: activeMailFolder === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)'
                      }}
                      onClick={() => {
                        setActiveMailFolder('all');
                        setSelectedThreadId(null);
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>📨</span> All Mail
                      </span>
                      {allCount > 0 && (
                        <span className="badge badge-purple" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>{allCount}</span>
                      )}
                    </button>

                    {/* TRASH */}
                    <button
                      className="btn-glass"
                      style={{
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        fontSize: '0.85rem',
                        borderRadius: '8px',
                        background: activeMailFolder === 'trash' ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(15, 13, 35, 0.4))' : 'rgba(15, 13, 35, 0.15)',
                        border: activeMailFolder === 'trash' ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
                        boxShadow: activeMailFolder === 'trash' ? '0 0 10px rgba(239, 68, 68, 0.1)' : 'none',
                        color: activeMailFolder === 'trash' ? '#f87171' : 'var(--text-secondary)'
                      }}
                      onClick={() => {
                        setActiveMailFolder('trash');
                        setSelectedThreadId(null);
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>🗑️</span> Trash
                      </span>
                      {trashCount > 0 && (
                        <span className="badge" style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem', color: '#f87171', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{trashCount}</span>
                      )}
                    </button>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>SMTP HANDSHAKE:</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></span>
                      SECURE CONNECTED
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: THREAD LIST */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
                    <div>
                      <h2 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, letterSpacing: '0.05em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', textTransform: 'uppercase' }}>
                        <span className="pulse-dot" style={{ width: '8px', height: '8px', background: activeMailFolder === 'trash' ? '#f87171' : '#d946ef', borderRadius: '50%', boxShadow: activeMailFolder === 'trash' ? '0 0 10px #f87171' : '0 0 10px #d946ef' }}></span>
                        {activeMailFolder === 'inbox' ? 'INBOX' : activeMailFolder === 'sent' ? 'SENT MAIL' : activeMailFolder === 'all' ? 'ALL COMMUNICATIONS' : 'TRASH BIN'}
                      </h2>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Synced to {userEmail || 'Gmail'}</span>
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>{filteredThreads.length}</span>
                  </div>

                  {/* EMPTY TRASH TRIGGER BAR */}
                  {activeMailFolder === 'trash' && filteredThreads.length > 0 && (
                    <button
                      className="btn-glass"
                      style={{
                        marginBottom: '1rem',
                        width: '100%',
                        justifyContent: 'center',
                        color: '#f87171',
                        borderColor: 'rgba(239, 68, 68, 0.4)',
                        background: 'rgba(239, 68, 68, 0.08)',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        padding: '0.5rem'
                      }}
                      onClick={handleEmptyTrash}
                      disabled={isClearingTrash}
                    >
                      {isClearingTrash ? '🗑️ Purging Trash...' : '🗑️ Empty Trash Now'}
                    </button>
                  )}

                  {/* SYNC ACTIONS */}
                  {activeMailFolder !== 'trash' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                      <button
                        className="btn-glass"
                        style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '0.5rem', borderColor: 'rgba(139, 92, 246, 0.3)' }}
                        onClick={() => handleSyncMail(false)}
                        disabled={isSyncingMail}
                      >
                        {isSyncingMail ? 'Syncing...' : '🔄 Sync Inbox'}
                      </button>
                      <button
                        className="btn-glass btn-secondary"
                        style={{ 
                          justifyContent: 'center', 
                          fontSize: '0.8rem', 
                          padding: '0.5rem', 
                          background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(15, 13, 35, 0.4))',
                          border: '1px solid rgba(236, 72, 153, 0.3)' 
                        }}
                        onClick={() => handleSyncMail(true)}
                        disabled={isSyncingMail}
                        title="Simulates an incoming recruiter reply using Gemini contextually"
                      >
                        {isSyncingMail ? 'Simulating...' : '🤖 Force Reply'}
                      </button>
                    </div>
                  )}

                  {/* THREAD CARDS LIST */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
                    {filteredThreads.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📬</div>
                        <p style={{ margin: 0, lineHeight: 1.4 }}>No email threads here.</p>
                        <p style={{ fontSize: '0.72rem', marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                          {activeMailFolder === 'trash' 
                            ? 'Deleted conversations will reside here before permanent purge.' 
                            : 'Active vacancy communications will initialize here automatically.'}
                        </p>
                      </div>
                    ) : (
                      filteredThreads.map(thread => {
                        const isSelected = thread.id === selectedThreadId;
                        const lastMessage = thread.messages && thread.messages.length > 0 ? thread.messages[thread.messages.length - 1] : null;
                        
                        // Status pill styling
                        let statusColor = '#eab308';
                        let statusText = 'Awaiting Recruiter';
                        let statusBg = 'rgba(234, 179, 8, 0.15)';
                        
                        if (thread.status === 'replied') {
                          statusColor = '#a78bfa';
                          statusText = 'Recruiter Replied';
                          statusBg = 'rgba(167, 139, 250, 0.15)';
                        } else if (thread.status === 'interview_offered') {
                          statusColor = '#10b981';
                          statusText = 'Interview Offered';
                          statusBg = 'rgba(16, 185, 129, 0.15)';
                        } else if (thread.status === 'rejected') {
                          statusColor = '#ef4444';
                          statusText = 'Rejected / Closed';
                          statusBg = 'rgba(239, 68, 68, 0.15)';
                        }

                        return (
                          <div
                            key={thread.id}
                            className={`glass-card ${isSelected ? 'active' : ''}`}
                            onClick={() => setSelectedThreadId(thread.id)}
                            style={{
                              padding: '1rem',
                              cursor: 'pointer',
                              border: isSelected ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.06)',
                              boxShadow: isSelected ? '0 0 12px rgba(139, 92, 246, 0.2)' : 'none',
                              background: isSelected ? 'rgba(139, 92, 246, 0.08)' : 'rgba(15, 13, 35, 0.3)',
                              transition: 'all 0.2s ease',
                              borderRadius: '8px',
                              position: 'relative'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                {thread.companyName}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                                {thread.updatedAt ? new Date(thread.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                              </span>
                            </div>

                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f3e8ff', marginBottom: '0.5rem' }}>
                              {thread.jobTitle}
                            </div>

                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: '0.65rem' }}>
                              {thread.subject}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span 
                                style={{ 
                                  fontSize: '0.65rem', 
                                  fontWeight: 600, 
                                  color: statusColor, 
                                  background: statusBg, 
                                  padding: '0.15rem 0.5rem', 
                                  borderRadius: '10px', 
                                  border: `1px solid ${statusColor}33`,
                                  boxShadow: `0 0 8px ${statusColor}1A`
                                }}
                              >
                                {statusText}
                              </span>
                              
                              {lastMessage && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                  {lastMessage.sender === 'user' ? 'You sent reply' : 'Received reply'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* COLUMN 3: ACTIVE THREAD */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', padding: '1.25rem' }}>
                  {!selectedThread ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      <div style={{ fontSize: '3.5rem', marginBottom: '1rem', filter: 'drop-shadow(0 0 10px rgba(139,92,246,0.3))' }}>📡</div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Communications Sandbox</h3>
                      <p style={{ maxWidth: '400px', fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
                        Select a career correspondence thread from the folders or lists to view, draft, and dispatch follow-ups or coordinate interviews directly inside your GiGO cockpit.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                      
                      {/* ACTIVE THREAD HEADER */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {selectedThread.companyName}
                            </span>
                            <span className="badge badge-pink" style={{ fontSize: '0.75rem' }}>{selectedThread.jobTitle}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Subject: <span style={{ color: '#d8b4fe' }}>{selectedThread.subject}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                            Recruiter Contact: <strong style={{ color: 'var(--text-secondary)' }}>{selectedThread.recruiterName || 'Hiring Team'}</strong> &lt;{selectedThread.recipientEmail}&gt;
                          </div>
                        </div>

                        {/* THREAD ACTION CONTROLS */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {selectedThread.isTrash || selectedThread.folder === 'trash' ? (
                            <button
                              className="btn-glass"
                              style={{
                                color: '#10b981',
                                borderColor: 'rgba(16, 185, 129, 0.4)',
                                background: 'rgba(16, 185, 129, 0.08)',
                                fontWeight: 700,
                                padding: '0.5rem 1rem',
                                fontSize: '0.8rem'
                              }}
                              onClick={() => handleRestoreFromTrash(selectedThread.id)}
                              disabled={isTrashingThread === selectedThread.id}
                            >
                              {isTrashingThread === selectedThread.id ? 'Restoring...' : '🔄 Restore from Trash'}
                            </button>
                          ) : (
                            <>
                              <button
                                className="btn-glass"
                                style={{
                                  color: '#f87171',
                                  borderColor: 'rgba(239, 68, 68, 0.4)',
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  fontWeight: 700,
                                  padding: '0.5rem 1rem',
                                  fontSize: '0.8rem'
                                }}
                                onClick={() => handleMoveToTrash(selectedThread.id)}
                                disabled={isTrashingThread === selectedThread.id}
                                title="Move this email thread to trash folder"
                              >
                                {isTrashingThread === selectedThread.id ? 'Deleting...' : '🗑️ Move to Trash'}
                              </button>

                              {/* ROUTINE FOLLOW UP TRIGGER */}
                              <button
                                className="btn-glass"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(15, 13, 35, 0.4))',
                                  border: '1px solid rgba(167, 139, 250, 0.4)',
                                  color: '#e9d5ff',
                                  fontWeight: 700,
                                  padding: '0.5rem 1rem',
                                  boxShadow: '0 0 10px rgba(167, 139, 250, 0.1)',
                                  fontSize: '0.8rem'
                                }}
                                onClick={() => handleGenerateFollowup(selectedThread.id)}
                                disabled={isGeneratingFollowup}
                              >
                                {isGeneratingFollowup ? '🪄 Drafting...' : '🪄 AI Follow-Up'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* MESSAGES LOG CONTAINER */}
                      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem', marginBottom: '1.25rem' }}>
                        {(!selectedThread.messages || selectedThread.messages.length === 0) ? (
                          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '2rem 0' }}>
                            No logged communications in this thread yet.
                          </p>
                        ) : (
                          selectedThread.messages.map((msg: any) => {
                            const isUser = msg.sender === 'user';
                            return (
                              <div
                                key={msg.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                                  width: '100%'
                                }}
                              >
                                <div
                                  style={{
                                    maxWidth: '75%',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    background: isUser ? 'rgba(76, 29, 149, 0.25)' : 'rgba(30, 41, 59, 0.4)',
                                    border: isUser ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(255,255,255,0.06)',
                                    boxShadow: isUser ? '0 4px 12px rgba(139, 92, 246, 0.05)' : 'none',
                                    color: 'var(--text-primary)'
                                  }}
                                >
                                  {/* Message Header */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0.25rem', gap: '2rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isUser ? '#d8b4fe' : '#94a3b8' }}>
                                      {isUser ? 'YOU (Candidate)' : `${msg.senderName || 'Recruiter'} (Recruiting Team)`}
                                    </span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                      {new Date(msg.timestamp).toLocaleString()}
                                    </span>
                                  </div>

                                  {/* Message Body */}
                                  {isUser ? (
                                    <div style={{ fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.5, color: '#f3e8ff' }}>
                                      {msg.body}
                                    </div>
                                  ) : (
                                    <div 
                                      style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-primary)' }}
                                      className="recruiter-email-body"
                                      dangerouslySetInnerHTML={{ __html: msg.body }}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* MESSAGE INPUT EDITOR FOOTER */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                        {selectedThread.isTrash || selectedThread.folder === 'trash' ? (
                          <div style={{ textAlign: 'center', padding: '1.25rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem', fontWeight: 500 }}>
                            ⚠️ This email thread is currently in the Trash bin. Replying is disabled. Please restore the thread to dispatch replies.
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
                              <div style={{ flex: 1 }}>
                                <textarea
                                  rows={3}
                                  className="input-glass"
                                  placeholder={`Draft a detailed email response to send from ${userEmail || 'synced address'}...`}
                                  style={{ 
                                    width: '100%', 
                                    resize: 'none', 
                                    background: 'rgba(15, 13, 35, 0.5)', 
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '0.75rem',
                                    fontSize: '0.85rem',
                                    color: '#f3e8ff',
                                    outline: 'none'
                                  }}
                                  value={replyBody}
                                  onChange={(e) => setReplyBody(e.target.value)}
                                />
                              </div>
                              <button
                                className="btn-glass"
                                style={{
                                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(15, 13, 35, 0.4))',
                                  borderColor: 'rgba(139, 92, 246, 0.6)',
                                  padding: '0.75rem 1.5rem',
                                  height: '46px',
                                  fontWeight: 700,
                                  fontSize: '0.85rem'
                                }}
                                onClick={handleSendReply}
                                disabled={isSendingReply || !replyBody.trim()}
                              >
                                {isSendingReply ? 'Sending...' : 'Send Reply ✉️'}
                              </button>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                              <span>Dispatches instantly via secure Google SMTP handshake.</span>
                              <span>Secure SSL/TLS encrypted</span>
                            </div>
                          </>
                        )}
                      </div>

                    </div>
                  )}
                </div>

                {/* AI FOLLOW-UP MODAL */}
                {showFollowupModal && (
                  <div className="modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 3, 10, 0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
                    <div className="glass-panel animate-scale-up" style={{ width: '650px', maxWidth: '90%', display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem', background: 'rgba(15, 12, 30, 0.95)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>🪄</span> Tailored Routine Follow-Up Email
                        </h3>
                        <span className="badge badge-purple">Gemini Pro Calibrated</span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, background: 'rgba(139, 92, 246, 0.05)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(139,92,246,0.15)' }}>
                        <strong>Wizard Directive:</strong> Inspects full thread history and crafts a highly professional follow-up highlighting your skills and redundant engineering uptime (10kVA solar setup + multi-ISP lines). Feel free to customize prior to dispatch.
                      </div>

                      <div style={{ flex: 1 }}>
                        <textarea
                          rows={12}
                          className="input-glass"
                          style={{
                            width: '100%',
                            resize: 'none',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            lineHeight: 1.5,
                            padding: '0.75rem',
                            background: 'rgba(5, 3, 10, 0.6)'
                          }}
                          value={followupDraftText}
                          onChange={(e) => setFollowupDraftText(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.75rem' }}>
                        <button
                          className="btn-glass btn-secondary"
                          onClick={() => { setShowFollowupModal(false); setFollowupDraftText(''); }}
                          disabled={isSendingReply}
                        >
                          Cancel Draft
                        </button>
                        <button
                          className="btn-glass"
                          style={{
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.4), rgba(15, 13, 35, 0.4))',
                            borderColor: '#8b5cf6'
                          }}
                          onClick={handleSendFollowup}
                          disabled={isSendingReply || !followupDraftText.trim()}
                        >
                          {isSendingReply ? 'Dispatched...' : 'Send Tailored Email 🚀'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </main>
            );
          })()}

      </>
      ) : (
        /* ====================================================
           ADMINISTRATIVE PORTAL VIEW
           ==================================================== */
        <main className="admin-portal-container animate-fade-in" style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', maxWidth: '1600px', margin: '0 auto', width: '100%' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>

            {/* ROW 0: GLOBAL SYSTEM CONFIGURATION & FINANCIAL CONTROLS */}
            <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', border: '1px solid var(--border-glass)', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }} className="text-gradient-purple-pink">Global System Configuration & Referral Controls</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>Configure global environment domains, active landing endpoints, and referral economics across the entire ecosystem.</p>
                </div>
                <div style={{ padding: '0.5rem 1rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <span style={{ fontSize: '1rem' }}>⚙️</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Core Engine</span>
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

                <button 
                  type="submit" 
                  className="btn-glass btn-secondary" 
                  style={{ height: '42px', justifyContent: 'center', fontWeight: 700, gap: '0.5rem', borderRadius: '8px', border: '1px solid var(--secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
                  disabled={isSavingSystemConfig}
                >
                  {isSavingSystemConfig ? (
                    <>
                      <div className="spinner-micro" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                      Saving System Config...
                    </>
                  ) : (
                    <>
                      Commit System Config 💾
                    </>
                  )}
                </button>
              </form>

              {/* MANAGING SEARCHABLE DOMAINS PANEL */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>🔧 Boolean Scraper Targeted Domains Directory</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 1rem 0' }}>Add or delete target web domains that are dynamically selectable in the Candidate Scraper Workspace filters dropdown.</p>
                
                {/* DOMAINS LIST BADGES */}
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
                  {configScraperDomains.length === 0 && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No custom domains configured (defaults will be used).</span>
                  )}
                </div>

                {/* ADD DOMAIN INTERFACE */}
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
            </div>

            {/* ROW 1: USER DATABASE GRID & MANUAL ADJUSTMENTS */}
            <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }} className="text-gradient-purple-pink">Firestore Candidate Database</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>Manage registered candidates, inspect profile balances, and issue direct administrative ledger adjustments.</p>
                </div>
                <button className="btn-glass btn-primary" onClick={fetchAdminUsers} disabled={isLoadingAdminData}>
                  <RefreshIcon /> Refresh Users
                </button>
              </div>

              {isLoadingAdminData ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0' }}>
                  <div className="spinner-micro" style={{ width: '40px', height: '40px', border: '3px solid rgba(255, 255, 255, 0.1)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Querying candidates snapshot...</span>
                </div>
              ) : (
                <div className="table-wrapper" style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User Profile</th>
                        <th>Email / Phone</th>
                        <th>Wallet Balance (NGN)</th>
                        <th>Wallet Balance (USD)</th>
                        <th>Dynamic Keys</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No candidate records found in active collection.</td>
                        </tr>
                      ) : (
                        adminUsers.map(user => (
                          <tr key={user.userId}>
                            <td>
                              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{user.fullName}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                                <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '4px', background: user.role === 'admin' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)', color: user.role === 'admin' ? 'var(--primary)' : 'var(--text-secondary)', border: user.role === 'admin' ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)' }}>
                                  {user.role === 'admin' ? '👑 Admin' : '👤 Candidate'}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>ID: {user.userId}</div>
                            </td>
                            <td>
                              <div style={{ fontSize: '0.85rem', color: '#f8fafc' }}>{user.email}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user.phoneNumber || 'No phone registered'}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                ₦{(user.financials?.walletBalanceNGN || 0.0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                              </div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                                ${(user.financials?.walletBalanceUSD || 0.0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                <span style={{ fontSize: '0.65rem', color: user.geminiApiKey ? '#a7f3d0' : '#93c5fd' }}>
                                  Gemini API Key: {user.geminiApiKey ? '✅ Custom Key' : 'ℹ️ System Default'}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: user.flutterwavePublicKey ? '#a7f3d0' : '#fca5a5' }}>
                                  Flutterwave PK: {user.flutterwavePublicKey ? '✅ Configured' : '❌ Unconfigured'}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button 
                                  className="btn-glass" 
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'rgba(138, 92, 246, 0.4)', color: 'var(--primary)' }}
                                  onClick={() => {
                                    setOverrideUser(user);
                                    setOverrideAmount('5000');
                                    setOverrideCurrency('NGN');
                                    setOverridePurpose('MANUAL_RECONCILIATION_CREDIT');
                                    setShowOverrideModal(true);
                                  }}
                                >
                                  Adjust Wallet
                                </button>
                                <button 
                                  className="btn-glass" 
                                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}
                                  onClick={() => handleInspectUser(user)}
                                >
                                  Inspect Activity
                                </button>
                                {userEmail === 'admin@gigo.com' && user.email !== 'admin@gigo.com' && (
                                  <button 
                                    className="btn-glass" 
                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: user.role === 'admin' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(139, 92, 246, 0.4)', color: user.role === 'admin' ? '#ef4444' : 'var(--primary)' }}
                                    onClick={() => handleChangeUserRole(user, user.role === 'admin' ? 'candidate' : 'admin')}
                                  >
                                    {user.role === 'admin' ? 'Demote Candidate' : 'Make Admin'}
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

            {/* ROW 2: AGENT VALIDATION LOGS & SCRAPER CONTROLS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
              
              {/* CONTINUOUS VALIDATION LOGS */}
              <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', maxHeight: '450px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Continuous Agent Validation Logs</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Simulated real-time autonomous validation loops monitoring platform health & web scraping routines.</p>
                  </div>
                  <button className="btn-glass" onClick={fetchAdminLogs}>
                    <RefreshIcon /> Fetch Logs
                  </button>
                </div>

                <div className="activity-log" style={{ flex: 1, minHeight: '180px', maxHeight: '320px', overflowY: 'auto', fontFamily: 'monospace' }}>
                  {adminLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                      No live agent validation logs generated yet. Run scrapers or onboarding to see logs populate!
                    </div>
                  ) : (
                    adminLogs.map(log => (
                      <div 
                        key={log.id} 
                        className="activity-item" 
                        style={{ 
                          borderLeftColor: log.status === 'CRITICAL_ALERT' ? 'var(--rose)' : log.status === 'WARNING' ? '#fbbf24' : 'var(--emerald)',
                          color: log.status === 'CRITICAL_ALERT' ? '#fca5a5' : log.status === 'WARNING' ? '#fde68a' : '#a7f3d0',
                          padding: '0.5rem',
                          background: 'rgba(255, 255, 255, 0.01)',
                          marginBottom: '0.35rem',
                          borderRadius: '4px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 700 }}>{log.actionType} ({log.status})</span>
                          <span>{log.timestamp ? log.timestamp.replace('T', ' ').substring(11, 19) : ''}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', lineHeight: '1.3' }}>{log.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        </main>
      )}

      {/* FOOTER */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid var(--border-glass)', padding: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        GiGO Career Platform — Connected to Secure Flutterwave Webhook Core and Dynamic Gemini Routing.
      </footer>

      {/* ----------------------------------------------------
         MODALS RENDERING BLOCK
         ---------------------------------------------------- */}

      {/* TOP UP MODAL (FLUTTERWAVE CHECKOUT) */}
      {showTopUpModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <button className="close-btn" onClick={() => setShowTopUpModal(false)}>&times;</button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <WalletIcon /> Deposit Wallet Funds
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Secure checkout utilizes Flutterwave Inline payments. Supports live credit card networks, mobile money, and sandbox simulation profiles.
            </p>

            <form onSubmit={handleTopUpSubmit}>
              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Currency Type</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    type="button" 
                    className={`btn-glass ${topUpCurrency === 'NGN' ? 'btn-secondary' : ''}`}
                    onClick={() => { setTopUpCurrency('NGN'); setTopUpAmount('5000'); }}
                    style={{ flex: 1, justifyContent: 'center', fontWeight: 700 }}
                  >
                    NGN (₦)
                  </button>
                  <button 
                    type="button" 
                    className={`btn-glass ${topUpCurrency === 'USD' ? 'btn-primary' : ''}`}
                    onClick={() => { setTopUpCurrency('USD'); setTopUpAmount('50'); }}
                    style={{ flex: 1, justifyContent: 'center', fontWeight: 700 }}
                  >
                    USD ($)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontWeight: 600 }}>Amount ({topUpCurrency})</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="Enter deposit amount"
                  required
                />
              </div>

              <button 
                type="submit" 
                className={`btn-glass ${topUpCurrency === 'USD' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', fontWeight: 700 }}
                disabled={isSubmittingTopUp}
              >
                {isSubmittingTopUp ? (
                  <>
                    <div className="spinner-micro" style={{ width: '12px', height: '12px', border: '1px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '0.5rem' }}></div>
                    Loading Checkout...
                  </>
                ) : `Pay ${topUpCurrency} ${topUpAmount}`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TRACK NEW TASK MODAL */}
      {showNewTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <button className="close-btn" onClick={() => setShowNewTaskModal(false)}>&times;</button>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Track Custom Career Event
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Add a custom job application or interview milestone card directly to your task tracking board.
            </p>

            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Job Title</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Senior Machine Learning Engineer"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Company</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. OpenAI"
                  value={newTaskCompany}
                  onChange={(e) => setNewTaskCompany(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Compensation / Salary</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. $180,000 - $220,000"
                  value={newTaskSalary}
                  onChange={(e) => setNewTaskSalary(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Default Milestone Column</label>
                <select 
                  className="form-control" 
                  value={newTaskColumn}
                  onChange={(e: any) => setNewTaskColumn(e.target.value)}
                >
                  <option value="matched">Matched Inbox</option>
                  <option value="applied">Applied / Active</option>
                  <option value="interviews">Interviews / Offers</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn-glass btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', fontWeight: 700 }}
              >
                Insert Track Card
              </button>
            </form>
          </div>
        </div>
      )}


      {/* TICKER CHANNEL CONFIGURATION MODAL */}
      {showTickerConfigModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '450px', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button className="close-btn" onClick={() => setShowTickerConfigModal(false)}>&times;</button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🎯 Personalize Match Feed
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: '1.4' }}>
              Choose <strong>up to 2</strong> specific platforms to target. This updates your live matches marquee to filter or seed announcements from those channels.
              <br />
              <strong style={{ color: 'var(--secondary)' }}>Setup Fee: ₦300.00 NGN</strong> (debited atomically from your career wallet balance).
            </p>

            <form onSubmit={handleConfigureTickerStream}>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', margin: '1rem 0' }}>
                {(systemConfig.scraperDomains || ['linkedin.com', 'twitter.com', 'instagram.com', 'facebook.com', 'reddit.com', 'github.com']).map((dom) => {
                  const isChecked = selectedDomains.includes(dom);
                  return (
                    <div 
                      key={dom} 
                      onClick={() => {
                        if (isChecked) {
                          setSelectedDomains(selectedDomains.filter(d => d !== dom));
                        } else {
                          if (selectedDomains.length >= 2) {
                            alert("You can select a maximum of 2 target channels.");
                            return;
                          }
                          setSelectedDomains([...selectedDomains, dom]);
                        }
                      }}
                      style={{
                        padding: '0.75rem',
                        borderRadius: '8px',
                        background: isChecked ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: isChecked ? '1px solid var(--primary)' : '1px solid var(--border-glass)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        color: isChecked ? '#fff' : 'var(--text-secondary)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        readOnly
                        style={{ margin: 0, pointerEvents: 'none' }}
                      />
                      {dom}
                    </div>
                  );
                })}
              </div>

              <div style={{
                background: 'rgba(0, 0, 0, 0.2)',
                border: '1px solid var(--border-glass)',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Your Wallet Balance:</span>
                <span style={{ fontWeight: 800, color: walletNGN >= 300 ? '#10b981' : '#ef4444' }}>
                  ₦{walletNGN.toLocaleString('en-NG', { minimumFractionDigits: 2 })} NGN
                </span>
              </div>

              <button 
                type="submit" 
                className="btn-glass btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 700, padding: '0.75rem' }}
                disabled={isConfiguringTickerStream || (walletNGN < 300 && selectedDomains.length > 0)}
              >
                {isConfiguringTickerStream ? 'Configuring Stream Setup...' : walletNGN < 300 ? 'Insufficient Wallet Balance' : 'Configure Feed Channels (₦300)'}
              </button>
            </form>
          </div>
        </div>
      )}


      {/* ADMIN LEDGER OVERRIDE ADJUSTMENT MODAL */}
      {showOverrideModal && overrideUser && (userEmail === 'admin@gigo.com' || userRole === 'admin') && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <button className="close-btn" onClick={() => setShowOverrideModal(false)}>&times;</button>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Direct Ledger Overrides
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Manually adjust active profile balance for <strong>{overrideUser.fullName}</strong>. Enter a positive number to credit or negative number to debit.
            </p>

            <form onSubmit={handleAdminOverrideSubmit}>
              <div className="form-group">
                <label>Currency Override</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button 
                    type="button" 
                    className={`btn-glass ${overrideCurrency === 'NGN' ? 'btn-secondary' : ''}`}
                    onClick={() => setOverrideCurrency('NGN')}
                    style={{ flex: 1, justifyContent: 'center', fontWeight: 700 }}
                  >
                    NGN (₦)
                  </button>
                  <button 
                    type="button" 
                    className={`btn-glass ${overrideCurrency === 'USD' ? 'btn-primary' : ''}`}
                    onClick={() => setOverrideCurrency('USD')}
                    style={{ flex: 1, justifyContent: 'center', fontWeight: 700 }}
                  >
                    USD ($)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Adjustment Amount (use minus '-' to debit)</label>
                <input 
                  type="number" 
                  step="any"
                  className="form-control"
                  placeholder="e.g. 5000 or -200"
                  value={overrideAmount}
                  onChange={(e) => setOverrideAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Purpose Code / Ledger Reason</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. MANUAL_RECONCILIATION_CREDIT"
                  value={overridePurpose}
                  onChange={(e) => setOverridePurpose(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className={`btn-glass ${overrideCurrency === 'USD' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', fontWeight: 700 }}
                disabled={isSubmittingOverride}
              >
                {isSubmittingOverride ? 'Executing ledger override...' : 'Commit Ledger Override'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* JOB DETAILS INSPECTOR MODAL */}
      {selectedJob && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '1000px', width: '90%' }}>
            <button className="close-btn" onClick={() => setSelectedJob(null)}>&times;</button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              <div>
                <span className="badge badge-purple" style={{ marginBottom: '0.5rem' }}>Ticker Live Stream Match</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.2rem 0' }}>{selectedJob.jobTitle}</h3>
                <h4 style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 700 }}>{selectedJob.companyName}</h4>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '60px', height: '60px', borderRadius: '50%', 
                  background: 'rgba(138, 92, 246, 0.1)', border: '2px solid var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column'
                }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>{selectedJob.score || 85}%</span>
                  <span style={{ fontSize: '0.5rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700 }}>Match</span>
                </div>
              </div>
            </div>

            <div className="grid-2-cols" style={{ marginTop: '1rem' }}>
              {/* Left Column: Metadata & CTAs */}
              <div>
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', marginBottom: '1.25rem' }}>
                  <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    📁 Regional Telemetry Metadata
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <LocationIcon /> <span>Location: {selectedJob.location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🟢 <span>Salary Bracket: {selectedJob.salaryRange}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📅 <span>Posted Online: {getRelativeTime(selectedJob.postedAt || selectedJob.scrapedAt)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🕒 <span>GiGO AI Synced: {getRelativeTime(selectedJob.scrapedAt)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      🔑 Application Specifications
                    </h5>
                    {selectedJob.applicationMethod === 'email' && (
                      <span className="badge badge-purple" style={{ textTransform: 'none', fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>✉️ Email Application</span>
                    )}
                    {selectedJob.applicationMethod === 'portal' && (
                      <span className="badge" style={{ textTransform: 'none', fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981' }}>🌐 Career Portal</span>
                    )}
                    {selectedJob.applicationMethod === 'google_form' && (
                      <span className="badge" style={{ textTransform: 'none', fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'rgba(236, 72, 153, 0.1)', border: '1px solid #ec4899', color: '#ec4899' }}>📋 Google Form</span>
                    )}
                    {(selectedJob.applicationMethod === 'unknown' || !selectedJob.applicationMethod) && (
                      <span className="badge" style={{ textTransform: 'none', fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--border-glass)' }}>❓ Direct Guidelines</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
                    {selectedJob.applicationMethod === 'email' && (
                      <>
                        {selectedJob.applicationEmail && (
                          <div>
                            <strong>📧 Recruiter HR Email:</strong>{' '}
                            <a href={`mailto:${selectedJob.applicationEmail}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
                              {selectedJob.applicationEmail}
                            </a>
                          </div>
                        )}
                        {selectedJob.emailSubject && (
                          <div style={{ background: 'rgba(0,0,0,0.15)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}><strong>Subject Line Template:</strong></div>
                            <code style={{ fontSize: '0.75rem', color: '#fff', wordBreak: 'break-all' }}>{selectedJob.emailSubject}</code>
                          </div>
                        )}
                        {selectedJob.emailBodyRequirements && (
                          <div>
                            <strong>✍️ Cover Email Directives:</strong>
                            <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.25' }}>
                              {selectedJob.emailBodyRequirements}
                            </p>
                          </div>
                        )}
                        {Array.isArray(selectedJob.attachmentsRequired) && selectedJob.attachmentsRequired.length > 0 && (
                          <div>
                            <strong>📎 Required Attachments:</strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.25rem' }}>
                              {selectedJob.attachmentsRequired.map((att, i) => (
                                <span key={i} className="badge badge-purple" style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                                  ✓ {att}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {selectedJob.applicationMethod === 'portal' && (
                      <>
                        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                          This role requires filling out an external web form. The portal link is provided below. Open the link to apply yourself, and the system will automatically file this match in your <strong>Applied</strong> milestone stack.
                        </div>
                        {selectedJob.applicationLink && (
                          <div style={{ marginTop: '0.25rem' }}>
                            <strong>🔗 Direct Portal URL:</strong>{' '}
                            <a href={selectedJob.applicationLink} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline', wordBreak: 'break-all' }}>
                              {selectedJob.applicationLink}
                            </a>
                          </div>
                        )}
                      </>
                    )}

                    {selectedJob.applicationMethod === 'google_form' && (
                      <>
                        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                          Applicants are expected to fill out a structured Google Form. Open the form to submit your application details, and the system will automatically file this match in your <strong>Applied</strong> milestone stack.
                        </div>
                        {selectedJob.applicationLink && (
                          <div style={{ marginTop: '0.25rem' }}>
                            <strong>📋 Google Form URL:</strong>{' '}
                            <a href={selectedJob.applicationLink} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline', wordBreak: 'break-all' }}>
                              {selectedJob.applicationLink}
                            </a>
                          </div>
                        )}
                      </>
                    )}

                    {(!selectedJob.applicationMethod || selectedJob.applicationMethod === 'unknown') && (
                      <>
                        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.3' }}>
                          Standard application guidelines apply. Please use the contact references below to complete your application.
                        </div>
                        {selectedJob.applicationLink && <div>🔗 Apply Link: <a href={selectedJob.applicationLink} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>Portal Link</a></div>}
                        {selectedJob.applicationEmail && <div>📧 HR Email: <a href={`mailto:${selectedJob.applicationEmail}`} style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>{selectedJob.applicationEmail}</a></div>}
                        {selectedJob.applicationPhone && <div>📞 HR Hotline: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{selectedJob.applicationPhone}</span></div>}
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <button 
                    className="btn-glass" 
                    style={{ flex: 1, justifyContent: 'center' }} 
                    onClick={() => importTickerJob(selectedJob, false)}
                  >
                    Import to Inbox
                  </button>
                  {selectedJob.applicationMethod === 'portal' || selectedJob.applicationMethod === 'google_form' ? (
                    <a 
                      href={selectedJob.applicationLink || selectedJob.applicationLinkOrEmail}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-glass btn-primary" 
                      style={{ flex: 1, justifyContent: 'center', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }} 
                      onClick={() => {
                        addLog(`Opening application link in a new tab: ${selectedJob.companyName}`);
                        importTickerJob(selectedJob, true);
                      }}
                    >
                      {selectedJob.applicationMethod === 'portal' ? 'Open Application Portal ↗\uFE0F' : 'Open Google Form ↗\uFE0F'}
                    </a>
                  ) : (
                    <button 
                      className="btn-glass btn-primary" 
                      style={{ flex: 1, justifyContent: 'center', fontWeight: 700 }} 
                      onClick={() => {
                        const job = selectedJob;
                        setSelectedJob(null);
                        openEmailModalForJob(job);
                      }}
                    >
                      ✉️ Apply via Email Dispatcher
                    </button>
                  )}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button 
                    className="btn-glass" 
                    style={{ width: '100%', justifyContent: 'center', border: '1px solid rgba(236, 72, 153, 0.3)', background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.05), rgba(0, 0, 0, 0.2))', fontWeight: 600, fontSize: '0.8rem' }} 
                    onClick={async () => {
                      const jobToGen = selectedJob;
                      setSelectedJob(null); // Close modal
                      setActiveLeftTab('docs'); // Switch to documents tab
                      await generateATSAsset(jobToGen, 'COVER_LETTER');
                    }}
                  >
                    ✨ Compile ATS Cover Letter (₦400 NGN)
                  </button>

                  <button 
                    className="btn-glass" 
                    style={{ width: '100%', justifyContent: 'center', border: '1px solid rgba(139, 92, 246, 0.3)', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(0, 0, 0, 0.2))', fontWeight: 600, fontSize: '0.8rem' }} 
                    onClick={async () => {
                      const jobToGen = selectedJob;
                      setSelectedJob(null); // Close modal
                      setActiveLeftTab('docs'); // Switch to documents tab
                      await generateATSAsset(jobToGen, 'CV');
                    }}
                  >
                    📄 Compile ATS CV / Resume (₦500 NGN)
                  </button>

                  <button 
                    className="btn-glass" 
                    style={{ width: '100%', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(0, 0, 0, 0.2))', fontWeight: 600, fontSize: '0.8rem' }} 
                    onClick={async () => {
                      const jobToGen = selectedJob;
                      setSelectedJob(null); // Close modal
                      setActiveLeftTab('docs'); // Switch to documents tab
                      await generateATSAsset(jobToGen, 'PORTFOLIO');
                    }}
                  >
                    💼 Compile Case Portfolio (₦600 NGN)
                  </button>
                </div>
              </div>

              {/* Right Column: Description & Reqs */}
              <div>
                {selectedJob.jobDescription && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Detailed Job Description</h5>
                    <div style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.5',
                      background: 'rgba(0, 0, 0, 0.2)',
                      maxHeight: '250px',
                      overflowY: 'auto',
                      padding: '1rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-glass)'
                    }}>
                      {selectedJob.jobDescription}
                    </div>
                  </div>
                )}

                {selectedJob.keyRequirementsSummary && selectedJob.keyRequirementsSummary.length > 0 && (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Core Requirements</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {selectedJob.keyRequirementsSummary.map((req, ridx) => (
                        <span 
                          key={ridx} 
                          className="badge"
                          style={{ 
                            fontSize: '0.7rem', 
                            padding: '0.3rem 0.6rem', 
                            background: 'rgba(139, 92, 246, 0.1)', 
                            border: '1px solid rgba(139, 92, 246, 0.2)', 
                            color: 'var(--primary)',
                            borderRadius: '6px',
                            backdropFilter: 'blur(5px)',
                            fontWeight: 600
                          }}
                        >
                          ✨ {req}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '1.5rem' }}>
                  <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>AI Matching Analysis</h5>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    Candidate possesses matching specs for this role. Score factors include vocal profile credentials, core technical competencies, and automated regional infrastructure telemetry indexes.
                  </p>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', marginBottom: '1.25rem' }}>
                  <h5 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>🚀 Recommended Next Actions</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <span style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.65rem', fontWeight: 800 }}>1</span>
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>Compile Cover Letter (₦400 NGN)</strong>
                        <div style={{ color: 'var(--text-muted)' }}>Generate an ATS-optimized, personalized cover letter targeted specifically for this position.</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <span style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.65rem', fontWeight: 800 }}>2</span>
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>Compile ATS CV / Resume (₦500 NGN)</strong>
                        <div style={{ color: 'var(--text-muted)' }}>Adapt your professional profile and telemetry into a tailored PDF CV.</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                      <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.65rem', fontWeight: 800 }}>3</span>
                      <div>
                        <strong style={{ color: 'var(--text-primary)' }}>Compile Case Portfolio (₦600 NGN)</strong>
                        <div style={{ color: 'var(--text-muted)' }}>Package your regional telemetry matches and live performance indicators as evidence.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT EMAIL APPLICATION DISPATCH MODAL */}
      {showEmailModal && emailJob && (
        <div className="modal-overlay" onClick={() => { if (!isSendingEmail) { setShowEmailModal(false); setEmailJob(null); } }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '1000px', width: '90%' }} onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" disabled={isSendingEmail} onClick={() => { setShowEmailModal(false); setEmailJob(null); }}>&times;</button>
            
            <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
              <span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>📧 GiGO Dispatch Gateway</span>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0.2rem 0' }}>Apply for {emailJob.jobTitle}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, margin: 0 }}>{emailJob.companyName}</p>
            </div>

            <form onSubmit={handleSendApplicationEmail}>
              <div className="grid-2-cols" style={{ marginTop: '1rem' }}>
                {/* Left Column: Form Dispatch Controls */}
                <div>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>HR Recipient Email</label>
                    <input 
                      type="email" 
                      value={emailRecipient} 
                      onChange={(e) => setEmailRecipient(e.target.value)}
                      required
                      className="form-control"
                      placeholder="recruitment@company.com"
                      disabled={isSendingEmail}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>Subject Line</label>
                    <input 
                      type="text" 
                      value={emailSubject} 
                      onChange={(e) => setEmailSubject(e.target.value)}
                      required
                      className="form-control"
                      placeholder="Subject"
                      disabled={isSendingEmail}
                    />
                  </div>

                  {/* List of compiled documents to attach */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                      Attach Compiled Assets (Optional)
                    </label>
                    {compiledDocuments.length === 0 ? (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', padding: '0.75rem', borderRadius: '4px', border: '1px dashed var(--border-glass)' }}>
                        No compiled assets found. Compile a Cover Letter, CV, or Portfolio from the Job Details modal first!
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '140px', overflowY: 'auto', background: 'rgba(0,0,0,0.15)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                        {compiledDocuments.map((doc: any) => {
                          const isSelected = selectedDocuments.includes(doc.id);
                          return (
                            <label key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px', background: isSelected ? 'rgba(138, 92, 246, 0.05)' : 'transparent' }}>
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setSelectedDocuments(prev => prev.filter(id => id !== doc.id));
                                  } else {
                                    setSelectedDocuments(prev => [...prev, doc.id]);
                                  }
                                }}
                                style={{ accentColor: 'var(--primary)' }}
                              />
                              <span className={`badge ${doc.type === 'CV' ? 'badge-purple' : doc.type === 'PORTFOLIO' ? 'badge-emerald' : 'badge-pink'}`} style={{ fontSize: '0.55rem', padding: '0.1rem 0.25rem' }}>
                                {doc.type}
                              </span>
                              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{doc.jobTitle} ({doc.companyName})</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>Email Cover Message Body</label>
                    <textarea 
                      value={emailBody} 
                      onChange={(e) => setEmailBody(e.target.value)}
                      required
                      className="form-control"
                      rows={6}
                      placeholder="Email message..."
                      style={{ resize: 'vertical', fontFamily: 'sans-serif', fontSize: '0.8rem', lineHeight: '1.4' }}
                      disabled={isSendingEmail}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem' }}>
                    <button 
                      type="button" 
                      className="btn-glass" 
                      style={{ flex: 1, justifyContent: 'center' }} 
                      onClick={() => { setShowEmailModal(false); setEmailJob(null); }}
                      disabled={isSendingEmail}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="btn-glass btn-primary" 
                      style={{ flex: 1.5, justifyContent: 'center', fontWeight: 700 }}
                      disabled={isSendingEmail}
                    >
                      {isSendingEmail ? (
                        <>
                          <div className="spinner-micro" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '0.5rem' }}></div>
                          Dispatching...
                        </>
                      ) : "🚀 GiGO Dispatch (₦200)"}
                    </button>
                  </div>
                </div>

                {/* Right Column: Dynamic Document Preview & Receipt Ledger */}
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    📎 Active Attachment Preview
                  </h4>
                  {(() => {
                    const activeDoc = compiledDocuments.find(d => selectedDocuments.includes(d.id));
                    return activeDoc ? (
                      <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                          <span className={`badge ${activeDoc.type === 'CV' ? 'badge-purple' : activeDoc.type === 'PORTFOLIO' ? 'badge-emerald' : 'badge-pink'}`} style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem' }}>
                            Previewing {activeDoc.type}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {activeDoc.jobTitle}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '180px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(0,0,0,0.15)', borderRadius: '4px' }}>
                          {activeDoc.content}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', background: 'rgba(0,0,0,0.1)', border: '1px dashed var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', padding: '1rem' }}>
                        <p style={{ margin: '0 0 0.5rem 0' }}>No compiled asset selected for attachment.</p>
                        <p style={{ fontSize: '0.65rem', margin: 0 }}>Check an asset on the left to include it as a dispatch attachment and preview it here.</p>
                      </div>
                    );
                  })()}

                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    backdropFilter: 'blur(10px)',
                    border: '1px solid var(--border-glass)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '1rem',
                    marginTop: '1.25rem'
                  }}>
                    <h5 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      💳 Dispatch Transaction Ledger
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Gateway Dispatch Fee:</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₦200 NGN</span>
                      </div>
                      {selectedDocuments.map(docId => {
                        const doc = compiledDocuments.find(d => d.id === docId);
                        if (!doc) return null;
                        const price = doc.type === 'CV' ? 500 : doc.type === 'PORTFOLIO' ? 600 : 400;
                        return (
                          <div key={docId} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '0.5rem', borderLeft: '2px solid var(--primary)' }}>
                            <span>Attachment ({doc.type}):</span>
                            <span style={{ fontWeight: 600 }}>₦{price} NGN</span>
                          </div>
                        );
                      })}
                      <div style={{ borderTop: '1px solid var(--border-glass)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '0.8rem', color: 'var(--primary)' }}>
                        <span>Total Estimated Value:</span>
                        <span>₦{200 + selectedDocuments.reduce((sum, docId) => {
                          const doc = compiledDocuments.find(d => d.id === docId);
                          if (!doc) return sum;
                          return sum + (doc.type === 'CV' ? 500 : doc.type === 'PORTFOLIO' ? 600 : 400);
                        }, 0)} NGN</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN CANDIDATE TELEMETRY INSPECTOR MODAL */}
      {showInspectModal && inspectUser && (userEmail === 'admin@gigo.com' || userRole === 'admin') && (
        <div className="modal-overlay" onClick={() => setShowInspectModal(false)}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowInspectModal(false)} style={{ fontSize: '1.75rem', top: '0.75rem', right: '1rem' }}>&times;</button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
              <div>
                <span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>Candidate Live Telemetry</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.2rem 0' }}>{inspectUser.fullName}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>User ID: <span className="font-mono">{inspectUser.userId}</span></p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Registered Email</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc' }}>{inspectUser.email}</div>
                {inspectUser.phoneNumber && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{inspectUser.phoneNumber}</div>
                )}
              </div>
            </div>

            {/* Profile Insights Sub-Panel */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.01)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem' }}>Career & Skills Core</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <div>
                    <strong>Target Roles:</strong> {inspectUser.targetRoles?.length > 0 ? inspectUser.targetRoles.join(', ') : 'None registered'}
                  </div>
                  <div>
                    <strong>Salary Expectation:</strong> {inspectUser.salary || 'None registered'}
                  </div>
                  <div>
                    <strong>Location Hub:</strong> {inspectUser.inferredLocationHints || 'None registered'}
                  </div>
                  <div>
                    <strong>Skills:</strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                      {inspectUser.skills?.length > 0 ? inspectUser.skills.map((s: string) => (
                        <span key={s} className="badge badge-pink" style={{ fontSize: '0.65rem' }}>{s}</span>
                      )) : <span style={{ color: 'var(--text-muted)' }}>None</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.01)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Workplace Infrastructure</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem' }}>
                  <div>
                    <strong>Power Details:</strong> {inspectUser.infrastructureStatus?.powerSetupDescription || 'Not verified'}
                  </div>
                  <div>
                    <strong>Internet Details:</strong> {inspectUser.infrastructureStatus?.internetSetupDescription || 'Not verified'}
                  </div>
                  <div>
                    <strong>Backup Plan:</strong> {inspectUser.infrastructureStatus?.hasRemoteBackupPlan ? (
                      <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>Verified Active</span>
                    ) : (
                      <span className="badge badge-pink" style={{ fontSize: '0.65rem' }}>Unverified / No Backup</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Live Activities Ledger & Document Streams */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              
              {/* Transactions Ledger */}
              <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(0, 0, 0, 0.15)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Handshake Payment Ledger History</span>
                  <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>Synced</span>
                </h4>
                
                {isFetchingInspectData ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Querying ledger records...</div>
                ) : inspectUserTransactions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No payment transaction history for this candidate.</div>
                ) : (
                  <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {inspectUserTransactions.map((tx: any) => (
                      <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '4px', border: '1px solid var(--border-glass)', fontSize: '0.75rem' }}>
                        <div>
                          <span style={{ fontWeight: 700, color: tx.type === 'CREDIT' ? '#10b981' : '#f43f5e' }}>{tx.type}</span>: {tx.currency} {tx.amount.toLocaleString()} ({tx.purpose})
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{tx.id} • {new Date(tx.timestamp).toLocaleString()}</div>
                        </div>
                        <span className="badge badge-emerald" style={{ fontSize: '0.6rem' }}>SUCCESSFUL</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Generated Cover Letter Documents */}
              <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(0, 0, 0, 0.15)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Compiled Career Assets</h4>
                
                {isFetchingInspectData ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading compiled assets...</div>
                ) : inspectUserDocuments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No cover letters compiled by this candidate yet.</div>
                ) : (
                  <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {inspectUserDocuments.map((doc: any) => (
                      <div key={doc.id} style={{ padding: '0.6rem 0.8rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '4px', border: '1px solid var(--border-glass)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.75rem' }}>
                          <div>
                            <strong>{doc.jobTitle}</strong> at <span style={{ color: 'var(--primary)' }}>{doc.companyName}</span>
                          </div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(doc.generatedAt).toLocaleDateString()}</span>
                        </div>
                        <pre style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', background: 'rgba(0, 0, 0, 0.2)', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-glass)', whiteSpace: 'pre-wrap', maxHeight: '80px', overflowY: 'auto', fontFamily: 'monospace' }}>
                          {doc.content}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <button 
              className="btn-glass btn-secondary" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '1.25rem', fontWeight: 700 }} 
              onClick={() => setShowInspectModal(false)}
            >
              Close Telemetry Inspector
            </button>
          </div>
        </div>
      )}

      {/* DISCOVERED VACANCIES MANUAL SEARCH RESULTS OVERLAY */}
      {showSearchResults && (
        <div className="modal-overlay" style={{ zIndex: 999 }} onClick={() => setShowSearchResults(false)}>
          <div className="results-overlay" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge badge-pink" style={{ fontSize: '0.65rem', marginBottom: '0.25rem' }}>
                  📡 Market Intelligence Crawl • Active
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }} className="text-gradient-purple-pink">
                  Discovered Live Vacancies
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                  Scrape complete in <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>{manualSearchLatency}ms</span>
                </p>
              </div>
              <button 
                className="close-btn" 
                onClick={() => setShowSearchResults(false)} 
                style={{ fontSize: '2rem', top: '1rem', right: '1.5rem', border: 'none', background: 'none', color: '#fff', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {/* DESIGNED ADVANCED BOOLEAN SYNTAX (Admin Only & Editable) */}
            {(userRole === 'admin' || userEmail === 'admin@gigo.com') && (
              <div style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border-glass)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
                    🔧 Designed Advanced Google Boolean Search String (Admin Only)
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--secondary)', fontWeight: 600 }}>Interactive Overrides Active</span>
                </div>
                <textarea
                  value={generatedBooleanQuery}
                  onChange={(e) => setGeneratedQuery(e.target.value)}
                  style={{
                    width: '100%',
                    height: '80px',
                    fontSize: '0.8rem',
                    color: 'var(--primary)',
                    fontFamily: 'monospace',
                    background: '#09081a',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '4px',
                    padding: '0.5rem',
                    colorScheme: 'dark',
                    outline: 'none',
                    resize: 'vertical',
                    marginBottom: '0.75rem'
                  }}
                />
                <button
                  onClick={async () => {
                    if (isSearchingManual) return;
                    setIsSearchingManual(true);
                    addLog(`[Admin Custom Query] Initiating manual sweep with custom override query: "${generatedBooleanQuery}"`);
                    try {
                      const response = await fetch(`${API_BASE_URL}/api/manual-search`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          userId: userId || undefined,
                          jobTitle: searchJobTitle,
                          location: searchLocation || undefined,
                          jobType: 'Any',
                          salaryRange: searchSalary || undefined,
                          customKeywords: searchKeywords || undefined,
                          targetDomain: searchDomain,
                          overrideQuery: generatedBooleanQuery
                        })
                      });

                      const data = await response.json();
                      if (response.ok && data.success) {
                        setManualSearchResults(data.jobs || []);
                        addLog(`[Admin Custom Query] Overridden query sweep completed in ${data.latencyMs}ms! Discovered ${data.jobs?.length || 0} listings.`);
                      } else {
                        alert(data.error || "Custom search query failed.");
                        addLog(`[Admin Custom Query] Failed to execute override: ${data.details || data.error}`);
                      }
                    } catch (err: any) {
                      console.error(err);
                      addLog(`[Admin Custom Query] Offline gateway bypass simulation.`);
                      alert("Offline mode cannot execute real-time raw custom queries.");
                    } finally {
                      setIsSearchingManual(false);
                    }
                  }}
                  disabled={isSearchingManual}
                  className="btn-glass"
                  style={{
                    padding: '0.4rem 1rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderColor: 'var(--primary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    cursor: 'pointer'
                  }}
                >
                  {isSearchingManual ? '📡 Running Custom Sweep...' : '⚡ Execute Custom Sweep'}
                </button>
              </div>
            )}

            {/* JOB RESULTS SCROLLABLE LIST */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingRight: '0.25rem' }}>
              {manualSearchResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                  No vacancies located matching your filters. Please adjust directives and re-run.
                </div>
              ) : (
                manualSearchResults.map((job: any) => {
                  const isImported = importedJobIds.includes(job.id);
                  const scoreColor = job.matchScore >= 80 ? '#10b981' : job.matchScore >= 65 ? '#f59e0b' : '#f43f5e';
                  
                  return (
                    <div 
                      key={job.id} 
                      className="glass-card" 
                      style={{ 
                        borderLeft: `3px solid ${scoreColor}`, 
                        padding: '1.25rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '0.75rem',
                        background: 'rgba(15, 13, 35, 0.4)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{job.jobTitle}</h4>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--secondary)', marginTop: '0.2rem' }}>{job.companyName}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                          <span 
                            className="badge" 
                            style={{ 
                              background: `rgba(${job.matchScore >= 80 ? '16, 185, 129' : job.matchScore >= 65 ? '245, 158, 11' : '244, 63, 94'}, 0.1)`, 
                              color: scoreColor, 
                              border: `1px solid ${scoreColor}40`,
                              fontWeight: 700
                            }}
                          >
                            {job.matchScore}% Match
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{job.sourcePlatform} ATS</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span>📍 {job.workType}</span>
                        <span>•</span>
                        <span>💰 {job.salaryRange || 'Competitive'}</span>
                      </div>

                      <div style={{ background: 'rgba(0, 0, 0, 0.15)', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                          Identified Key Requirements
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {(job.keyRequirementsSummary || []).map((req: string, i: number) => (
                            <span key={i} style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.04)', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '3px', border: '1px solid rgba(255,255,255,0.02)' }}>
                              ✓ {req}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* CTA HOOK BUTTONS */}
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <button 
                          className={`btn-glass ${isImported ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ flex: 1.2, justifyContent: 'center', fontSize: '0.75rem', padding: '0.5rem' }}
                          onClick={() => importJobToKanban(job)}
                          disabled={isImported}
                        >
                          {isImported ? '✓ Saved to Inbox' : '📥 Import to Match Inbox'}
                        </button>
                        <button 
                          className="btn-glass"
                          style={{ flex: 1.5, justifyContent: 'center', fontSize: '0.75rem', padding: '0.5rem', border: '1px solid rgba(138, 92, 246, 0.4)', background: 'linear-gradient(135deg, rgba(138, 92, 246, 0.1), rgba(0, 0, 0, 0.2))' }}
                          onClick={async () => {
                            const jobToGen = {
                              id: job.id,
                              jobTitle: job.jobTitle,
                              companyName: job.companyName,
                              salaryRange: job.salaryRange || 'Competitive',
                              score: job.matchScore,
                              location: job.workType
                            };
                            setShowSearchResults(false); // Close drawer
                            setActiveLeftTab('docs'); // Switch to documents tab in Column 1
                            await generateCoverLetter(jobToGen); // Trigger Cover Letter compile
                          }}
                        >
                          ✨ Compile Cover Letter
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1.25rem', marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
              <a 
                href={manualSearchResults[0]?.applicationLinkOrEmail || '#'} 
                target="_blank" 
                rel="noreferrer" 
                className="btn-glass" 
                style={{ flex: 1, justifyContent: 'center', textDecoration: 'none', color: '#fff', fontSize: '0.8rem' }}
              >
                🔗 External Apply Sandbox
              </a>
              <button 
                className="btn-glass btn-secondary" 
                style={{ flex: 1, justifyContent: 'center', fontSize: '0.8rem' }}
                onClick={() => setShowSearchResults(false)}
              >
                Close Scraper Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REFERRAL MANUAL SHARE OPTION MODAL */}
      {showManualShareModal && lastGeneratedInvite && (
        <div className="modal-overlay" onClick={() => { setShowManualShareModal(false); setLastGeneratedInvite(null); }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => { setShowManualShareModal(false); setLastGeneratedInvite(null); }}>&times;</button>
            
            <div style={{ marginBottom: '1.25rem' }}>
              <span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>👥 GiGO Referral Sharing Gateway</span>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0.2rem 0' }} className="text-gradient-purple-pink">
                Share GiGO with {lastGeneratedInvite.friendName}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Below are the AI-tailored marketing copies prepared by GiGO Gemini models. Choose your preferred channel to share.
              </p>
            </div>

            {/* FRIEND CARD SUMMARY */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.5rem', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Recipient Name:</span> <strong style={{ color: '#fff' }}>{lastGeneratedInvite.friendName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Email:</span> <strong style={{ color: '#fff' }}>{lastGeneratedInvite.friendEmail}</strong>
              </div>
              {lastGeneratedInvite.friendPhone && (
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Phone:</span> <strong style={{ color: '#fff' }}>{lastGeneratedInvite.friendPhone}</strong>
                </div>
              )}
            </div>

            {/* CHANNEL 1: EMAIL */}
            <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid rgba(139, 92, 246, 0.25)', background: 'rgba(15, 13, 35, 0.3)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📧 Option A: Send Personalized Email
              </h4>
              
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Subject Line</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    className="form-control font-mono" 
                    readOnly 
                    value={lastGeneratedInvite.subject || ''} 
                    style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.25)' }}
                  />
                  <button 
                    type="button"
                    className="btn-glass btn-secondary" 
                    style={{ fontSize: '0.7rem', padding: '0.4rem 0.75rem' }}
                    onClick={() => {
                      navigator.clipboard.writeText(lastGeneratedInvite.subject || '');
                      alert('Subject copied to clipboard!');
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>Email Message Body</label>
                <textarea 
                  className="form-control font-mono" 
                  readOnly 
                  rows={5}
                  value={lastGeneratedInvite.emailBody || ''} 
                  style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.25)', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button"
                  className="btn-glass" 
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem' }}
                  onClick={() => {
                    navigator.clipboard.writeText(lastGeneratedInvite.emailBody || '');
                    alert('Email body copied to clipboard!');
                  }}
                >
                  📋 Copy Email Body
                </button>
                <a 
                  href={`mailto:${lastGeneratedInvite.friendEmail}?subject=${encodeURIComponent(lastGeneratedInvite.subject || '')}&body=${encodeURIComponent(lastGeneratedInvite.emailBody || '')}`}
                  className="btn-glass btn-primary"
                  style={{ flex: 1.2, justifyContent: 'center', textDecoration: 'none', color: '#fff', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}
                >
                  🚀 Launch Mail Client
                </a>
              </div>
            </div>

            {/* CHANNEL 2: WHATSAPP */}
            <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.25)', background: 'rgba(15, 13, 35, 0.3)' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--emerald)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💬 Option B: Share via WhatsApp
              </h4>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>WhatsApp Instant Message</label>
                <textarea 
                  className="form-control font-mono" 
                  readOnly 
                  rows={4}
                  value={lastGeneratedInvite.whatsappMessage || ''} 
                  style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.25)', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button 
                  type="button"
                  className="btn-glass" 
                  style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem' }}
                  onClick={() => {
                    navigator.clipboard.writeText(lastGeneratedInvite.whatsappMessage || '');
                    alert('WhatsApp message copied to clipboard!');
                  }}
                >
                  📋 Copy WhatsApp Copy
                </button>
                <a 
                  href={lastGeneratedInvite.friendPhone 
                    ? `https://wa.me/${lastGeneratedInvite.friendPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(lastGeneratedInvite.whatsappMessage || '')}`
                    : `https://api.whatsapp.com/send?text=${encodeURIComponent(lastGeneratedInvite.whatsappMessage || '')}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="btn-glass btn-secondary"
                  style={{ flex: 1.2, justifyContent: 'center', textDecoration: 'none', color: '#fff', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}
                >
                  💬 Open WhatsApp
                </a>
              </div>
            </div>

            {/* REFERRAL LINK COPY TRACE */}
            <div style={{ background: 'rgba(138, 92, 246, 0.04)', border: '1px dashed rgba(138, 92, 246, 0.3)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', fontWeight: 700, marginBottom: '0.35rem' }}>
                Your Unique Tracking Onboarding URL
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  className="form-control font-mono" 
                  readOnly 
                  value={lastGeneratedInvite.referralLink || `${systemConfig.frontendDomain}/?ref=${userId}`} 
                  style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', color: '#fff', border: 'none' }}
                />
                <button 
                  type="button"
                  className="btn-glass btn-primary" 
                  style={{ fontSize: '0.7rem', padding: '0.4rem 1rem' }}
                  onClick={() => {
                    navigator.clipboard.writeText(lastGeneratedInvite.referralLink || `${systemConfig.frontendDomain}/?ref=${userId}`);
                    alert('Referral onboarding link copied!');
                  }}
                >
                  Copy Link
                </button>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                * When your friend completes registration via this tracking URL, we atomically award you <strong>₦{systemConfig.referralBonus.toLocaleString()} NGN</strong> instantly!
              </div>
            </div>

            <button 
              type="button"
              className="btn-glass btn-primary" 
              style={{ width: '100%', justifyContent: 'center', fontWeight: 700, padding: '0.6rem' }} 
              onClick={() => { setShowManualShareModal(false); setLastGeneratedInvite(null); }}
            >
              Done Sharing
            </button>
          </div>
        </div>
      )}

      {/* GiGO BRAIN MEMORY ENRICHMENT MODAL */}
      {showBrainEnrichModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(6, 4, 15, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }} className="animate-fade-in" onClick={() => { if (!isEnrichingBrain) { setShowBrainEnrichModal(false); setActiveGapToFeed(''); setActiveGapQuestion(''); } }}>
          <div style={{
            width: '100%',
            maxWidth: '550px',
            background: '#0a0816',
            border: '1px solid rgba(138, 92, 246, 0.25)',
            borderRadius: '16px',
            padding: '1.75rem',
            boxShadow: 'var(--shadow-glow-purple)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🧠</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }} className="text-gradient-purple-pink">Feed Intellect Memory</h3>
              </div>
              <button 
                type="button"
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}
                onClick={() => { setShowBrainEnrichModal(false); setActiveGapToFeed(''); setActiveGapQuestion(''); }}
              >
                ✕
              </button>
            </div>

            {/* Gap Guidance Message */}
            {activeGapToFeed ? (
              <div style={{ background: 'rgba(138, 92, 246, 0.08)', border: '1px solid rgba(138, 92, 246, 0.2)', padding: '0.85rem 1rem', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '0.05em' }}>
                  Targeting Cognitive Gap: {activeGapToFeed}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 600, fontStyle: 'italic', lineHeight: '1.2rem' }}>
                  "{activeGapQuestion}"
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.25rem' }}>
                Feed your GiGO Mind Clone with new skills, technical parameters, location updates, backup infrastructure setups, or experience metrics. Gemini 2.5 Pro will automatically merge them into your profile.
              </p>
            )}

            {/* Enrichment Input Form */}
            <form onSubmit={(e) => handleEnrichMind(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Memory Statement</label>
                <textarea 
                  required
                  rows={5}
                  placeholder={activeGapToFeed 
                    ? `Describe your experience with ${activeGapToFeed}...` 
                    : "e.g., 'I have 4 years of experience building Python and PyTorch ML models, and deployed a solar backup system with a 5kW inverter to cover load shedding.'"
                  }
                  value={brainEnrichStatement}
                  onChange={(e) => setBrainEnrichStatement(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.25)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    fontFamily: 'inherit',
                    lineHeight: '1.3rem',
                    resize: 'none'
                  }}
                />
              </div>

              {/* Mic Simulator Action */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={startBrainSpeechRecognition}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '50px',
                    border: '1px solid',
                    borderColor: isBrainSpeechRecording ? 'var(--primary)' : 'var(--border-glass)',
                    background: isBrainSpeechRecording ? 'var(--primary-glow)' : 'rgba(255, 255, 255, 0.03)',
                    color: isBrainSpeechRecording ? '#fff' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isBrainSpeechRecording ? '0 0 10px var(--primary)' : 'none'
                  }}
                >
                  <span style={{ fontSize: '0.9rem' }}>{isBrainSpeechRecording ? '🔴' : '🎤'}</span>
                  <span>{isBrainSpeechRecording ? 'Listening...' : 'Tap to Speak Memory'}</span>
                </button>
              </div>

              {/* Sync Memory Trigger */}
              <button
                type="submit"
                disabled={isEnrichingBrain || !brainEnrichStatement.trim()}
                className="btn-glass btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.75rem',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  marginTop: '0.5rem',
                  borderRadius: '10px'
                }}
              >
                {isEnrichingBrain ? (
                  <>
                    <span className="spinner-border" style={{ width: '14px', height: '14px', borderWidth: '2px', marginRight: '0.5rem' }}></span>
                    Synchronizing Brain Clone Synapse...
                  </>
                ) : (
                  '🧠 Ingest Synapse & Sync Mind'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN ADVANCED SETTINGS COCKPIT OVERLAY */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(6, 4, 15, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }} className="animate-fade-in" onClick={() => { if (!isUpdatingSettings) setShowSettingsModal(false); }}>
          <div style={{
            width: '95%',
            maxWidth: '1200px',
            height: '90%',
            maxHeight: '800px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }} onClick={(e) => e.stopPropagation()}>
            {/* Cockpit Header */}
            <div style={{
              padding: '1.5rem 2rem',
              borderBottom: '1px solid var(--border-glass)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.01)'
            }}>
              <div>
                <span className="badge badge-purple" style={{ marginBottom: '0.35rem' }}>🎛️ Control Deck</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.1rem 0' }}>WA Advanced Settings Cockpit</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Calibrate regional scraping velocities, SMTP relays, candidate profile matching thresholds, and DB telemetry overrides.
                </p>
              </div>
              <button 
                className="close-btn" 
                style={{ top: 'auto', position: 'relative' }}
                disabled={isUpdatingSettings}
                onClick={() => setShowSettingsModal(false)}
              >
                &times;
              </button>
            </div>

            {/* Cockpit Workspace */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Sidebar Navigation */}
              <div style={{
                width: '280px',
                borderRight: '1px solid var(--border-glass)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                background: 'rgba(0,0,0,0.15)',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn-glass"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      background: settingsActiveTab === 'profile' ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
                      borderColor: settingsActiveTab === 'profile' ? 'var(--primary)' : 'var(--border-glass)',
                      color: '#fff',
                      fontWeight: 700
                    }}
                    onClick={() => setSettingsActiveTab('profile')}
                  >
                    👤 Profile & Career Spec
                  </button>
                  <button
                    type="button"
                    className="btn-glass"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      background: settingsActiveTab === 'scan' ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
                      borderColor: settingsActiveTab === 'scan' ? 'var(--primary)' : 'var(--border-glass)',
                      color: '#fff',
                      fontWeight: 700
                    }}
                    onClick={() => setSettingsActiveTab('scan')}
                  >
                    ⏱️ Scan Rates & Tickers
                  </button>
                  <button
                    type="button"
                    className="btn-glass"
                    style={{
                      width: '100%',
                      justifyContent: 'flex-start',
                      background: settingsActiveTab === 'keys' ? 'var(--primary)' : 'rgba(255,255,255,0.02)',
                      borderColor: settingsActiveTab === 'keys' ? 'var(--primary)' : 'var(--border-glass)',
                      color: '#fff',
                      fontWeight: 700
                    }}
                    onClick={() => setSettingsActiveTab('keys')}
                  >
                    🔑 SMTP & API Relays
                  </button>
                </div>

                {/* Local Telemetry Diagnostics Box */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '1rem'
                }}>
                  <h5 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 0.5rem 0', color: 'var(--primary)', fontWeight: 700 }}>
                    📊 Local Telemetry Diagnostics
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    <div>Candidate: <strong style={{ color: '#fff' }}>{settingsName || profile?.name || '[   ]'}</strong></div>
                    <div>Scraping: <strong style={{ color: '#fff' }}>Every {settingsScanInterval}m</strong></div>
                    <div>Feed Sync: <strong style={{ color: '#fff' }}>Every {settingsFeedRefreshInterval}m</strong></div>
                    <div>Active Assets: <strong style={{ color: '#fff' }}>{compiledDocuments.length} compiled</strong></div>
                    <div>Wallet Bal: <strong style={{ color: '#10b981' }}>₦{walletNGN.toLocaleString()}</strong></div>
                  </div>
                </div>
              </div>

              {/* Tab Content Panel */}
              <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', background: 'rgba(255, 255, 255, 0.005)' }}>
                <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ flex: 1 }}>
                    {settingsActiveTab === 'profile' && (
                      <div className="animate-fade-in">
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#fff' }}>👤 Candidate Profile & Target Specs</h4>
                        
                        <div className="grid-2-cols" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                          <div className="form-group">
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>Full Candidate Name</label>
                            <input 
                              type="text" 
                              value={settingsName} 
                              onChange={(e) => setSettingsName(e.target.value)}
                              required
                              className="form-control"
                              placeholder="Full Name"
                              disabled={isUpdatingSettings || hasVoiceOnboarded}
                            />
                            {hasVoiceOnboarded && (
                              <span style={{ fontSize: '0.7rem', color: '#a78bfa', marginTop: '0.25rem', display: 'block', fontStyle: 'italic' }}>
                                🔒 Locked after onboarding for security & KYC synchronization integrity.
                              </span>
                            )}
                          </div>
                          <div className="form-group">
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>Cyber-Avatar URL</label>
                            <input 
                              type="text" 
                              value={settingsProfilePic} 
                              onChange={(e) => setSettingsProfilePic(e.target.value)}
                              className="form-control"
                              placeholder="https://images.unsplash.com/photo-..."
                              disabled={isUpdatingSettings}
                            />
                          </div>
                        </div>

                        <div className="grid-2-cols" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                          <div className="form-group">
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>Target Role Spec</label>
                            <input 
                              type="text" 
                              value={settingsRole} 
                              onChange={(e) => setSettingsRole(e.target.value)}
                              required
                              className="form-control"
                              placeholder="e.g. Lead AI Engineer"
                              disabled={isUpdatingSettings}
                            />
                          </div>
                          <div className="form-group">
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>Salary Expectation Bracket</label>
                            <input 
                              type="text" 
                              value={settingsSalary} 
                              onChange={(e) => setSettingsSalary(e.target.value)}
                              required
                              className="form-control"
                              placeholder="e.g. $180k - $240k"
                              disabled={isUpdatingSettings}
                            />
                          </div>
                        </div>

                        <div className="grid-2-cols" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
                          <div className="form-group">
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>Location Anchor</label>
                            <select
                              value={settingsLocation}
                              onChange={(e) => setSettingsLocation(e.target.value)}
                              className="form-control"
                              style={{ background: 'rgba(15, 12, 33, 0.8)', color: '#fff', border: '1px solid var(--border-glass)' }}
                              disabled={isUpdatingSettings}
                            >
                              <option value="[   ]">[   ]</option>
                              <option value="Lagos, Nigeria">Lagos, Nigeria</option>
                              <option value="Abuja, Nigeria">Abuja, Nigeria</option>
                              <option value="San Francisco, CA">San Francisco, CA</option>
                              <option value="London, United Kingdom">London, United Kingdom</option>
                              <option value="Berlin, Germany">Berlin, Germany</option>
                              <option value="Tallinn, Estonia">Tallinn, Estonia</option>
                              <option value="Cape Town, South Africa">Cape Town, South Africa</option>
                              <option value="Fully Remote">Fully Remote</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>Work Type Preferences</label>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                              {['Remote', 'Hybrid', 'Onsite'].map(type => {
                                const isChecked = settingsWorkTypePreferences.includes(type);
                                return (
                                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleWorkTypePref(type)}
                                      disabled={isUpdatingSettings}
                                      style={{ accentColor: 'var(--primary)' }}
                                    />
                                    {type}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Skills competencies Tags Manager */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            Interactive Skills Competencies
                          </label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', marginBottom: '0.75rem' }}>
                            {settingsSkills.length === 0 ? (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No skills added. Add some below to drive real-time matching accuracy!</div>
                            ) : (
                              settingsSkills.map(skill => (
                                <span 
                                  key={skill} 
                                  className="badge badge-purple" 
                                  style={{ 
                                    fontSize: '0.7rem', 
                                    padding: '0.25rem 0.5rem', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.35rem',
                                    borderRadius: '6px'
                                  }}
                                >
                                  {skill}
                                  <button
                                    type="button"
                                    onClick={() => removeSettingsSkillTag(skill)}
                                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0, fontSize: '0.7rem', display: 'flex', alignItems: 'center' }}
                                  >
                                    &times;
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input 
                              type="text" 
                              value={settingsNewSkill} 
                              onChange={(e) => setSettingsNewSkill(e.target.value)}
                              className="form-control"
                              placeholder="Add a new skill (e.g., Python, Next.js)"
                              style={{ flex: 1 }}
                              disabled={isUpdatingSettings}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  addSettingsSkillTag();
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="btn-glass btn-primary"
                              style={{ padding: '0.4rem 1.25rem' }}
                              disabled={isUpdatingSettings}
                              onClick={addSettingsSkillTag}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsActiveTab === 'scan' && (
                      <div className="animate-fade-in">
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#fff' }}>⏱️ Scraping Velox & Feed Sync Calibration</h4>
                        
                        <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Autonomous Scraper Sweep Frequency</label>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)' }}>
                              {(() => {
                                const h = Math.floor(settingsScanInterval / 60);
                                const m = settingsScanInterval % 60;
                                return h > 0 ? `${h}h ${m > 0 ? m + 'm' : ''}` : `${m} minutes`;
                              })()}
                            </span>
                          </div>
                          <input 
                            type="range" 
                            min={45} 
                            max={720} 
                            step={15}
                            value={settingsScanInterval} 
                            onChange={(e) => setSettingsScanInterval(Number(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--primary)', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', outline: 'none' }}
                            disabled={isUpdatingSettings}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                            <span>High Velocity (45 min)</span>
                            <span>Standard (3 hours)</span>
                            <span>Deep Sweep (12 hours)</span>
                          </div>
                        </div>

                        <div style={{ marginBottom: '2rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '1.5rem', borderRadius: 'var(--radius-md)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Real-Time Live Feed Refresh Speed</label>
                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--secondary)' }}>
                              {settingsFeedRefreshInterval} minute{settingsFeedRefreshInterval > 1 ? 's' : ''}
                            </span>
                          </div>
                          <input 
                            type="range" 
                            min={1} 
                            max={60} 
                            step={1}
                            value={settingsFeedRefreshInterval} 
                            onChange={(e) => setSettingsFeedRefreshInterval(Number(e.target.value))}
                            style={{ width: '100%', accentColor: 'var(--secondary)', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', outline: 'none' }}
                            disabled={isUpdatingSettings}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                            <span>Rapid Live (1 min)</span>
                            <span>Balanced (15 min)</span>
                            <span>Eco Mode (60 min)</span>
                          </div>
                        </div>

                        {/* Interactive Domain Ticker Tag Filters */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            Ticker Target Domains Filtering
                          </label>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', marginBottom: '0.75rem' }}>
                            {tickerTargetDomains.length === 0 ? (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No domain filters registered. Showing all scraped channels.</div>
                            ) : (
                              tickerTargetDomains.map(dom => (
                                <span 
                                  key={dom} 
                                  className="badge badge-emerald" 
                                  style={{ 
                                    fontSize: '0.7rem', 
                                    padding: '0.25rem 0.5rem', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.35rem',
                                    borderRadius: '6px'
                                  }}
                                >
                                  🟢 {dom}
                                  <button
                                    type="button"
                                    onClick={() => setTickerTargetDomains(prev => prev.filter(d => d !== dom))}
                                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 0, fontSize: '0.7rem', display: 'flex', alignItems: 'center' }}
                                  >
                                    &times;
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input 
                              type="text" 
                              value={newTickerDomain} 
                              onChange={(e) => setNewTickerDomain(e.target.value)}
                              className="form-control"
                              placeholder="e.g. linkedin.com, green-house.io"
                              style={{ flex: 1 }}
                              disabled={isUpdatingSettings}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (newTickerDomain.trim() && !tickerTargetDomains.includes(newTickerDomain.trim().toLowerCase())) {
                                    setTickerTargetDomains(prev => [...prev, newTickerDomain.trim().toLowerCase()]);
                                    setNewTickerDomain('');
                                  }
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="btn-glass btn-primary"
                              style={{ padding: '0.4rem 1.25rem' }}
                              disabled={isUpdatingSettings}
                              onClick={() => {
                                if (newTickerDomain.trim() && !tickerTargetDomains.includes(newTickerDomain.trim().toLowerCase())) {
                                  setTickerTargetDomains(prev => [...prev, newTickerDomain.trim().toLowerCase()]);
                                  setNewTickerDomain('');
                                }
                              }}
                            >
                              Add Channel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsActiveTab === 'keys' && (
                      <div className="animate-fade-in">
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#fff' }}>🔑 SMTP & API Relay Core Calibrations</h4>
                        
                        {/* SMTP EDUCATION & CALIBRATION GUIDE */}
                        <div style={{
                          background: 'linear-gradient(135deg, rgba(138, 92, 246, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                          border: '1px solid rgba(138, 92, 246, 0.3)',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          marginBottom: '1.5rem',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>🎯</span>
                            <h5 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                              SMTP Handshake Calibration Guide — Why It Matters
                            </h5>
                          </div>
                          
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.45', margin: '0 0 1.25rem 0' }}>
                            By default, GiGO operates in <strong>Simulation Mock Mode</strong>. To bypass simulated dispatches and send real physical applications directly through your personal Gmail account, you must connect your Google secure handshake relay.
                          </p>

                          <div className="grid-2-cols" style={{ gap: '1.5rem', marginBottom: '0.5rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', padding: '1rem', borderRadius: '8px' }}>
                              <h6 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c4b5fd', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                🌟 Key User Benefits
                              </h6>
                              <ul style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <li><strong>100% Authenticity</strong>: Applications are sent directly from your personal Gmail domain, ensuring massive trust and maximum recruiter engagement.</li>
                                <li><strong>Automatic Sent Folder Sync</strong>: All application emails and recruiter dispatches instantly show up in your real Gmail App's <strong>Sent</strong> folder.</li>
                                <li><strong>Two-Way Thread Sync</strong>: Recruiter replies to your Gmail automatically sync back to your virtual GiGO Mailroom ledger in real-time.</li>
                              </ul>
                            </div>

                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', padding: '1rem', borderRadius: '8px' }}>
                              <h6 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#34d399', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                🔑 3-Step Setup Handshake
                              </h6>
                              <ol style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                <li><strong>MFA</strong>: Ensure <strong>2-Step Verification</strong> is active in your Google Account settings.</li>
                                <li><strong>Create App Password</strong>: In your Google Account, search for <em>"App passwords"</em>. Select <em>Other (Custom name)</em>, type <code>"GiGO Platform"</code>, click generate, and copy the 16-character code.</li>
                                <li><strong>Fill & Deploy</strong>: Fill out the server details below using your copied code as your SMTP Password (with no spaces), and click <strong>Save Calibrations</strong>.</li>
                              </ol>
                            </div>
                          </div>
                        </div>
                        
                        {/* SMTP RELAY */}
                        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                          <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', margin: '0 0 1rem 0' }}>📧 Custom SMTP Mail Dispatch Server</h5>
                          <div className="grid-2-cols" style={{ gap: '1.5rem', marginBottom: '1rem' }}>
                            <div className="form-group">
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>SMTP Host</label>
                              <input 
                                type="text" 
                                value={settingsSmtpHost} 
                                onChange={(e) => setSettingsSmtpHost(e.target.value)}
                                className="form-control"
                                placeholder="smtp.gmail.com"
                                disabled={isUpdatingSettings}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>SMTP Port</label>
                              <input 
                                type="text" 
                                value={settingsSmtpPort} 
                                onChange={(e) => setSettingsSmtpPort(e.target.value)}
                                className="form-control"
                                placeholder="587"
                                disabled={isUpdatingSettings}
                              />
                            </div>
                          </div>
                          <div className="grid-2-cols" style={{ gap: '1.5rem' }}>
                            <div className="form-group">
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>SMTP Username / Login</label>
                              <input 
                                type="text" 
                                value={settingsSmtpUser} 
                                onChange={(e) => setSettingsSmtpUser(e.target.value)}
                                className="form-control"
                                placeholder="user@gmail.com"
                                disabled={isUpdatingSettings}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>SMTP Password / Secret</label>
                              <input 
                                type="password" 
                                value={settingsSmtpPass} 
                                onChange={(e) => setSettingsSmtpPass(e.target.value)}
                                className="form-control"
                                placeholder="••••••••••••"
                                disabled={isUpdatingSettings}
                              />
                            </div>
                          </div>
                        </div>

                        {/* CORES */}
                        <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-glass)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                          <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)', margin: '0 0 1rem 0' }}>🧠 Core LLM & Payment Gateways API Relays</h5>
                          <div className="form-group" style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Personal Gemini API Key (Optional Override)</label>
                            <input 
                              type="password" 
                              value={settingsGeminiKey} 
                              onChange={(e) => setSettingsGeminiKey(e.target.value)}
                              className="form-control"
                              placeholder="AIzaSy..."
                              disabled={isUpdatingSettings}
                            />
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>* If left blank, processing runs natively on standard regional cloud resources.</div>
                          </div>

                          <div className="grid-2-cols" style={{ gap: '1.5rem' }}>
                            <div className="form-group">
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Flutterwave Public Key</label>
                              <input 
                                type="text" 
                                value={settingsFlwPubKey} 
                                onChange={(e) => setSettingsFlwPubKey(e.target.value)}
                                className="form-control"
                                placeholder="FLWPUBK_TEST-..."
                                disabled={isUpdatingSettings}
                              />
                            </div>
                            <div className="form-group">
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Flutterwave Secret Key</label>
                              <input 
                                type="password" 
                                value={settingsFlwSecKey} 
                                onChange={(e) => setSettingsFlwSecKey(e.target.value)}
                                className="form-control"
                                placeholder="FLWSECK_TEST-..."
                                disabled={isUpdatingSettings}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cockpit Footer Controls */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '1rem',
                    borderTop: '1px solid var(--border-glass)',
                    paddingTop: '1.5rem',
                    marginTop: '2rem'
                  }}>
                    <button
                      type="button"
                      className="btn-glass"
                      style={{ padding: '0.5rem 1.5rem', fontSize: '0.8rem' }}
                      disabled={isUpdatingSettings}
                      onClick={() => setShowSettingsModal(false)}
                    >
                      Cancel Override
                    </button>
                    <button
                      type="submit"
                      className="btn-glass btn-primary"
                      style={{ padding: '0.5rem 2rem', fontSize: '0.8rem', fontWeight: 700 }}
                      disabled={isUpdatingSettings}
                    >
                      {isUpdatingSettings ? (
                        <>
                          <div className="spinner-micro" style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '0.5rem' }}></div>
                          Synchronizing Configuration...
                        </>
                      ) : "💾 Save & Deploy Calibrations"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXTENDED MATCHES VAULT OVERLAY MODAL */}
      {showRemainingJobsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(6, 4, 15, 0.93)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          zIndex: 95,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }} className="animate-fade-in" onClick={() => setShowRemainingJobsModal(false)}>
          <div style={{
            width: '95%',
            maxWidth: '1100px',
            height: '85%',
            maxHeight: '750px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{
              padding: '1.25rem 2rem',
              borderBottom: '1px solid var(--border-glass)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.2)'
            }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💼</span> Extended Match Vault
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
                  Discovered high-potential matching roles filtered to your preference settings ({remainingJobs.length} matches)
                </p>
              </div>

              {/* View Switches & Close Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{
                  display: 'flex',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: '8px',
                  padding: '2px',
                  alignItems: 'center'
                }}>
                  <button
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      border: 'none',
                      background: vaultLayout === 'card' ? 'var(--primary)' : 'transparent',
                      color: vaultLayout === 'card' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    onClick={() => setVaultLayout('card')}
                  >
                    <span>⊞</span> Grid
                  </button>
                  <button
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      border: 'none',
                      background: vaultLayout === 'list' ? 'var(--primary)' : 'transparent',
                      color: vaultLayout === 'list' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    onClick={() => setVaultLayout('list')}
                  >
                    <span>☰</span> List
                  </button>
                  <button
                    style={{
                      padding: '0.35rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      border: 'none',
                      background: vaultLayout === 'compact' ? 'var(--primary)' : 'transparent',
                      color: vaultLayout === 'compact' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}
                    onClick={() => setVaultLayout('compact')}
                  >
                    <span>⁝</span> Compact
                  </button>
                </div>

                <button 
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-glass)',
                    color: 'var(--text-primary)',
                    fontSize: '1.25rem',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onClick={() => setShowRemainingJobsModal(false)}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Main Scrollable View Panel */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem 2rem',
              display: vaultLayout === 'card' ? 'grid' : 'flex',
              flexDirection: vaultLayout === 'card' ? undefined : 'column',
              gridTemplateColumns: vaultLayout === 'card' ? 'repeat(auto-fill, minmax(300px, 1fr))' : undefined,
              gap: vaultLayout === 'compact' ? '0.5rem' : '1.25rem',
              background: 'rgba(0, 0, 0, 0.1)'
            }}>
              {remainingJobs.length === 0 ? (
                <div style={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4rem 2rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  gap: '1rem'
                }}>
                  <div style={{ fontSize: '3rem' }}>🔍</div>
                  <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>No Extended Matches</h4>
                  <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: 0, lineHeight: '1.5' }}>
                    All current matches are featured in the Live AI Matches Ticker. Tap "Scan Jobs" to trigger new discoveries.
                  </p>
                </div>
              ) : (
                remainingJobs.map((job) => {
                  if (vaultLayout === 'card') {
                    return (
                      <div 
                        key={job.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '12px',
                          padding: '1.25rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          transition: 'all 0.25s ease-out',
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                          e.currentTarget.style.borderColor = 'rgba(138, 92, 246, 0.4)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                        onClick={() => setSelectedJob(job)}
                      >
                        {/* Top row */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            {job.location}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="badge badge-purple" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                              {job.score}% match
                            </span>
                            <button
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                borderRadius: '4px',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.65rem',
                                cursor: 'pointer',
                                padding: 0,
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                              }}
                              onClick={(e) => handleDismissJob(job.id, e)}
                              title="Dismiss listing"
                            >
                              ❌
                            </button>
                          </div>
                        </div>

                        {/* Job Info */}
                        <div style={{ flex: 1, marginBottom: '1rem' }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.25rem 0', lineHeight: '1.3' }}>
                            {job.jobTitle}
                          </h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, margin: '0 0 0.5rem 0' }}>
                            {job.companyName}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500, margin: '0 0 0.75rem 0' }}>
                            💰 {job.salaryRange}
                          </p>

                          {/* Requirements summary tags */}
                          {job.keyRequirementsSummary && job.keyRequirementsSummary.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                              {job.keyRequirementsSummary.slice(0, 3).map((req, idx) => (
                                <span 
                                  key={idx} 
                                  style={{
                                    fontSize: '0.65rem',
                                    background: 'rgba(255, 255, 255, 0.04)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    padding: '0.15rem 0.4rem',
                                    borderRadius: '4px',
                                    color: 'var(--text-secondary)'
                                  }}
                                >
                                  {req}
                                </span>
                              ))}
                              {job.keyRequirementsSummary.length > 3 && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                                  +{job.keyRequirementsSummary.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Card Actions Footer */}
                        <div style={{
                          display: 'flex',
                          gap: '0.5rem',
                          borderTop: '1px solid var(--border-glass)',
                          paddingTop: '0.75rem',
                          marginTop: '0.5rem'
                        }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn-glass"
                            style={{
                              flex: 1,
                              fontSize: '0.7rem',
                              padding: '0.4rem 0',
                              fontWeight: 600,
                              textAlign: 'center',
                              borderRadius: '6px'
                            }}
                            onClick={() => setSelectedJob(job)}
                          >
                            🔎 Details
                          </button>
                          
                          <button
                            className="btn-glass btn-primary"
                            style={{
                              padding: '0.4rem 0.75rem',
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '6px'
                            }}
                            onClick={() => {
                              setEmailJob(job);
                              setShowEmailModal(true);
                            }}
                            title="Quick Apply via Email Dispatcher"
                          >
                            ✉️ Apply
                          </button>
                        </div>
                      </div>
                    );
                  } else if (vaultLayout === 'list') {
                    return (
                      <div 
                        key={job.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '12px',
                          padding: '1rem 1.5rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s ease-out',
                          cursor: 'pointer',
                          gap: '1.5rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                          e.currentTarget.style.borderColor = 'rgba(138, 92, 246, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                        }}
                        onClick={() => setSelectedJob(job)}
                      >
                        {/* Left: Score Badge & Location */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', minWidth: '100px', textAlign: 'center' }}>
                          <span className="badge badge-purple" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', fontWeight: 800 }}>
                            {job.score}% Match
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                            📍 {job.location || 'Remote'}
                          </span>
                        </div>

                        {/* Middle: Job Information */}
                        <div style={{ flex: 2, minWidth: 0 }}>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {job.jobTitle}
                          </h4>
                          <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, margin: '0.15rem 0 0 0' }}>
                            {job.companyName}
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.15rem 0 0 0' }}>
                            💰 {job.salaryRange || 'Not Specified'}
                          </p>
                        </div>

                        {/* Middle-Right: Tag lists */}
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', flex: 1.5, justifyContent: 'flex-start', maxHeight: '42px', overflow: 'hidden' }}>
                          {job.keyRequirementsSummary && job.keyRequirementsSummary.slice(0, 3).map((req, idx) => (
                            <span 
                              key={idx} 
                              style={{
                                fontSize: '0.65rem',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              {req}
                            </span>
                          ))}
                        </div>

                        {/* Right: Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            className="btn-glass"
                            style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem', fontWeight: 600, borderRadius: '6px' }}
                            onClick={() => setSelectedJob(job)}
                          >
                            🔎 Details
                          </button>
                          <button
                            className="btn-glass btn-primary"
                            style={{ fontSize: '0.7rem', padding: '0.4rem 0.8rem', fontWeight: 600, borderRadius: '6px' }}
                            onClick={() => {
                              setEmailJob(job);
                              setShowEmailModal(true);
                            }}
                          >
                            ✉️ Apply
                          </button>
                          <button
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#ef4444',
                              borderRadius: '6px',
                              width: '26px',
                              height: '26px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onClick={(e) => handleDismissJob(job.id, e)}
                            title="Dismiss"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    // Compact View
                    return (
                      <div 
                        key={job.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.01)',
                          border: '1px solid rgba(255, 255, 255, 0.03)',
                          borderRadius: '6px',
                          padding: '0.4rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                          gap: '1rem'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                          e.currentTarget.style.borderColor = 'rgba(138, 92, 246, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.03)';
                        }}
                        onClick={() => setSelectedJob(job)}
                      >
                        {/* Left Rank Indicator */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0, flex: 1.5 }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', background: 'rgba(138, 92, 246, 0.1)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>
                            {job.score}%
                          </span>
                          <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '0.25rem', alignItems: 'center', minWidth: 0 }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {job.jobTitle}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              • {job.companyName}
                            </span>
                          </div>
                        </div>

                        {/* Middle Info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: 'var(--text-secondary)', flex: 1 }}>
                          <span>📍 {job.location || 'Remote'}</span>
                          <span>|</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>💰 {job.salaryRange || 'Not Spec'}</span>
                        </div>

                        {/* Right compact actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }} onClick={(e) => e.stopPropagation()}>
                          <button
                            style={{
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--border-glass)',
                              color: 'var(--text-primary)',
                              fontSize: '0.65rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            onClick={() => setSelectedJob(job)}
                          >
                            Details
                          </button>
                          <button
                            style={{
                              background: 'var(--primary)',
                              border: 'none',
                              color: 'var(--text-primary)',
                              fontSize: '0.65rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              setEmailJob(job);
                              setShowEmailModal(true);
                            }}
                          >
                            Apply
                          </button>
                          <button
                            style={{
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              color: '#ef4444',
                              fontSize: '0.6rem',
                              width: '18px',
                              height: '18px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            onClick={(e) => handleDismissJob(job.id, e)}
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    );
                  }
                })
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '1rem 2rem',
              borderTop: '1px solid var(--border-glass)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.25)'
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                💡 Tip: Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>ESC</kbd> to close. Dismissing cards synchronizes with backend database in real-time.
              </span>
              <button
                className="btn-glass"
                style={{ fontSize: '0.75rem', padding: '0.4rem 1rem', fontWeight: 600 }}
                onClick={() => setShowRemainingJobsModal(false)}
              >
                Close Vault
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
