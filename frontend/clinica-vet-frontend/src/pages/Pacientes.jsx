import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { breedColorMap as razaColors, speciesColorMap as especieColors, stringToColor } from '../SelectedAnimalContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, SearchInput, DataTable, Pagination, Modal, FormPanel, FormField } from '../components/ui';
import { useClientTable } from '../hooks/useClientTable';
import { usePacientes, useCrearPaciente, useReasignarTutor } from '../hooks/usePacientes';
import { useTutores } from '../hooks/useTutores';
import { mensajeError } from '../lib/queryClient';

const especieOptions = [
  { value: '', label: 'Seleccionar especie' },
  { value: 'Perro', label: '🐕 Perro' },
  { value: 'Gato', label: '🐈 Gato' },
  { value: 'Conejo', label: '🐇 Conejo' },
  { value: 'Ave', label: '🦜 Ave' },
  { value: 'Reptil', label: '🦎 Reptil' },
  { value: 'Caballo', label: '🐴 Caballo' },
];

const razaOptions = {
  Perro: ['Labrador', 'Pastor Alemán', 'Golden Retriever', 'Beagle', 'Rottweiler', 'Bulldog Francés', 'Chihuahua', 'Shih Tzu', 'Otro'],
  Gato: ['Siames', 'Persa', 'Maine Coon', 'Sphynx', 'Bengalí', 'Abisinio', 'Ragdoll', 'Otro'],
  Conejo: ['Angora', 'Neozelandés', 'Mini Lop', 'Belier', 'Holandés', 'Otro'],
  Ave: ['Periquito', 'Canario', 'Cacatúa', 'Loro', 'Agapornis', 'Otro'],
  Reptil: ['Iguana', 'Serpiente', 'Tortuga', 'Camaleón', 'Gecko', 'Otro'],
  Caballo: ['Pura Sangre', 'Andaluz', 'Cuarto de Milla', 'Criollo', 'Frisón', 'Otro'],
};

function getPreviewColor(especie, raza) {
  if (!raza) return especieColors[especie?.toLowerCase()] || '#4B5563';
  const n = raza.trim().toLowerCase();
  return razaColors[n] || stringToColor(n);
}

const PAGE_SIZE = 10;

const EMPTY = {
  tutor_id: '', nombre: '', especie: '', raza: '', raza_custom: '',
  sexo: '', fecha_nacimiento: '', funcion_zootecnica: '',
  esquemas_preventivos: '', tatuaje: '', microchip: ''
};

export default function Pacientes() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const toast = useToast();

  // Datos vía TanStack Query: caché compartida + revalidación automática.
  const { data: pacientes = [], isLoading: loading, isError, error, refetch } = usePacientes();
  const { data: tutores = [] } = useTutores();
  const crearPaciente = useCrearPaciente();
  const reasignarTutorMut = useReasignarTutor();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const errorMsg = isError ? mensajeError(error, 'Error al cargar pacientes') : null;

  // Búsqueda + paginación client-side (design system).
  const { query, setQuery, page, setPage, totalPages, filtered, pageItems } = useClientTable(
    pacientes,
    { searchKeys: ['nombre', 'especie', 'raza', 'sexo', 'tutor'], pageSize: PAGE_SIZE }
  );

  // Modal de reasignación
  const [modalReasignar, setModalReasignar] = useState(null); // { id, nombre, tutor }
  const [nuevoTutorId, setNuevoTutorId] = useState('');
  const tutoresActivos = tutores.filter(
    (t) => t.activo !== 0 && t.activo !== false && t.activo !== '0'
  );

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get('action') === 'new') {
      setMostrarForm(true);
      window.history.replaceState({}, '', '/pacientes');
    }
  }, [search]);

  const guardar = async () => {
    const razaFinal = form.raza === 'Otro' ? form.raza_custom.trim() : form.raza;
    if (!form.tutor_id || !form.nombre || !form.especie || !form.sexo || !razaFinal) {
      toast.warning('Completa todos los campos requeridos (*)');
      return;
    }
    try {
      await crearPaciente.mutateAsync({
        tutor_id: parseInt(form.tutor_id),
        nombre: form.nombre,
        especie: form.especie,
        raza: razaFinal || null,
        sexo: form.sexo,
        fecha_nacimiento: form.fecha_nacimiento || null,
        funcion_zootecnica: form.funcion_zootecnica || null,
        esquemas_preventivos: form.esquemas_preventivos || null,
        tatuaje: form.tatuaje || null,
        microchip: form.microchip || null
      });
      setForm(EMPTY);
      setMostrarForm(false);
      toast.success(`${form.nombre} se registró correctamente`);
    } catch (err) {
      toast.error('Error al guardar: ' + mensajeError(err));
    }
  };
  const guardando = crearPaciente.isPending;

  const abrirModalReasignar = (paciente) => {
    // La lista de tutores ya está en caché (useTutores); no hace falta pedirla otra vez.
    setNuevoTutorId('');
    setModalReasignar({ id: paciente.id, nombre: paciente.nombre, tutor: paciente.tutor });
  };
  const cerrarModalReasignar = () => { setModalReasignar(null); setNuevoTutorId(''); };

  const guardarReasignacion = async () => {
    if (!nuevoTutorId) { toast.warning('Selecciona un tutor'); return; }
    try {
      await reasignarTutorMut.mutateAsync({ id: modalReasignar.id, nuevoTutorId: parseInt(nuevoTutorId) });
      toast.success(`${modalReasignar.nombre} fue reasignado correctamente`);
      cerrarModalReasignar();
    } catch (err) {
      toast.error('Error al reasignar: ' + mensajeError(err));
    }
  };
  const reasignando = reasignarTutorMut.isPending;

  const razaFinalPreview = form.raza === 'Otro' ? form.raza_custom : form.raza;
  const previewColor = form.especie ? getPreviewColor(form.especie, razaFinalPreview) : null;

  // ── Columnas de la tabla ────────────────────────────────────
  const columns = [
    { header: 'Paciente', cell: (p) => p.nombre, className: 'font-semibold text-slate-800 dark:text-slate-200' },
    { header: 'Especie', cell: (p) => p.especie },
    { header: 'Raza', cell: (p) => p.raza || '—', className: 'text-slate-500 dark:text-slate-400' },
    {
      header: 'Sexo',
      cell: (p) => (
        <span className={p.sexo === 'Macho' ? 'badge-blue' : 'badge-purple'}>
          {p.sexo === 'Macho' ? '♂' : '♀'} {p.sexo}
        </span>
      ),
    },
    { header: 'Esquemas', cell: (p) => p.esquemas_preventivos || '—' },
    { header: 'Tutor', cell: (p) => p.tutor },
    {
      header: '',
      stopPropagation: true,
      cell: (p) => (
        <div className="flex items-center gap-2">
          <span onClick={() => navigate(`/expediente/${p.id}`)} className="text-violet-600 dark:text-violet-400 font-medium text-xs cursor-pointer">Ver →</span>
          <button
            onClick={() => abrirModalReasignar(p)}
            title="Reasignar tutor"
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Reasignar Tutor
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Error banner */}
      {errorMsg && (
        <div className="mb-4 flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3">
          <svg className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">Ocurrió un error</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{errorMsg}</p>
          </div>
          <button onClick={() => refetch()} title="Reintentar" className="text-red-400 hover:text-red-600 dark:hover:text-red-300 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      )}

      <PageHeader
        title="Pacientes"
        subtitle={`${pacientes.length} animal${pacientes.length !== 1 ? 'es' : ''} registrado${pacientes.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={() => { setMostrarForm(!mostrarForm); setForm(EMPTY); }} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo paciente
          </button>
        }
      />

      <FormPanel
        open={mostrarForm}
        onClose={() => setMostrarForm(false)}
        title="Registrar paciente"
        footer={
          <>
            <button onClick={guardar} disabled={guardando} className="btn-success disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar paciente'}
            </button>
            <button onClick={() => setMostrarForm(false)} className="btn-secondary">Cancelar</button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Tutor *" className="sm:col-span-2">
            <select value={form.tutor_id} onChange={e => setForm({ ...form, tutor_id: e.target.value })} className="input">
              <option value="">Seleccionar tutor</option>
              {tutores.map(t => <option key={t.id} value={t.id}>{t.nombre} {t.apellidos}</option>)}
            </select>
          </FormField>

          <FormField label="Nombre *" value={form.nombre} onChange={(v) => setForm({ ...form, nombre: v })} placeholder="Nombre del paciente" />

          <FormField label="Especie *">
            <select value={form.especie} onChange={e => setForm({ ...form, especie: e.target.value, raza: '', raza_custom: '' })} className="input">
              {especieOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </FormField>

          <FormField label="Raza *">
            <select value={form.raza} onChange={e => setForm({ ...form, raza: e.target.value, raza_custom: '' })} disabled={!form.especie} className="input disabled:opacity-50 disabled:cursor-not-allowed">
              <option value="">Seleccionar raza</option>
              {(razaOptions[form.especie] || ['Otro']).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </FormField>

          {form.raza === 'Otro' && (
            <FormField label="Especificar raza" value={form.raza_custom} onChange={(v) => setForm({ ...form, raza_custom: v })} placeholder="Escribe la raza" />
          )}

          {previewColor && (
            <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
              <div className="w-8 h-8 rounded-lg border-2 border-white dark:border-slate-700 shadow-sm flex-shrink-0" style={{ backgroundColor: previewColor }} />
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Color del sidebar para <strong>{razaFinalPreview || form.especie}</strong>
              </p>
            </div>
          )}

          <FormField label="Sexo *">
            <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })} className="input">
              <option value="">Seleccionar</option>
              <option value="Macho">♂ Macho</option>
              <option value="Hembra">♀ Hembra</option>
            </select>
          </FormField>

          <FormField label="Fecha de nacimiento" type="date" value={form.fecha_nacimiento} onChange={(v) => setForm({ ...form, fecha_nacimiento: v })} />
          <FormField label="Función zootécnica" value={form.funcion_zootecnica} onChange={(v) => setForm({ ...form, funcion_zootecnica: v })} placeholder="Ej: Mascota, Trabajo, Reproducción" />
          <FormField label="Esquemas preventivos" value={form.esquemas_preventivos} onChange={(v) => setForm({ ...form, esquemas_preventivos: v })} placeholder="Ej: Completo, Incompleto" />
          <FormField label="Tatuaje" value={form.tatuaje} onChange={(v) => setForm({ ...form, tatuaje: v })} placeholder="Número de tatuaje" />
          <FormField label="Microchip" value={form.microchip} onChange={(v) => setForm({ ...form, microchip: v })} placeholder="Número de microchip" />
        </div>
      </FormPanel>

      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar por nombre, especie, raza, tutor..."
        className="mb-4"
      />

      <DataTable
        columns={columns}
        data={pageItems}
        loading={loading}
        onRowClick={(p) => navigate(`/expediente/${p.id}`)}
        empty={{
          title: 'Sin pacientes registrados',
          hint: query ? 'Intenta con otra búsqueda' : undefined,
          icon: (
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          ),
        }}
      />

      <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} />

      {/* Modal Reasignar Tutor */}
      <Modal
        open={!!modalReasignar}
        onClose={cerrarModalReasignar}
        title="Reasignar Tutor"
        icon={
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </div>
        }
        footer={
          <>
            <button onClick={guardarReasignacion} disabled={reasignando || !nuevoTutorId} className="btn-success disabled:opacity-50 flex-1">
              {reasignando ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={cerrarModalReasignar} className="btn-secondary flex-1">Cancelar</button>
          </>
        }
      >
        {modalReasignar && (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              Paciente: <span className="font-semibold text-slate-700 dark:text-slate-300">{modalReasignar.nombre}</span>
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Tutor actual: <span className="font-medium text-slate-600 dark:text-slate-400">{modalReasignar.tutor || '—'}</span>
            </p>
            <FormField label="Nuevo tutor *">
              <select value={nuevoTutorId} onChange={e => setNuevoTutorId(e.target.value)} className="input">
                <option value="">Seleccionar tutor activo</option>
                {tutoresActivos.map(t => <option key={t.id} value={t.id}>{t.nombre} {t.apellidos}</option>)}
              </select>
            </FormField>
            {tutoresActivos.length === 0 && (
              <p className="text-xs text-slate-400 mt-1">No hay tutores activos disponibles.</p>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
