import { useEffect, useState } from 'react';
import API from '../api';

export default function Reportes() {
  const [stats, setStats] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    API.get('/stats')
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return <div className="text-gray-500 dark:text-gray-400">Cargando reportes...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reportes</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Métricas generales del sistema en tiempo real.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats && Object.entries(stats).map(([key, value]) => (
          <div key={key} className="bg-white dark:bg-gray-900 rounded-3xl shadow p-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">{key}</p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mt-3">{value}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Registro total</p>
          </div>
        ))}
      </div>
    </div>
  );
}
