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

  const filtradas = vacunas.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.paciente_nombre?.toLowerCase().includes(q) ||
      item.tutor_nombre?.toLowerCase().includes(q) ||
      item.nombre?.toLowerCase().includes(q) ||
      item.fabricante?.toLowerCase().includes(q)
    );
  });

  const getProximaBadge = (proxima_dosis) => {
    if (!proxima_dosis) return null;
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const proxima = new Date(proxima_dosis); proxima.setHours(0, 0, 0, 0);
    const diff = Math.ceil((proxima - hoy) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return <span className="badge-red">Vencida</span>;
    if (diff <= 30) return <span className="badge-yellow">En {diff}d</span>;
    return <span className="badge-green">{new Date(proxima_dosis).toLocaleDateString('es-MX')}</span>;
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Vacunas</h1>
          <p className="page-subtitle">Registro completo del plan de vacunación</p>
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
          placeholder="Buscar por paciente, vacuna o fabricante..."
          className="input pl-9"
        />
      </div>

      <div className="table-wrapper">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              {['Vacuna', 'Aplicación', 'Próxima dosis', 'Paciente', 'Tutor', ''].map(h => (
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  <p className="text-sm font-medium">Sin vacunas registradas</p>
                </div>
              </td></tr>
            ) : filtradas.map(item => (
              <tr key={item.id} className="table-row">
                <td className="table-cell font-semibold text-slate-800 dark:text-slate-200">{item.nombre}</td>
                <td className="table-cell text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {item.fecha_aplicacion ? new Date(item.fecha_aplicacion).toLocaleDateString('es-MX') : '—'}
                </td>
                <td className="table-cell">{getProximaBadge(item.proxima_dosis) || '—'}</td>
                <td className="table-cell">{item.paciente_nombre}</td>
                <td className="table-cell">{item.tutor_nombre} {item.tutor_apellidos}</td>
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
          {filtradas.length} vacuna{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
