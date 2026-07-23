import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDashboardClinica, useDashboardEmpleado } from '../hooks/useDashboard';

// ── Módulos de navegación ─────────────────────────────────────
const modulos = [
  {
    key: 'tutores', label: 'Tutores', ruta: '/tutores',
    desc: 'Propietarios registrados',
    color: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400',
    hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    key: 'pacientes', label: 'Pacientes', ruta: '/pacientes',
    desc: 'Animales registrados',
    color: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400',
    hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
  },
  {
    key: 'consultas', label: 'Consultas', ruta: '/consultas',
    desc: 'Citas veterinarias',
    color: 'bg-violet-500', light: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400',
    hoverBorder: 'hover:border-violet-300 dark:hover:border-violet-700',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    key: 'hospitalizaciones', label: 'Hospitalizaciones', ruta: '/hospitalizaciones',
    desc: 'Pacientes internados',
    color: 'bg-amber-500', light: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400',
    hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    key: 'cirugias', label: 'Cirugías', ruta: '/cirugias',
    desc: 'Procedimientos quirúrgicos',
    color: 'bg-red-500', light: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400',
    hoverBorder: 'hover:border-red-300 dark:hover:border-red-700',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
  {
    key: 'vacunas', label: 'Vacunas', ruta: '/vacunas',
    desc: 'Plan de vacunación',
    color: 'bg-teal-500', light: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600 dark:text-teal-400',
    hoverBorder: 'hover:border-teal-300 dark:hover:border-teal-700',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
];

// Calculadoras destacadas para el banner del dashboard
const CALC_DESTACADAS = [
  { label: 'Anestesia', desc: 'Flow rates · ASA · Agente volátil' },
  { label: 'Fluidos', desc: 'Fluidoterapia · CRI · Osmolalidad' },
  { label: 'Blood Gas', desc: 'Ácido-base · Anion gap · HCO₃' },
  { label: 'Nutrición', desc: 'RER · DER · Cantidad a alimentar' },
  { label: 'Farmacia', desc: 'Dosis · Volumen · Concentración' },
  { label: 'Scores', desc: 'Pain · Glasgow · SIRS' },
  { label: 'Toxicología', desc: 'Exposición · Nivel de riesgo' },
  { label: 'Conversiones', desc: 'Peso · Temp · Presiones · Suturas' },
  { label: 'Cardiac', desc: 'MAP · Presión de pulso' },
  { label: 'Hematología', desc: 'Transfusión · Volumen sanguíneo' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// ── Helpers de formato seguro ─────────────────────────────────
function safeCurrency(val) {
  const n = Number(val ?? 0);
  return isNaN(n) ? '$0.00' : `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function safeInt(val) {
  const n = Number(val ?? 0);
  return isNaN(n) ? 0 : n;
}
function safeStr(val, fallback = '—') {
  return (val !== null && val !== undefined && String(val).trim() !== '') ? String(val) : fallback;
}
function safeDate(val) {
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '—';
  }
}

// ── Componente: KPI Card ──────────────────────────────────────
function KpiCard({ icon, label, value, sub, colorClass, bgClass, accent }) {
  return (
    <div className={`card p-5 flex items-start gap-4 border shadow-sm hover:shadow-md transition-all duration-200 ${accent || 'border-slate-100 dark:border-slate-700/60'}`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bgClass}`}>
        <span className={colorClass}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-0.5 leading-none tabular-nums">{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── Componente: Tarea Card (Empleado) ─────────────────────────
function TareaCard({ icon, label, value, sub, colorClass, bgClass, borderClass, statusDot }) {
  return (
    <div className={`card p-5 flex items-start gap-4 border shadow-sm hover:shadow-md transition-all duration-200 ${borderClass}`}>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${bgClass} relative`}>
        <span className={`${colorClass}`}>{icon}</span>
        {statusDot && (
          <span className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${statusDot}`} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-4xl font-extrabold mt-0.5 leading-none tabular-nums ${colorClass}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Componente: Medalla de actividad ─────────────────────────
function ActivityBadge({ count }) {
  const n = safeInt(count);
  if (n === 0) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500">
        0
      </span>
    );
  }
  if (n >= 20) {
    return (
      <span title="Élite" className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 ring-2 ring-amber-400/50">
        {n}
      </span>
    );
  }
  if (n >= 10) {
    return (
      <span title="Activo" className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
        {n}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
      {n}
    </span>
  );
}

// ── Componente: Estado vacío elegante ─────────────────────────
function EmptyState({ title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{title || 'Sin datos'}</p>
      {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// ── Vista: Dashboard Clínica ──────────────────────────────────
function DashboardClinica({ user }) {
  const navigate = useNavigate();
  const { data, isLoading: loading, isError, error: errObj } = useDashboardClinica();
  const error = isError ? (errObj?.response?.data?.error || 'Error al cargar el dashboard') : null;
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const kpis = data?.kpis ?? {};
  const scorecard = Array.isArray(data?.scorecard_empleados) ? data.scorecard_empleados : [];
  const ingresosRecientes = Array.isArray(data?.ingresos_recientes) ? data.ingresos_recientes : [];
  const alertasInventario = Array.isArray(data?.alertas_inventario) ? data.alertas_inventario : [];

  return (
    <div className="animate-fade-in space-y-8">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 capitalize mb-1">{today}</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {getGreeting()}, {safeStr(user?.nombre, 'Usuario')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-100 dark:border-blue-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />
              Torre de Control
            </span>
            <span className="text-sm">Vista analítica de tu clínica</span>
          </p>
        </div>
        <div className="flex-shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            Sistema operativo
          </div>
        </div>
      </div>

      {/* ── Banner Calculadoras ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-700 dark:via-blue-800 dark:to-indigo-900 p-6 shadow-lg ring-1 ring-blue-500/20">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-500/10 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white leading-tight">Módulo Avanzado de Calculadoras Clínicas</h2>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed max-w-lg">
              Herramientas de soporte para decisiones médicas en tiempo real con 10 categorías diagnósticas integradas.
            </p>
            <button
              onClick={() => navigate('/calculadora')}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 font-bold text-sm rounded-xl hover:bg-blue-50 active:scale-95 transition-all duration-150 shadow-sm hover:shadow-md"
            >
              <span>Abrir Calculadoras</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2 flex-shrink-0">
            {CALC_DESTACADAS.map((c) => (
              <button
                key={c.label}
                onClick={() => navigate('/calculadora')}
                title={`${c.label} — ${c.desc}`}
                className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/25 active:scale-95 transition-all duration-150 group border border-white/10 hover:border-white/30"
              >
                <span className="text-white text-xs font-medium leading-tight text-center">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPIs Globales ──────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            KPIs del Mes
          </h2>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700/60" />
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="Ingresos del Mes"
              value={safeCurrency(kpis?.ingresos_mes)}
              sub="Recibos finalizados"
              bgClass="bg-emerald-50 dark:bg-emerald-900/20"
              colorClass="text-emerald-600 dark:text-emerald-400"
              accent="border-emerald-100 dark:border-emerald-800/40"
            />
            <KpiCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              label="Pacientes Totales"
              value={safeInt(kpis?.total_pacientes).toLocaleString('es-MX')}
              sub="Registrados en la clínica"
              bgClass="bg-blue-50 dark:bg-blue-900/20"
              colorClass="text-blue-600 dark:text-blue-400"
              accent="border-blue-100 dark:border-blue-800/40"
            />
            <KpiCard
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              label="Consultas de Hoy"
              value={safeInt(kpis?.consultas_hoy)}
              sub={new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
              bgClass="bg-violet-50 dark:bg-violet-900/20"
              colorClass="text-violet-600 dark:text-violet-400"
              accent="border-violet-100 dark:border-violet-800/40"
            />
          </div>
        )}
      </div>

      {/* ── Torre de Control: Grid 3 columnas ───────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Torre de Control
          </h2>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700/60" />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>No se pudo cargar la Torre de Control.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

            {/* ── Columna 1: Finanzas — Ingresos Recientes ── */}
            <div className="card overflow-hidden border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
              {/* Header columna */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0 shadow-sm text-emerald-600 dark:text-emerald-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Finanzas</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Últimos {ingresosRecientes.length || 0} ingresos</p>
                </div>
                {ingresosRecientes.length > 0 && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                    {ingresosRecientes.length}
                  </span>
                )}
              </div>

              {/* Tabla ingresos recientes */}
              {ingresosRecientes.length === 0 ? (
                <EmptyState title="Sin ingresos recientes" subtitle="Los recibos finalizados aparecerán aquí" />
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50 flex-1">
                  {ingresosRecientes.map((rec, idx) => (
                    <div
                      key={rec?.id ?? idx}
                      className="px-5 py-3.5 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-colors duration-150 group"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {safeStr(rec?.paciente, 'Paciente desconocido')}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            Cobró: {safeStr(rec?.empleado, 'Sin asignar')}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {safeDate(rec?.fecha)}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap tabular-nums">
                            {safeCurrency(rec?.total)}
                          </span>
                          <div className="w-full h-0.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer total */}
              {ingresosRecientes.length > 0 && (
                <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total mostrado</span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {safeCurrency(ingresosRecientes.reduce((acc, r) => acc + Number(r?.total ?? 0), 0))}
                  </span>
                </div>
              )}
            </div>

            {/* ── Columna 2: Personal — Scorecard de Empleados ── */}
            <div className="card overflow-hidden border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col">
              {/* Header columna */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10">
                <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0 shadow-sm text-violet-600 dark:text-violet-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Personal</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Scorecard de actividad</p>
                </div>
                {scorecard.length > 0 && (
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-2 py-0.5 rounded-full">
                    {scorecard.length}
                  </span>
                )}
              </div>

              {/* Tabla scorecard */}
              {scorecard.length === 0 ? (
                <EmptyState title="No hay empleados registrados" subtitle="Los empleados activos aparecerán aquí" />
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700">
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Empleado</th>
                        <th className="text-center px-2 py-2.5 font-semibold text-violet-500 dark:text-violet-400 text-xs uppercase tracking-wider" title="Consultas">Cons.</th>
                        <th className="text-center px-2 py-2.5 font-semibold text-red-500 dark:text-red-400 text-xs uppercase tracking-wider" title="Cirugías">Cir.</th>
                        <th className="text-center px-2 py-2.5 font-semibold text-amber-500 dark:text-amber-400 text-xs uppercase tracking-wider" title="Hospitalizaciones">Hosp.</th>
                        <th className="text-center px-3 py-2.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {scorecard.map((emp, idx) => {
                        const isTop = idx === 0;
                        return (
                          <tr
                            key={emp?.empleado_id ?? idx}
                            className={`hover:bg-violet-50/50 dark:hover:bg-violet-900/10 transition-colors duration-150 ${isTop ? 'bg-amber-50/40 dark:bg-amber-900/5' : ''}`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                                  idx === 0 ? 'bg-amber-400' : idx === 1 ? 'bg-slate-400' : idx === 2 ? 'bg-orange-400' : 'bg-gradient-to-br from-blue-400 to-indigo-500'
                                }`}>
                                  {idx < 3 ? idx + 1 : safeStr(emp?.empleado_nombre, '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <p className={`font-semibold text-xs truncate max-w-[100px] ${isTop ? 'text-amber-700 dark:text-amber-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {safeStr(emp?.empleado_nombre, 'Sin nombre')}
                                  </p>
                                  <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                    {safeStr(emp?.rol, 'Sin rol')}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span className="font-bold text-violet-600 dark:text-violet-400 text-xs tabular-nums">{safeInt(emp?.total_consultas)}</span>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span className="font-bold text-red-600 dark:text-red-400 text-xs tabular-nums">{safeInt(emp?.total_cirugias)}</span>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span className="font-bold text-amber-600 dark:text-amber-400 text-xs tabular-nums">{safeInt(emp?.total_hospitalizaciones)}</span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <ActivityBadge count={emp?.total_actividad} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Columna 3: Alertas Críticas de Inventario ── */}
            <div className="flex flex-col gap-4">
              {/* Panel de alertas */}
              <div className="rounded-2xl overflow-hidden border-2 border-red-200 dark:border-red-800/60 shadow-md hover:shadow-lg transition-shadow duration-200">
                {/* Header alerta */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 dark:from-red-700 dark:to-orange-700 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Alertas Críticas</h3>
                      <p className="text-red-100 text-xs">Inventario bajo — Acción requerida</p>
                    </div>
                    <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full ${alertasInventario.length > 0 ? 'bg-white text-red-600' : 'bg-white/20 text-white'}`}>
                      {alertasInventario.length}
                    </span>
                  </div>
                </div>

                {/* Lista de alertas */}
                {alertasInventario.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-2">
                      <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Sin alertas de inventario</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Todo el stock está en niveles normales</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 divide-y divide-red-100 dark:divide-red-900/30">
                    {alertasInventario.map((item, idx) => (
                      <div
                        key={item?.id ?? idx}
                        className="flex items-center justify-between px-5 py-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors duration-150"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0 text-red-500 dark:text-red-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {safeStr(item?.nombre, 'Producto sin nombre')}
                            </p>
                            <p className="text-xs text-red-500 dark:text-red-400 font-medium mt-0.5">
                              Stock crítico
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg text-sm font-bold ${
                            safeInt(item?.stock) <= 2
                              ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 ring-2 ring-red-300 dark:ring-red-700'
                              : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 ring-2 ring-orange-300 dark:ring-orange-700'
                          }`}>
                            {safeInt(item?.stock)}
                          </span>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">unidades</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer alerta */}
                <div className="bg-orange-50 dark:bg-orange-900/10 border-t border-orange-100 dark:border-orange-900/30 px-5 py-3">
                  <p className="text-xs text-orange-600 dark:text-orange-400 font-medium flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Datos de inventario en modo demo. Módulo completo próximamente.</span>
                  </p>
                </div>
              </div>

              {/* Mini-panel de estado general */}
              <div className="card p-4 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow duration-200">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>Estado General</span>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700/60" />
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                      Sistema operativo
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">OK</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full inline-block ${alertasInventario.length > 0 ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`} />
                      Inventario
                    </span>
                    <span className={`text-xs font-semibold ${alertasInventario.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {alertasInventario.length > 0 ? `${alertasInventario.length} alerta${alertasInventario.length !== 1 ? 's' : ''}` : 'OK'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                      Personal activo
                    </span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {scorecard.length} empleado{scorecard.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 pb-2">
        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
        <p className="text-xs text-slate-400 dark:text-slate-600 px-3">
          ANA-vet · Sistema de Gestión Veterinaria
        </p>
        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

// ── Vista: Dashboard Empleado ─────────────────────────────────
function DashboardEmpleado({ user }) {
  const navigate = useNavigate();
  const { data, isLoading: loading, isError, error: errObj } = useDashboardEmpleado();
  const error = isError ? (errObj?.response?.data?.error || 'Error al cargar el dashboard') : null;
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const tareas = data?.tareas_hoy ?? {};
  const consultasHoy = safeInt(tareas?.consultas_hoy);
  const cirugiasHoy = safeInt(tareas?.cirugias_hoy);
  const totalTareas = safeInt(tareas?.total_tareas);

  // Estado de carga del empleado: libre / ocupado
  const estadoEmpleado = totalTareas === 0
    ? { label: 'Libre', dot: 'bg-emerald-400', badge: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40' }
    : totalTareas <= 3
    ? { label: 'Activo', dot: 'bg-blue-400', badge: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/40' }
    : { label: 'Ocupado', dot: 'bg-orange-400 animate-pulse', badge: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800/40' };

  const accesosRapidos = [
    {
      label: 'Nuevo Paciente',
      desc: 'Registrar un nuevo animal',
      ruta: '/pacientes?action=new',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ),
      bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
      textClass: 'text-emerald-700 dark:text-emerald-300',
      iconClass: 'text-emerald-600 dark:text-emerald-400',
      borderClass: 'border-emerald-200 dark:border-emerald-800/60',
      hoverClass: 'hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/30',
      dotColor: 'bg-emerald-400',
    },
    {
      label: 'Nueva Consulta',
      desc: 'Registrar una consulta médica',
      ruta: '/consultas?action=new',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      bgClass: 'bg-violet-50 dark:bg-violet-900/20',
      textClass: 'text-violet-700 dark:text-violet-300',
      iconClass: 'text-violet-600 dark:text-violet-400',
      borderClass: 'border-violet-200 dark:border-violet-800/60',
      hoverClass: 'hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-50/80 dark:hover:bg-violet-900/30',
      dotColor: 'bg-violet-400',
    },
    {
      label: 'Nueva Cirugía',
      desc: 'Registrar un procedimiento quirúrgico',
      ruta: '/cirugias?action=new',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      bgClass: 'bg-red-50 dark:bg-red-900/20',
      textClass: 'text-red-700 dark:text-red-300',
      iconClass: 'text-red-600 dark:text-red-400',
      borderClass: 'border-red-200 dark:border-red-800/60',
      hoverClass: 'hover:border-red-400 dark:hover:border-red-600 hover:bg-red-50/80 dark:hover:bg-red-900/30',
      dotColor: 'bg-red-400',
    },
    {
      label: 'Calculadoras',
      desc: 'Herramientas clínicas de apoyo',
      ruta: '/calculadora',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      bgClass: 'bg-blue-50 dark:bg-blue-900/20',
      textClass: 'text-blue-700 dark:text-blue-300',
      iconClass: 'text-blue-600 dark:text-blue-400',
      borderClass: 'border-blue-200 dark:border-blue-800/60',
      hoverClass: 'hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/80 dark:hover:bg-blue-900/30',
      dotColor: 'bg-blue-400',
    },
  ];

  return (
    <div className="animate-fade-in space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 capitalize mb-1">{today}</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {getGreeting()}, {safeStr(user?.nombre, 'Usuario')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
            {user?.rol_nombre && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-100 dark:border-indigo-800/40">
                {user.rol_nombre}
              </span>
            )}
            <span className="text-sm">{safeStr(user?.clinica_nombre, 'Tu clínica')}</span>
          </p>
        </div>
        {!loading && !error && (
          <div className="flex-shrink-0">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${estadoEmpleado.badge}`}>
              <span className={`w-2 h-2 rounded-full inline-block ${estadoEmpleado.dot}`} />
              {estadoEmpleado.label}
            </div>
          </div>
        )}
      </div>

      {/* ── Mis Tareas de Hoy ───────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Mis Tareas de Hoy
          </h2>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700/60" />
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse h-28 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TareaCard
              icon={
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              label="Consultas de Hoy"
              value={consultasHoy}
              sub="Asignadas a ti hoy"
              bgClass="bg-violet-50 dark:bg-violet-900/20"
              colorClass={consultasHoy > 0 ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'}
              borderClass="border border-violet-100 dark:border-violet-800/40"
              statusDot={consultasHoy > 0 ? 'bg-violet-400' : 'bg-slate-300 dark:bg-slate-600'}
            />
            <TareaCard
              icon={
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              }
              label="Cirugías de Hoy"
              value={cirugiasHoy}
              sub="Procedimientos programados"
              bgClass="bg-red-50 dark:bg-red-900/20"
              colorClass={cirugiasHoy > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}
              borderClass="border border-red-100 dark:border-red-800/40"
              statusDot={cirugiasHoy > 0 ? 'bg-red-400 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}
            />
            <TareaCard
              icon={
                totalTareas === 0 ? (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : totalTareas <= 3 ? (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              }
              label="Total de Tareas"
              value={totalTareas}
              sub={totalTareas === 0 ? 'Sin actividades hoy' : totalTareas <= 3 ? 'Carga moderada' : 'Día ocupado'}
              bgClass={totalTareas === 0 ? 'bg-slate-50 dark:bg-slate-800/40' : totalTareas <= 3 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}
              colorClass={totalTareas === 0 ? 'text-slate-400 dark:text-slate-500' : totalTareas <= 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-600 dark:text-orange-400'}
              borderClass={totalTareas === 0 ? 'border border-slate-100 dark:border-slate-700/60' : totalTareas <= 3 ? 'border border-emerald-100 dark:border-emerald-800/40' : 'border border-orange-100 dark:border-orange-800/40'}
              statusDot={totalTareas === 0 ? 'bg-emerald-400' : totalTareas <= 3 ? 'bg-blue-400' : 'bg-orange-400 animate-pulse'}
            />
          </div>
        )}
      </div>

      {/* ── Resumen de Agenda ───────────────────────────────── */}
      {!loading && !error && (
        <div className="card p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shadow-sm text-indigo-600 dark:text-indigo-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Agenda Médica Inmediata</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {/* Consultas */}
            <div className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150 ${
              consultasHoy > 0
                ? 'bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800/30'
                : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/40'
            }`}>
              <div className="flex items-center gap-3">
                <span className={`${consultasHoy > 0 ? 'text-violet-500 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Consultas pendientes</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Pacientes asignados hoy</p>
                </div>
              </div>
              <span className={`text-2xl font-extrabold tabular-nums ${consultasHoy > 0 ? 'text-violet-600 dark:text-violet-400' : 'text-slate-300 dark:text-slate-600'}`}>
                {consultasHoy}
              </span>
            </div>
            {/* Cirugías */}
            <div className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150 ${
              cirugiasHoy > 0
                ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/30'
                : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-700/40'
            }`}>
              <div className="flex items-center gap-3">
                <span className={`${cirugiasHoy > 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cirugías programadas</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Procedimientos del día</p>
                </div>
              </div>
              <span className={`text-2xl font-extrabold tabular-nums ${cirugiasHoy > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-300 dark:text-slate-600'}`}>
                {cirugiasHoy}
              </span>
            </div>
            {/* Estado general */}
            <div className={`flex items-center gap-3 p-3.5 rounded-xl border ${
              totalTareas === 0
                ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30'
                : totalTareas <= 3
                ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/30'
                : 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800/30'
            }`}>
              <span className={`flex-shrink-0 ${
                totalTareas === 0 ? 'text-emerald-500 dark:text-emerald-400' : totalTareas <= 3 ? 'text-blue-500 dark:text-blue-400' : 'text-orange-500 dark:text-orange-400'
              }`}>
                {totalTareas === 0 ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : totalTareas <= 3 ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
              </span>
              <p className={`text-sm font-medium ${
                totalTareas === 0
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : totalTareas <= 3
                  ? 'text-blue-700 dark:text-blue-400'
                  : 'text-orange-700 dark:text-orange-400'
              }`}>
                {totalTareas === 0
                  ? 'Sin actividades asignadas para hoy.'
                  : `Tienes ${totalTareas} actividad${totalTareas !== 1 ? 'es' : ''} programada${totalTareas !== 1 ? 's' : ''} para hoy.`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Accesos Rápidos ─────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Accesos Rápidos
          </h2>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700/60" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accesosRapidos.map((a) => (
            <button
              key={a.ruta}
              onClick={() => navigate(a.ruta)}
              className={`card p-5 text-left group hover:shadow-md active:scale-95 transition-all duration-200 border ${a.borderClass} ${a.hoverClass}`}
            >
              <div className={`w-14 h-14 rounded-2xl ${a.bgClass} ${a.iconClass} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200 shadow-sm relative`}>
                {a.icon}
                <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${a.dotColor}`} />
              </div>
              <p className={`font-bold text-sm ${a.textClass}`}>{a.label}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">{a.desc}</p>
              <div className={`mt-3 text-xs font-bold ${a.textClass} flex items-center gap-1 group-hover:gap-2 transition-all duration-200`}>
                <span>Ir ahora</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Módulos del sistema ─────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Módulos del Sistema
          </h2>
          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700/60" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {modulos.map(m => (
            <button
              key={m.key}
              onClick={() => navigate(m.ruta)}
              className={`card p-4 text-left hover:shadow-md active:scale-95 transition-all duration-200 group border border-slate-100 dark:border-slate-700/60 ${m.hoverBorder}`}
            >
              <div className={`w-10 h-10 rounded-xl ${m.light} ${m.text} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
                {m.icon}
              </div>
              <p className={`text-xs font-bold ${m.text}`}>{m.label}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-relaxed">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 pb-2">
        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
        <p className="text-xs text-slate-400 dark:text-slate-600 px-3">
          ANA-vet · Sistema de Gestión Veterinaria
        </p>
        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

// ── Componente Principal: Dashboard ──────────────────────────
export default function Dashboard() {
  const { tipo, user } = useAuth();

  if (tipo === 'clinica') {
    return <DashboardClinica user={user} />;
  }

  if (tipo === 'empleado') {
    return <DashboardEmpleado user={user} />;
  }

  // Fallback (no debería ocurrir si las rutas están protegidas)
  return (
    <div className="animate-fade-in flex items-center justify-center min-h-64">
      <div className="text-center text-slate-400 dark:text-slate-500">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="font-medium">Sesión no reconocida</p>
        <p className="text-sm mt-1">Por favor, inicia sesión nuevamente.</p>
      </div>
    </div>
  );
}
