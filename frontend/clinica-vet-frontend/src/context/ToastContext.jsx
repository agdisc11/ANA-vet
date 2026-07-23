import { createContext, useContext, useState, useCallback, useRef } from 'react';

// ─────────────────────────────────────────────────────────────
// ToastContext — Sistema global de notificaciones apiladas.
// Reemplaza los alert() nativos por toasts elegantes y no bloqueantes.
//
// Uso:
//   const toast = useToast();
//   toast.success('Paciente creado');
//   toast.error('No se pudo guardar');
//   toast.info('Sincronizando…');
//   toast.warning('Revisa los campos');
// ─────────────────────────────────────────────────────────────

const ToastContext = createContext(null);

const VARIANTS = {
  success: {
    ring: 'border-emerald-200 dark:border-emerald-800/60',
    bar: 'bg-emerald-500',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    ),
  },
  error: {
    ring: 'border-red-200 dark:border-red-800/60',
    bar: 'bg-red-500',
    iconBg: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    ),
  },
  warning: {
    ring: 'border-amber-200 dark:border-amber-800/60',
    bar: 'bg-amber-500',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    ),
  },
  info: {
    ring: 'border-violet-200 dark:border-violet-800/60',
    bar: 'bg-violet-500',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
};

function ToastItem({ toast, onClose }) {
  const v = VARIANTS[toast.type] || VARIANTS.info;
  return (
    <div
      role="status"
      className={`pointer-events-auto relative w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border bg-white dark:bg-slate-900 shadow-lg shadow-slate-900/5 dark:shadow-black/30 animate-slide-up ${v.ring}`}
    >
      <span className={`absolute left-0 top-0 h-full w-1 ${v.bar}`} />
      <div className="flex items-start gap-3 px-4 py-3 pl-5">
        <span className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${v.iconBg}`}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            {v.icon}
          </svg>
        </span>
        <p className="flex-1 pt-0.5 text-sm font-medium text-slate-700 dark:text-slate-200 break-words">
          {toast.message}
        </p>
        <button
          onClick={onClose}
          aria-label="Cerrar notificación"
          className="-mr-1 flex-shrink-0 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, type = 'info', duration = 4000) => {
    if (!message) return;
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message: String(message), type }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  const api = useRef({
    show:    (msg, type, duration) => push(msg, type, duration),
    success: (msg, duration) => push(msg, 'success', duration),
    error:   (msg, duration) => push(msg, 'error', duration ?? 6000),
    warning: (msg, duration) => push(msg, 'warning', duration),
    info:    (msg, duration) => push(msg, 'info', duration),
    dismiss,
  }).current;

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-0 right-0 z-[100] flex flex-col items-end gap-2 p-4 sm:p-6">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>');
  }
  return ctx;
}

export default ToastContext;
