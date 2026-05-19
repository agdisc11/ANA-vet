import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';

// ── Módulos de navegación ─────────────────────────────────────
const modulos = [
  {
    key: 'tutores', label: 'Tutores', ruta: '/tutores',
    desc: 'Propietarios registrados',
    color: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400',
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
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
  },
];

// Calculadoras destacadas para el banner del dashboard
const CALC_DESTACADAS = [
  { emoji: '💉', label: 'Anestesia', desc: 'Flow rates · ASA · Agente volátil' },
  { emoji: '💧', label: 'Fluidos', desc: 'Fluidoterapia · CRI · Osmolalidad' },
  { emoji: '🩸', label: 'Blood Gas', desc: 'Ácido-base · Anion gap · HCO₃' },
  { emoji: '🥩', label: 'Nutrición', desc: 'RER · DER · Cantidad a alimentar' },
  { emoji: '💊', label: 'Farmacia', desc: 'Dosis · Volumen · Concentración' },
  { emoji: '📊', label: 'Scores', desc: 'Pain · Glasgow · SIRS' },
  { emoji: '☠️', label: 'Toxicología', desc: 'Exposición · Nivel de riesgo' },
  { emoji: '🔄', label: 'Conversiones', desc: 'Peso · Temp · Presiones · Suturas' },
  { emoji: '❤️', label: 'Cardiac', desc: 'MAP · Presión de pulso' },
  { emoji: '🔬', label: 'Hematología', desc: 'Transfusión · Volumen sanguíneo' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// ── Componente: KPI Card ──────────────────────────────────────
function KpiCard({ icon, label, value, sub, colorClass, bgClass }) {
  return (
    <div className="card p-5 flex items-start gap-4 border border-slate-100 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bgClass}`}>
        <span className={`text-2xl ${colorClass}`}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white mt-0.5 leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ── Componente: Medalla de actividad ─────────────────────────
function ActivityBadge({ count }) {
  if (count === 0) {
    return (
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500">
        0
      </span>
    );
  }
  if (count >= 20) {
    return (
      <span title="🏆 Élite" className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 ring-2 ring-amber-400/50">
        {count}
      </span>
    );
  }
  if (count >= 10) {
    return (
      <span title="🥈 Activo" className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
        {count}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
      {count}
    </span>
  );
}

// ── Vista: Dashboard Clínica ──────────────────────────────────
function DashboardClinica({ user }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    API.get('/dashboard/clinica')
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Error al cargar el dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const kpis = data?.kpis ?? {};
  const scorecard = data?.scorecard_empleados ?? [];
  const ingresosRecientes = data?.ingresos_recientes ?? [];
  const alertasInventario = data?.alertas_inventario ?? [];

  return (
    <div className="animate-fade-in space-y-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 capitalize mb-1">{today}</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {getGreeting()}, {user?.nombre} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Torre de Control · Vista analítica de tu clínica
        </p>
      </div>

      {/* ── Banner Calculadoras ─────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-700 dark:via-blue-800 dark:to-indigo-900 p-6 shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">🧮</span>
              <h2 className="text-xl font-bold text-white leading-tight">Módulo Avanzado de Calculadoras Clínicas</h2>
            </div>
            <p className="text-blue-100 text-sm leading-relaxed max-w-lg">
              Herramientas de soporte para decisiones médicas en tiempo real con 10 categorías diagnósticas integradas.
            </p>
            <button
              onClick={() => navigate('/calculadora')}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 font-bold text-sm rounded-xl hover:bg-blue-50 transition-all duration-150 shadow-sm"
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
                className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-150 group"
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{c.emoji}</span>
                <span className="text-white text-xs font-medium leading-tight text-center">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPIs Globales (3 tarjetas) ──────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          KPIs del Mes
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse h-24 bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-600 dark:text-red-400 text-sm">
            ⚠️ {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              icon="💰"
              label="Ingresos del Mes"
              value={`$${Number(kpis.ingresos_mes ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
              sub="Recibos finalizados"
              bgClass="bg-emerald-50 dark:bg-emerald-900/20"
              colorClass="text-emerald-600 dark:text-emerald-400"
            />
            <KpiCard
              icon="🐾"
              label="Pacientes Totales"
              value={(kpis.total_pacientes ?? 0).toLocaleString('es-MX')}
              sub="Registrados en la clínica"
              bgClass="bg-blue-50 dark:bg-blue-900/20"
              colorClass="text-blue-600 dark:text-blue-400"
            />
            <KpiCard
              icon="📋"
              label="Consultas de Hoy"
              value={kpis.consultas_hoy ?? 0}
              sub={new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
              bgClass="bg-violet-50 dark:bg-violet-900/20"
              colorClass="text-violet-600 dark:text-violet-400"
            />
          </div>
        )}
      </div>

      {/* ── Torre de Control: Grid 3 columnas ───────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Torre de Control
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-600 dark:text-red-400 text-sm">
            ⚠️ No se pudo cargar la Torre de Control.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

            {/* ── Columna 1: Finanzas — Ingresos Recientes ── */}
            <div className="card overflow-hidden border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col">
              {/* Header columna */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-emerald-50 dark:bg-emerald-900/10">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-lg flex-shrink-0">
                  💰
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Finanzas</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Últimos 5 ingresos</p>
                </div>
              </div>

              {/* Tabla ingresos recientes */}
              {ingresosRecientes.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm flex-1">
                  <p className="text-3xl mb-2">📭</p>
                  <p>Sin ingresos recientes</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700/50 flex-1">
                  {ingresosRecientes.map((rec) => (
                    <div key={rec.id} className="px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                            🐾 {rec.paciente}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                            Cobró: {rec.empleado}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {new Date(rec.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0 whitespace-nowrap">
                          ${Number(rec.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Columna 2: Personal — Scorecard de Empleados ── */}
            <div className="card overflow-hidden border border-slate-100 dark:border-slate-700/60 shadow-sm flex flex-col">
              {/* Header columna */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-violet-50 dark:bg-violet-900/10">
                <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-lg flex-shrink-0">
                  👥
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Personal</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Scorecard de actividad</p>
                </div>
              </div>

              {/* Tabla scorecard */}
              {scorecard.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm flex-1">
                  <p className="text-3xl mb-2">👤</p>
                  <p>No hay empleados registrados</p>
                </div>
              ) : (
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700">
                        <th className="text-left px-4 py-2.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Empleado</th>
                        <th className="text-center px-2 py-2.5 font-semibold text-violet-500 dark:text-violet-400 text-xs uppercase tracking-wider" title="Consultas">📋</th>
                        <th className="text-center px-2 py-2.5 font-semibold text-red-500 dark:text-red-400 text-xs uppercase tracking-wider" title="Cirugías">🔪</th>
                        <th className="text-center px-2 py-2.5 font-semibold text-amber-500 dark:text-amber-400 text-xs uppercase tracking-wider" title="Hospitalizaciones">🏥</th>
                        <th className="text-center px-3 py-2.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                      {scorecard.map((emp, idx) => (
                        <tr
                          key={emp.empleado_id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {/* Medalla de posición */}
                              {idx === 0 && <span title="Top 1" className="text-base leading-none">🥇</span>}
                              {idx === 1 && <span title="Top 2" className="text-base leading-none">🥈</span>}
                              {idx === 2 && <span title="Top 3" className="text-base leading-none">🥉</span>}
                              {idx > 2 && (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  {emp.empleado_nombre?.charAt(0)?.toUpperCase() ?? '?'}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate max-w-[100px]">
                                  {emp.empleado_nombre}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                  {emp.rol ?? 'Sin rol'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className="font-semibold text-violet-600 dark:text-violet-400 text-xs">{emp.total_consultas}</span>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className="font-semibold text-red-600 dark:text-red-400 text-xs">{emp.total_cirugias}</span>
                          </td>
                          <td className="px-2 py-3 text-center">
                            <span className="font-semibold text-amber-600 dark:text-amber-400 text-xs">{emp.total_hospitalizaciones}</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <ActivityBadge count={emp.total_actividad} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ── Columna 3: Alertas Críticas de Inventario ── */}
            <div className="flex flex-col gap-4">
              {/* Panel de alertas */}
              <div className="rounded-2xl overflow-hidden border-2 border-red-200 dark:border-red-800/60 shadow-md">
                {/* Header alerta */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 dark:from-red-700 dark:to-orange-700 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl animate-pulse">🚨</span>
                    <div>
                      <h3 className="font-bold text-white text-sm">Alertas Críticas</h3>
                      <p className="text-red-100 text-xs">Inventario bajo — Acción requerida</p>
                    </div>
                    <span className="ml-auto bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {alertasInventario.length}
                    </span>
                  </div>
                </div>

                {/* Lista de alertas */}
                {alertasInventario.length === 0 ? (
                  <div className="bg-white dark:bg-slate-800 p-6 text-center">
                    <p className="text-3xl mb-2">✅</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sin alertas de inventario</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 divide-y divide-red-100 dark:divide-red-900/30">
                    {alertasInventario.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-5 py-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-lg flex-shrink-0">
                            💊
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {item.nombre}
                            </p>
                            <p className="text-xs text-red-500 dark:text-red-400 font-medium mt-0.5">
                              Stock crítico
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-lg text-sm font-bold ${
                            item.stock <= 2
                              ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 ring-2 ring-red-300 dark:ring-red-700'
                              : 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 ring-2 ring-orange-300 dark:ring-orange-700'
                          }`}>
                            {item.stock}
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
                    <span>⚠️</span>
                    <span>Datos de inventario en modo demo. Módulo completo próximamente.</span>
                  </p>
                </div>
              </div>

              {/* Mini-panel de estado general */}
              <div className="card p-4 border border-slate-100 dark:border-slate-700/60 shadow-sm">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                  Estado General
                </h4>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                      Sistema operativo
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">✓ OK</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full inline-block ${alertasInventario.length > 0 ? 'bg-red-400' : 'bg-emerald-400'}`}></span>
                      Inventario
                    </span>
                    <span className={`text-xs font-semibold ${alertasInventario.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {alertasInventario.length > 0 ? `${alertasInventario.length} alerta${alertasInventario.length !== 1 ? 's' : ''}` : '✓ OK'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
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
      <p className="text-center text-xs text-slate-400 dark:text-slate-600 pb-2">
        ANA-vet · Sistema de Gestión Veterinaria
      </p>
    </div>
  );
}

// ── Vista: Dashboard Empleado ─────────────────────────────────
function DashboardEmpleado({ user }) {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    API.get('/dashboard/empleado')
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || 'Error al cargar el dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const tareas = data?.tareas_hoy ?? {};

  const accesosRapidos = [
    {
      label: 'Nuevo Paciente',
      desc: 'Registrar un nuevo animal',
      ruta: '/pacientes?action=new',
      icon: '🐾',
      bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
      textClass: 'text-emerald-700 dark:text-emerald-300',
      borderClass: 'border-emerald-200 dark:border-emerald-800',
      btnClass: 'bg-emerald-600 hover:bg-emerald-700',
    },
    {
      label: 'Nueva Consulta',
      desc: 'Registrar una consulta médica',
      ruta: '/consultas?action=new',
      icon: '📋',
      bgClass: 'bg-violet-50 dark:bg-violet-900/20',
      textClass: 'text-violet-700 dark:text-violet-300',
      borderClass: 'border-violet-200 dark:border-violet-800',
      btnClass: 'bg-violet-600 hover:bg-violet-700',
    },
    {
      label: 'Nueva Cirugía',
      desc: 'Registrar un procedimiento quirúrgico',
      ruta: '/cirugias?action=new',
      icon: '🔪',
      bgClass: 'bg-red-50 dark:bg-red-900/20',
      textClass: 'text-red-700 dark:text-red-300',
      borderClass: 'border-red-200 dark:border-red-800',
      btnClass: 'bg-red-600 hover:bg-red-700',
    },
    {
      label: 'Calculadoras',
      desc: 'Herramientas clínicas de apoyo',
      ruta: '/calculadora',
      icon: '🧮',
      bgClass: 'bg-blue-50 dark:bg-blue-900/20',
      textClass: 'text-blue-700 dark:text-blue-300',
      borderClass: 'border-blue-200 dark:border-blue-800',
      btnClass: 'bg-blue-600 hover:bg-blue-700',
    },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 capitalize mb-1">{today}</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {getGreeting()}, {user?.nombre} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {user?.rol_nombre ? `${user.rol_nombre} · ` : ''}{user?.clinica_nombre ?? 'Tu clínica'}
        </p>
      </div>

      {/* ── Mis Tareas de Hoy ───────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Mis Tareas de Hoy
        </h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="card p-5 animate-pulse h-24 bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-600 dark:text-red-400 text-sm">
            ⚠️ {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              icon="📋"
              label="Consultas de Hoy"
              value={tareas.consultas_hoy ?? 0}
              sub="Asignadas a ti hoy"
              bgClass="bg-violet-50 dark:bg-violet-900/20"
              colorClass="text-violet-600 dark:text-violet-400"
            />
            <KpiCard
              icon="🔪"
              label="Cirugías de Hoy"
              value={tareas.cirugias_hoy ?? 0}
              sub="Procedimientos programados"
              bgClass="bg-red-50 dark:bg-red-900/20"
              colorClass="text-red-600 dark:text-red-400"
            />
            <KpiCard
              icon="✅"
              label="Total de Tareas"
              value={tareas.total_tareas ?? 0}
              sub="Actividades del día"
              bgClass="bg-emerald-50 dark:bg-emerald-900/20"
              colorClass="text-emerald-600 dark:text-emerald-400"
            />
          </div>
        )}
      </div>

      {/* ── Resumen de Agenda ───────────────────────────────── */}
      {!loading && !error && (
        <div className="card p-5 border border-slate-100 dark:border-slate-700/60 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-xl">
              📅
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
            <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30">
              <div className="flex items-center gap-3">
                <span className="text-lg">📋</span>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Consultas pendientes</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Pacientes asignados hoy</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                {tareas.consultas_hoy ?? 0}
              </span>
            </div>
            {/* Cirugías */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
              <div className="flex items-center gap-3">
                <span className="text-lg">🔪</span>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Cirugías programadas</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Procedimientos del día</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                {tareas.cirugias_hoy ?? 0}
              </span>
            </div>
            {/* Estado general */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${
              (tareas.total_tareas ?? 0) === 0
                ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-700'
                : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800/30'
            }`}>
              <span className="text-lg">{(tareas.total_tareas ?? 0) === 0 ? '😌' : '🏃'}</span>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {(tareas.total_tareas ?? 0) === 0
                  ? 'Sin actividades asignadas para hoy. ¡Buen descanso!'
                  : `Tienes ${tareas.total_tareas} actividad${tareas.total_tareas !== 1 ? 'es' : ''} programada${tareas.total_tareas !== 1 ? 's' : ''} para hoy.`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Accesos Rápidos ─────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Accesos Rápidos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accesosRapidos.map((a) => (
            <button
              key={a.ruta}
              onClick={() => navigate(a.ruta)}
              className={`card p-5 text-left group hover:shadow-md transition-all duration-200 border ${a.borderClass}`}
            >
              <div className={`w-11 h-11 rounded-xl ${a.bgClass} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform`}>
                {a.icon}
              </div>
              <p className={`font-semibold text-sm ${a.textClass}`}>{a.label}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{a.desc}</p>
              <div className={`mt-3 text-xs font-semibold ${a.textClass} flex items-center gap-1`}>
                <span>Ir ahora</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Módulos del sistema ─────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
          Módulos del Sistema
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {modulos.map(m => (
            <button
              key={m.key}
              onClick={() => navigate(m.ruta)}
              className="card p-4 text-left hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 group"
            >
              <div className={`w-9 h-9 rounded-lg ${m.light} ${m.text} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                {m.icon}
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{m.label}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-600 pb-2">
        ANA-vet · Sistema de Gestión Veterinaria
      </p>
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
        <p className="text-4xl mb-3">🔒</p>
        <p className="font-medium">Sesión no reconocida</p>
        <p className="text-sm mt-1">Por favor, inicia sesión nuevamente.</p>
      </div>
    </div>
  );
}
