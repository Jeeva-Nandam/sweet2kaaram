import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import type { OrderStatus } from '../lib/types';
import { STATUS_COLOR, STATUS_LABEL } from '../lib/format';

export const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`} aria-hidden="true">{name}</span>
);

export const inputCls =
  'w-full h-11 px-3 rounded-lg border border-border-warm bg-white text-sm text-on-surface placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-surface-container disabled:text-text-muted';
export const textareaCls = inputCls.replace('h-11', 'min-h-24 py-2.5');
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
export const btnGhost =
  'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-border-warm bg-white text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50 cursor-pointer';
export const btnDanger =
  'inline-flex items-center justify-center gap-2 h-11 px-5 rounded-lg border border-red-200 bg-white text-sm font-semibold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-on-surface mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-text-muted mt-1">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer ${checked ? 'bg-tertiary' : 'bg-surface-dim'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

export const Spinner = ({ className = '' }: { className?: string }) => (
  <span className={`inline-block w-5 h-5 rounded-full border-2 border-primary/25 border-t-primary animate-spin ${className}`} role="status" aria-label="Loading" />
);
export const PageLoader = () => <div className="py-24 flex justify-center"><Spinner className="w-8 h-8" /></div>;

export function Empty({ icon, title, text, action }: { icon: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="py-16 px-4 text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-surface-container-low text-primary flex items-center justify-center mb-4">
        <Icon name={icon} className="text-3xl" />
      </div>
      <h3 className="font-serif text-xl font-semibold text-on-surface">{title}</h3>
      {text && <p className="text-sm text-text-muted mt-1.5 max-w-sm mx-auto">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const ErrorBox = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm p-4 flex items-start gap-3" role="alert">
    <Icon name="error" className="text-xl shrink-0" />
    <div className="flex-1">{message}</div>
    {onRetry && <button onClick={onRetry} className="font-bold underline cursor-pointer">Retry</button>}
  </div>
);

export const StatusBadge = ({ status }: { status: OrderStatus }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLOR[status]}`}>{STATUS_LABEL[status]}</span>
);

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}
        className={`bg-white w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl`}>
        <div className="sticky top-0 bg-white border-b border-border-warm px-5 h-14 flex items-center justify-between z-10">
          <h2 className="font-serif text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 text-text-muted hover:text-on-surface cursor-pointer"><Icon name="close" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/** Product / order thumbnails never break the layout, even when the link is dead or empty. */
export function Img({ src, alt, className = '' }: { src?: string; alt: string; className?: string }) {
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [src]);
  if (!src || bad) {
    return <div className={`bg-surface-container-low text-primary/40 flex items-center justify-center ${className}`}><Icon name="image" className="text-3xl" /></div>;
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setBad(true)} className={`object-cover ${className}`} />;
}

// ---- Toasts ----
type Toast = { id: number; kind: 'ok' | 'err'; text: string };
const ToastCtx = createContext<{ ok: (t: string) => void; err: (t: string) => void }>({ ok: () => {}, err: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast['kind'], text: string) => {
    const id = Date.now() + Math.random();
    setList((l) => [...l, { id, kind, text }]);
    setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 4500);
  }, []);
  return (
    <ToastCtx.Provider value={{ ok: (t) => push('ok', t), err: (t) => push('err', t) }}>
      {children}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] flex flex-col gap-2 w-[min(92vw,26rem)]" aria-live="polite">
        {list.map((t) => (
          <div key={t.id} className={`rounded-lg px-4 py-3 text-sm font-semibold shadow-lg flex items-center gap-2 text-white ${t.kind === 'ok' ? 'bg-tertiary' : 'bg-error'}`}>
            <Icon name={t.kind === 'ok' ? 'check_circle' : 'error'} className="text-lg" />{t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
