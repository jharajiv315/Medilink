import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { currentUser, allUsers, switchUser } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isMarketingPage = currentPath === '/' || currentPath === '/how-it-works' || currentPath === '/features' || currentPath === '/for-clinics' || currentPath === '/faq';

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#FFFFFF] border-b border-[#DFE5D8] transition-all">
      <div className="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => onNavigate('/')}
        >
          <img
            alt="MediLink Brand Logo"
            className="h-8 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida/AEtjO1VX5xu07jjYgG0p77rL8wQkk6lYM6m7o2nL_0opAQvTWEUqkorqy6c5_fSSGRLl7S0ih5ScHlVhTeGqxG21ghpdO6YC0tOkHO13MJmfKBGbPZ0b0dh3BBe60h5MJ6YzmhSaxQd2FTla9CR-uiA24cbuwxcFPo_CF8GjyWEtgpZCXXKzL4OTlf9D2OQk_RAb6hnIgvhhWuLrMMyf_vqerOsOGvdXYU4r-VvT6_LG2FjiDl4QBA50jcmnTA"
          />
          <span className="font-['Plus_Jakarta_Sans'] font-semibold text-[20px] text-[#0B0808] tracking-tight">
            MediLink
          </span>
          <span className="hidden md:inline-block text-[11px] font-semibold text-[#33650E] bg-[#F2F7EB] border border-[#DFE5D8] px-2 py-0.5 rounded-full">
            FHIR R4 Connected
          </span>
        </div>

        {/* Navigation items */}
        {isMarketingPage ? (
          <nav className="hidden lg:flex items-center gap-8">
            <button
              onClick={() => onNavigate('/')}
              className={`transition-colors font-['DM_Sans'] text-[14px] font-semibold ${
                currentPath === '/'
                  ? 'text-[#33650E] border-b-2 border-[#33650E] pb-1'
                  : 'text-[#42493b] hover:text-[#181d16]'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('/#how-it-works')}
              className="font-['DM_Sans'] text-[14px] font-semibold text-[#42493b] hover:text-[#181d16] transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => onNavigate('/#features')}
              className="font-['DM_Sans'] text-[14px] font-semibold text-[#42493b] hover:text-[#181d16] transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => onNavigate('/clinic/dashboard')}
              className="font-['DM_Sans'] text-[14px] font-semibold text-[#42493b] hover:text-[#181d16] transition-colors"
            >
              For Clinics
            </button>
            <button
              onClick={() => onNavigate('/#faq')}
              className="font-['DM_Sans'] text-[14px] font-semibold text-[#42493b] hover:text-[#181d16] transition-colors"
            >
              FAQ
            </button>
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-1 bg-[#F4F5F1] p-1 rounded-xl border border-[#DFE5D8]">
            {currentUser.role === 'patient' ? (
              <>
                <button
                  onClick={() => onNavigate('/patient/dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                    currentPath === '/patient/dashboard'
                      ? 'bg-[#FFFFFF] text-[#33650E] shadow-sm font-semibold'
                      : 'text-[#484D45] hover:text-[#0B0808]'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => onNavigate('/patient/history')}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                    currentPath === '/patient/history'
                      ? 'bg-[#FFFFFF] text-[#33650E] shadow-sm font-semibold'
                      : 'text-[#484D45] hover:text-[#0B0808]'
                  }`}
                >
                  Medical Timeline
                </button>
                <button
                  onClick={() => onNavigate('/patient/conflicts')}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-1.5 ${
                    currentPath === '/patient/conflicts'
                      ? 'bg-[#FFFFFF] text-[#33650E] shadow-sm font-semibold'
                      : 'text-[#484D45] hover:text-[#0B0808]'
                  }`}
                >
                  <span>Discrepancies</span>
                  <span className="w-2 h-2 rounded-full bg-[#A33837]"></span>
                </button>
                <button
                  onClick={() => onNavigate('/patient/import')}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                    currentPath === '/patient/import'
                      ? 'bg-[#FFFFFF] text-[#33650E] shadow-sm font-semibold'
                      : 'text-[#484D45] hover:text-[#0B0808]'
                  }`}
                >
                  Import Records
                </button>
                <button
                  onClick={() => onNavigate('/patient/consents')}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                    currentPath === '/patient/consents'
                      ? 'bg-[#FFFFFF] text-[#33650E] shadow-sm font-semibold'
                      : 'text-[#484D45] hover:text-[#0B0808]'
                  }`}
                >
                  Consent & Sharing
                </button>
                <button
                  onClick={() => onNavigate('/patient/access-history')}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                    currentPath === '/patient/access-history'
                      ? 'bg-[#FFFFFF] text-[#33650E] shadow-sm font-semibold'
                      : 'text-[#484D45] hover:text-[#0B0808]'
                  }`}
                >
                  Audit Ledger
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('/clinic/dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                    currentPath === '/clinic/dashboard'
                      ? 'bg-[#FFFFFF] text-[#33650E] shadow-sm font-semibold'
                      : 'text-[#484D45] hover:text-[#0B0808]'
                  }`}
                >
                  Clinical Workspace
                </button>
                <button
                  onClick={() => onNavigate('/clinic/access-requests')}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                    currentPath === '/clinic/access-requests'
                      ? 'bg-[#FFFFFF] text-[#33650E] shadow-sm font-semibold'
                      : 'text-[#484D45] hover:text-[#0B0808]'
                  }`}
                >
                  Request Patient Records
                </button>
                <button
                  onClick={() => onNavigate('/clinic/handoff/grant-sutter-01')}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all flex items-center gap-1.5 ${
                    currentPath.includes('/clinic/handoff')
                      ? 'bg-[#FFFFFF] text-[#33650E] shadow-sm font-semibold'
                      : 'text-[#484D45] hover:text-[#0B0808]'
                  }`}
                >
                  <span>Active Handoff (Ananya S.)</span>
                  <span className="w-2 h-2 rounded-full bg-[#78A541]"></span>
                </button>
                <button
                  onClick={() => onNavigate('/patient/access-history')}
                  className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                    currentPath === '/patient/access-history'
                      ? 'bg-[#FFFFFF] text-[#33650E] shadow-sm font-semibold'
                      : 'text-[#484D45] hover:text-[#0B0808]'
                  }`}
                >
                  Audit Ledger
                </button>
              </>
            )}
          </nav>
        )}

        {/* Right side controls: Role Switcher & CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Persona Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1.5 sm:gap-2 bg-[#F2F7EB] hover:bg-[#ebefe4] border border-[#DFE5D8] px-2 sm:px-3 py-1.5 rounded-xl transition-all text-left"
              title="Switch demo persona to test workflows"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#33650E] text-[#FFFFFF] flex items-center justify-center font-bold text-[11px] sm:text-[12px]">
                {currentUser.role === 'patient' ? 'AS' : currentUser.role === 'clinician' ? 'MV' : 'SC'}
              </div>
              <div className="hidden md:block leading-tight pr-1">
                <p className="text-[12px] font-semibold text-[#0B0808] truncate max-w-[120px]">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-[#42493b] capitalize font-medium">
                  {currentUser.role}
                </p>
              </div>
              <span className="material-symbols-outlined text-[16px] text-[#42493b]">
                expand_more
              </span>
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-[#FFFFFF] rounded-2xl shadow-xl border border-[#DFE5D8] p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-[#DFE5D8] mb-1">
                  <p className="text-[11px] font-bold text-[#667065] uppercase tracking-wider">
                    Switch Demo Persona
                  </p>
                  <p className="text-[11px] text-[#484D45] mt-0.5">
                    Test patient consent & clinician handoffs
                  </p>
                </div>
                {allUsers.map(user => (
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
                    className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-colors ${
                      currentUser.id === user.id
                        ? 'bg-[#F2F7EB] border border-[#78A541]'
                        : 'hover:bg-[#F4F5F1]'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold ${
                        user.role === 'patient'
                          ? 'bg-[#33650E] text-[#FFFFFF]'
                          : user.role === 'clinician'
                          ? 'bg-[#214c00] text-[#FFFFFF]'
                          : 'bg-[#484D45] text-[#FFFFFF]'
                      }`}
                    >
                      {user.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#0B0808] truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-[#667065] truncate">
                        {user.role === 'patient'
                          ? 'Patient (ID: DEMO-P001)'
                          : user.role === 'clinician'
                          ? 'Attending Physician (Sutter Health)'
                          : 'Chief Compliance Officer'}
                      </p>
                    </div>
                    {currentUser.id === user.id && (
                      <span className="material-symbols-outlined text-[18px] text-[#33650E]">
                        check_circle
                      </span>
                    )}
                  </button>
                ))}
                <div className="mt-2 pt-2 border-t border-[#DFE5D8] px-2 flex justify-between items-center text-[11px] text-[#667065]">
                  <span>Fictional Synthetic Dataset</span>
                  <button
                    onClick={async () => {
                      await fetch('/api/db/reset', { method: 'POST' });
                      setShowUserDropdown(false);
                      window.location.reload();
                    }}
                    className="text-[#33650E] hover:underline font-semibold"
                  >
                    Reset Data
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button (hide text on tiny screens) */}
          {currentUser.role === 'patient' ? (
            <button
              onClick={() => onNavigate('/patient/dashboard')}
              className="hidden sm:inline-flex items-center gap-2 bg-[#33650E] hover:bg-[#28510B] text-[#FFFFFF] font-['DM_Sans'] text-[13px] sm:text-[14px] font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
            >
              <span>Patient Portal</span>
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_forward</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('/clinic/dashboard')}
              className="hidden sm:inline-flex items-center gap-2 bg-[#33650E] hover:bg-[#28510B] text-[#FFFFFF] font-['DM_Sans'] text-[13px] sm:text-[14px] font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
            >
              <span>Clinic Workspace</span>
              <span className="material-symbols-outlined text-[16px] sm:text-[18px]">arrow_forward</span>
            </button>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#42493b] hover:text-[#181d16]"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFFFFF] border-b border-[#DFE5D8] px-6 py-4 space-y-2">
          {currentUser.role === 'patient' ? (
            <>
              <button
                onClick={() => {
                  onNavigate('/patient/dashboard');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 font-medium text-[#181d16]"
              >
                Overview
              </button>
              <button
                onClick={() => {
                  onNavigate('/patient/history');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 font-medium text-[#181d16]"
              >
                Medical Timeline
              </button>
              <button
                onClick={() => {
                  onNavigate('/patient/conflicts');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 font-medium text-[#A33837] font-semibold"
              >
                Discrepancies (1 Flagged)
              </button>
              <button
                onClick={() => {
                  onNavigate('/patient/import');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 font-medium text-[#181d16]"
              >
                Import Records
              </button>
              <button
                onClick={() => {
                  onNavigate('/patient/consents');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 font-medium text-[#181d16]"
              >
                Consent & Sharing
              </button>
              <button
                onClick={() => {
                  onNavigate('/patient/access-history');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 font-medium text-[#181d16]"
              >
                Audit Ledger
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  onNavigate('/clinic/dashboard');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 font-medium text-[#181d16]"
              >
                Clinical Workspace
              </button>
              <button
                onClick={() => {
                  onNavigate('/clinic/access-requests');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 font-medium text-[#181d16]"
              >
                Request Patient Records
              </button>
              <button
                onClick={() => {
                  onNavigate('/clinic/handoff/grant-sutter-01');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 font-medium text-[#33650E] font-semibold"
              >
                Open Active Handoff (Ananya S.)
              </button>
              <button
                onClick={() => {
                  onNavigate('/patient/access-history');
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 font-medium text-[#181d16]"
              >
                Audit Ledger
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
