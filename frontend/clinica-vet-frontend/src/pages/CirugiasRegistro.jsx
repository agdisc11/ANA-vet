import { useNavigate } from 'react-router-dom';
import { PageHeader, SearchInput, DataTable, Pagination } from '../components/ui';
import { useClientTable } from '../hooks/useClientTable';
import { useCirugias } from '../hooks/useClinico';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('es-MX') : '—');

export default function CirugiasRegistro() {
  const navigate = useNavigate();
  const { data: cirugias = [], isLoading } = useCirugias();

  const { query, setQuery, page, setPage, totalPages, filtered, pageItems } = useClientTable(
    cirugias,
    { searchKeys: ['paciente_nombre', 'tutor_nombre', 'procedimiento', 'protocolo', 'empleados_nombres'] }
  );

  const columns = [
    { header: 'Fecha', className: 'text-slate-500 dark:text-slate-400 whitespace-nowrap', cell: (c) => fmt(c.fecha) },
    { header: 'Paciente', className: 'font-semibold text-slate-800 dark:text-slate-200', cell: (c) => c.paciente_nombre },
    { header: 'Tutor', cell: (c) => `${c.tutor_nombre || ''} ${c.tutor_apellidos || ''}`.trim() || '—' },
    { header: 'Procedimiento', cell: (c) => (c.procedimiento ? <span className="badge-red">{c.procedimiento}</span> : '—') },
    {
      header: 'Personal médico',
      cell: (c) => c.empleados_nombres
        ? <span className="max-w-[180px] truncate inline-block align-bottom text-xs text-slate-600 dark:text-slate-300" title={c.empleados_nombres}>{c.empleados_nombres}</span>
        : <span className="text-slate-400 dark:text-slate-500 text-xs">Sin asignar</span>,
    },
    { header: 'Anestesia', className: 'text-slate-500 dark:text-slate-400', cell: (c) => c.protocolo || '—' },
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
        title="Cirugías"
        subtitle="Registro de procedimientos quirúrgicos y anestesia"
        action={
          <button onClick={() => navigate('/pacientes?new=true')} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo paciente
          </button>
        }
      />

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar por paciente, procedimiento, protocolo o personal..." className="mb-4" />

      <DataTable
        columns={columns}
        data={pageItems}
        loading={isLoading}
        empty={{ title: 'Sin cirugías registradas', hint: query ? 'Intenta con otra búsqueda' : undefined }}
      />

      <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} />
    </div>
  );
}
