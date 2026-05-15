import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function VacunasRegistro() {
  const navigate = useNavigate();
  const [vacunas, setVacunas] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    API.get('/vacunas/all')
      .then(r => setVacunas(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const filteredVacunas = vacunas.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.paciente_nombre?.toLowerCase().includes(query) ||
      item.tutor_nombre?.toLowerCase().includes(query) ||
      item.nombre?.toLowerCase().includes(query) ||
      item.fabricante?.toLowerCase().includes(query) ||
      item.via_administracion?.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vacunas</h2>
          <p className="text-gray-500 dark:text-gray-400">Registro completo del plan de vacunación.</p>
        </div>
        <button onClick={() => navigate('/pacientes?new=true')}
          className="px-4 py-2 rounded-lg bg-teal-600 text-white text-sm hover:bg-teal-700 transition">
          Nuevo paciente para vacuna
        </button>
      </div>
      <div className="mb-6">
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar por paciente, vacuna o fabricante"
          className="w-full md:w-1/2 border rounded-lg px-4 py-3 text-sm dark:bg-gray-900 dark:text-white dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Vacuna</th>
              <th className="px-4 py-3">Aplicación</th>
              <th className="px-4 py-3">Próxima dosis</th>
              <th className="px-4 py-3">Paciente</th>
              <th className="px-4 py-3">Tutor</th>
              <th className="px-4 py-3">Acción</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">Cargando registros...</td></tr>
            ) : filteredVacunas.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-500">No hay vacunas registradas.</td></tr>
            ) : filteredVacunas.map(item => (
              <tr key={item.id} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <td className="px-4 py-4">{item.nombre}</td>
                <td className="px-4 py-4">{item.fecha_aplicacion ? new Date(item.fecha_aplicacion).toLocaleDateString('es-MX') : '—'}</td>
                <td className="px-4 py-4">{item.proxima_dosis ? new Date(item.proxima_dosis).toLocaleDateString('es-MX') : '—'}</td>
                <td className="px-4 py-4">{item.paciente_nombre}</td>
                <td className="px-4 py-4">{item.tutor_nombre} {item.tutor_apellidos}</td>
                <td className="px-4 py-4">
                  <button onClick={() => navigate(`/expediente/${item.paciente_id}`)}
                    className="text-teal-600 dark:text-teal-300 text-sm font-medium hover:underline">
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
