import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { PageHeader, SearchInput, DataTable, Pagination } from '../components/ui';
import { useClientTable } from '../hooks/useClientTable';
import { useConsultas } from '../hooks/useClinico';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('es-MX') : '—');

export default function ConsultasRegistro() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const toast = useToast();
  const { data: consultas = [], isLoading } = useConsultas();

  const { query, setQuery, page, setPage, totalPages, filtered, pageItems } = useClientTable(
    consultas,
    { searchKeys: ['paciente_nombre', 'tutor_nombre', 'motivo', 'dx_definitivo', 'dx_presuntivo', 'empleado_nombre'] }
  );

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('action') === 'new') {
      toast.info('Para registrar una nueva consulta, abre el expediente del paciente y usa el botón "Nueva consulta".');
      window.history.replaceState({}, '', '/consultas');
    }
  }, [search, toast]);

  const columns = [
    { header: 'Fecha', className: 'text-slate-500 dark:text-slate-400 whitespace-nowrap', cell: (c) => fmt(c.fecha) },
    { header: 'Paciente', className: 'font-semibold text-slate-800 dark:text-slate-200', cell: (c) => c.paciente_nombre },
    { header: 'Tutor', cell: (c) => `${c.tutor_nombre || ''} ${c.tutor_apellidos || ''}`.trim() || '—' },
    {
      header: 'Médico encargado',
      cell: (c) => c.empleado_nombre
        ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-medium">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {c.empleado_nombre} {c.empleado_apellidos}
          </span>
        )
        : <span className="text-slate-400 dark:text-slate-500 text-xs">Sin asignar</span>,
    },
    { header: 'Motivo', className: 'text-slate-500 dark:text-slate-400 max-w-xs truncate', cell: (c) => c.motivo || '—' },
    { header: 'Diagnóstico', cell: (c) => (c.dx_definitivo || c.dx_presuntivo) ? <span className="badge-green">{c.dx_definitivo || c.dx_presuntivo}</span> : '—' },
    {
      header: '', stopPropagation: true,
      cell: (c) => (
        <button onClick={() => navigate(`/expediente/${c.paciente_id}`)} className="text-violet-600 dark:text-violet-400 text-xs font-semibold hover:underline">
          Ver expediente →
        </button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Consultas"
        subtitle="Registro completo de consultas veterinarias"
        action={
          <button onClick={() => navigate('/pacientes?new=true')} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo paciente
          </button>
        }
      />

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar por paciente, tutor, diagnóstico o médico..." className="mb-4" />

      <DataTable
        columns={columns}
        data={pageItems}
        loading={isLoading}
        empty={{ title: 'Sin consultas registradas', hint: query ? 'Intenta con otra búsqueda' : undefined }}
      />

      <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} />
    </div>
  );
}
