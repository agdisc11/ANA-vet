/**
 * Panel de formulario colapsable (el bloque `.form-section` con título,
 * botón de cerrar y fila de acciones que cada página repetía).
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {string} title
 * @param {React.ReactNode} children   los campos (normalmente una grilla)
 * @param {React.ReactNode} footer     botones de guardar/cancelar
 */
export default function FormPanel({ open, onClose, title, children, footer }) {
  if (!open) return null;

  return (
    <div className="form-section animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" aria-label="Cerrar">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {children}
      {footer && <div className="flex gap-3 mt-5">{footer}</div>}
    </div>
  );
}
