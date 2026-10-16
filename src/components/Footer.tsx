import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { currentUser, isAuthenticated } = useAuth();
  return (
    <footer className="w-full bg-[#f1f5ea] border-t border-[#DFE5D8] py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          onClick={() => onNavigate('/')}
        >
          <div className="w-7 h-7 rounded-lg bg-[#33650E] flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v18M3 12h18" stroke="#FFFFFF" strokeWidth="2.5" />
              <circle cx="12" cy="12" r="3.5" fill="#bdef81" stroke="#33650E" strokeWidth="1.5" />
            </svg>
          </div>
          <span className="font-['Plus_Jakarta_Sans'] font-bold text-[18px] text-[#0B0808]">
            MediLink
          </span>
          <span className="text-[12px] text-[#667065] ml-1 hidden sm:inline">• Clinical Continuity</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <p className="font-['DM_Sans'] text-[13px] text-[#42493b]">
            © 2026 MediLink Health Continuity Inc. All clinical rights reserved.
          </p>
          <span className="inline-block text-[11px] font-semibold text-[#33650E] bg-[#F2F7EB] px-2.5 py-0.5 rounded-full border border-[#DFE5D8]">
            Fictional Synthetic Prototype
          </span>
        </div>

        <div className="flex items-center gap-6">
          {isAuthenticated && currentUser.role !== 'clinician' && <button
            onClick={() => onNavigate('/patient/access-history')}
            className="font-['DM_Sans'] text-[13px] text-[#42493b] hover:text-[#181d16] transition-colors"
          >
            Audit Trail
          </button>}
          <button
            onClick={() => onNavigate('/#faq')}
            className="font-['DM_Sans'] text-[13px] text-[#42493b] hover:text-[#181d16] transition-colors"
          >
            Privacy Framework
          </button>
          <button
            onClick={() => onNavigate('/#faq')}
            className="font-['DM_Sans'] text-[13px] text-[#42493b] hover:text-[#181d16] transition-colors"
          >
            HIPAA & SOC 2
          </button>
        </div>
      </div>
    </footer>
  );
};
