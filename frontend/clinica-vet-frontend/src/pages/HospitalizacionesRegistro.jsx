import { useNavigate } from 'react-router-dom';
import { PageHeader, SearchInput, DataTable, Pagination } from '../components/ui';
import { useClientTable } from '../hooks/useClientTable';
import { useHospitalizaciones } from '../hooks/useClinico';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('es-MX') : '—');

function EstadoBadge({ item }) {
  if (!item.fecha_alta) return <span className="badge-yellow">Activo</span>;
  const tipo = item.tipo_alta?.toLowerCase();
  if (tipo === 'fallecimiento') return <span className="badge-red">{item.tipo_alta}</span>;
  if (tipo === 'curación') return <span className="badge-green">{item.tipo_alta}</span>;
  return <span className="badge-blue">{item.tipo_alta || 'Alta'}</span>;
}

export default function HospitalizacionesRegistro() {
  const navigate = useNavigate();
  const { data: hospitalizaciones = [], isLoading } = useHospitalizaciones();

  const { query, setQuery, page, setPage, totalPages, filtered, pageItems } = useClientTable(
    hospitalizaciones,
    { searchKeys: ['paciente_nombre', 'tutor_nombre', 'tipo_alta', 'historia_clinica', 'empleados_nombres'] }
  );

  const columns = [
    { header: 'Ingreso', className: 'text-slate-500 dark:text-slate-400 whitespace-nowrap', cell: (h) => fmt(h.fecha_ingreso) },
    { header: 'Paciente', className: 'font-semibold text-slate-800 dark:text-slate-200', cell: (h) => h.paciente_nombre },
    { header: 'Tutor', cell: (h) => `${h.tutor_nombre || ''} ${h.tutor_apellidos || ''}`.trim() || '—' },
    {
      header: 'Personal médico',
      cell: (h) => h.empleados_nombres
        ? <span className="max-w-[180px] truncate inline-block align-bottom text-xs text-slate-600 dark:text-slate-300" title={h.empleados_nombres}>{h.empleados_nombres}</span>
        : <span className="text-slate-400 dark:text-slate-500 text-xs">Sin asignar</span>,
    },
    { header: 'Alta', className: 'text-slate-500 dark:text-slate-400 whitespace-nowrap', cell: (h) => h.fecha_alta ? fmt(h.fecha_alta) : <span className="badge-yellow">Pendiente</span> },
    { header: 'Estado', cell: (h) => <EstadoBadge item={h} /> },
    {
      header: '', stopPropagation: true,
      cell: (h) => (
        <button onClick={() => navigate(`/expediente/${h.paciente_id}`)} className="text-violet-600 dark:text-violet-400 text-xs font-semibold hover:underline">
          Ver expediente →
        </button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Hospitalizaciones"
        subtitle="Pacientes internados y sus antecedentes"
        action={
          <button onClick={() => navigate('/pacientes?new=true')} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo paciente
          </button>
        }
      />

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar por paciente, tutor, estado o personal médico..." className="mb-4" />

      <DataTable
        columns={columns}
        data={pageItems}
        loading={isLoading}
        empty={{ title: 'Sin hospitalizaciones registradas', hint: query ? 'Intenta con otra búsqueda' : undefined }}
      />

      <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} />
    </div>
  );
}
