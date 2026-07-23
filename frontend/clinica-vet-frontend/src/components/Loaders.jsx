// ─────────────────────────────────────────────────────────────
// Loaders — Componentes reutilizables de estado de carga.
//   <Spinner />            → spinner inline
//   <PageLoader />         → spinner centrado para páginas
//   <Skeleton />           → bloque "shimmer"
//   <TableSkeleton />      → filas de tabla en carga
//   <EmptyState />         → estado vacío consistente
// ─────────────────────────────────────────────────────────────

export function Spinner({ className = 'h-5 w-5', label }) {
  return (
    <span className="inline-flex items-center gap-2" role="status" aria-live="polite">
      <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {label && <span className="text-sm">{label}</span>}
    </span>
  );
}

export function PageLoader({ label = 'Cargando…' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-400 dark:text-slate-500">
      <Spinner className="h-7 w-7" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 dark:bg-slate-700/50 ${className}`} />;
}

export function TableSkeleton({ rows = 6, cols = 5 }) {
  return (
    <div className="table-wrapper overflow-hidden">
      <div className="space-y-px">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={`h-4 ${c === 0 ? 'w-32' : c === cols - 1 ? 'ml-auto w-16' : 'w-24'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <div className="mb-3 text-slate-300 dark:text-slate-600">
        {icon || (
          <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )}
      </div>
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</p>
      {hint && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
