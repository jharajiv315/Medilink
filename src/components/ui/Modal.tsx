import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className={`relative transform overflow-hidden rounded-2xl bg-white p-6 sm:p-8 text-left shadow-2xl border border-[#DFE5D8] transition-all w-full ${maxWidthStyles[maxWidth]} my-8`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-[#DFE5D8] mb-5">
            <div>
              {title && (
                <h3 className="font-[\x27Plus_Jakarta_Sans\x27] text-lg font-bold text-[#0B0808]">
                  {title}
                </h3>
              )}
              {description && (
                <p className="font-[\x27DM_Sans\x27] text-xs text-[#667065] mt-1">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-[#667065] hover:text-[#0B0808] hover:bg-[#F2F7EB] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="font-[\x27DM_Sans\x27]">{children}</div>
        </div>
      </div>
    </div>
  );
};
