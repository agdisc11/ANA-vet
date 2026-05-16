import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import Toast from '../components/Toast';

/* ── Confirmation Modal ─────────────────────────────────────────── */
function ConfirmModal({ open, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 w-80 text-center">
        <p className="text-gray-800 dark:text-white font-semibold text-base mb-2">¿Guardar hospitalización?</p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
          Confirma que los datos son correctos antes de registrar.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border text-sm text-gray-600 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm hover:bg-green-600"
          >
            Sí, guardar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
const FORM_EMPTY = {
  fecha_ingreso: '', historia_clinica: '', abordaje_hospitalario: '',
  tratamiento_intrahospitalario: '', abordaje_diagnostico: '', fecha_alta: '', tipo_alta: '', acta_responsiva: ''
};

export default function Hospitalizacion() {
  const { expedienteId, pacienteId } = useParams();
  const navigate = useNavigate();
  const [hospitalizaciones, setHospitalizaciones] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(FORM_EMPTY);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'success' });

  const closeToast = useCallback(() => setToast({ message: '', type: 'success' }), []);

  const fetchHospitalizaciones = useCallback(() => {
    API.get(`/hospitalizaciones/${expedienteId}`).then(r => setHospitalizaciones(r.data));
  }, [expedienteId]);

  useEffect(() => { fetchHospitalizaciones(); }, [fetchHospitalizaciones]);

  const handleGuardarClick = () => setConfirmOpen(true);

  const guardar = async () => {
    setConfirmOpen(false);
    try {
      await API.post('/hospitalizaciones', { expediente_id: expedienteId, ...form });
      setForm(FORM_EMPTY);
      setMostrarForm(false);
      fetchHospitalizaciones();
      setToast({ message: 'Hospitalización guardada correctamente.', type: 'success' });
    } catch {
      setToast({ message: 'Error al guardar la hospitalización. Intenta de nuevo.', type: 'error' });
    }
  };

  return (
    <div>
      <Toast message={toast.message} type={toast.type} onClose={closeToast} />
      <ConfirmModal open={confirmOpen} onConfirm={guardar} onCancel={() => setConfirmOpen(false)} />

      <button onClick={() => navigate(`/expediente/${pacienteId}`)}
        className="text-blue-600 text-sm mb-4 hover:underline">← Volver al expediente</button>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Hospitalizacion</h2>
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Nueva hospitalizacion
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5 mb-6 grid grid-cols-2 gap-4">
          <input type="date" value={form.fecha_ingreso} onChange={e => setForm({...form, fecha_ingreso: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm col-span-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          {[
            { key: 'historia_clinica', label: 'Historia clinica' },
            { key: 'abordaje_hospitalario', label: 'Abordaje hospitalario' },
            { key: 'tratamiento_intrahospitalario', label: 'Tratamiento intrahospitalario' },
            { key: 'abordaje_diagnostico', label: 'Abordaje diagnostico' },
            { key: 'acta_responsiva', label: 'Acta responsiva' },
          ].map(f => (
            <textarea key={f.key} placeholder={f.label} rows={3}
              value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          ))}
          <input type="date" value={form.fecha_alta} onChange={e => setForm({...form, fecha_alta: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="Fecha de alta" />
          <select value={form.tipo_alta} onChange={e => setForm({...form, tipo_alta: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="">Tipo de alta</option>
            <option value="Curación">Curación</option>
            <option value="Mejoría">Mejoría</option>
            <option value="Fallecimiento">Fallecimiento</option>
            <option value="Otro">Otro</option>
          </select>
          <button onClick={handleGuardarClick}
            className="col-span-2 bg-green-500 text-white py-2 rounded-lg text-sm hover:bg-green-600">
            Guardar
          </button>
        </div>
      )}

      <div className="space-y-4">
        {hospitalizaciones.map(h => (
          <div key={h.id} className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
            <p className="text-xs text-gray-400 mb-3">Ingreso: {new Date(h.fecha_ingreso).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}{h.fecha_alta && ` - Alta: ${new Date(h.fecha_alta).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}`}</p>
            <div className="grid grid-cols-2 gap-3 text-sm dark:text-gray-200">
              {h.historia_clinica && <div><span className="font-semibold text-gray-600 dark:text-gray-400">Historia clinica: </span>{h.historia_clinica}</div>}
              {h.abordaje_hospitalario && <div><span className="font-semibold text-gray-600 dark:text-gray-400">Abordaje: </span>{h.abordaje_hospitalario}</div>}
              {h.tratamiento_intrahospitalario && <div><span className="font-semibold text-gray-600 dark:text-gray-400">Tratamiento: </span>{h.tratamiento_intrahospitalario}</div>}
              {h.abordaje_diagnostico && <div><span className="font-semibold text-gray-600 dark:text-gray-400">Abordaje dx: </span>{h.abordaje_diagnostico}</div>}
              {h.tipo_alta && <div><span className="font-semibold text-gray-600 dark:text-gray-400">Tipo de alta: </span>{h.tipo_alta}</div>}
              {h.acta_responsiva && <div className="col-span-2"><span className="font-semibold text-gray-600 dark:text-gray-400">Acta responsiva: </span>{h.acta_responsiva}</div>}
            </div>
          </div>
        ))}
        {hospitalizaciones.length === 0 && <p className="text-gray-400 text-center py-6">Sin hospitalizaciones registradas</p>}
      </div>
    </div>
  );
}
