import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:4000/api';

export default function Consulta() {
  const { expedienteId, pacienteId } = useParams();
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    fecha: '', motivo: '', anamnesis: '', examen_fisico: '', indicaciones: ''
  });

  const cargar = () => axios.get(`${API}/consultas/${expedienteId}`).then(r => setConsultas(r.data));

  useEffect(() => { cargar(); }, [expedienteId]);

  const guardar = async () => {
    await axios.post(`${API}/consultas`, { expediente_id: expedienteId, ...form });
    setForm({ fecha: '', motivo: '', anamnesis: '', examen_fisico: '', indicaciones: '' });
    setMostrarForm(false);
    cargar();
  };

  return (
    <div>
      <button onClick={() => navigate(`/expediente/${pacienteId}`)}
        className="text-blue-600 text-sm mb-4 hover:underline">← Volver al expediente</button>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Consultas</h2>
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Nueva consulta
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5 mb-6 grid grid-cols-2 gap-4">
          <input type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm col-span-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          {[
            { key: 'motivo', label: 'Motivo de consulta' },
            { key: 'anamnesis', label: 'Anamnesis' },
            { key: 'examen_fisico', label: 'Examen fisico' },
            { key: 'indicaciones', label: 'Indicaciones' },
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
        {consultas.map(c => (
          <div key={c.id} className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
            <p className="text-xs text-gray-400 mb-3">{new Date(c.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <div className="grid grid-cols-2 gap-3 text-sm dark:text-gray-200">
              {c.motivo && <div><span className="font-semibold text-gray-600 dark:text-gray-400">Motivo: </span>{c.motivo}</div>}
              {c.anamnesis && <div><span className="font-semibold text-gray-600 dark:text-gray-400">Anamnesis: </span>{c.anamnesis}</div>}
              {c.examen_fisico && <div><span className="font-semibold text-gray-600 dark:text-gray-400">Examen fisico: </span>{c.examen_fisico}</div>}
              {c.indicaciones && <div className="col-span-2"><span className="font-semibold text-gray-600 dark:text-gray-400">Indicaciones: </span>{c.indicaciones}</div>}
            </div>
          </div>
        ))}
        {consultas.length === 0 && <p className="text-gray-400 text-center py-6">Sin consultas registradas</p>}
      </div>
    </div>
  );
}