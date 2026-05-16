import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';

const CAMPOS = [
  { key: 'motivo', label: 'Motivo de consulta' },
  { key: 'anamnesis', label: 'Anamnesis' },
  { key: 'examen_fisico', label: 'Examen físico' },
  { key: 'examenes_sistemicos', label: 'Exámenes sistémicos' },
  { key: 'lista_problemas', label: 'Lista de problemas' },
  { key: 'dx_presuntivo', label: 'Dx presuntivo' },
  { key: 'abordaje_dx', label: 'Abordaje diagnóstico' },
  { key: 'dx_definitivo', label: 'Dx definitivo' },
  { key: 'indicaciones', label: 'Indicaciones' },
  { key: 'tratamiento', label: 'Tratamiento' },
  { key: 'tratamiento_etiologico', label: 'Tratamiento etiológico' },
  { key: 'seguimiento_medico', label: 'Seguimiento médico' },
];

const EMPTY = Object.fromEntries([['fecha', ''], ...CAMPOS.map(f => [f.key, ''])]);

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export default function Consulta() {
  const { expedienteId, pacienteId } = useParams();
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    API.get(`/consultas/${expedienteId}`).then(r => setConsultas(r.data));
  }, [expedienteId]);

  const guardar = async () => {
    setGuardando(true);
    try {
      await API.post('/consultas', { expediente_id: expedienteId, ...form });
      setForm(EMPTY);
      setMostrarForm(false);
      API.get(`/consultas/${expedienteId}`).then(r => setConsultas(r.data));
    } finally {
      setGuardando(false);
    }
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
          <h1 className="page-title">Consultas</h1>
          <p className="page-subtitle">{consultas.length} consulta{consultas.length !== 1 ? 's' : ''} registrada{consultas.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setMostrarForm(!mostrarForm); setForm(EMPTY); }} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva consulta
        </button>
      </div>

      {mostrarForm && (
        <div className="form-section animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Registrar consulta</h2>
            <button onClick={() => setMostrarForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <label className="input-label">Fecha *</label>
            <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} className="input max-w-xs" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CAMPOS.map(f => (
              <div key={f.key}>
                <label className="input-label">{f.label}</label>
                <textarea
                  placeholder={f.label}
                  rows={3}
                  value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  className="input resize-none"
                />
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={guardar} disabled={guardando} className="btn-success disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar consulta'}
            </button>
            <button onClick={() => setMostrarForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {consultas.map(c => (
          <div key={c.id} className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {new Date(c.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              {c.dx_definitivo && <span className="badge-green ml-auto">{c.dx_definitivo}</span>}
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {CAMPOS.map(f => <Field key={f.key} label={f.label} value={c[f.key]} />)}
            </div>
          </div>
        ))}

        {consultas.length === 0 && (
          <div className="card p-10 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sin consultas registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
