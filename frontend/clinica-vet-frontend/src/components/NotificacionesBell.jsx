import { useState, useEffect, useRef } from 'react';
import { useNotificaciones } from '../hooks/useDashboard';

// ─────────────────────────────────────────────────────────────
// NotificacionesBell — Campana de notificaciones con dropdown
// Muestra recordatorios próximos: vacunas (7 días) y consultas (hoy/mañana)
// ─────────────────────────────────────────────────────────────

const TIPO_CONFIG = {
  vacuna: {
    icon: '💉',
    color: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
    badge: 'Vacuna',
  },
  consulta: {
    icon: '📋',
    color: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
    badge: 'Consulta',
  },
  cita: {
    icon: '📅',
    color: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
    badge: 'Cita',
  },
};

function formatFecha(fechaStr) {
  if (!fechaStr) return '';
  const fecha = new Date(fechaStr);
  const hoy = new Date();
  const manana = new Date();
  manana.setDate(hoy.getDate() + 1);

  const soloFecha = (d) => d.toISOString().split('T')[0];

  if (soloFecha(fecha) === soloFecha(hoy)) return 'Hoy';
  if (soloFecha(fecha) === soloFecha(manana)) return 'Mañana';

  return fecha.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function NotificacionesBell() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Datos + refresco cada 5 min vía TanStack Query (refetchInterval en el hook).
  const { data, isLoading: loading, isError, refetch } = useNotificaciones();
  const notificaciones = Array.isArray(data) ? data : [];
  const error = isError ? 'No se pudieron cargar las notificaciones' : null;
  const fetchNotificaciones = refetch;

  // ── Cerrar dropdown al hacer clic fuera ──────────────────────
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const count = notificaciones.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Botón campana ── */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        title="Notificaciones y recordatorios"
        className={`
          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
          transition-all duration-150
          ${open
            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
          }
        `}
      >
        {/* Ícono campana con badge */}
        <span className="relative flex-shrink-0">
          <svg
            className={`w-4 h-4 ${open ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-sm">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </span>

        <span>Notificaciones</span>

        {count > 0 && (
          <span className="ml-auto text-xs font-semibold text-red-500 dark:text-red-400">
            {count}
          </span>
        )}
      </button>

      {/* ── Dropdown flotante ── */}
      {open && (
        <div className="
          absolute bottom-full left-0 mb-2 w-80
          bg-white dark:bg-slate-800
          border border-slate-200 dark:border-slate-700
          rounded-2xl shadow-xl z-50
          overflow-hidden
          animate-fade-in
        ">
          {/* Header del dropdown */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                Recordatorios próximos
              </h3>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Cuerpo del dropdown */}
          <div className="max-h-72 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8 gap-2 text-slate-400 dark:text-slate-500">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm">Cargando...</span>
              </div>
            )}

            {!loading && error && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                <button
                  onClick={fetchNotificaciones}
                  className="mt-2 text-xs text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Reintentar
                </button>
              </div>
            )}

            {!loading && !error && notificaciones.length === 0 && (
              <div className="px-4 py-8 text-center">
                <div className="text-3xl mb-2">✅</div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Sin recordatorios próximos
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  No hay citas, vacunas ni consultas en los próximos días
                </p>
              </div>
            )}

            {!loading && !error && notificaciones.length > 0 && (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700">
                {notificaciones.map((n) => {
                  const cfg = TIPO_CONFIG[n.tipo] || TIPO_CONFIG.consulta;
                  return (
                    <li key={n.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-start gap-3">
                        {/* Ícono tipo */}
                        <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base ${cfg.color}`}>
                          {cfg.icon}
                        </span>
                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-snug line-clamp-2">
                            {n.mensaje}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.color}`}>
                              {cfg.badge}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                              {formatFecha(n.fecha)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {!loading && notificaciones.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
                {count} recordatorio{count !== 1 ? 's' : ''} · Vacunas (7 días) y consultas (hoy/mañana)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
