import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import Toast from '../components/Toast';

function ConfirmModal({ open, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="card p-6 w-80 text-center animate-slide-up">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="font-semibold text-slate-800 dark:text-white mb-1">¿Guardar cirugía?</p>
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
  fecha: '', procedimiento: '', plan_quirurgico: '', notas: '', consentimiento: '',
  protocolo: '', farmacos: '', dosis: '', observaciones_anestesia: ''
};

const CAMPOS_CX = [
  { key: 'procedimiento', label: 'Procedimiento' },
  { key: 'plan_quirurgico', label: 'Plan quirúrgico' },
  { key: 'notas', label: 'Notas' },
  { key: 'consentimiento', label: 'Consentimiento' },
];

const CAMPOS_ANEST = [
  { key: 'protocolo', label: 'Protocolo' },
  { key: 'farmacos', label: 'Fármacos' },
  { key: 'dosis', label: 'Dosis' },
  { key: 'observaciones_anestesia', label: 'Observaciones' },
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

export default function Cirugia() {
  const { expedienteId, pacienteId } = useParams();
  const navigate = useNavigate();
  const [cirugias, setCirugias] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(FORM_EMPTY);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });
  const closeToast = useCallback(() => setToast({ message: '', type: 'success' }), []);

  const fetchData = useCallback(() => {
    API.get(`/cirugias/${expedienteId}`).then(r => setCirugias(r.data));
  }, [expedienteId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const guardar = async () => {
    setConfirmOpen(false);
    try {
      const res = await API.post('/cirugias', {
        expediente_id: expedienteId,
        fecha: form.fecha,
        procedimiento: form.procedimiento,
        plan_quirurgico: form.plan_quirurgico,
        notas: form.notas,
        consentimiento: form.consentimiento
      });
      await API.post('/anestesia', {
        cirugia_id: res.data.id,
        protocolo: form.protocolo,
        farmacos: form.farmacos,
        dosis: form.dosis,
        observaciones: form.observaciones_anestesia
      });
      setForm(FORM_EMPTY);
      setMostrarForm(false);
      fetchData();
      setToast({ message: 'Cirugía guardada correctamente.', type: 'success' });
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
          <h1 className="page-title">Cirugías</h1>
          <p className="page-subtitle">{cirugias.length} procedimiento{cirugias.length !== 1 ? 's' : ''} registrado{cirugias.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setMostrarForm(!mostrarForm); setForm(FORM_EMPTY); }} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva cirugía
        </button>
      </div>

      {mostrarForm && (
        <div className="form-section animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Registrar cirugía</h2>
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

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Datos de la cirugía</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {CAMPOS_CX.map(f => (
              <div key={f.key}>
                <label className="input-label">{f.label}</label>
                <textarea rows={3} placeholder={f.label} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="input resize-none" />
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Protocolo anestésico</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CAMPOS_ANEST.map(f => (
              <div key={f.key}>
                <label className="input-label">{f.label}</label>
                <textarea rows={3} placeholder={f.label} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} className="input resize-none" />
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={() => setConfirmOpen(true)} className="btn-success">Guardar cirugía</button>
            <button onClick={() => setMostrarForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {cirugias.map(c => (
          <div key={c.id} className="card p-5">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {new Date(c.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              {c.procedimiento && <span className="badge-red ml-auto">{c.procedimiento}</span>}
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {CAMPOS_CX.filter(f => f.key !== 'procedimiento').map(f => <Field key={f.key} label={f.label} value={c[f.key]} />)}
            </div>

            {(c.protocolo || c.farmacos || c.dosis || c.observaciones) && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-2">Protocolo anestésico</p>
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  <Field label="Protocolo" value={c.protocolo} />
                  <Field label="Fármacos" value={c.farmacos} />
                  <Field label="Dosis" value={c.dosis} />
                  <Field label="Observaciones" value={c.observaciones} />
                </div>
              </div>
            )}
          </div>
        ))}

        {cirugias.length === 0 && (
          <div className="card p-10 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sin cirugías registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
