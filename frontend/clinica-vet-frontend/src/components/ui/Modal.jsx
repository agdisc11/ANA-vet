import { useEffect } from 'react';

/**
 * Modal centrado con overlay. Cierra con Escape o clic en el backdrop.
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {string} [title]
 * @param {React.ReactNode} [icon]     ícono junto al título
 * @param {React.ReactNode} children   cuerpo
 * @param {React.ReactNode} [footer]   fila de acciones (botones)
 * @param {string} [maxWidth]          clase de ancho (default max-w-sm)
 */
export default function Modal({ open, onClose, title, icon, children, footer, maxWidth = 'max-w-sm' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full ${maxWidth} p-6 animate-slide-up`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {icon}
              <h2 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" aria-label="Cerrar">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {children}
        {footer && <div className="flex gap-3 mt-5">{footer}</div>}
      </div>
    </div>
  );
}
