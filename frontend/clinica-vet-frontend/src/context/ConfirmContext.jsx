import { createContext, useContext, useState, useCallback, useRef } from 'react';

// ─────────────────────────────────────────────────────────────
// ConfirmContext — Diálogo de confirmación basado en promesas.
// Reemplaza window.confirm() por un modal accesible y con estilo.
//
// Uso:
//   const confirm = useConfirm();
//   const ok = await confirm({
//     title: 'Eliminar tutor',
//     message: '¿Seguro que deseas eliminar este tutor?',
//     confirmText: 'Eliminar',
//     tone: 'danger',
//   });
//   if (ok) { ... }
// ─────────────────────────────────────────────────────────────

const ConfirmContext = createContext(null);

const TONES = {
  danger: {
    iconBg: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
    btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  },
  primary: {
    iconBg: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
    btn: 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-500',
  },
  warning: {
    iconBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    btn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
  },
};

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const resolver = useRef(null);

  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolver.current = resolve;
      setState({
        title:       opts.title       || '¿Estás seguro?',
        message:     opts.message      || 'Esta acción no se puede deshacer.',
        confirmText: opts.confirmText  || 'Confirmar',
        cancelText:  opts.cancelText   || 'Cancelar',
        tone:        opts.tone         || 'danger',
      });
    });
  }, []);

  const close = useCallback((result) => {
    if (resolver.current) {
      resolver.current(result);
      resolver.current = null;
    }
    setState(null);
  }, []);

  const tone = state ? (TONES[state.tone] || TONES.danger) : TONES.danger;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => close(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${tone.iconBg}`}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{state.title}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{state.message}</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => close(false)}
                className="btn-secondary flex-1 justify-center"
              >
                {state.cancelText}
              </button>
              <button
                autoFocus
                onClick={() => close(true)}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 ${tone.btn}`}
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm debe usarse dentro de <ConfirmProvider>');
  }
  return ctx;
}

export default ConfirmContext;
