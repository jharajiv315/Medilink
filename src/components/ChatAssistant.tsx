import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, MessageCircle, RotateCcw, Leaf } from 'lucide-react';
import { Modal } from './ui/Modal.tsx';
import { useAuth } from '../context/AuthContext.tsx';

type Message = { role: 'user' | 'assistant'; content: string; source?: string };
const welcome: Message = { role: 'assistant', content: 'Welcome to MediLink. I can help you find your way around your records and sharing permissions. What would you like to do?', source: 'guide' };
const suggestions = ['Find my patient code', 'Share records with my doctor', 'Import a record'];

export function ChatAssistant() {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [useAI, setUseAI] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    controller.current?.abort(); controller.current = null;
    setMessages([welcome]); setInput(''); setError(''); setBusy(false); setUseAI(false); setOpen(false);
    return () => controller.current?.abort();
  }, [currentUser.id]);
  useEffect(() => { if (open) end.current?.scrollIntoView({ block: 'nearest' }); }, [messages, busy, open]);

  async function send(text = input) {
    if (!text.trim() || controller.current) return;
    const next: Message[] = [...messages, { role: 'user', content: text.trim() }];
    const request = new AbortController(); controller.current = request;
    setMessages(next); setInput(''); setBusy(true); setError('');
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: request.signal,
        body: JSON.stringify({ messages: next.slice(-11).map(({ role, content }) => ({ role, content })), useAI }) });
      const data = await response.json();
      if (!response.ok || !data.reply) throw new Error(data.error || 'Unable to send your message. Please try again.');
      if (!request.signal.aborted) setMessages([...next, { role: 'assistant', content: data.reply, source: data.source }]);
    } catch (err) {
      if (!request.signal.aborted) { setError(err instanceof Error ? err.message : 'Unable to connect.'); setInput(text); setMessages(next.slice(0, -1)); }
    } finally { if (controller.current === request) { controller.current = null; setBusy(false); } }
  }

  return <>
    <button onClick={() => setOpen(true)} aria-label="Open MediLink assistant" className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-white/30 bg-[#285208] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-[#214C00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#33650E]">
      <MessageCircle size={19} /><span className="hidden sm:inline">Ask MediLink</span>
    </button>
    <Modal isOpen={open} onClose={() => setOpen(false)} title="MediLink assistant" description="A little guidance, whenever you need it." maxWidth="md">
      <div className="flex items-center justify-between gap-3 pb-3 text-xs text-[#667065]">
        <span className="inline-flex items-center gap-1.5"><Leaf size={14} /> Product guidance</span>
        <button disabled={busy} onClick={() => { setMessages([welcome]); setError(''); setInput(''); }} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-[#F2F7EB] disabled:opacity-40"><RotateCcw size={13} /> New conversation</button>
      </div>
      <div role="log" aria-label="Conversation" aria-live="polite" className="max-h-[38dvh] min-h-40 space-y-4 overflow-y-auto overscroll-contain pr-1">
        {messages.map((message, i) => <div key={i} className={message.role === 'user' ? 'ml-8' : 'mr-4'}>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#667065]">{message.role === 'user' ? 'You' : message.source === 'gemini' ? 'MediLink · AI response' : 'MediLink · Help guide'}</p>
          <div className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'bg-[#285208] text-white rounded-br-md' : 'bg-[#F2F7EB] text-[#30392A] rounded-bl-md'}`}>{message.content}</div>
        </div>)}
        {busy && <p role="status" className="text-xs text-[#667065]">Preparing your reply…</p>}
        <div ref={end} />
      </div>
      {messages.length === 1 && <div className="mt-4 flex flex-wrap gap-2">{suggestions.map(text => <button key={text} onClick={() => void send(text)} className="rounded-full border border-[#DFE5D8] px-3 py-2 text-xs text-[#33650E] hover:bg-[#F2F7EB]">{text}</button>)}</div>}
      {error && <p role="alert" className="mt-3 text-xs text-[#A33837]">{error}</p>}
      <form className="mt-4 flex gap-2 rounded-2xl border border-[#DFE5D8] bg-white p-2 focus-within:border-[#78A541]" onSubmit={e => { e.preventDefault(); void send(); }}>
        <input aria-label="Message MediLink" value={input} maxLength={1500} onChange={e => setInput(e.target.value)} placeholder="How can I help?" className="min-w-0 flex-1 bg-transparent px-2 text-base outline-none" />
        <button type="submit" aria-label="Send message" disabled={busy || !input.trim()} className="rounded-xl bg-[#285208] p-3 text-white disabled:opacity-40"><ArrowUp size={18} /></button>
      </form>
      <label className="mt-3 flex items-start gap-2 text-xs text-[#667065]"><input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} className="mt-0.5 accent-[#33650E]" /> Allow Gemini for questions beyond the help guide. This sends this conversation to Google.</label>
      <p className="mt-2 text-[11px] leading-relaxed text-[#667065]">Please leave out private medical details. This assistant cannot access your records or give medical advice. Conversations aren’t saved by MediLink and clear when you sign out or reload.</p>
    </Modal>
  </>;
}
