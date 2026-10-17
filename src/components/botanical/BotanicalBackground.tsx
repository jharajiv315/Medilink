import React from 'react';

interface BotanicalBackgroundProps {
  position?: 'top-right' | 'bottom-left' | 'bottom-right' | 'both-corners';
  className?: string;
}

export const BotanicalBackground: React.FC<BotanicalBackgroundProps> = ({
  position = 'both-corners',
  className = ''
}) => {
  return (
    <div className={`pointer-events-none fixed inset-0 overflow-hidden z-0 select-none ${className}`} aria-hidden="true">
      {(position === 'top-right' || position === 'both-corners') && (
        <div className="absolute top-0 right-0 w-64 md:w-80 lg:w-96 h-64 md:h-80 lg:h-96 opacity-35 mix-blend-multiply transition-opacity duration-500">
          <img
            src="/assets/botanical/botanical-corner.svg"
            alt=""
            className="w-full h-full object-contain rotate-180 transform -scale-x-100"
          />
        </div>
      )}

      {(position === 'bottom-left' || position === 'both-corners') && (
        <div className="absolute bottom-0 left-0 w-48 md:w-64 lg:w-80 h-48 md:h-64 lg:h-80 opacity-30 mix-blend-multiply transition-opacity duration-500">
          <img
            src="/assets/botanical/botanical-leaves.svg"
            alt=""
            className="w-full h-full object-contain -rotate-12"
          />
        </div>
      )}

      {position === 'bottom-right' && (
        <div className="absolute bottom-0 right-0 w-48 md:w-64 lg:w-80 h-48 md:h-64 lg:h-80 opacity-35 mix-blend-multiply">
          <img
            src="/assets/botanical/botanical-leaves.svg"
            alt=""
            className="w-full h-full object-contain rotate-45 transform scale-x-100"
          />
        </div>
      )}
    </div>
  );
};
