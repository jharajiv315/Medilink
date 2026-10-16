import React from 'react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#f1f5ea] border-t border-[#DFE5D8] py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => onNavigate('/')}
        >
          <img
            alt="MediLink Brand Logo"
            className="h-6 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida/AEtjO1VX5xu07jjYgG0p77rL8wQkk6lYM6m7o2nL_0opAQvTWEUqkorqy6c5_fSSGRLl7S0ih5ScHlVhTeGqxG21ghpdO6YC0tOkHO13MJmfKBGbPZ0b0dh3BBe60h5MJ6YzmhSaxQd2FTla9CR-uiA24cbuwxcFPo_CF8GjyWEtgpZCXXKzL4OTlf9D2OQk_RAb6hnIgvhhWuLrMMyf_vqerOsOGvdXYU4r-VvT6_LG2FjiDl4QBA50jcmnTA"
          />
          <span className="font-['Plus_Jakarta_Sans'] font-bold text-[18px] text-[#0B0808]">
            MediLink
          </span>
          <span className="text-[12px] text-[#667065] ml-2">Clinical Continuity & Records Handoff</span>
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
          <button
            onClick={() => onNavigate('/patient/access-history')}
            className="font-['DM_Sans'] text-[13px] text-[#42493b] hover:text-[#181d16] transition-colors"
          >
            Audit Trail
          </button>
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
