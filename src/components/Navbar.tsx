import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Shield,
  ShieldCheck,
  Lock,
  Search,
  ChevronDown,
  LayoutDashboard,
  Clock,
  AlertTriangle,
  FileUp,
  History,
  Stethoscope,
  FilePlus,
  Activity,
  Menu,
  X,
  ArrowRight,
  User,
  Check,
  Building2,
  Sparkles,
  Command,
  FileText,
  RotateCcw,
  KeyRound,
  ExternalLink,
  Pill,
  CheckCircle2
} from 'lucide-react';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { currentUser, allUsers, switchUser } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCommandSearch, setShowCommandSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [activeGrantId, setActiveGrantId] = useState<string>('grant-1792166349001');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Poll for active clinical grant once on mount
  useEffect(() => {
    fetch('/api/clinic/dashboard')
      .then(res => res.json())
      .then(data => {
        if (data.activeGrants && data.activeGrants.length > 0) {
          setActiveGrantId(data.activeGrants[data.activeGrants.length - 1].id);
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Command+K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandSearch(prev => !prev);
      } else if (e.key === 'Escape') {
        setShowCommandSearch(false);
        setShowUserDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto focus search input when opened
  useEffect(() => {
    if (showCommandSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [showCommandSearch]);

  const isMarketingPage =
    currentPath === '/' ||
    currentPath === '/how-it-works' ||
    currentPath === '/features' ||
    currentPath === '/for-clinics' ||
    currentPath === '/faq';

  // Quick navigation items for search command palette
  const searchableItems = [
    {
      title: 'Documentation Discrepancies (1 Flagged)',
      subtitle: 'Penicillin allergy conflict: Memorial Hospital vs Allergy Center',
      path: '/patient/conflicts',
      category: 'Clinical Safety',
      badge: 'Action Required',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
    },
    {
      title: 'Medical Timeline & Longitudinal Chart',
      subtitle: 'Unified hospital discharges, lab panels, and outpatient notes',
      path: '/patient/history',
      category: 'Health Records',
      badge: 'Updated Today',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      title: 'Patient Overview Dashboard',
      subtitle: 'Connected health systems, medication adherence & alerts',
      path: '/patient/dashboard',
      category: 'Patient Portal',
      badge: 'Overview',
      badgeColor: 'bg-stone-100 text-stone-700 border-stone-200'
    },
    {
      title: 'Sharing & Patient-Controlled Consents',
      subtitle: 'Manage active scopes, category permissions, and Sutter Health grant',
      path: '/patient/consents',
      category: 'Privacy',
      badge: '1 Active Grant',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      title: 'Import Medical Records',
      subtitle: 'Ingest Epic, Cerner, FHIR R4 JSON, or PDF discharge files',
      path: '/patient/import',
      category: 'Data Ingestion',
      badge: 'Upload',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      title: 'Cryptographic Audit Ledger',
      subtitle: 'Tamper-evident access log with SHA-256 provenance hashes',
      path: '/patient/access-history',
      category: 'Compliance',
      badge: 'HIPAA Verifiable',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      title: 'Clinical Workspace (Dr. Marcus Vance)',
      subtitle: 'Sutter Health authorized physician clinical verification handoff',
      path: '/clinic/dashboard',
      category: 'Clinician Suite',
      badge: 'Physician View',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    {
      title: 'Active Patient Handoff (Ananya Sharma)',
      subtitle: 'Two-pane clinical reconciliation for DEMO-P001',
      path: `/clinic/handoff/${activeGrantId}`,
      category: 'Clinician Suite',
      badge: 'Active Token',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    }
  ];

  const filteredItems = searchableItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleResetDemo = async () => {
    try {
      await fetch('/api/db/reset', { method: 'POST' });
      setResetSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch {
      window.location.reload();
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-40 bg-white border-b border-[#E3E8DC] shadow-xs">
        {/* Top ambient hairline accent bar */}
        <div className="h-[2px] w-full bg-gradient-to-r from-[#214D09] via-[#33650E] to-[#78A541]" />

        <div className="h-18 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* ================= LEFT: BRAND EMBLEM & BADGE ================= */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('/')}
              className="group flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#33650E] rounded-xl py-1 transition-transform active:scale-[0.98]"
              title="MediLink Home"
            >
              {/* Premium Geometric Brandmark */}
              <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1C3E07] via-[#2E5E0C] to-[#3B7310] flex items-center justify-center shadow-[0_2px_8px_rgba(46,94,12,0.28)] ring-1 ring-white/30 group-hover:shadow-[0_4px_16px_rgba(46,94,12,0.36)] transition-all shrink-0">
                {/* Micro inner glow */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-transparent to-white/20 pointer-events-none" />
                
                {/* Crisp Vector Medical Continuity Symbol */}
                <svg
                  className="w-5 h-5 text-white transform transition-transform group-hover:scale-105 duration-300 relative z-10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 4v16" stroke="#FFFFFF" strokeWidth="2.5" />
                  <path d="M4 12h16" stroke="#FFFFFF" strokeWidth="2.5" />
                  <circle cx="12" cy="12" r="3.2" fill="#BDEF81" stroke="#234E09" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="1.2" fill="#FFFFFF" />
                </svg>

                {/* Clean live indicator ring without continuous ping layout shift */}
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#78A541] border border-white" />
                </span>
              </div>

              {/* Brand Typography */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-[21px] text-[#0B0808] tracking-tight group-hover:text-[#2E5E0C] transition-colors leading-none">
                    MediLink
                  </span>
                  
                  {/* Subtle luxury brand tag */}
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-[5px] text-[9.5px] font-bold tracking-wider uppercase bg-[#F2F7EB] text-[#2E5E0C] border border-[#D5E1CD]">
                    PRO
                  </span>
                </div>
                <span className="text-[10.5px] font-medium text-[#64705F] tracking-tight -mt-0.5 hidden sm:block">
                  Connected Health Records
                </span>
              </div>
            </button>

            {/* In-App Context Pill */}
            {!isMarketingPage && (
              <div className="hidden lg:flex items-center pl-3 border-l border-[#DFE5D8]">
                {currentUser.role === 'patient' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F2F7EB] text-[#2E5E0C] border border-[#D4E0CC]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#78A541]" />
                    <span>Patient Portal</span>
                    <span className="text-stone-400 text-[10px]">•</span>
                    <span className="text-stone-500 font-normal">Ananya S.</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#214D09] text-white shadow-xs">
                    <Stethoscope className="w-3 h-3 text-[#BDEF81]" />
                    <span>Clinical Suite</span>
                    <span className="text-emerald-300 text-[10px]">•</span>
                    <span className="text-emerald-100 font-normal">Sutter Health</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ================= CENTER: NAVIGATION ================= */}
          {isMarketingPage ? (
            <nav className="hidden lg:flex items-center gap-1 bg-[#F5F8F2] p-1 rounded-full border border-[#DFE5D8]/80 shadow-xs">
              <button
                onClick={() => onNavigate('/')}
                className={`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all duration-200 ${
                  currentPath === '/'
                    ? 'bg-white text-[#214D09] shadow-[0_1px_4px_rgba(0,0,0,0.06)] font-bold'
                    : 'text-[#4A5245] hover:text-[#0B0808] hover:bg-white/50'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => onNavigate('/#how-it-works')}
                className="px-4 py-1.5 rounded-full text-[13px] font-semibold text-[#4A5245] hover:text-[#0B0808] hover:bg-white/50 transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => onNavigate('/#features')}
                className="px-4 py-1.5 rounded-full text-[13px] font-semibold text-[#4A5245] hover:text-[#0B0808] hover:bg-white/50 transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => onNavigate('/clinic/dashboard')}
                className="px-4 py-1.5 rounded-full text-[13px] font-semibold text-[#4A5245] hover:text-[#0B0808] hover:bg-white/50 transition-colors flex items-center gap-1.5"
              >
                <Stethoscope className="w-3.5 h-3.5 text-[#33650E]" />
                <span>For Clinics</span>
              </button>
              <button
                onClick={() => onNavigate('/#faq')}
                className="px-4 py-1.5 rounded-full text-[13px] font-semibold text-[#4A5245] hover:text-[#0B0808] hover:bg-white/50 transition-colors"
              >
                FAQ
              </button>
            </nav>
          ) : (
            <nav className="hidden xl:flex items-center gap-1 bg-[#F3F7EE] p-1 rounded-2xl border border-[#DCE4D5] shadow-xs">
              {currentUser.role === 'patient' ? (
                <>
                  <button
                    onClick={() => onNavigate('/patient/dashboard')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
                      currentPath === '/patient/dashboard'
                        ? 'bg-white text-[#214D09] shadow-sm font-bold ring-1 ring-black/[0.04]'
                        : 'text-[#485244] hover:text-[#0B0808] hover:bg-white/60'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Overview</span>
                  </button>
                  <button
                    onClick={() => onNavigate('/patient/history')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
                      currentPath === '/patient/history'
                        ? 'bg-white text-[#214D09] shadow-sm font-bold ring-1 ring-black/[0.04]'
                        : 'text-[#485244] hover:text-[#0B0808] hover:bg-white/60'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Timeline</span>
                  </button>
                  <button
                    onClick={() => onNavigate('/patient/conflicts')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
                      currentPath === '/patient/conflicts'
                        ? 'bg-white text-[#A33837] shadow-sm font-bold ring-1 ring-rose-200'
                        : 'text-[#485244] hover:text-[#0B0808] hover:bg-white/60'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-[#C83F3E]" />
                    <span>Discrepancies</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#FFF0EF] text-[#A33837] border border-[#ffdad6] shadow-xs">
                      1
                    </span>
                  </button>
                  <button
                    onClick={() => onNavigate('/patient/import')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
                      currentPath === '/patient/import'
                        ? 'bg-white text-[#214D09] shadow-sm font-bold ring-1 ring-black/[0.04]'
                        : 'text-[#485244] hover:text-[#0B0808] hover:bg-white/60'
                    }`}
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Import</span>
                  </button>
                  <button
                    onClick={() => onNavigate('/patient/consents')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
                      currentPath === '/patient/consents'
                        ? 'bg-white text-[#214D09] shadow-sm font-bold ring-1 ring-black/[0.04]'
                        : 'text-[#485244] hover:text-[#0B0808] hover:bg-white/60'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Sharing</span>
                  </button>
                  <button
                    onClick={() => onNavigate('/patient/access-history')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
                      currentPath === '/patient/access-history'
                        ? 'bg-white text-[#214D09] shadow-sm font-bold ring-1 ring-black/[0.04]'
                        : 'text-[#485244] hover:text-[#0B0808] hover:bg-white/60'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Audit</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('/clinic/dashboard')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
                      currentPath === '/clinic/dashboard'
                        ? 'bg-white text-[#214D09] shadow-sm font-bold ring-1 ring-black/[0.04]'
                        : 'text-[#485244] hover:text-[#0B0808] hover:bg-white/60'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Clinical Workspace</span>
                  </button>
                  <button
                    onClick={() => onNavigate('/clinic/access-requests')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
                      currentPath === '/clinic/access-requests'
                        ? 'bg-white text-[#214D09] shadow-sm font-bold ring-1 ring-black/[0.04]'
                        : 'text-[#485244] hover:text-[#0B0808] hover:bg-white/60'
                    }`}
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    <span>Request Records</span>
                  </button>
                  <button
                    onClick={() => onNavigate(`/clinic/handoff/${activeGrantId}`)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
                      currentPath.includes('/clinic/handoff')
                        ? 'bg-white text-[#214D09] shadow-sm font-bold ring-1 ring-black/[0.04]'
                        : 'text-[#485244] hover:text-[#0B0808] hover:bg-white/60'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 text-[#33650E]" />
                    <span>Handoff (Ananya S.)</span>
                    <span className="w-2 h-2 rounded-full bg-[#78A541]" />
                  </button>
                  <button
                    onClick={() => onNavigate('/patient/access-history')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12.5px] font-semibold transition-all duration-200 ${
                      currentPath === '/patient/access-history'
                        ? 'bg-white text-[#214D09] shadow-sm font-bold ring-1 ring-black/[0.04]'
                        : 'text-[#485244] hover:text-[#0B0808] hover:bg-white/60'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>Audit Ledger</span>
                  </button>
                </>
              )}
            </nav>
          )}

          {/* ================= RIGHT: CONTROLS & LUXURY ACTIONS ================= */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            
            {/* Quick Search / Command Palette Trigger Button */}
            <button
              onClick={() => setShowCommandSearch(true)}
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs text-[#525B4D] bg-[#F4F7EF] hover:bg-[#EBF1E4] hover:text-[#111A0E] border border-[#DCE4D5] rounded-xl transition-all shadow-xs group"
              title="Quick Search (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-[#62705C] group-hover:text-[#214D09] transition-colors" />
              <span className="hidden md:inline font-medium">Search records...</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-stone-500 bg-white border border-stone-200 rounded shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                <Command className="w-2.5 h-2.5" />K
              </kbd>
            </button>

            {/* Security / HIPAA Verified Shield Indicator (Desktop) */}
            <div className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F2F7EB] border border-[#DCE4D5] text-[11px] font-semibold text-[#2E5E0C]">
              <Lock className="w-3 h-3 text-[#78A541]" />
              <span>256-Bit Encrypted</span>
            </div>

            {/* Marketing primary action button */}
            {isMarketingPage ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('/login')}
                  className="hidden sm:inline-flex items-center text-[13.5px] font-semibold text-[#485244] hover:text-[#0B0808] px-3.5 py-2 rounded-xl hover:bg-[#F2F7EB] transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onNavigate('/patient/dashboard')}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#214D09] to-[#33650E] hover:from-[#1A3D07] hover:to-[#28510B] text-white font-['DM_Sans'] text-[13.5px] font-semibold px-4.5 py-2 rounded-xl transition-all shadow-[0_2px_10px_rgba(33,77,9,0.22)] active:scale-[0.98]"
                >
                  <span>Connect Records</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('/')}
                className="hidden lg:inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#4A5446] hover:text-[#0B0808] px-3 py-1.5 rounded-xl hover:bg-[#F2F7EB] border border-transparent hover:border-[#DCE4D5] transition-all"
                title="View Marketing Landing Page"
              >
                <span>Home Page</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </button>
            )}

            {/* ================= PERSONA SWITCHER / USER PROFILE ================= */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`flex items-center gap-2 p-1 sm:pl-1.5 sm:pr-2.5 py-1 rounded-full sm:rounded-2xl border transition-all duration-200 select-none ${
                  showUserDropdown
                    ? 'border-[#78A541] bg-[#F2F7EB] shadow-[0_0_0_2px_rgba(120,165,65,0.2)]'
                    : 'border-[#DCE4D5] hover:border-[#78A541] bg-white hover:bg-[#F5F8F1] shadow-xs'
                }`}
                title="Switch Demo Persona & Security Credentials"
                aria-label="User profile and persona switch menu"
              >
                {/* Avatar with role gradient and live dot */}
                <div className="relative">
                  <div
                    className={`w-7.5 h-7.5 rounded-full flex items-center justify-center font-bold text-[11.5px] text-white shadow-xs ${
                      currentUser.role === 'patient'
                        ? 'bg-gradient-to-br from-[#214D09] to-[#3B7310]'
                        : currentUser.role === 'clinician'
                        ? 'bg-gradient-to-br from-[#12361B] to-[#1E562D]'
                        : 'bg-gradient-to-br from-[#3D453C] to-[#2B3029]'
                    }`}
                  >
                    {currentUser.name
                      .split(' ')
                      .map(n => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#78A541] ring-1.5 ring-white" />
                </div>

                {/* Name & Role label */}
                <div className="hidden sm:block text-left leading-tight pr-0.5">
                  <p className="text-[12px] font-bold text-[#0B0808] truncate max-w-[105px]">
                    {currentUser.name.split(' ')[0]}
                  </p>
                  <p className="text-[10px] font-semibold text-[#667262] capitalize flex items-center gap-1">
                    <span>{currentUser.role}</span>
                  </p>
                </div>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#62705C] transition-transform duration-200 hidden sm:block ${
                    showUserDropdown ? 'rotate-180 text-[#214D09]' : ''
                  }`}
                />
              </button>

              {/* Ultra-Luxury Persona Flyout Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2.5 w-84 bg-white/98 backdrop-blur-2xl rounded-2xl shadow-[0_16px_48px_-8px_rgba(18,29,14,0.18),0_4px_16px_rgba(18,29,14,0.06)] border border-[#DCE4D5] p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Current Authenticated User Badge */}
                  <div className="p-3 bg-gradient-to-br from-[#F4F8EE] to-[#E9F1DF] rounded-xl border border-[#D5E1CC] mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-[13px] font-extrabold text-white shadow-sm shrink-0 ${
                          currentUser.role === 'patient'
                            ? 'bg-gradient-to-br from-[#214D09] to-[#3B7310]'
                            : 'bg-gradient-to-br from-[#12361B] to-[#1E562D]'
                        }`}
                      >
                        {currentUser.name
                          .split(' ')
                          .map(n => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-bold text-[#0B0808] truncate">
                            {currentUser.name}
                          </p>
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9.5px] font-bold uppercase bg-white text-[#214D09] border border-[#D5E1CC]">
                            Active
                          </span>
                        </div>
                        <p className="text-[11px] text-[#556150] truncate">{currentUser.email}</p>
                        <p className="text-[10px] text-[#717E6C] truncate mt-0.5">
                          {currentUser.role === 'patient'
                            ? 'Patient ID: DEMO-P001 • MRN: ML-89204'
                            : 'Sutter Health Clinical Provider #MD-4819'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section Label */}
                  <div className="px-2 py-1 flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-[#5F6B5A] uppercase tracking-wider">
                      Switch Role Persona
                    </span>
                    <span className="text-[10px] text-stone-400 font-medium">1-Click Live Switch</span>
                  </div>

                  {/* Persona Options */}
                  <div className="space-y-1.5 mt-1">
                    {allUsers.map(user => {
                      const isActive = currentUser.id === user.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            switchUser(user.id);
                            setShowUserDropdown(false);
                            if (user.role === 'patient') {
                              onNavigate('/patient/dashboard');
                            } else {
                              onNavigate('/clinic/dashboard');
                            }
                          }}
                          className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-all duration-150 ${
                            isActive
                              ? 'bg-[#EEF5E6] border border-[#BBD3A5] shadow-xs'
                              : 'hover:bg-[#F5F8F1] border border-transparent'
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${
                              user.role === 'patient'
                                ? 'bg-[#2E5E0C]'
                                : user.role === 'clinician'
                                ? 'bg-[#184620]'
                                : 'bg-[#434B41]'
                            }`}
                          >
                            {user.name
                              .split(' ')
                              .map(n => n[0])
                              .slice(0, 2)
                              .join('')}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-[12.5px] font-bold text-[#0B0808] truncate">
                                {user.name}
                              </p>
                              {isActive && (
                                <CheckCircle2 className="w-4 h-4 text-[#2E5E0C] shrink-0" />
                              )}
                            </div>
                            <p className="text-[10.5px] text-[#556150] truncate">
                              {user.role === 'patient'
                                ? 'Patient • Ananya Sharma (Type 2 Diab)'
                                : user.role === 'clinician'
                                ? 'Attending Physician (Sutter Health)'
                                : 'Compliance & Privacy Officer'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Cryptographic Session info */}
                  <div className="mt-3 p-2 rounded-lg bg-[#FAFBF8] border border-[#E7ECE2] text-[10.5px] text-[#5A6655] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-[#2E5E0C]" />
                      <span>Zero-Knowledge Consent Active</span>
                    </span>
                    <span className="font-mono text-[9.5px] text-stone-400">SHA-256</span>
                  </div>

                  {/* Bottom Actions */}
                  <div className="mt-3 pt-2.5 border-t border-[#E7ECE2] px-1 flex items-center justify-between text-[11.5px]">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onNavigate(currentUser.role === 'patient' ? '/patient/dashboard' : '/clinic/dashboard');
                      }}
                      className="font-bold text-[#2E5E0C] hover:text-[#1E4107] hover:underline flex items-center gap-1"
                    >
                      <span>Open Workspace</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={handleResetDemo}
                      disabled={resetSuccess}
                      className="text-[#647160] hover:text-[#0B0808] hover:underline flex items-center gap-1 transition-colors"
                      title="Reset mock medical database to initial seed data"
                    >
                      <RotateCcw className={`w-3 h-3 ${resetSuccess ? 'animate-spin text-[#2E5E0C]' : ''}`} />
                      <span>{resetSuccess ? 'Resetting...' : 'Reset Data'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-[#424A3F] hover:bg-[#F2F7EB] border border-transparent hover:border-[#DCE4D5] transition-all"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ================= MOBILE DRAWER ================= */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white border-b border-[#DCE4D5] px-5 py-4 space-y-4 shadow-xl">
            {/* Active User Persona Banner */}
            <div className="p-3 bg-[#F4F8EE] rounded-2xl border border-[#D5E1CC] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#2E5E0C] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {currentUser.name
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#0B0808]">{currentUser.name}</p>
                  <p className="text-[11px] text-[#556150] capitalize">{currentUser.role} Account</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowUserDropdown(true);
                  setMobileMenuOpen(false);
                }}
                className="text-[11.5px] font-bold text-[#2E5E0C] hover:underline px-2.5 py-1 bg-white rounded-lg border border-[#D5E1CC]"
              >
                Switch
              </button>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1 pt-1">
              {isMarketingPage ? (
                <>
                  <button
                    onClick={() => {
                      onNavigate('/');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2.5 px-3 rounded-xl font-bold text-[#0B0808] hover:bg-[#F4F8EE]"
                  >
                    Home
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/#how-it-works');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2.5 px-3 rounded-xl font-semibold text-[#485244] hover:bg-[#F4F8EE]"
                  >
                    How It Works
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/#features');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2.5 px-3 rounded-xl font-semibold text-[#485244] hover:bg-[#F4F8EE]"
                  >
                    Key Features
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/clinic/dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2.5 px-3 rounded-xl font-semibold text-[#485244] hover:bg-[#F4F8EE] flex items-center justify-between"
                  >
                    <span>For Clinics &amp; Physicians</span>
                    <Stethoscope className="w-4 h-4 text-[#33650E]" />
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/#faq');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2.5 px-3 rounded-xl font-semibold text-[#485244] hover:bg-[#F4F8EE]"
                  >
                    FAQ
                  </button>
                  <div className="pt-3 border-t border-[#DFE5D8]">
                    <button
                      onClick={() => {
                        onNavigate('/patient/dashboard');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-[#214D09] to-[#33650E] text-white py-3 rounded-xl font-bold text-[14px] shadow-sm flex items-center justify-center gap-2"
                    >
                      <span>Launch Patient Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : currentUser.role === 'patient' ? (
                <>
                  <button
                    onClick={() => {
                      onNavigate('/patient/dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left py-2.5 px-3 rounded-xl font-semibold flex items-center gap-2.5 ${
                      currentPath === '/patient/dashboard' ? 'bg-[#EEF5E6] text-[#214D09] font-bold' : 'text-[#485244]'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Overview Dashboard</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/patient/history');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left py-2.5 px-3 rounded-xl font-semibold flex items-center gap-2.5 ${
                      currentPath === '/patient/history' ? 'bg-[#EEF5E6] text-[#214D09] font-bold' : 'text-[#485244]'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Longitudinal Timeline</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/patient/conflicts');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left py-2.5 px-3 rounded-xl font-semibold flex items-center justify-between ${
                      currentPath === '/patient/conflicts' ? 'bg-[#FFF0EF] text-[#A33837] font-bold' : 'text-[#A33837]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Discrepancy Resolution</span>
                    </span>
                    <span className="text-[10px] bg-[#FFF0EF] px-2 py-0.5 rounded-full border border-[#ffdad6] font-bold">
                      1 Flagged
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/patient/import');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left py-2.5 px-3 rounded-xl font-semibold flex items-center gap-2.5 ${
                      currentPath === '/patient/import' ? 'bg-[#EEF5E6] text-[#214D09] font-bold' : 'text-[#485244]'
                    }`}
                  >
                    <FileUp className="w-4 h-4" />
                    <span>Import EHR Documents</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/patient/consents');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left py-2.5 px-3 rounded-xl font-semibold flex items-center gap-2.5 ${
                      currentPath === '/patient/consents' ? 'bg-[#EEF5E6] text-[#214D09] font-bold' : 'text-[#485244]'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Consent &amp; Provider Access</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/patient/access-history');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left py-2.5 px-3 rounded-xl font-semibold flex items-center gap-2.5 ${
                      currentPath === '/patient/access-history' ? 'bg-[#EEF5E6] text-[#214D09] font-bold' : 'text-[#485244]'
                    }`}
                  >
                    <History className="w-4 h-4" />
                    <span>Audit Trail (SHA-256)</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      onNavigate('/clinic/dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2.5 px-3 rounded-xl font-bold text-[#0B0808]"
                  >
                    Clinical Workspace
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/clinic/access-requests');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2.5 px-3 rounded-xl font-semibold text-[#485244]"
                  >
                    Request Patient Records
                  </button>
                  <button
                    onClick={() => {
                      onNavigate(`/clinic/handoff/${activeGrantId}`);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2.5 px-3 rounded-xl font-bold text-[#214D09] flex items-center justify-between"
                  >
                    <span>Active Handoff (Ananya S.)</span>
                    <span className="w-2 h-2 rounded-full bg-[#78A541] animate-pulse" />
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('/patient/access-history');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left py-2.5 px-3 rounded-xl font-semibold text-[#485244]"
                  >
                    Audit Ledger
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ================= COMMAND PALETTE SEARCH MODAL ================= */}
      {showCommandSearch && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowCommandSearch(false)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-stone-200 bg-stone-50/50">
              <Search className="w-5 h-5 text-stone-400 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search health records, discrepancies, providers, lab results..."
                className="w-full bg-transparent border-0 outline-none text-stone-800 placeholder:text-stone-400 text-sm font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="p-1 rounded-md text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <kbd className="px-2 py-0.5 text-[11px] font-semibold text-stone-400 bg-stone-100 border border-stone-200 rounded">
                ESC
              </kbd>
            </div>

            {/* Results / Navigation List */}
            <div className="max-h-[60vh] overflow-y-auto p-2 divide-y divide-stone-100">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-stone-400 text-sm">
                  No medical records or sections matching "{searchQuery}"
                </div>
              ) : (
                filteredItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      onNavigate(item.path);
                      setShowCommandSearch(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-[#F4F8EE] flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#EBF3E3] text-[#2E5E0C] flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-stone-900 group-hover:text-[#214D09] truncate">
                            {item.title}
                          </p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-[#214D09] group-hover:translate-x-0.5 transition-all shrink-0 ml-3" />
                  </button>
                ))
              )}
            </div>

            {/* Command Palette Footer */}
            <div className="px-4 py-2.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2E5E0C]" />
                <span>Zero-Knowledge Indexed Health Records</span>
              </span>
              <div className="flex items-center gap-2">
                <span>Navigate</span>
                <kbd className="px-1.5 py-0.5 bg-white border border-stone-200 rounded text-[10px]">↵</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
