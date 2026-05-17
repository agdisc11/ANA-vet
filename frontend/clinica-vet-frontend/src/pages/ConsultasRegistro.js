import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import Toast from '../components/Toast';

export default function ConsultasRegistro() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [consultas, setConsultas] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cargando, setCargando] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    API.get('/consultas/all')
      .then(r => setConsultas(r.data))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('action') === 'new') {
      setToast('Para registrar una nueva consulta, abre el expediente del paciente y usa el botón "Nueva consulta".');
      window.history.replaceState({}, '', '/consultas');
    }
  }, [search]);

  const filtradas = consultas.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      item.paciente_nombre?.toLowerCase().includes(q) ||
      item.tutor_nombre?.toLowerCase().includes(q) ||
      item.motivo?.toLowerCase().includes(q) ||
      item.dx_definitivo?.toLowerCase().includes(q) ||
      item.dx_presuntivo?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Consultas</h1>
          <p className="page-subtitle">Registro completo de consultas veterinarias</p>
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
          placeholder="Buscar por paciente, tutor o diagnóstico..."
          className="input pl-9"
        />
      </div>

      <div className="table-wrapper">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              {['Fecha', 'Paciente', 'Tutor', 'Motivo', 'Diagnóstico', ''].map(h => (
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-sm font-medium">Sin consultas registradas</p>
                </div>
              </td></tr>
            ) : filtradas.map(item => (
              <tr key={item.id} className="table-row">
                <td className="table-cell text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {item.fecha ? new Date(item.fecha).toLocaleDateString('es-MX') : '—'}
                </td>
                <td className="table-cell font-semibold text-slate-800 dark:text-slate-200">{item.paciente_nombre}</td>
                <td className="table-cell">{item.tutor_nombre} {item.tutor_apellidos}</td>
                <td className="table-cell text-slate-500 dark:text-slate-400 max-w-xs truncate">{item.motivo || '—'}</td>
                <td className="table-cell">
                  {item.dx_definitivo || item.dx_presuntivo ? (
                    <span className="badge-green">{item.dx_definitivo || item.dx_presuntivo}</span>
                  ) : '—'}
                </td>
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
          {filtradas.length} consulta{filtradas.length !== 1 ? 's' : ''} encontrada{filtradas.length !== 1 ? 's' : ''}
        </p>
      )}

      <Toast
        message={toast}
        type="error"
        onClose={() => setToast('')}
        duration={5000}
      />
    </div>
  );
}
