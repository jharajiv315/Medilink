import React from 'react';

export interface MascotCompanionProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'hero';
  variant?: 'sidebar' | 'hero' | 'journey' | 'inline';
  quote?: string;
  alt?: string;
  className?: string;
  decorative?: boolean;
}

export const MascotCompanion: React.FC<MascotCompanionProps> = ({
  size = 'md',
  variant = 'sidebar',
  quote,
  alt = 'MediLink Bulbasaur botanical health companion',
  className = '',
  decorative = true
}) => {
  if (variant === 'sidebar') {
    return (
      <div className={`relative px-4 py-3 rounded-2xl bg-gradient-to-b from-[#eaf4df] to-[#deedd0] border border-[#d2e4c2] overflow-hidden shadow-sm ${className}`}>
        {/* Background botanical leaf accents */}
        <div className="absolute -top-3 -right-3 w-16 h-16 opacity-40 pointer-events-none">
          <img src="/assets/botanical/botanical-leaves.svg" alt="" aria-hidden="true" className="w-full h-full object-contain" />
        </div>
        
        {/* Mascot Character Artwork */}
        <div className="relative flex justify-center -mt-1 mb-1">
          <img
            src="/assets/botanical/medilink-mascot-sidebar.webp"
            alt={decorative ? '' : alt}
            aria-hidden={decorative ? 'true' : undefined}
            className="w-24 h-24 object-contain filter drop-shadow-[0_4px_8px_rgba(33,76,0,0.12)] transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        </div>

        {/* Message Card */}
        {quote && (
          <div className="relative bg-[#ffffff]/90 backdrop-blur-xs px-3 py-2 rounded-xl border border-[#d6e5c8] shadow-xs text-center">
            <p className="text-[12px] font-medium text-[#2d5610] leading-snug font-['DM_Sans']">
              {quote}
            </p>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={`relative inline-block ${className}`}>
        <img
          src="/assets/botanical/medilink-mascot-master.png"
          alt={decorative ? '' : alt}
          aria-hidden={decorative ? 'true' : undefined}
          className="w-48 sm:w-60 md:w-72 lg:w-80 h-auto object-contain filter drop-shadow-[0_12px_24px_rgba(20,50,0,0.22)] select-none pointer-events-none"
          loading="eager"
        />
      </div>
    );
  }

  if (variant === 'journey') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <img
          src="/assets/botanical/medilink-mascot-small.webp"
          alt={decorative ? '' : alt}
          aria-hidden={decorative ? 'true' : undefined}
          className="w-10 h-10 object-contain drop-shadow-xs"
        />
      </div>
    );
  }

  // Default inline
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    hero: 'w-64 h-64'
  }[size];

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <img
        src="/assets/botanical/medilink-mascot-sidebar.webp"
        alt={decorative ? '' : alt}
        aria-hidden={decorative ? 'true' : undefined}
        className={`${sizeClasses} object-contain`}
        loading="lazy"
      />
    </div>
  );
};
