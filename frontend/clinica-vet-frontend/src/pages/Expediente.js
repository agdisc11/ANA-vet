import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:4000/api';

export default function Expediente() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  const [paciente, setPaciente] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    anamnesis: '', examen_fisico: '', examenes_sistemicos: '',
    lista_problemas: '', dx_presuntivo: '', abordaje_dx: '', dx_definitivo: ''
  });

  useEffect(() => {
    axios.get(`${API}/pacientes/${pacienteId}`).then(r => setPaciente(r.data));
    axios.get(`${API}/expedientes/${pacienteId}`).then(r => setExpedientes(r.data));
  }, [pacienteId]);

  const guardar = async () => {
    await axios.post(`${API}/expedientes`, { paciente_id: pacienteId, ...form });
    setMostrarForm(false);
    axios.get(`${API}/expedientes/${pacienteId}`).then(r => setExpedientes(r.data));
  };

  return (
    <div>
      <button onClick={() => navigate('/pacientes')}
        className="text-blue-600 text-sm mb-4 hover:underline">← Volver</button>

      {paciente && (
        <div className="bg-white rounded-xl shadow p-5 mb-6 flex gap-8">
          <div>
            <p className="text-xs text-gray-400 uppercase">Paciente</p>
            <p className="text-xl font-bold text-gray-800">{paciente.nombre}</p>
          </div>
          <div><p className="text-xs text-gray-400 uppercase">Especie</p><p className="font-medium">{paciente.especie}</p></div>
          <div><p className="text-xs text-gray-400 uppercase">Raza</p><p className="font-medium">{paciente.raza}</p></div>
          <div><p className="text-xs text-gray-400 uppercase">Sexo</p><p className="font-medium">{paciente.sexo}</p></div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-700">Expedientes clínicos</h3>
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Nuevo expediente
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6 grid grid-cols-2 gap-4">
          {[
            { key: 'anamnesis', label: 'Anamnesis' },
            { key: 'examen_fisico', label: 'Examen físico' },
            { key: 'examenes_sistemicos', label: 'Exámenes sistémicos' },
            { key: 'lista_problemas', label: 'Lista de problemas' },
            { key: 'dx_presuntivo', label: 'Dx presuntivo' },
            { key: 'abordaje_dx', label: 'Abordaje diagnóstico' },
            { key: 'dx_definitivo', label: 'Dx definitivo' },
          ].map(f => (
            <textarea key={f.key} placeholder={f.label} rows={2}
              value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          ))}
          <button onClick={guardar}
            className="col-span-2 bg-green-500 text-white py-2 rounded-lg text-sm hover:bg-green-600">
            Guardar
          </button>
        </div>
      )}

      <div className="space-y-4">
        {expedientes.map(e => (
          <div key={e.id} className="bg-white rounded-xl shadow p-5">
            <p className="text-xs text-gray-400 mb-2">{e.fecha_apertura}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {e.anamnesis && <div><span className="font-semibold text-gray-600">Anamnesis: </span>{e.anamnesis}</div>}
              {e.examen_fisico && <div><span className="font-semibold text-gray-600">Examen físico: </span>{e.examen_fisico}</div>}
              {e.examenes_sistemicos && <div><span className="font-semibold text-gray-600">Exámenes sistémicos: </span>{e.examenes_sistemicos}</div>}
              {e.lista_problemas && <div><span className="font-semibold text-gray-600">Lista de problemas: </span>{e.lista_problemas}</div>}
              {e.dx_presuntivo && <div><span className="font-semibold text-gray-600">Dx presuntivo: </span>{e.dx_presuntivo}</div>}
              {e.abordaje_dx && <div><span className="font-semibold text-gray-600">Abordaje dx: </span>{e.abordaje_dx}</div>}
              {e.dx_definitivo && <div className="col-span-2"><span className="font-semibold text-gray-600">Dx definitivo: </span>{e.dx_definitivo}</div>}
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => navigate(`/consulta/${pacienteId}/${e.id}`)}
                className="text-xs bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-white px-3 py-1 rounded-lg hover:bg-blue-100">
                📋 Consultas
              </button>
              <button onClick={() => navigate(`/hospitalizacion/${pacienteId}/${e.id}`)}
                className="text-xs bg-purple-50 dark:bg-purple-900 text-purple-600 dark:text-white px-3 py-1 rounded-lg hover:bg-purple-100">
                🏥 Hospitalización
              </button>
              <button onClick={() => navigate(`/cirugia/${pacienteId}/${e.id}`)}
                className="text-xs bg-red-50 dark:bg-red-900 text-red-600 dark:text-white px-3 py-1 rounded-lg hover:bg-red-100">
                🔪 Cirugia
              </button>
            </div>
          </div>
        ))}
        {expedientes.length === 0 && <p className="text-gray-400 text-center py-6">Sin expedientes</p>}
      </div>
    </div>
  );
}