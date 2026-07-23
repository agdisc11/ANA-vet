import { useNavigate } from 'react-router-dom';
import { PageHeader, SearchInput, DataTable, Pagination } from '../components/ui';
import { useClientTable } from '../hooks/useClientTable';
import { useVacunas } from '../hooks/useClinico';

const fmt = (d) => (d ? new Date(d).toLocaleDateString('es-MX') : '—');

function ProximaBadge({ proxima }) {
  if (!proxima) return '—';
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const p = new Date(proxima); p.setHours(0, 0, 0, 0);
  const diff = Math.ceil((p - hoy) / 86_400_000);
  if (diff <= 0) return <span className="badge-red">Vencida</span>;
  if (diff <= 30) return <span className="badge-yellow">En {diff}d</span>;
  return <span className="badge-green">{fmt(proxima)}</span>;
}

export default function VacunasRegistro() {
  const navigate = useNavigate();
  const { data: vacunas = [], isLoading } = useVacunas();

  const { query, setQuery, page, setPage, totalPages, filtered, pageItems } = useClientTable(
    vacunas,
    { searchKeys: ['paciente_nombre', 'tutor_nombre', 'nombre', 'fabricante'] }
  );

  const columns = [
    { header: 'Vacuna', className: 'font-semibold text-slate-800 dark:text-slate-200', cell: (v) => v.nombre },
    { header: 'Aplicación', className: 'text-slate-500 dark:text-slate-400 whitespace-nowrap', cell: (v) => fmt(v.fecha_aplicacion) },
    { header: 'Próxima dosis', cell: (v) => <ProximaBadge proxima={v.proxima_dosis} /> },
    { header: 'Paciente', cell: (v) => v.paciente_nombre },
    { header: 'Tutor', cell: (v) => `${v.tutor_nombre || ''} ${v.tutor_apellidos || ''}`.trim() || '—' },
    {
      header: '', stopPropagation: true,
      cell: (v) => (
        <button onClick={() => navigate(`/expediente/${v.paciente_id}`)} className="text-violet-600 dark:text-violet-400 text-xs font-semibold hover:underline">
          Ver expediente →
        </button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Vacunas"
        subtitle="Registro completo del plan de vacunación"
        action={
          <button onClick={() => navigate('/pacientes?new=true')} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo paciente
          </button>
        }
      />

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar por paciente, vacuna o fabricante..." className="mb-4" />

      <DataTable
        columns={columns}
        data={pageItems}
        loading={isLoading}
        empty={{ title: 'Sin vacunas registradas', hint: query ? 'Intenta con otra búsqueda' : undefined }}
      />

      <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} />
    </div>
  );
}
