import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Logo } from '../ui/Logo.tsx';
import { MascotCompanion } from '../botanical/MascotCompanion.tsx';
import { Modal } from '../ui/Modal.tsx';
import {
  LayoutDashboard,
  FileUp,
  Clock,
  AlertTriangle,
  ShieldCheck,
  History,
  FilePlus,
  FileText,
  Activity,
  User,
  Search,
  Bell,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ArrowRight
} from 'lucide-react';

interface PortalLayoutProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  children: React.ReactNode;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  currentPath,
  onNavigate,
  children
}) => {
  const { currentUser, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCommandSearch, setShowCommandSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [activeGrantId, setActiveGrantId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setShowUserDropdown(false);
    setShowCommandSearch(false);
  }, [currentPath]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch active grant for clinician
  useEffect(() => {
    if (!isAuthenticated || currentUser.role !== 'clinician') return;
    const controller = new AbortController();
    fetch('/api/clinic/dashboard', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        const grant = data.activeGrants?.at(-1);
        setActiveGrantId(grant?.id ?? null);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [currentUser.id, currentUser.role, isAuthenticated, currentPath]);

  // Global Ctrl+K / Cmd+K and Escape shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandSearch(prev => !prev);
      } else if (e.key === 'Escape') {
        setShowCommandSearch(false);
        setMobileMenuOpen(false);
        setShowUserDropdown(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (showCommandSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [showCommandSearch]);

  const patientNav = [
    { label: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
    { label: 'Import Records', path: '/patient/import', icon: FileUp },
    { label: 'Medical History', path: '/patient/history', icon: Clock },
    { label: 'Discrepancies', path: '/patient/conflicts', icon: AlertTriangle },
    { label: 'Consents & Sharing', path: '/patient/consents', icon: ShieldCheck },
    { label: 'Access History', path: '/patient/access-history', icon: History }
  ];

  const clinicianHandoffPath = activeGrantId ? `/clinic/handoff/${activeGrantId}` : '/clinic/dashboard';
  const clinicianNav = [
    { label: 'Dashboard', path: '/clinic/dashboard', icon: LayoutDashboard },
    { label: 'Access Requests', path: '/clinic/access-requests', icon: FilePlus },
    { label: 'Patient Records', path: '/clinic/dashboard', icon: FileText },
    { label: 'Clinical Handoff', path: clinicianHandoffPath, icon: Activity },
    { label: 'Patients', path: '/clinic/dashboard', icon: User },
    { label: 'Audit Logs', path: '/clinic/dashboard', icon: History }
  ];

  const navItems = currentUser.role === 'clinician' ? clinicianNav : patientNav;

  // Companion quote based on current page
  const getCompanionQuote = () => {
    if (currentPath === '/patient/dashboard') return 'Small records make a healthier tomorrow. 🌱';
    if (currentPath === '/patient/history') return 'Every record adds a new leaf to your journey. 🌱';
    if (currentPath === '/patient/consents') return "You're in control of your health story. 🌱";
    if (currentPath === '/patient/conflicts') return 'Clinical clarity ensures safer patient care. 🌱';
    return 'Growing stronger with every connected record. 🌱';
  };

  const isCurrentActive = (itemPath: string) => {
    if (itemPath === '/patient/dashboard') return currentPath === '/patient/dashboard';
    if (itemPath === '/clinic/dashboard') return currentPath === '/clinic/dashboard';
    if (itemPath.startsWith('/clinic/handoff/')) return currentPath.startsWith('/clinic/handoff/');
    return currentPath === itemPath;
  };

  const userInitials = (currentUser.name || 'AS')
    .split(' ')
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen flex bg-[#F7FBF0] text-[#0B0808]">
      {/* ================= DESKTOP LEFT SIDEBAR ================= */}
      <aside className="hidden lg:flex flex-col w-[240px] xl:w-[250px] shrink-0 border-r border-[#DFE5D8] bg-[#F7FBF0] h-screen sticky top-0 px-4 py-5 justify-between z-30 select-none">
        <div className="space-y-6">
          {/* Logo */}
          <div className="px-2 pt-1">
            <button
              onClick={() => onNavigate('/')}
              className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#33650E] rounded-xl"
            >
              <Logo size="md" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav aria-label="Portal sidebar navigation" className="space-y-1.5">
            {navItems.map(item => {
              const active = isCurrentActive(item.path);
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => onNavigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-['DM_Sans'] text-[14px] font-medium transition-all duration-160 ${
                    active
                      ? 'bg-[#285208] text-[#FFFFFF] shadow-sm font-semibold'
                      : 'text-[#484D45] hover:text-[#0B0808] hover:bg-[#EBF3E2]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#FFFFFF]' : 'text-[#667065]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Companion Card */}
        <div className="pt-4">
          <MascotCompanion
            variant="sidebar"
            quote={getCompanionQuote()}
          />
        </div>
      </aside>

      {/* ================= MOBILE SLIDE-OVER DRAWER ================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex flex-col w-[280px] max-w-[85vw] bg-[#F7FBF0] h-full p-5 shadow-2xl z-10 border-r border-[#DFE5D8] justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Logo size="md" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-[#667065] hover:bg-[#EBF3E2]"
                  aria-label="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {navItems.map(item => {
                  const active = isCurrentActive(item.path);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => {
                        onNavigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-['DM_Sans'] text-[14px] transition-colors ${
                        active
                          ? 'bg-[#285208] text-[#FFFFFF] font-semibold'
                          : 'text-[#484D45] hover:bg-[#EBF3E2]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4">
              <MascotCompanion
                variant="sidebar"
                quote={getCompanionQuote()}
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN COLUMN: HEADER & CONTENT ================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-[#F7FBF0]/95 backdrop-blur-md border-b border-[#DFE5D8] px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Mobile menu toggle & brand */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(prev => !prev)}
              name="Toggle navigation menu"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              className="p-2 rounded-xl border border-[#DFE5D8] bg-[#FFFFFF] text-[#0B0808] hover:bg-[#F2F7EB] focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Logo size="sm" />
          </div>

          {/* Search bar matching reference */}
          <div className="flex-1 max-w-xl hidden sm:block">
            <button
              onClick={() => setShowCommandSearch(true)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#FFFFFF] border border-[#DFE5D8] shadow-2xs text-[#667065] hover:border-[#CAD4C1] text-left transition-colors"
            >
              <Search className="w-4 h-4 text-[#72796A]" />
              <span className="font-['DM_Sans'] text-[13.5px] truncate">
                Search your records, providers, or documents...
              </span>
              <kbd className="ml-auto hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-mono text-[#72796A] bg-[#F2F7EB] border border-[#DFE5D8]">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 ml-auto">
            {/* Bell Notification */}
            <button
              onClick={() => onNavigate('/patient/conflicts')}
              className="relative p-2 rounded-full text-[#484D45] hover:bg-[#EBF3E2] transition-colors"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#A33837] border-2 border-[#F7FBF0]" />
            </button>

            {/* Settings */}
            <button
              onClick={() => onNavigate('/patient/consents')}
              className="p-2 rounded-full text-[#484D45] hover:bg-[#EBF3E2] transition-colors hidden sm:block"
              title="Settings"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>

            {/* User Avatar Badge with Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowUserDropdown(prev => !prev)}
                className="flex items-center gap-2.5 pl-1.5 pr-2 sm:pr-3 py-1 rounded-full bg-[#FFFFFF] border border-[#DFE5D8] hover:border-[#CAD4C1] transition-all shadow-2xs"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#579C91] text-[#FFFFFF] flex items-center justify-center font-bold text-[12px] sm:text-[13px] font-['Plus_Jakarta_Sans'] shrink-0 shadow-2xs">
                  {userInitials}
                </div>
                <div className="hidden sm:flex flex-col text-left leading-tight">
                  <span className="font-['Plus_Jakarta_Sans'] text-[12.5px] font-bold text-[#0B0808]">
                    {currentUser.name}
                  </span>
                  <span className="font-['DM_Sans'] text-[10.5px] text-[#667065] capitalize">
                    {currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#667065]" />
              </button>

              {/* Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#FFFFFF] border border-[#DFE5D8] shadow-lg p-2 z-50">
                  <div className="px-3 py-2 border-b border-[#F0F4EA] mb-1">
                    <div className="font-bold text-[13px] text-[#0B0808]">{currentUser.name}</div>
                    <div className="text-[11px] text-[#667065] truncate">{currentUser.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onNavigate(currentUser.role === 'clinician' ? '/patient/dashboard' : '/clinic/dashboard');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-[#484D45] hover:bg-[#F2F7EB] transition-colors"
                  >
                    <User className="w-4 h-4 text-[#33650E]" />
                    <span>Switch to {currentUser.role === 'clinician' ? 'Patient' : 'Clinician'} View</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                      onNavigate('/');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-[#A33837] hover:bg-[#FFF0EF] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* ================= COMMAND PALETTE SEARCH MODAL (Ctrl+K) ================= */}
      {showCommandSearch && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search records and navigation"
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-xs"
          onClick={() => setShowCommandSearch(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-[#FFFFFF] border border-[#DFE5D8] shadow-2xl p-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-3 py-2 border-b border-[#DFE5D8] mb-3">
              <Search className="w-5 h-5 text-[#33650E]" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search medical records, diagnoses, providers..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-[15px] text-[#0B0808] outline-none font-['DM_Sans']"
              />
              <kbd className="px-2 py-0.5 rounded text-[11px] font-mono text-[#667065] bg-[#F2F7EB] border border-[#DFE5D8]">
                ESC
              </kbd>
            </div>

            <div className="space-y-1 max-h-72 overflow-y-auto">
              {navItems.map(item => (
                <button
                  key={item.label}
                  onClick={() => {
                    setShowCommandSearch(false);
                    onNavigate(item.path);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#F2F7EB] text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="w-4 h-4 text-[#33650E]" />
                    <span className="font-['DM_Sans'] text-[14px] text-[#0B0808]">{item.label}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#667065]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
