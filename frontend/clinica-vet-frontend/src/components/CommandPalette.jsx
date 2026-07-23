import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBusqueda, LONGITUD_MINIMA } from '../hooks/useBusqueda';
import { useDebounce } from '../hooks/useDebounce';
import { plegar, encontrarCoincidencia } from '../lib/texto';
import { mensajeError } from '../lib/queryClient';

/**
 * Command palette global (Ctrl/Cmd+K) — Fase 4.1.
 *
 * Une dos fuentes en una sola lista navegable con el teclado:
 *   - Acciones: catálogo local (navegar, dar de alta). Filtrado en el
 *     cliente, sin red: responde en el mismo frame que la tecla.
 *   - Pacientes y tutores: vienen de GET /api/buscar, con el término
 *     diferido para no lanzar una petición por pulsación.
 *
 * El backend devuelve resultados semánticos (tipo + id); traducirlos a
 * rutas es responsabilidad de este componente, que es quien conoce el
 * router de la SPA.
 */

const ACCIONES = [
  { id: 'nuevo-paciente', label: 'Nuevo paciente', hint: 'Dar de alta un animal', icono: '🐾', ruta: '/pacientes?action=new', claves: 'alta crear registrar mascota animal' },
  { id: 'nuevo-tutor', label: 'Nuevo tutor', hint: 'Dar de alta un propietario', icono: '👤', ruta: '/tutores?action=new', claves: 'alta crear registrar propietario dueño cliente' },
  { id: 'agenda', label: 'Agenda', hint: 'Citas del día y de la semana', icono: '📅', ruta: '/agenda', claves: 'citas calendario horario' },
  { id: 'flujo', label: 'Flujo del día', hint: 'Sala de espera y atención', icono: '🚦', ruta: '/flujo', claves: 'sala espera tablero kanban hoy' },
  { id: 'pacientes', label: 'Pacientes', hint: 'Listado de animales', icono: '🐕', ruta: '/pacientes', claves: 'animales mascotas listado' },
  { id: 'tutores', label: 'Tutores', hint: 'Listado de propietarios', icono: '🧑', ruta: '/tutores', claves: 'propietarios dueños clientes listado' },
  { id: 'consultas', label: 'Consultas', hint: 'Registro de consultas', icono: '📋', ruta: '/consultas', claves: 'clinica revision' },
  { id: 'hospitalizaciones', label: 'Hospitalizaciones', hint: 'Animales internados', icono: '🏥', ruta: '/hospitalizaciones', claves: 'internamiento internados' },
  { id: 'cirugias', label: 'Cirugías', hint: 'Registro de cirugías', icono: '🔪', ruta: '/cirugias', claves: 'quirofano operacion anestesia' },
  { id: 'vacunas', label: 'Vacunas', hint: 'Registro de vacunación', icono: '💉', ruta: '/vacunas', claves: 'vacunacion carnet inmunizacion' },
  { id: 'recordatorios', label: 'Recordatorios', hint: 'Avisos por WhatsApp', icono: '💬', ruta: '/recordatorios', claves: 'whatsapp avisos seguimiento' },
  { id: 'inventario', label: 'Inventario', hint: 'Productos y stock', icono: '📦', ruta: '/inventario', claves: 'stock productos almacen farmacia' },
  { id: 'calculadora', label: 'Calculadoras', hint: 'Dosis, fluidos, anestesia…', icono: '🧮', ruta: '/calculadora', claves: 'dosis fluidos toxicologia farmacia' },
  { id: 'reportes', label: 'Reportes', hint: 'Informes en PDF', icono: '📊', ruta: '/reportes', claves: 'pdf informes estadisticas' },
  { id: 'empleados', label: 'Empleados', hint: 'Equipo de la clínica', icono: '🧑‍⚕️', ruta: '/empleados', claves: 'personal usuarios roles staff', soloAdmin: true },
];

/** Cuántas acciones se sugieren cuando el palette se abre en blanco. */
const SUGERENCIAS = 5;

const ICONO_TIPO = { paciente: '🐾', tutor: '🧑' };
const GRUPO_TIPO = { paciente: 'Pacientes', tutor: 'Tutores' };

/**
 * Agrupa los resultados del servidor por tipo, manteniendo cada sección
 * contigua y ordenando las secciones por su MEJOR coincidencia.
 *
 * El backend devuelve una lista plana ordenada por relevancia global.
 * Pintarla tal cual repetiría el encabezado cuando los tipos se
 * intercalan (paciente 75, tutor 75, paciente 50 → "Pacientes",
 * "Tutores", "Pacientes"); pero un orden de secciones FIJO enterraría
 * al mejor resultado (buscar "mendoza" pone al tutor en 50 y a sus
 * pacientes en 25, y Enter debe llevar al tutor). Ordenar las secciones
 * por su máximo cumple las dos cosas: un encabezado por sección y el
 * mejor resultado siempre en la primera fila.
 */
function agruparPorTipo(resultados) {
  const porTipo = new Map();
  for (const r of resultados) {
    // filter/push conservan el orden por relevancia que ya trae la lista
    if (!porTipo.has(r.tipo)) porTipo.set(r.tipo, []);
    porTipo.get(r.tipo).push(r);
  }
  return [...porTipo.values()].sort((a, b) => b[0].relevancia - a[0].relevancia);
}

/** Traduce un resultado del backend a una ruta de la SPA. */
function rutaDeResultado(resultado) {
  if (resultado.tipo === 'paciente') return `/expediente/${resultado.id}`;
  // Los tutores no tienen vista propia: se abre el listado prefiltrado.
  return `/tutores?q=${encodeURIComponent(resultado.titulo)}`;
}

/** Resalta el tramo del texto que casa con la consulta (sin importar acentos). */
function Resaltado({ texto, consulta }) {
  const rango = consulta ? encontrarCoincidencia(texto, consulta) : null;
  if (!rango) return <>{texto}</>;
  return (
    <>
      {texto.slice(0, rango.inicio)}
      <mark className="bg-violet-200 dark:bg-violet-500/40 text-inherit rounded px-0.5">
        {texto.slice(rango.inicio, rango.fin)}
      </mark>
      {texto.slice(rango.fin)}
    </>
  );
}

function Tecla({ children }) {
  return (
    <kbd className="inline-flex items-center rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-slate-500 dark:text-slate-400">
      {children}
    </kbd>
  );
}

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { tipo } = useAuth();
  const [consulta, setConsulta] = useState('');
  const [indice, setIndice] = useState(0);
  const inputRef = useRef(null);
  const listaRef = useRef(null);

  const termino = useDebounce(consulta.trim(), 250);
  const consultaPlegada = plegar(consulta);
  const buscando = termino.length >= LONGITUD_MINIMA;

  const { data, isFetching, isError, error } = useBusqueda(termino, { enabled: open });

  // Al abrir, empezar siempre en blanco y con el foco en el input.
  useEffect(() => {
    if (!open) return;
    setConsulta('');
    setIndice(0);
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const acciones = useMemo(
    () => ACCIONES.filter((a) => !a.soloAdmin || tipo === 'clinica'),
    [tipo]
  );

  // Lista plana: es lo que recorren las flechas. El render la agrupa
  // después por `grupo`, así los índices del teclado nunca se desalinean.
  const items = useMemo(() => {
    const q = plegar(consulta);
    const accionesVisibles = q
      ? acciones.filter((a) => plegar(`${a.label} ${a.hint} ${a.claves}`).includes(q))
      : acciones.slice(0, SUGERENCIAS);

    const deAcciones = accionesVisibles.map((a) => ({
      clave: `accion-${a.id}`,
      grupo: 'Acciones',
      icono: a.icono,
      titulo: a.label,
      subtitulo: a.hint,
      detalle: null,
      ruta: a.ruta,
    }));

    const deServidor = agruparPorTipo(data?.resultados ?? []).flatMap((seccion) =>
      seccion.map((r) => ({
        clave: `${r.tipo}-${r.id}`,
        grupo: GRUPO_TIPO[r.tipo] ?? 'Resultados',
        icono: ICONO_TIPO[r.tipo] ?? '🔎',
        titulo: r.titulo,
        subtitulo: r.subtitulo,
        detalle: r.detalle,
        ruta: rutaDeResultado(r),
      }))
    );

    return [...deAcciones, ...deServidor];
  }, [consulta, acciones, data]);

  // Cualquier cambio en la lista vuelve la selección al primer elemento.
  useEffect(() => { setIndice(0); }, [items.length, termino]);

  // Mantiene visible la fila seleccionada al navegar con el teclado.
  useEffect(() => {
    listaRef.current
      ?.querySelector('[data-seleccionado="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [indice, items]);

  const elegir = useCallback((item) => {
    if (!item) return;
    onClose();
    navigate(item.ruta);
  }, [navigate, onClose]);

  // El teclado se escucha en `window`, no en el input: si el foco se
  // pierde (un clic en el panel, en el botón de cerrar…) Escape y las
  // flechas deben seguir funcionando. Mismo criterio que ui/Modal.
  // `indice` va en las dependencias para que el listener siempre vea la
  // fila seleccionada actual (re-suscribirse es más barato que un ref).
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key === 'Enter') { e.preventDefault(); elegir(items[indice]); return; }
      if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
        e.preventDefault();
        setIndice((i) => (items.length ? (i + 1) % items.length : 0));
        return;
      }
      if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
        e.preventDefault();
        setIndice((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, items, indice, elegir, onClose]);

  if (!open) return null;

  const sinResultados = items.length === 0;
  let grupoAnterior = null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[10vh] bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda global"
      >
        {/* Campo de búsqueda */}
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 px-4">
          <svg className="h-5 w-5 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            maxLength={100}
            placeholder="Buscar pacientes, tutores o acciones…"
            aria-label="Buscar"
            aria-autocomplete="list"
            className="flex-1 bg-transparent py-4 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
          />
          {isFetching && (
            <span className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-slate-200 border-t-violet-500 dark:border-slate-700 dark:border-t-violet-400" />
          )}
          <button
            onClick={onClose}
            aria-label="Cerrar búsqueda"
            className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <Tecla>Esc</Tecla>
          </button>
        </div>

        {/* Resultados */}
        <div ref={listaRef} className="max-h-[55vh] overflow-y-auto py-2">
          {isError && (
            <p className="px-4 py-6 text-center text-sm text-red-500 dark:text-red-400">
              {mensajeError(error, 'No se pudo completar la búsqueda')}
            </p>
          )}

          {!isError && sinResultados && (
            <p className="px-4 py-8 text-center text-sm text-slate-400">
              {buscando
                ? <>Sin resultados para <span className="font-semibold text-slate-500 dark:text-slate-300">“{consulta.trim()}”</span></>
                : 'Escribe para buscar…'}
            </p>
          )}

          {!isError && items.map((item, i) => {
            const nuevoGrupo = item.grupo !== grupoAnterior;
            grupoAnterior = item.grupo;
            const seleccionado = i === indice;

            return (
              <div key={item.clave}>
                {nuevoGrupo && (
                  <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600">
                    {item.grupo}
                  </p>
                )}
                <button
                  type="button"
                  data-seleccionado={seleccionado}
                  onMouseMove={() => setIndice(i)}
                  onClick={() => elegir(item)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    seleccionado ? 'bg-violet-50 dark:bg-violet-900/30' : ''
                  }`}
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base dark:bg-slate-800">
                    {item.icono}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm font-medium ${
                      seleccionado
                        ? 'text-violet-700 dark:text-violet-300'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      <Resaltado texto={item.titulo} consulta={consultaPlegada} />
                    </span>
                    {item.subtitulo && (
                      <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                        {item.subtitulo}
                      </span>
                    )}
                  </span>
                  {item.detalle && (
                    <span className="flex-shrink-0 text-xs text-slate-400 dark:text-slate-500">
                      {item.detalle}
                    </span>
                  )}
                  {seleccionado && (
                    <span className="flex-shrink-0 text-violet-500 dark:text-violet-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Pie con la ayuda de teclado */}
        <div className="flex items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 px-4 py-2.5 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1"><Tecla>↑</Tecla><Tecla>↓</Tecla> navegar</span>
            <span className="flex items-center gap-1"><Tecla>↵</Tecla> abrir</span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {buscando ? `${items.length} resultado${items.length === 1 ? '' : 's'}` : 'Ctrl K'}
          </span>
        </div>
      </div>
    </div>
  );
}
