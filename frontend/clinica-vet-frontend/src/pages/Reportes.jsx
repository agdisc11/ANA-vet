import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useStats } from '../hooks/useDashboard';
import { reportsService } from '../services/reportsService';

const reportes = [
  { tipo: 'general', label: 'Reporte General', desc: 'Resumen completo del sistema', color: 'bg-violet-600 hover:bg-violet-700', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
  )},
  { tipo: 'pacientes', label: 'Pacientes', desc: 'Listado de animales registrados', color: 'bg-emerald-600 hover:bg-emerald-700', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
  )},
  { tipo: 'consultas', label: 'Consultas', desc: 'Historial de consultas veterinarias', color: 'bg-blue-600 hover:bg-blue-700', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
  )},
  { tipo: 'hospitalizaciones', label: 'Hospitalizaciones', desc: 'Pacientes internados y altas', color: 'bg-amber-600 hover:bg-amber-700', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
  )},
  { tipo: 'cirugias', label: 'Cirugías', desc: 'Procedimientos quirúrgicos', color: 'bg-red-600 hover:bg-red-700', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
  )},
  { tipo: 'vacunas', label: 'Vacunas', desc: 'Plan de vacunación completo', color: 'bg-teal-600 hover:bg-teal-700', icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
  )},
];

const statLabels = { tutores: 'Tutores', pacientes: 'Pacientes', consultas: 'Consultas', hospitalizaciones: 'Hospitalizaciones', cirugias: 'Cirugías', vacunas: 'Vacunas' };

export default function Reportes() {
  const toast = useToast();
  const { data: stats, isLoading: cargando } = useStats();
  const [generando, setGenerando] = useState(null);

  const generarPDF = async (tipo) => {
    try {
      setGenerando(tipo);
      await reportsService.descargarReporte(tipo);
      toast.success('Reporte generado correctamente');
    } catch {
      toast.error('Error al generar el reporte PDF');
    } finally {
      setGenerando(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-subtitle">Métricas del sistema y generación de reportes PDF</p>
        </div>
      </div>

      {cargando ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded mb-2" />
              <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="card p-5">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 capitalize">{statLabels[key] || key}</p>
            </div>
          ))}
        </div>
      )}

      <div className="card p-6">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">Generar reportes PDF</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Los reportes se generan con los datos más recientes del sistema.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reportes.map((r) => (
            <button key={r.tipo} onClick={() => generarPDF(r.tipo)} disabled={!!generando} className={`${r.color} disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl p-4 text-left transition-all duration-150 flex items-start gap-3`}>
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                {generando === r.tipo ? (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : r.icon}
              </div>
              <div>
                <p className="font-semibold text-sm">{r.label}</p>
                <p className="text-xs text-white/70 mt-0.5">{generando === r.tipo ? 'Generando...' : r.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800">
          <p className="text-sm text-violet-800 dark:text-violet-200">
            <strong>💡 Tip:</strong> Cada reporte incluye información detallada de pacientes, tutores y procedimientos realizados.
          </p>
        </div>
      </div>
    </div>
  );
}
