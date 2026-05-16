import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

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

const acciones = [
  { label: 'Nuevo Tutor', ruta: '/tutores', color: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'Nuevo Paciente', ruta: '/pacientes', color: 'bg-emerald-600 hover:bg-emerald-700' },
  { label: 'Nueva Consulta', ruta: '/consultas', color: 'bg-violet-600 hover:bg-violet-700' },
  { label: 'Ver Reportes', ruta: '/reportes', color: 'bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    API.get('/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const total = Object.values(stats).reduce((a, b) => (typeof b === 'number' ? a + b : a), 0);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-slate-500 dark:text-slate-400 capitalize mb-1">{today}</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{getGreeting()} 👋</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Aquí tienes el resumen de tu clínica veterinaria.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {modulos.map(m => (
          <button
            key={m.key}
            onClick={() => navigate(m.ruta)}
            className="card p-4 text-left hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-200 group"
          >
            <div className={`w-9 h-9 rounded-lg ${m.light} ${m.text} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              {m.icon}
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats[m.key] ?? 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{m.label}</p>
          </button>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Módulos principales */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Módulos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {modulos.map(m => (
              <button
                key={m.key}
                onClick={() => navigate(m.ruta)}
                className="card-hover p-4 text-left group"
              >
                <div className={`w-10 h-10 rounded-xl ${m.light} ${m.text} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  {m.icon}
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{m.label}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{m.desc}</p>
                <div className={`mt-3 text-xs font-semibold ${m.text}`}>
                  {stats[m.key] ?? 0} registros →
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="space-y-4">
          {/* Total */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total sistema</h3>
              <span className="badge-purple">Global</span>
            </div>
            <p className="text-5xl font-bold text-slate-900 dark:text-white">{total}</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">registros en total</p>
            <div className="mt-4 space-y-2">
              {modulos.map(m => (
                <div key={m.key} className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${m.text}`}>{m.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${m.color} rounded-full transition-all`}
                        style={{ width: total > 0 ? `${Math.round(((stats[m.key] ?? 0) / total) * 100)}%` : '0%' }}
                      />
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 w-4 text-right">{stats[m.key] ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Acciones rápidas</h3>
            <div className="space-y-2">
              {acciones.map(a => (
                <button
                  key={a.ruta}
                  onClick={() => navigate(a.ruta)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all ${a.color}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-4">
        ANA-vet · Sistema de Gestión Veterinaria
      </p>
    </div>
  );
}
