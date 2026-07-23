/**
 * Paginación controlada. No se renderiza si hay una sola página.
 *
 * @param {number} page         página actual (1-based)
 * @param {number} totalPages
 * @param {(n: number) => void} onChange
 * @param {number} [totalItems] para el texto "N resultados"
 */
export default function Pagination({ page, totalPages, onChange, totalItems }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm text-slate-500 dark:text-slate-400">
        Página {page} de {totalPages}
        {typeof totalItems === 'number' && (
          <> · {totalItems} resultado{totalItems !== 1 ? 's' : ''}</>
        )}
      </span>
      <div className="flex gap-1.5">
        <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} className="page-btn">←</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <button key={n} onClick={() => onChange(n)} className={n === page ? 'page-btn-active' : 'page-btn'}>
            {n}
          </button>
        ))}
        <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="page-btn">→</button>
      </div>
    </div>
  );
}
