import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  size?: 'sm' | 'md';
  pulse?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  pulse = false,
  icon,
  className = ''
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5'
  };

  const variantStyles = {
    success: 'bg-[#EDF6E6] text-[#33650E] border-[#D0E4B6]',
    warning: 'bg-[#FFF5E5] text-[#985C12] border-[#F2D4A8]',
    danger: 'bg-[#FFF0EF] text-[#A33837] border-[#F8C8C6]',
    neutral: 'bg-[#F2F7EB] text-[#484D45] border-[#DFE5D8]',
    info: 'bg-[#EBF3FC] text-[#1E56A0] border-[#C3DCF7]'
  };

  const pulseColors = {
    success: 'bg-[#33650E]',
    warning: 'bg-[#985C12]',
    danger: 'bg-[#A33837]',
    neutral: 'bg-[#667065]',
    info: 'bg-[#1E56A0]'
  };

  return (
    <span
      className={`inline-flex items-center font-medium font-body rounded-full border ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColors[variant]}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseColors[variant]}`} />
        </span>
      )}
      {icon}
      <span>{children}</span>
    </span>
  );
};
