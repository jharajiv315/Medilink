import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium font-body transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-xl gap-2 shadow-sm',
    lg: 'text-base px-6 py-3.5 rounded-xl gap-2.5 shadow'
  };

  const variantStyles = {
    primary: 'bg-[#33650E] hover:bg-[#285208] text-white focus:ring-[#33650E]',
    secondary: 'bg-white hover:bg-[#F2F7EB] text-[#0B0808] border border-[#DFE5D8] focus:ring-[#33650E]',
    outline: 'bg-transparent hover:bg-[#F2F7EB] text-[#33650E] border border-[#33650E]/40 focus:ring-[#33650E]',
    danger: 'bg-[#A33837] hover:bg-[#862D2C] text-white focus:ring-[#A33837]',
    ghost: 'bg-transparent hover:bg-[#F2F7EB] text-[#484D45] focus:ring-[#33650E]'
  };

  return (
    <button
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
};
