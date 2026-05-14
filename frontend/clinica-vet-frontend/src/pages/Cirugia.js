import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';

export default function Cirugia() {
  const { expedienteId, pacienteId } = useParams();
  const navigate = useNavigate();
  const [cirugias, setCirugias] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    fecha: '', procedimiento: '', plan_quirurgico: '', notas: '', consentimiento: '',
    protocolo: '', farmacos: '', dosis: '', observaciones_anestesia: ''
  });

  useEffect(() => {
    API.get(`/cirugias/${expedienteId}`).then(r => setCirugias(r.data));
  }, [expedienteId]);

  const guardar = async () => {
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
    setForm({ fecha: '', procedimiento: '', plan_quirurgico: '', notas: '', consentimiento: '', protocolo: '', farmacos: '', dosis: '', observaciones_anestesia: '' });
    setMostrarForm(false);
    API.get(`/cirugias/${expedienteId}`).then(r => setCirugias(r.data));
  };

  return (
    <div>
      <button onClick={() => navigate(`/expediente/${pacienteId}`)}
        className="text-blue-600 text-sm mb-4 hover:underline">← Volver al expediente</button>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Cirugias</h2>
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Nueva cirugia
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5 mb-6 grid grid-cols-2 gap-4">
          <p className="col-span-2 font-semibold text-gray-600 dark:text-gray-300 text-sm border-b pb-2">Datos de la cirugia</p>
          <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm col-span-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          {[
            { key: 'procedimiento', label: 'Procedimiento' },
            { key: 'plan_quirurgico', label: 'Plan quirurgico' },
            { key: 'notas', label: 'Notas' },
            { key: 'consentimiento', label: 'Consentimiento' },
          ].map(f => (
            <textarea key={f.key} placeholder={f.label} rows={3}
              value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          ))}
          <p className="col-span-2 font-semibold text-gray-600 dark:text-gray-300 text-sm border-b pb-2 mt-2">Protocolo anestesico</p>
          {[
            { key: 'protocolo', label: 'Protocolo' },
            { key: 'farmacos', label: 'Farmacos' },
            { key: 'dosis', label: 'Dosis' },
            { key: 'observaciones_anestesia', label: 'Observaciones' },
          ].map(f => (
            <textarea key={f.key} placeholder={f.label} rows={3}
              value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          ))}
          <button onClick={guardar}
            className="col-span-2 bg-green-500 text-white py-2 rounded-lg text-sm hover:bg-green-600">
            Guardar
          </button>
        </div>
      )}

      <div className="space-y-4">
        {cirugias.map(c => (
          <div key={c.id} className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
            <p className="text-xs text-gray-400 mb-1">{new Date(c.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <p className="font-bold text-gray-800 dark:text-white mb-3">{c.procedimiento}</p>
            <div className="grid grid-cols-2 gap-3 text-sm dark:text-gray-200">
              {c.plan_quirurgico && <div><span className="font-semibold text-gray-600 dark:text-gray-400">Plan quirurgico: </span>{c.plan_quirurgico}</div>}
              {c.notas && <div><span className="font-semibold text-gray-600 dark:text-gray-400">Notas: </span>{c.notas}</div>}
              {c.consentimiento && <div className="col-span-2"><span className="font-semibold text-gray-600 dark:text-gray-400">Consentimiento: </span>{c.consentimiento}</div>}
            </div>
          </div>
        ))}
        {cirugias.length === 0 && <p className="text-gray-400 text-center py-6">Sin cirugias registradas</p>}
      </div>
    </div>
  );
}