import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const tarjetas = [
  { key: 'tutores', label: 'Tutores', icon: '👤', color: 'bg-blue-500', ruta: '/tutores' },
  { key: 'pacientes', label: 'Pacientes', icon: '🐾', color: 'bg-green-500', ruta: '/pacientes' },
  { key: 'consultas', label: 'Consultas', icon: '📋', color: 'bg-purple-500', ruta: null },
  { key: 'hospitalizaciones', label: 'Hospitalizaciones', icon: '🏥', color: 'bg-yellow-500', ruta: null },
  { key: 'cirugias', label: 'Cirugias', icon: '🔪', color: 'bg-red-500', ruta: null },
  { key: 'vacunas', label: 'Vacunas', icon: '💉', color: 'bg-teal-500', ruta: null },
];

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/stats').then(r => setStats(r.data));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Bienvenido</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Resumen general del sistema</p>
      <div className="grid grid-cols-3 gap-4">
        {tarjetas.map(t => (
          <div key={t.key}
            onClick={() => t.ruta && navigate(t.ruta)}
            className={`${t.color} ${t.ruta ? 'cursor-pointer hover:opacity-90' : ''} text-white rounded-xl p-6 shadow transition`}>
            <div className="text-3xl mb-2">{t.icon}</div>
            <div className="text-3xl font-bold mb-1">{stats[t.key] ?? '...'}</div>
            <div className="text-sm opacity-90">{t.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}