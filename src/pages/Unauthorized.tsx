import React from 'react';

interface UnauthorizedProps {
  onNavigate: (path: string) => void;
}

export const Unauthorized: React.FC<UnauthorizedProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16 bg-[#f7fbf0]">
      <div className="max-w-md w-full bg-[#FFFFFF] rounded-3xl border-2 border-[#A33837] p-8 text-center shadow-lg space-y-5">
        <div className="w-16 h-16 rounded-full bg-[#FFF0EF] text-[#A33837] flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[36px]">shield_lock</span>
        </div>

        <div>
          <span className="text-[11px] font-bold text-[#A33837] uppercase tracking-wider bg-[#FFF0EF] px-3 py-1 rounded-full">
            Security Enforcement
          </span>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[24px] font-bold text-[#0B0808] mt-3">
            Access Denied
          </h1>
          <p className="font-['DM_Sans'] text-[14px] text-[#42493b] mt-2">
            You do not have active clinical permissions to view this patient file or the access grant
            was revoked.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5">
          <button
            onClick={() => onNavigate('/')}
            className="w-full bg-[#33650E] text-[#FFFFFF] font-semibold text-[14px] py-3 rounded-xl hover:bg-[#28510B] transition-colors"
          >
            Return to Home
          </button>
          <button
            onClick={() => onNavigate('/patient/access-history')}
            className="w-full bg-[#F2F7EB] text-[#33650E] font-semibold text-[14px] py-3 rounded-xl border border-[#DFE5D8] hover:bg-[#ebefe4] transition-colors"
          >
            View Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
