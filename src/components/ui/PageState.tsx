import React from 'react';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export function PageState({ error, onRetry, title = 'Loading your records' }: { error?: string; onRetry?: () => void; title?: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <div className="rounded-3xl border border-[#DFE5D8] bg-white p-8 text-center shadow-[0_8px_32px_rgba(33,76,0,0.04)] sm:p-12" role={error ? 'alert' : 'status'} aria-live="polite">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F7EB] text-[#33650E]">
          {error ? <AlertCircle className="h-6 w-6" /> : <Loader2 className="h-6 w-6 animate-spin" />}
        </div>
        <h1 className="text-xl font-bold">{error ? 'We couldn’t load this page' : title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[#667065]">{error || 'Your workspace will be ready in a moment.'}</p>
        {error && onRetry && <button onClick={onRetry} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#33650E] px-5 py-3 text-sm font-semibold text-white hover:bg-[#285208]">Try again <ArrowRight className="h-4 w-4" /></button>}
      </div>
    </div>
  );
}
