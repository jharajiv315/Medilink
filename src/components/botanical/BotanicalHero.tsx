import React from 'react';

export const BotanicalHero: React.FC = () => {
  return (
    <div className="relative w-full max-w-[620px] mx-auto min-h-[460px] sm:min-h-[500px] lg:min-h-[540px] flex items-center justify-center select-none">
      {/* Background Soft Glow / Ambient Aura */}
      <div className="absolute inset-0 bg-radial from-[#e4f3d2]/70 via-[#f0f8e7]/30 to-transparent blur-2xl -z-10 pointer-events-none" />

      {/* Layer 1: Real Healthcare Consultation Photo with Feathered Radial Mask */}
      <div className="relative w-[88%] sm:w-[82%] aspect-[4/3] rounded-3xl overflow-hidden z-10 transition-all duration-300">
        <img
          src="/assets/healthcare/consultation-hero.webp"
          alt="Authentic healthcare consultation in a calm, modern clinic"
          className="w-full h-full object-cover object-center filter saturate-[1.04] contrast-[1.02]"
          style={{
            WebkitMaskImage: 'radial-gradient(ellipse 80% 78% at 50% 46%, black 52%, rgba(0, 0, 0, 0.88) 72%, transparent 100%)',
            maskImage: 'radial-gradient(ellipse 80% 78% at 50% 46%, black 52%, rgba(0, 0, 0, 0.88) 72%, transparent 100%)'
          }}
          loading="eager"
        />
        {/* Gentle atmospheric gradient at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#f7fbf0] via-[#f7fbf0]/60 to-transparent pointer-events-none" />
      </div>

      {/* Layer 2: Floating Medical History Interface Preview Card */}
      <div className="absolute right-0 sm:-right-4 top-14 sm:top-16 z-25 w-[210px] sm:w-[245px] bg-[#ffffff]/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 shadow-[0_16px_36px_rgba(20,50,0,0.14)] border border-[#dfe5d8] transition-all duration-300 hover:shadow-[0_20px_42px_rgba(20,50,0,0.18)]">
        {/* Card Header & Search Mini Bar */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#f2f7eb] border border-[#e2ebd9] mb-3">
          <span className="material-symbols-outlined text-[14px] text-[#667065]">search</span>
          <span className="text-[10px] text-[#667065] font-['DM_Sans']">Search in records...</span>
        </div>

        <div className="flex items-center justify-between mb-2.5">
          <span className="font-['Plus_Jakarta_Sans'] text-[12px] font-bold text-[#0B0808]">Medical History</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#33650E]"></span>
        </div>

        {/* Mini Vine Timeline */}
        <div className="relative pl-5 space-y-2.5 text-[10.5px] font-['DM_Sans'] before:content-[''] before:absolute before:left-2 before:top-1.5 before:bottom-1.5 before:w-[2px] before:bg-gradient-to-b before:from-[#78a541] before:via-[#33650E] before:to-[#579c91]">
          {/* Event 1 */}
          <div className="relative">
            <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#78a541]" />
            <div className="font-bold text-[#0B0808]">Lab Report</div>
            <div className="text-[9.5px] text-[#667065]">May 12, 2024</div>
          </div>

          {/* Event 2 */}
          <div className="relative">
            <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#33650E]" />
            <div className="font-bold text-[#0B0808]">Prescription</div>
            <div className="text-[9.5px] text-[#667065]">Jun 3, 2024</div>
          </div>

          {/* Event 3 */}
          <div className="relative">
            <span className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#579c91]" />
            <div className="font-bold text-[#0B0808]">Clinical Note</div>
            <div className="text-[9.5px] text-[#667065]">Dec 10, 2023</div>
          </div>
        </div>

        {/* Connected Providers pill */}
        <div className="mt-3 pt-2 border-t border-[#f0f4ea] flex items-center gap-1.5 text-[9.5px] font-semibold text-[#33650E]">
          <span className="material-symbols-outlined text-[13px]">check_circle</span>
          <span>All records connected across providers</span>
        </div>
      </div>

      {/* Layer 3: Grass and Lush Botanical Bed at Base */}
      <div className="absolute bottom-2 left-6 right-6 sm:left-12 sm:right-12 h-20 z-20 pointer-events-none overflow-hidden">
        {/* Soft grass silhouette */}
        <svg viewBox="0 0 500 80" className="w-full h-full object-cover opacity-90" fill="none">
          <ellipse cx="250" cy="70" rx="240" ry="25" fill="#e2f0cc" />
          <ellipse cx="280" cy="75" rx="190" ry="18" fill="#d2e8b6" />
          <path d="M120 75 Q 115 45 110 35 Q 125 50 135 75 Z" fill="#6f9140" opacity="0.8" />
          <path d="M140 75 Q 150 40 160 30 Q 155 55 148 75 Z" fill="#78a541" opacity="0.8" />
          <path d="M220 75 Q 215 35 205 25 Q 225 45 235 75 Z" fill="#6f9140" opacity="0.75" />
          <path d="M360 75 Q 375 30 390 20 Q 380 50 370 75 Z" fill="#78a541" opacity="0.85" />
        </svg>
      </div>

      {/* Layer 4: Approved Master Bulbasaur Mascot Sitting on Grass in Foreground */}
      <div className="absolute left-[20%] sm:left-[24%] bottom-0 z-30 pointer-events-none transform -translate-x-1/2">
        <img
          src="/assets/botanical/medilink-mascot-master.png"
          alt="MediLink Bulbasaur mascot companion"
          className="w-44 sm:w-56 md:w-64 lg:w-72 h-auto object-contain filter drop-shadow-[0_12px_24px_rgba(25,60,5,0.24)] select-none transition-transform duration-300 hover:scale-105 pointer-events-auto"
          loading="eager"
        />
      </div>

      {/* Layer 5: Decorative Botanical Leaf Vignettes (Top Right and Bottom Right) */}
      <div className="absolute -top-6 -right-6 w-32 sm:w-40 h-32 sm:h-40 z-30 pointer-events-none opacity-85">
        <img src="/assets/botanical/botanical-leaves.svg" alt="" aria-hidden="true" className="w-full h-full object-contain -rotate-45" />
      </div>

      <div className="absolute -bottom-8 -right-8 w-36 sm:w-44 h-36 sm:h-44 z-30 pointer-events-none opacity-90">
        <img src="/assets/botanical/botanical-corner.svg" alt="" aria-hidden="true" className="w-full h-full object-contain rotate-12" />
      </div>
    </div>
  );
};
