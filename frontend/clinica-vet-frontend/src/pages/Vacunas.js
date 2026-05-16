import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';

const EMPTY = { nombre: '', fecha_aplicacion: '', proxima_dosis: '', lote: '', fabricante: '', via_administracion: '', dosis: '', observaciones: '' };

export default function Vacunas() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  const [vacunas, setVacunas] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    API.get(`/vacunas/${pacienteId}`).then(r => setVacunas(r.data));
  }, [pacienteId]);

  const guardar = async () => {
    setGuardando(true);
    try {
      await API.post('/vacunas', { paciente_id: pacienteId, ...form });
      setForm(EMPTY);
      setMostrarForm(false);
      API.get(`/vacunas/${pacienteId}`).then(r => setVacunas(r.data));
    } finally {
      setGuardando(false);
    }
  };

  const getRowClass = (proxima_dosis) => {
    if (!proxima_dosis) return '';
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const proxima = new Date(proxima_dosis); proxima.setHours(0, 0, 0, 0);
    const diff = Math.ceil((proxima - hoy) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return 'bg-red-50 dark:bg-red-900/10';
    if (diff <= 30) return 'bg-amber-50 dark:bg-amber-900/10';
    return '';
  };

  const getProximaBadge = (proxima_dosis) => {
    if (!proxima_dosis) return '—';
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const proxima = new Date(proxima_dosis); proxima.setHours(0, 0, 0, 0);
    const diff = Math.ceil((proxima - hoy) / (1000 * 60 * 60 * 24));
    const fecha = new Date(proxima_dosis).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
    if (diff <= 0) return <span className="badge-red">Vencida · {fecha}</span>;
    if (diff <= 30) return <span className="badge-yellow">En {diff}d · {fecha}</span>;
    return <span className="badge-green">{fecha}</span>;
  };

  return (
    <div className="animate-fade-in">
      <button onClick={() => navigate(`/expediente/${pacienteId}`)} className="back-link">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver al expediente
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Vacunas</h1>
          <p className="page-subtitle">{vacunas.length} vacuna{vacunas.length !== 1 ? 's' : ''} registrada{vacunas.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setMostrarForm(!mostrarForm); setForm(EMPTY); }} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva vacuna
        </button>
      </div>

      {mostrarForm && (
        <div className="form-section animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Registrar vacuna</h2>
            <button onClick={() => setMostrarForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="input-label">Nombre de la vacuna *</label>
              <input placeholder="Ej: Rabia, Parvovirus, etc." value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="input" />
            </div>
            <div>
              <label className="input-label">Fecha de aplicación</label>
              <input type="date" value={form.fecha_aplicacion} onChange={e => setForm({ ...form, fecha_aplicacion: e.target.value })} className="input" />
            </div>
            <div>
              <label className="input-label">Próxima dosis</label>
              <input type="date" value={form.proxima_dosis} onChange={e => setForm({ ...form, proxima_dosis: e.target.value })} className="input" />
            </div>
            <div>
              <label className="input-label">Fabricante</label>
              <input placeholder="Laboratorio fabricante" value={form.fabricante} onChange={e => setForm({ ...form, fabricante: e.target.value })} className="input" />
            </div>
            <div>
              <label className="input-label">Lote</label>
              <input placeholder="Número de lote" value={form.lote} onChange={e => setForm({ ...form, lote: e.target.value })} className="input" />
            </div>
            <div>
              <label className="input-label">Vía de administración</label>
              <select value={form.via_administracion} onChange={e => setForm({ ...form, via_administracion: e.target.value })} className="input">
                <option value="">Seleccionar</option>
                <option value="Subcutánea">Subcutánea</option>
                <option value="Intramuscular">Intramuscular</option>
                <option value="Intravenosa">Intravenosa</option>
                <option value="Oral">Oral</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="input-label">Dosis</label>
              <input placeholder="Ej: 1 ml" value={form.dosis} onChange={e => setForm({ ...form, dosis: e.target.value })} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label className="input-label">Observaciones</label>
              <textarea rows={2} placeholder="Observaciones adicionales" value={form.observaciones} onChange={e => setForm({ ...form, observaciones: e.target.value })} className="input resize-none" />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={guardar} disabled={guardando || !form.nombre.trim()} className="btn-success disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar vacuna'}
            </button>
            <button onClick={() => setMostrarForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      {/* Legend */}
      {vacunas.length > 0 && (
        <div className="flex gap-4 mb-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-200 dark:bg-red-900/40 border border-red-300 dark:border-red-700" />Vencida</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-200 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700" />Vence en 30 días</span>
        </div>
      )}

      <div className="table-wrapper">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              {['Vacuna', 'Aplicación', 'Próxima dosis', 'Lote', 'Fabricante', 'Vía', 'Dosis'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vacunas.map(v => (
              <tr key={v.id} className={`border-t border-slate-100 dark:border-slate-800 transition-colors ${getRowClass(v.proxima_dosis)}`}>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{v.nombre}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {v.fecha_aplicacion ? new Date(v.fecha_aplicacion).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                </td>
                <td className="px-4 py-3">{getProximaBadge(v.proxima_dosis)}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{v.lote || '—'}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{v.fabricante || '—'}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{v.via_administracion || '—'}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{v.dosis || '—'}</td>
              </tr>
            ))}
            {vacunas.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="text-slate-400 dark:text-slate-500">
                    <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    <p className="text-sm font-medium">Sin vacunas registradas</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
