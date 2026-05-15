import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function HospitalizacionesRegistro() {
  const navigate = useNavigate();
  const [hospitalizaciones, setHospitalizaciones] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    API.get('/hospitalizaciones/all')
      .then(r => setHospitalizaciones(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const filteredHospitalizaciones = hospitalizaciones.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.paciente_nombre?.toLowerCase().includes(query) ||
      item.tutor_nombre?.toLowerCase().includes(query) ||
      item.tipo_alta?.toLowerCase().includes(query) ||
      item.historia_clinica?.toLowerCase().includes(query) ||
      item.abordaje_hospitalario?.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hospitalizaciones</h2>
          <p className="text-gray-500 dark:text-gray-400">Pacientes internados y sus antecedentes.</p>
        </div>
        <button onClick={() => navigate('/pacientes?new=true')}
          className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition">
          Nuevo paciente internado
        </button>
      </div>
      <div className="mb-6">
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar por paciente, tutor, estado o diagnóstico"
          className="w-full md:w-1/2 border rounded-lg px-4 py-3 text-sm dark:bg-gray-900 dark:text-white dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Ingreso</th>
              <th className="px-4 py-3">Paciente</th>
              <th className="px-4 py-3">Tutor</th>
              <th className="px-4 py-3">Alta</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Cargando registros...</td></tr>
            ) : filteredHospitalizaciones.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No hay hospitalizaciones registradas.</td></tr>
            ) : filteredHospitalizaciones.map(item => (
              <tr key={item.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <td className="px-4 py-4">{item.fecha_ingreso ? new Date(item.fecha_ingreso).toLocaleDateString('es-MX') : '—'}</td>
                <td className="px-4 py-4">{item.paciente_nombre}</td>
                <td className="px-4 py-4">{item.tutor_nombre} {item.tutor_apellidos}</td>
                <td className="px-4 py-4">{item.fecha_alta ? new Date(item.fecha_alta).toLocaleDateString('es-MX') : 'Pendiente'}</td>
                <td className="px-4 py-4">{item.tipo_alta || 'Activo'}</td>
                <td className="px-4 py-4">
                  <button onClick={() => navigate(`/expediente/${item.paciente_id}`)}
                    className="text-green-600 dark:text-green-400 text-sm font-medium hover:underline">
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
