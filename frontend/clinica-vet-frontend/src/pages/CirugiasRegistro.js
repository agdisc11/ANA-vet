import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function CirugiasRegistro() {
  const navigate = useNavigate();
  const [cirugias, setCirugias] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    API.get('/cirugias/all')
      .then(r => setCirugias(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  const filtradas = cirugias.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.paciente_nombre?.toLowerCase().includes(q) ||
      item.tutor_nombre?.toLowerCase().includes(q) ||
      item.procedimiento?.toLowerCase().includes(q) ||
      item.protocolo?.toLowerCase().includes(q) ||
      item.empleados_nombres?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cirugías</h1>
          <p className="page-subtitle">Registro de procedimientos quirúrgicos y anestesia</p>
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
          placeholder="Buscar por paciente, procedimiento, protocolo o personal..."
          className="input pl-9"
        />
      </div>

      <div className="table-wrapper">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              {['Fecha', 'Paciente', 'Tutor', 'Procedimiento', 'Personal médico', 'Anestesia', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                <div className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Cargando registros...
                </div>
              </td></tr>
            ) : filtradas.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-12 text-center">
                <div className="text-slate-400 dark:text-slate-500">
                  <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <p className="text-sm font-medium">Sin cirugías registradas</p>
                </div>
              </td></tr>
            ) : filtradas.map(item => (
              <tr key={item.id} className="table-row">
                <td className="table-cell text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {item.fecha ? new Date(item.fecha).toLocaleDateString('es-MX') : '—'}
                </td>
                <td className="table-cell font-semibold text-slate-800 dark:text-slate-200">{item.paciente_nombre}</td>
                <td className="table-cell">{item.tutor_nombre} {item.tutor_apellidos}</td>
                <td className="table-cell">
                  {item.procedimiento ? (
                    <span className="badge-red">{item.procedimiento}</span>
                  ) : '—'}
                </td>
                <td className="table-cell">
                  {item.empleados_nombres ? (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600 dark:text-slate-300">
                      <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="max-w-[160px] truncate" title={item.empleados_nombres}>{item.empleados_nombres}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 text-xs">Sin asignar</span>
                  )}
                </td>
                <td className="table-cell text-slate-500 dark:text-slate-400">{item.protocolo || '—'}</td>
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
          {filtradas.length} cirugía{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
