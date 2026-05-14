import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { useSelectedAnimal } from '../SelectedAnimalContext';

export default function Expediente() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  const { setSelectedAnimal } = useSelectedAnimal();
  const [paciente, setPaciente] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);

  useEffect(() => {
    setSelectedAnimal(null);
    API.get(`/pacientes/${pacienteId}`).then(r => setPaciente(r.data));
    API.get(`/expedientes/${pacienteId}`).then(r => setExpedientes(r.data));
  }, [pacienteId, setSelectedAnimal]);

  useEffect(() => {
    if (paciente) {
      setSelectedAnimal(paciente);
    }
  }, [paciente, setSelectedAnimal]);

  useEffect(() => {
    return () => setSelectedAnimal(null);
  }, [setSelectedAnimal]);

  const guardar = async () => {
    await API.post('/expedientes', { paciente_id: pacienteId });
    setMostrarForm(false);
    API.get(`/expedientes/${pacienteId}`).then(r => setExpedientes(r.data));
  };

  return (
    <div>
      <button onClick={() => navigate('/pacientes')}
        className="text-blue-600 text-sm mb-4 hover:underline">← Volver</button>

      {paciente && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5 mb-6">
          <div className="flex flex-wrap gap-8">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase">Paciente</p>
              <p className="text-xl font-bold text-gray-800 dark:text-white">{paciente.nombre}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Tutor: {paciente.tutor}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase">Categorías</p>
              <p className="font-medium dark:text-gray-100">{paciente.especie} / {paciente.sexo}</p>
              {paciente.funcion_zootecnica && <span className="block text-sm text-gray-500 dark:text-gray-400">{paciente.funcion_zootecnica}</span>}
            </div>
            <div><p className="text-xs text-gray-400 dark:text-gray-500 uppercase">Raza</p><p className="font-medium dark:text-gray-100">{paciente.raza}</p></div>
            {paciente.tatuaje && (
              <div><p className="text-xs text-gray-400 dark:text-gray-500 uppercase">Tatuaje</p><p className="font-medium dark:text-gray-100">{paciente.tatuaje}</p></div>
            )}
            {paciente.microchip && (
              <div><p className="text-xs text-gray-400 dark:text-gray-500 uppercase">Microchip</p><p className="font-medium dark:text-gray-100">{paciente.microchip}</p></div>
            )}
          </div>
          <div className="mt-4 flex gap-2 flex-wrap">
            <button onClick={() => navigate(`/vacunas/${pacienteId}`)}
              className="text-xs bg-green-50 dark:bg-green-900 text-green-600 dark:text-white px-3 py-1 rounded-lg hover:bg-green-100">
              💉 Vacunas
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-700 dark:text-white">Expedientes clínicos</h3>
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Nuevo expediente
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5 mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Al crear un expediente clínico se generará un número de expediente.
            El registro de consultas, hospitalizaciones y cirugías se realiza desde sus secciones.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={guardar}
              className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-600">
              Crear expediente
            </button>
            <button onClick={() => setMostrarForm(false)}
              className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {expedientes.map(e => (
          <div key={e.id} className="bg-white dark:bg-gray-900 rounded-xl shadow p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-xs text-gray-400 dark:text-gray-500">Expediente #{e.id}</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-100">Fecha de apertura: {e.fecha_apertura}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
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
                🔪 Cirugía
              </button>
            </div>
          </div>
        ))}
        {expedientes.length === 0 && <p className="text-gray-400 text-center py-6">Sin expedientes</p>}
      </div>
    </div>
  );
}