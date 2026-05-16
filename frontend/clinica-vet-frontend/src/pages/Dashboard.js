import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const modulos = [
  { key: 'tutores', label: 'Tutores', icon: '👤', color: 'from-blue-500 to-blue-600', ruta: '/tutores', desc: 'Gestionar propietarios' },
  { key: 'pacientes', label: 'Pacientes', icon: '🐾', color: 'from-green-500 to-green-600', ruta: '/pacientes', desc: 'Animales registrados' },
  { key: 'consultas', label: 'Consultas', icon: '📋', color: 'from-purple-500 to-purple-600', ruta: '/consultas', desc: 'Citas veterinarias' },
  { key: 'hospitalizaciones', label: 'Hospitalizaciones', icon: '🏥', color: 'from-yellow-500 to-yellow-600', ruta: '/hospitalizaciones', desc: 'Pacientes internados' },
  { key: 'cirugias', label: 'Cirugías', icon: '🔪', color: 'from-red-500 to-red-600', ruta: '/cirugias', desc: 'Procedimientos quirúrgicos' },
  { key: 'vacunas', label: 'Vacunas', icon: '💉', color: 'from-teal-500 to-teal-600', ruta: '/vacunas', desc: 'Plan de vacunación' },
];

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const total = Object.values(stats).reduce((a, b) => (typeof b === 'number' ? a + b : a), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-4xl">🏥</div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Clínica Veterinaria</h1>
            <p className="text-gray-600 dark:text-gray-400">Sistema de Gestión Integral</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8 mb-10">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-6">📊 Resumen del Sistema</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {modulos.map(m => (
            <div key={m.key} className="text-center p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md transition">
              <div className="text-2xl mb-2">{m.icon}</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{stats[m.key] ?? 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{m.label}</div>
            </div>
          ))}
          <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
            <div className="text-2xl mb-2">📈</div>
            <div className="text-sm font-semibold text-blue-900 dark:text-blue-300">{total}</div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Total</div>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🎯 Módulos Principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modulos.map(m => (
            <div
              key={m.key}
              onClick={() => m.ruta && navigate(m.ruta)}
              className={`group relative bg-gradient-to-br ${m.color} ${m.ruta ? 'cursor-pointer' : 'opacity-75'} rounded-2xl shadow-lg overflow-hidden transition transform hover:scale-105 hover:shadow-2xl`}>
              
              {/* Background decoration */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full transform translate-x-8 -translate-y-8"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full transform -translate-x-4 translate-y-4"></div>
              </div>

              {/* Content */}
              <div className="relative p-8 text-white h-48 flex flex-col justify-between">
                <div>
                  <div className="text-5xl mb-4 group-hover:scale-110 transition transform">{m.icon}</div>
                  <h3 className="text-2xl font-bold mb-2">{m.label}</h3>
                  <p className="text-white/90 text-sm">{m.desc}</p>
                </div>
                
                <div className="flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="text-4xl font-bold">{stats[m.key] ?? 0}</span>
                    <span className="text-white/70 text-xs mt-1">registros</span>
                  </div>
                  {m.ruta && <div className="text-3xl opacity-50 group-hover:opacity-100 transition">→</div>}
                </div>
              </div>

              {/* Hover indicator */}
              {m.ruta && <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 group-hover:bg-white/100 transition"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-10 bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">⚡ Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button onClick={() => navigate('/tutores')} className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 py-3 rounded-lg font-medium transition">
            Nuevo Tutor
          </button>
          <button onClick={() => navigate('/pacientes')} className="bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 py-3 rounded-lg font-medium transition">
            Nuevo Paciente
          </button>
          <button onClick={() => navigate('/consultas')} className="bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-400 py-3 rounded-lg font-medium transition">
            Nueva Consulta
          </button>
          <button onClick={() => navigate('/reportes')} className="bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 py-3 rounded-lg font-medium transition">
            Reportes
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
        <p>Sistema de Gestión Veterinaria | Interfaz diseñada para facilidad de uso y eficiencia</p>
      </div>
    </div>
  );
}