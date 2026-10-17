import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true
}) => {
  const iconSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-9 h-9' : 'w-7 h-7';
  const textSize = size === 'sm' ? 'text-[17px]' : size === 'lg' ? 'text-[24px]' : 'text-[20px]';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Botanical Two-Leaf Mark */}
      <svg
        className={`${iconSize} shrink-0`}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Left primary leaf */}
        <path
          d="M8 26 C 6 18 10 9 20 6 C 24 14 20 23 8 26 Z"
          fill="#33650E"
        />
        {/* Leaf central stem line */}
        <path
          d="M10 24 Q 15 17 19 8"
          stroke="#558f22"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* Right accent leaf */}
        <path
          d="M17 25 C 19 19 23 15 28 13 C 29 19 25 24 17 25 Z"
          fill="#6F9140"
          opacity="0.95"
        />
      </svg>

      {showText && (
        <span className={`font-['Plus_Jakarta_Sans'] font-bold ${textSize} tracking-tight text-[#0B0808]`}>
          MediLink
        </span>
      )}
    </div>
  );
};
