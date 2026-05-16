import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import Toast from '../components/Toast';

function ConfirmModal({ open, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card p-6 w-80 text-center animate-slide-up">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="font-semibold text-slate-800 dark:text-white mb-1">¿Guardar hospitalización?</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Confirma que los datos son correctos.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onCancel} className="btn-secondary">Cancelar</button>
          <button onClick={onConfirm} className="btn-success">Sí, guardar</button>
        </div>
      </div>
    </div>
  );
}

const FORM_EMPTY = {
  fecha_ingreso: '', historia_clinica: '', abordaje_hospitalario: '',
  tratamiento_intrahospitalario: '', abordaje_diagnostico: '', fecha_alta: '', tipo_alta: '', acta_responsiva: ''
};

const CAMPOS = [
  { key: 'historia_clinica', label: 'Historia clínica' },
  { key: 'abordaje_hospitalario', label: 'Abordaje hospitalario' },
  { key: 'tratamiento_intrahospitalario', label: 'Tratamiento intrahospitalario' },
  { key: 'abordaje_diagnostico', label: 'Abordaje diagnóstico' },
  { key: 'acta_responsiva', label: 'Acta responsiva' },
];

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export default function Hospitalizacion() {
  const { expedienteId, pacienteId } = useParams();
  const navigate = useNavigate();
  const [hospitalizaciones, setHospitalizaciones] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(FORM_EMPTY);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const closeToast = useCallback(() => setToast({ message: '', type: 'success' }), []);

  const fetchData = useCallback(() => {
    API.get(`/hospitalizaciones/${expedienteId}`).then(r => setHospitalizaciones(r.data));
  }, [expedienteId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const guardar = async () => {
    setConfirmOpen(false);
    try {
      await API.post('/hospitalizaciones', { expediente_id: expedienteId, ...form });
      setForm(FORM_EMPTY);
      setMostrarForm(false);
      fetchData();
      setToast({ message: 'Hospitalización guardada correctamente.', type: 'success' });
    } catch {
      setToast({ message: 'Error al guardar. Intenta de nuevo.', type: 'error' });
    }
  };

  return (
    <div className="animate-fade-in">
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      <ConfirmModal open={confirmOpen} onConfirm={guardar} onCancel={() => setConfirmOpen(false)} />

      <button onClick={() => navigate(`/expediente/${pacienteId}`)} className="back-link">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver al expediente
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">Hospitalización</h1>
          <p className="page-subtitle">{hospitalizaciones.length} registro{hospitalizaciones.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setMostrarForm(!mostrarForm); setForm(FORM_EMPTY); }} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva hospitalización
        </button>
      </div>

      {mostrarForm && (
        <div className="form-section animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Registrar hospitalización</h2>
            <button onClick={() => setMostrarForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="input-label">Fecha de ingreso</label>
              <input type="date" value={form.fecha_ingreso} onChange={e => setForm({ ...form, fecha_ingreso: e.target.value })} className="input" />
            </div>
            <div>
              <label className="input-label">Fecha de alta</label>
              <input type="date" value={form.fecha_alta} onChange={e => setForm({ ...form, fecha_alta: e.target.value })} className="input" />
            </div>
            <div>
              <label className="input-label">Tipo de alta</label>
              <select value={form.tipo_alta} onChange={e => setForm({ ...form, tipo_alta: e.target.value })} className="input">
                <option value="">Seleccionar</option>
                <option value="Curación">Curación</option>
                <option value="Mejoría">Mejoría</option>
                <option value="Fallecimiento">Fallecimiento</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CAMPOS.map(f => (
              <div key={f.key}>
                <label className="input-label">{f.label}</label>
                <textarea rows={3} placeholder={f.label} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="input resize-none" />
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={() => setConfirmOpen(true)} className="btn-success">Guardar hospitalización</button>
            <button onClick={() => setMostrarForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {hospitalizaciones.map(h => (
          <div key={h.id} className="card p-5">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Ingreso: {new Date(h.fecha_ingreso).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              {h.fecha_alta && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Alta: {new Date(h.fecha_alta).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
              {h.tipo_alta && (
                <span className={h.tipo_alta === 'Fallecimiento' ? 'badge-red ml-auto' : h.tipo_alta === 'Curación' ? 'badge-green ml-auto' : 'badge-blue ml-auto'}>
                  {h.tipo_alta}
                </span>
              )}
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {CAMPOS.map(f => <Field key={f.key} label={f.label} value={h[f.key]} />)}
            </div>
          </div>
        ))}

        {hospitalizaciones.length === 0 && (
          <div className="card p-10 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sin hospitalizaciones registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
