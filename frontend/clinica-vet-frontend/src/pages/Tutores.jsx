import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { plegar } from '../lib/texto';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { PageHeader, SearchInput, DataTable, Pagination, FormPanel, FormField } from '../components/ui';
import { useClientTable } from '../hooks/useClientTable';
import { useTutores, useCrearTutor, useDarDeBajaTutor, useVetarTutor } from '../hooks/useTutores';
import { mensajeError } from '../lib/queryClient';

const PAGE_SIZE = 10;
const EMPTY = { nombre: '', apellidos: '', telefono: '', whatsapp: '', correo: '', direccion: '' };

/** Campos sueltos donde también busca el filtro de la tabla. */
const CAMPOS_BUSCABLES = ['telefono', 'whatsapp', 'correo', 'direccion', 'codigo'];

const CAMPOS = [
  { key: 'nombre', label: 'Nombre *', placeholder: 'Nombre' },
  { key: 'apellidos', label: 'Apellidos', placeholder: 'Apellidos' },
  { key: 'telefono', label: 'Teléfono', placeholder: '555-000-0000' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: '555-000-0000' },
  { key: 'correo', label: 'Correo', placeholder: 'correo@ejemplo.com' },
  { key: 'direccion', label: 'Dirección', placeholder: 'Calle, colonia, ciudad' },
];

function EstatusBadge({ estatus }) {
  const estilo =
    estatus === 'vetado' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
    : estatus === 'inactivo' ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
    : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400';
  const texto = estatus === 'vetado' ? 'Vetado' : estatus === 'inactivo' ? 'Inactivo' : 'Activo';
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ml-2 ${estilo}`}>{texto}</span>;
}

export default function Tutores() {
  const { search } = useLocation();
  const { tipo, user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  // Puede vetar/dar de baja: Administrador o Veterinario (rol_id 2).
  const puedeGestionar = tipo === 'clinica' || (tipo === 'empleado' && Number(user?.rol_id) === 2);

  const { data: tutores = [], isLoading: loading } = useTutores();
  const crearTutor = useCrearTutor();
  const darDeBajaMut = useDarDeBajaTutor();
  const vetarMut = useVetarTutor();

  const [form, setForm] = useState(EMPTY);
  const [mostrarForm, setMostrarForm] = useState(false);

  // Filtro propio en vez de searchKeys porque debe casar el nombre
  // COMPLETO: "Carlos Mendoza" no está en ninguna columna suelta
  // (nombre y apellidos van separados) y es justo lo que manda el
  // deep-link de la búsqueda global. Además ignora acentos.
  const buscarTutor = useCallback((tutor, q) => {
    const consulta = plegar(q);
    const campos = [
      `${tutor.nombre ?? ''} ${tutor.apellidos ?? ''}`,
      ...CAMPOS_BUSCABLES.map((campo) => tutor[campo]),
    ];
    return campos.some((valor) => plegar(valor).includes(consulta));
  }, []);

  const { query, setQuery, page, setPage, totalPages, filtered, pageItems } = useClientTable(
    tutores,
    { searchFn: buscarTutor, pageSize: PAGE_SIZE }
  );

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('action') === 'new') {
      setMostrarForm(true);
      window.history.replaceState({}, '', '/tutores');
    }
    // La búsqueda global (Ctrl+K) manda aquí con ?q=<nombre>: el tutor
    // no tiene vista propia, así que se abre el listado ya filtrado.
    const q = params.get('q');
    if (q) {
      setQuery(q);
      window.history.replaceState({}, '', '/tutores');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const darDeBaja = async (tutor) => {
    const ok = await confirm({
      title: 'Dar de baja al tutor',
      message: `${tutor.nombre} ${tutor.apellidos} quedará inactivo. ¿Deseas continuar?`,
      confirmText: 'Dar de baja', tone: 'warning',
    });
    if (!ok) return;
    try {
      await darDeBajaMut.mutateAsync(tutor.id);
      toast.success(`${tutor.nombre} fue dado de baja`);
    } catch (e) {
      toast.error(mensajeError(e, 'Error al dar de baja al tutor. Inténtalo de nuevo.'));
    }
  };

  const vetar = async (tutor) => {
    const ok = await confirm({
      title: 'Vetar tutor',
      message: `${tutor.nombre} ${tutor.apellidos} quedará vetado y no podrá recibir servicios. ¿Deseas continuar?`,
      confirmText: 'Vetar', tone: 'danger',
    });
    if (!ok) return;
    try {
      await vetarMut.mutateAsync(tutor.id);
      toast.success(`${tutor.nombre} fue vetado`);
    } catch (e) {
      toast.error(mensajeError(e, 'Error al vetar al tutor. Inténtalo de nuevo.'));
    }
  };

  const guardar = async () => {
    if (!form.nombre.trim()) { toast.warning('El nombre del tutor es obligatorio'); return; }
    try {
      await crearTutor.mutateAsync(form);
      setForm(EMPTY);
      setMostrarForm(false);
      toast.success(`${form.nombre} se registró correctamente`);
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo registrar el tutor'));
    }
  };

  const columns = [
    { header: 'Código', cell: (t) => <span className="badge-blue">{t.codigo || '—'}</span> },
    {
      header: 'Nombre',
      className: 'font-semibold text-slate-800 dark:text-slate-200',
      cell: (t) => <>{t.nombre} {t.apellidos}<EstatusBadge estatus={t.estatus} /></>,
    },
    { header: 'Teléfono', cell: (t) => t.telefono || '—' },
    { header: 'WhatsApp', cell: (t) => t.whatsapp || '—' },
    { header: 'Correo', cell: (t) => t.correo || '—' },
    { header: 'Dirección', cell: (t) => t.direccion || '—', className: 'text-slate-500 dark:text-slate-400' },
    {
      header: 'Acciones',
      stopPropagation: true,
      cell: (t) => (
        <div className="flex items-center gap-1.5">
          {puedeGestionar && (
            <button
              onClick={() => darDeBaja(t)}
              disabled={t.estatus === 'inactivo' || t.estatus === 'vetado'}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-800 hover:bg-amber-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Dar de baja al tutor"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              Dar de Baja
            </button>
          )}
          {puedeGestionar && (
            <button
              onClick={() => vetar(t)}
              disabled={t.estatus === 'vetado'}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800 hover:bg-red-500/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Vetar tutor"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              Vetar
            </button>
          )}
          {!puedeGestionar && <span className="text-xs text-slate-400">—</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tutores"
        subtitle={`${tutores.length} propietario${tutores.length !== 1 ? 's' : ''} registrado${tutores.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={() => { setMostrarForm(!mostrarForm); setForm(EMPTY); }} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo tutor
          </button>
        }
      />

      <FormPanel
        open={mostrarForm}
        onClose={() => setMostrarForm(false)}
        title="Registrar tutor"
        footer={
          <>
            <button onClick={guardar} disabled={crearTutor.isPending || !form.nombre.trim()} className="btn-success disabled:opacity-50">
              {crearTutor.isPending ? 'Guardando...' : 'Guardar tutor'}
            </button>
            <button onClick={() => setMostrarForm(false)} className="btn-secondary">Cancelar</button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CAMPOS.map((c) => (
            <FormField
              key={c.key}
              label={c.label}
              placeholder={c.placeholder}
              value={form[c.key]}
              onChange={(v) => setForm({ ...form, [c.key]: v })}
            />
          ))}
        </div>
      </FormPanel>

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre, teléfono, correo..." className="mb-4" />

      <DataTable
        columns={columns}
        data={pageItems}
        loading={loading}
        empty={{
          title: 'Sin tutores registrados',
          hint: query ? 'Intenta con otra búsqueda' : undefined,
          icon: (
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        }}
      />

      <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} />
    </div>
  );
}
