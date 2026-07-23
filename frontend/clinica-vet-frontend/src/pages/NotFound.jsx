import { Link } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────
// NotFound — Página 404 para rutas inexistentes.
// ─────────────────────────────────────────────────────────────
export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center animate-fade-in">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-50 dark:bg-violet-900/20">
        <span className="text-4xl">🐾</span>
      </div>
      <p className="text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">404</p>
      <h1 className="mt-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
        Esta página se escapó del consultorio
      </h1>
      <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        La ruta que buscas no existe o fue movida. Verifica la dirección o vuelve al inicio.
      </p>
      <Link to="/" className="btn-primary mt-6">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        Volver al Dashboard
      </Link>
    </div>
  );
}
