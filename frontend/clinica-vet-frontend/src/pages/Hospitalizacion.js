import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:4000/api';

export default function Hospitalizacion() {
  const { expedienteId, pacienteId } = useParams();
  const navigate = useNavigate();
  const [hospitalizaciones, setHospitalizaciones] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    fecha_ingreso: '', historia_clinica: '', abordaje_hospitalario: '',
    tratamiento_intrahospitalario: '', abordaje_diagnostico: ''
  });

  const cargar = () => axios.get(`${API}/hospitalizaciones/${expedienteId}`).then(r => setHospitalizaciones(r.data));

  useEffect(() => { cargar(); }, [expedienteId]);

  const guardar = async () => {
    await axios.post(`${API}/hospitalizaciones`, { expediente_id: expedienteId, ...form });
    setForm({ fecha_ingreso: '', historia_clinica: '', abordaje_hospitalario: '', tratamiento_intrahospitalario: '', abordaje_diagnostico: '' });
    setMostrarForm(false);
    cargar();
  };

  return (
    <div>
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
        {hospitalizaciones.map(h => (
          <div key={h.id} className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
            <p className="text-xs text-gray-400 mb-3">Ingreso: {new Date(h.fecha_ingreso).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            <div className="grid grid-cols-2 gap-3 text-sm dark:text-gray-200">
              {h.historia_clinica && <div><span className="font-semibold text-gray-600 dark:text-gray-400">Historia clinica: </span>{h.historia_clinica}</div>}
              {h.abordaje_hospitalario && <div><span className="font-semibold text-gray-600 dark:text-gray-400">Abordaje: </span>{h.abordaje_hospitalario}</div>}
              {h.tratamiento_intrahospitalario && <div><span className="font-semibold text-gray-600 dark:text-gray-400">Tratamiento: </span>{h.tratamiento_intrahospitalario}</div>}
              {h.abordaje_diagnostico && <div><span className="font-semibold text-gray-600 dark:text-gray-400">Abordaje dx: </span>{h.abordaje_diagnostico}</div>}
            </div>
          </div>
        ))}
        {hospitalizaciones.length === 0 && <p className="text-gray-400 text-center py-6">Sin hospitalizaciones registradas</p>}
      </div>
    </div>
  );
}