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

  const filtradas = hospitalizaciones.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.paciente_nombre?.toLowerCase().includes(q) ||
      item.tutor_nombre?.toLowerCase().includes(q) ||
      item.tipo_alta?.toLowerCase().includes(q) ||
      item.historia_clinica?.toLowerCase().includes(q)
    );
  });

  const getEstadoBadge = (item) => {
    if (!item.fecha_alta) return <span className="badge-yellow">Activo</span>;
    const tipo = item.tipo_alta?.toLowerCase();
    if (tipo === 'fallecimiento') return <span className="badge-red">{item.tipo_alta}</span>;
    if (tipo === 'curación') return <span className="badge-green">{item.tipo_alta}</span>;
    return <span className="badge-blue">{item.tipo_alta || 'Alta'}</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hospitalizaciones</h1>
          <p className="page-subtitle">Pacientes internados y sus antecedentes</p>
        </div>
        <button onClick={() => navigate('/pacientes?new=true')} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo paciente
        </button>
      </div>

      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar por paciente, tutor o estado..."
          className="input pl-9"
        />
      </div>

      <div className="table-wrapper">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              {['Ingreso', 'Paciente', 'Tutor', 'Alta', 'Estado', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Cargando registros...
                </div>
              </td></tr>
            ) : filtradas.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center">
                <div className="text-slate-400 dark:text-slate-500">
                  <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-sm font-medium">Sin hospitalizaciones registradas</p>
                </div>
              </td></tr>
            ) : filtradas.map(item => (
              <tr key={item.id} className="table-row">
                <td className="table-cell text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {item.fecha_ingreso ? new Date(item.fecha_ingreso).toLocaleDateString('es-MX') : '—'}
                </td>
                <td className="table-cell font-semibold text-slate-800 dark:text-slate-200">{item.paciente_nombre}</td>
                <td className="table-cell">{item.tutor_nombre} {item.tutor_apellidos}</td>
                <td className="table-cell text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {item.fecha_alta ? new Date(item.fecha_alta).toLocaleDateString('es-MX') : <span className="badge-yellow">Pendiente</span>}
                </td>
                <td className="table-cell">{getEstadoBadge(item)}</td>
                <td className="table-cell">
                  <button
                    onClick={() => navigate(`/expediente/${item.paciente_id}`)}
                    className="text-violet-600 dark:text-violet-400 text-xs font-semibold hover:underline"
                  >
                    Ver expediente →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!cargando && filtradas.length > 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 text-right">
          {filtradas.length} hospitalización{filtradas.length !== 1 ? 'es' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
