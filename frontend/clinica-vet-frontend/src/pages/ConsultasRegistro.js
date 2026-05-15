import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function ConsultasRegistro() {
  const navigate = useNavigate();
  const [consultas, setConsultas] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    API.get('/consultas/all')
      .then(r => setConsultas(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const filteredConsultas = consultas.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.paciente_nombre?.toLowerCase().includes(query) ||
      item.tutor_nombre?.toLowerCase().includes(query) ||
      item.motivo?.toLowerCase().includes(query) ||
      item.dx_definitivo?.toLowerCase().includes(query) ||
      item.dx_presuntivo?.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Consultas</h2>
          <p className="text-gray-500 dark:text-gray-400">Registro completo de consultas veterinarias.</p>
        </div>
        <button onClick={() => navigate('/pacientes?new=true')}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 transition">
          Nuevo paciente para consulta
        </button>
      </div>
      <div className="mb-6">
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar por paciente, tutor o diagnóstico"
          className="w-full md:w-1/2 border rounded-lg px-4 py-3 text-sm dark:bg-gray-900 dark:text-white dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Paciente</th>
              <th className="px-4 py-3">Tutor</th>
              <th className="px-4 py-3">Motivo</th>
              <th className="px-4 py-3">Diagnóstico</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Cargando registros...</td></tr>
            ) : filteredConsultas.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No hay consultas registradas.</td></tr>
            ) : filteredConsultas.map(item => (
              <tr key={item.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <td className="px-4 py-4">{item.fecha ? new Date(item.fecha).toLocaleDateString('es-MX') : 'Sin fecha'}</td>
                <td className="px-4 py-4">{item.paciente_nombre}</td>
                <td className="px-4 py-4">{item.tutor_nombre} {item.tutor_apellidos}</td>
                <td className="px-4 py-4">{item.motivo || '—'}</td>
                <td className="px-4 py-4">{item.dx_definitivo || item.dx_presuntivo || '—'}</td>
                <td className="px-4 py-4">
                  <button onClick={() => navigate(`/expediente/${item.paciente_id}`)}
                    className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
                    Ver expediente
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
