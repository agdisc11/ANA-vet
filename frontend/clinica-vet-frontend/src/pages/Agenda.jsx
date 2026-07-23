import { useCallback, useEffect, useMemo, useState } from 'react';
import { citasService } from '../services/citasService';
import { pacientesService } from '../services/pacientesService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import CitaFormModal from '../components/agenda/CitaFormModal';
import CitaDetallePanel from '../components/agenda/CitaDetallePanel';
import {
  ESTADO_CONFIG, aISO, sumarDias, lunesDe, aMinutos, aHHMM,
} from '../components/agenda/constantes';

// ─────────────────────────────────────────────────────────────
// Agenda — Calendario de citas (vista semana / día).
//   · Clic en un horario vacío → nueva cita con fecha/hora precargadas
//   · Clic en una cita → detalle con acciones de estado y WhatsApp
//   · Filtros por veterinario y por estado
// ─────────────────────────────────────────────────────────────

const PX_POR_MIN = 1.6; // 30 min = 48px de alto
const DIAS_CORTOS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

/** Distribuye las citas de un día en "carriles" para que los traslapes se vean lado a lado. */
function distribuirEnCarriles(citasDia) {
  const eventos = citasDia
    .map((cita) => {
      const ini = aMinutos(cita.hora_inicio);
      return { cita, ini, fin: ini + Number(cita.duracion_min || 30) };
    })
    .sort((a, b) => a.ini - b.ini || a.fin - b.fin);

  const posicionados = [];
  let cluster = [];
  let finCluster = -1;

  const cerrarCluster = () => {
    if (!cluster.length) return;
    const finesPorCarril = [];
    for (const ev of cluster) {
      let carril = finesPorCarril.findIndex((fin) => fin <= ev.ini);
      if (carril === -1) {
        carril = finesPorCarril.length;
        finesPorCarril.push(ev.fin);
      } else {
        finesPorCarril[carril] = ev.fin;
      }
      ev.carril = carril;
    }
    for (const ev of cluster) {
      ev.carriles = finesPorCarril.length;
      posicionados.push(ev);
    }
    cluster = [];
  };

  for (const ev of eventos) {
    if (cluster.length && ev.ini >= finCluster) cerrarCluster();
    cluster.push(ev);
    finCluster = Math.max(finCluster, ev.fin);
  }
  cerrarCluster();
  return posicionados;
}

export default function Agenda() {
  const toast = useToast();
  const confirm = useConfirm();
  const { user, tipo } = useAuth();
  const nombreClinica = tipo === 'clinica' ? user?.nombre : user?.clinica_nombre;

  const [vista, setVista] = useState(() => (window.innerWidth < 1024 ? 'dia' : 'semana'));
  const [fechaBase, setFechaBase] = useState(() => new Date());
  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [filtroVet, setFiltroVet] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState({ abierta: false, inicial: null });
  const [detalle, setDetalle] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  // ── Días visibles y rango consultado ─────────────────────────
  const dias = useMemo(() => {
    if (vista === 'dia') return [new Date(fechaBase)];
    const lunes = lunesDe(fechaBase);
    return Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));
  }, [vista, fechaBase]);

  const desde = aISO(dias[0]);
  const hasta = aISO(dias[dias.length - 1]);

  // ── Carga de datos ───────────────────────────────────────────
  const cargarCitas = useCallback(async () => {
    setCargando(true);
    try {
      const data = await citasService.listar({ desde, hasta, ...(filtroVet ? { empleado_id: filtroVet } : {}) });
      setCitas(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cargar la agenda');
    } finally {
      setCargando(false);
    }
  }, [desde, hasta, filtroVet, toast]);

  useEffect(() => { cargarCitas(); }, [cargarCitas]);

  useEffect(() => {
    pacientesService.listar().then((data) => setPacientes(Array.isArray(data) ? data : []))
      .catch(() => setPacientes([]));
    citasService.veterinarios().then((data) => setVeterinarios(Array.isArray(data) ? data : []))
      .catch(() => setVeterinarios([]));
  }, []);

  // ── Derivados ────────────────────────────────────────────────
  const citasVisibles = useMemo(
    () => (filtroEstado ? citas.filter((c) => c.estado === filtroEstado) : citas),
    [citas, filtroEstado]
  );

  const citasPorDia = useMemo(() => {
    const mapa = new Map();
    for (const c of citasVisibles) {
      const clave = String(c.fecha).slice(0, 10);
      if (!mapa.has(clave)) mapa.set(clave, []);
      mapa.get(clave).push(c);
    }
    return mapa;
  }, [citasVisibles]);

  const conteoPorEstado = useMemo(() => {
    const conteo = {};
    for (const c of citas) conteo[c.estado] = (conteo[c.estado] || 0) + 1;
    return conteo;
  }, [citas]);

  // Rango horario visible: 08–20 h, ampliado si hay citas fuera de él
  const [horaMin, horaMax] = useMemo(() => {
    let min = 8, max = 20;
    for (const c of citasVisibles) {
      const ini = aMinutos(c.hora_inicio);
      const fin = ini + Number(c.duracion_min || 30);
      min = Math.min(min, Math.floor(ini / 60));
      max = Math.max(max, Math.ceil(fin / 60));
    }
    return [min, max];
  }, [citasVisibles]);

  const altoTotal = (horaMax - horaMin) * 60 * PX_POR_MIN;
  const hoyISO = aISO(new Date());

  const citasHoy = useMemo(() => {
    const deHoy = (citasPorDia.get(hoyISO) || [])
      .filter((c) => ['programada', 'confirmada', 'en_sala'].includes(c.estado))
      .sort((a, b) => aMinutos(a.hora_inicio) - aMinutos(b.hora_inicio));
    return deHoy;
  }, [citasPorDia, hoyISO]);

  // ── Navegación ───────────────────────────────────────────────
  const navegar = (direccion) =>
    setFechaBase((f) => sumarDias(f, direccion * (vista === 'semana' ? 7 : 1)));

  const etiquetaRango = vista === 'semana'
    ? `${dias[0].toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })} – ${dias[6].toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}`
    : fechaBase.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // ── Mutaciones ───────────────────────────────────────────────
  const guardarCita = async (datos) => {
    setGuardando(true);
    try {
      if (modal.inicial?.id) {
        await citasService.actualizar(modal.inicial.id, datos);
        toast.success('Cita actualizada');
      } else {
        await citasService.crear(datos);
        toast.success('Cita agendada 🎉');
      }
      setModal({ abierta: false, inicial: null });
      cargarCitas();
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo guardar la cita');
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (destino) => {
    if (!detalle) return;
    setCambiandoEstado(true);
    try {
      await citasService.cambiarEstado(detalle.id, destino);
      toast.success(`Cita → ${ESTADO_CONFIG[destino].label}`);
      setDetalle({ ...detalle, estado: destino });
      cargarCitas();
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo cambiar el estado');
    } finally {
      setCambiandoEstado(false);
    }
  };

  const eliminarCita = async () => {
    if (!detalle) return;
    const ok = await confirm({
      title: 'Eliminar cita',
      message: `¿Eliminar la cita de ${detalle.paciente_nombre}? Si solo no se realizará, es mejor cancelarla.`,
      confirmText: 'Eliminar',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await citasService.eliminar(detalle.id);
      toast.success('Cita eliminada');
      setDetalle(null);
      cargarCitas();
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo eliminar la cita');
    }
  };

  const abrirNueva = (dia, minutos) =>
    setModal({
      abierta: true,
      inicial: { fecha: aISO(dia), hora_inicio: aHHMM(minutos), duracion_min: 30 },
    });

  const abrirEdicion = () => {
    setModal({ abierta: true, inicial: detalle });
    setDetalle(null);
  };

  // ── Render ───────────────────────────────────────────────────
  const horas = Array.from({ length: horaMax - horaMin }, (_, i) => horaMin + i);
  const ahoraMin = new Date().getHours() * 60 + new Date().getMinutes();

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Agenda</h1>
          <p className="text-sm text-slate-400 capitalize">{etiquetaRango}</p>
        </div>
        <button
          onClick={() => abrirNueva(fechaBase, 10 * 60)}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva cita
        </button>
      </div>

      {/* Barra de herramientas */}
      <div className="card px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <button onClick={() => navegar(-1)} aria-label="Anterior" className="btn-secondary !px-2.5">←</button>
          <button onClick={() => setFechaBase(new Date())} className="btn-secondary">Hoy</button>
          <button onClick={() => navegar(1)} aria-label="Siguiente" className="btn-secondary !px-2.5">→</button>
        </div>

        <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-sm font-medium">
          {[['dia', 'Día'], ['semana', 'Semana']].map(([valor, etiqueta]) => (
            <button
              key={valor}
              onClick={() => setVista(valor)}
              className={`px-4 py-2 transition-colors ${
                vista === valor
                  ? 'bg-violet-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        <select
          className="input !w-auto"
          value={filtroVet}
          onChange={(e) => setFiltroVet(e.target.value)}
        >
          <option value="">Todos los veterinarios</option>
          {veterinarios.map((v) => (
            <option key={v.id} value={v.id}>{v.nombre} {v.apellidos}</option>
          ))}
        </select>

        {cargando && <span className="text-xs text-slate-400 animate-pulse">Cargando…</span>}
      </div>

      {/* Chips de estado */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        <button
          onClick={() => setFiltroEstado('')}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            filtroEstado === ''
              ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900'
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          Todas ({citas.length})
        </button>
        {Object.entries(ESTADO_CONFIG).map(([estado, cfg]) => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(filtroEstado === estado ? '' : estado)}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${cfg.chip} ${
              filtroEstado === estado ? 'ring-2 ring-offset-1 ring-slate-400 dark:ring-offset-slate-950' : 'opacity-80 hover:opacity-100'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.punto}`} />
            {cfg.label} ({conteoPorEstado[estado] || 0})
          </button>
        ))}
      </div>

      {/* Resumen de hoy */}
      {citasHoy.length > 0 && (
        <div className="card px-4 py-3 mb-4 flex flex-wrap items-center gap-2 border-l-4 !border-l-violet-500">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Hoy: {citasHoy.length} {citasHoy.length === 1 ? 'cita pendiente' : 'citas pendientes'}
          </span>
          {citasHoy.slice(0, 3).map((c) => (
            <button
              key={c.id}
              onClick={() => setDetalle(c)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_CONFIG[c.estado].chip} hover:opacity-80`}
            >
              {String(c.hora_inicio).slice(0, 5)} · {c.paciente_nombre}
            </button>
          ))}
          {citasHoy.length > 3 && (
            <span className="text-xs text-slate-400">y {citasHoy.length - 3} más…</span>
          )}
        </div>
      )}

      {citas.length === 0 && !cargando && (
        <p className="text-sm text-slate-400 mb-3">
          Sin citas en este rango. Haz clic en cualquier horario del calendario para agendar la primera ✨
        </p>
      )}

      {/* ── Calendario ── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: vista === 'semana' ? 860 : 340 }}>
            {/* Encabezado de días */}
            <div
              className="grid border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10"
              style={{ gridTemplateColumns: `56px repeat(${dias.length}, minmax(0, 1fr))` }}
            >
              <div />
              {dias.map((dia) => {
                const esHoy = aISO(dia) === hoyISO;
                return (
                  <div key={aISO(dia)} className="px-2 py-3 text-center border-l border-slate-100 dark:border-slate-800">
                    <p className={`text-xs uppercase tracking-wide ${esHoy ? 'text-violet-500 font-bold' : 'text-slate-400'}`}>
                      {DIAS_CORTOS[(dia.getDay() + 6) % 7]}
                    </p>
                    <p className={`mt-0.5 text-lg font-bold leading-none ${
                      esHoy
                        ? 'inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}>
                      {dia.getDate()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Cuerpo de la grilla */}
            <div
              className="grid"
              style={{ gridTemplateColumns: `56px repeat(${dias.length}, minmax(0, 1fr))` }}
            >
              {/* Columna de horas */}
              <div className="relative" style={{ height: altoTotal }}>
                {horas.map((h) => (
                  <span
                    key={h}
                    className="absolute right-2 -translate-y-1/2 text-[11px] text-slate-400"
                    style={{ top: (h - horaMin) * 60 * PX_POR_MIN }}
                  >
                    {h > 0 ? `${String(h).padStart(2, '0')}:00` : ''}
                  </span>
                ))}
              </div>

              {/* Columnas de días */}
              {dias.map((dia) => {
                const iso = aISO(dia);
                const eventos = distribuirEnCarriles(citasPorDia.get(iso) || []);
                const esHoy = iso === hoyISO;

                return (
                  <div
                    key={iso}
                    className={`relative border-l border-slate-100 dark:border-slate-800 ${esHoy ? 'bg-violet-50/40 dark:bg-violet-900/5' : ''}`}
                    style={{ height: altoTotal }}
                  >
                    {/* Líneas de hora y slots clicables de 30 min */}
                    {horas.map((h) => (
                      <div key={h}>
                        <div
                          className="absolute w-full border-t border-slate-100 dark:border-slate-800/70"
                          style={{ top: (h - horaMin) * 60 * PX_POR_MIN }}
                        />
                        {[0, 30].map((m) => (
                          <div
                            key={m}
                            onClick={() => abrirNueva(dia, h * 60 + m)}
                            title={`Agendar ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`}
                            className="absolute w-full cursor-pointer hover:bg-violet-100/60 dark:hover:bg-violet-900/20 transition-colors"
                            style={{ top: ((h - horaMin) * 60 + m) * PX_POR_MIN, height: 30 * PX_POR_MIN }}
                          />
                        ))}
                      </div>
                    ))}

                    {/* Línea de hora actual */}
                    {esHoy && ahoraMin >= horaMin * 60 && ahoraMin <= horaMax * 60 && (
                      <div
                        className="absolute w-full z-20 pointer-events-none"
                        style={{ top: (ahoraMin - horaMin * 60) * PX_POR_MIN }}
                      >
                        <div className="border-t-2 border-red-500" />
                        <span className="absolute -left-0.5 -top-1 h-2 w-2 rounded-full bg-red-500" />
                      </div>
                    )}

                    {/* Bloques de cita */}
                    {eventos.map(({ cita, ini, fin, carril, carriles }) => {
                      const cfg = ESTADO_CONFIG[cita.estado] || ESTADO_CONFIG.programada;
                      const alto = Math.max((fin - ini) * PX_POR_MIN, 26);
                      return (
                        <button
                          key={cita.id}
                          onClick={() => setDetalle(cita)}
                          className={`absolute z-10 rounded-lg border px-1.5 py-0.5 text-left shadow-sm overflow-hidden transition-transform hover:scale-[1.02] hover:z-20 ${cfg.bloque}`}
                          style={{
                            top: (ini - horaMin * 60) * PX_POR_MIN + 1,
                            height: alto - 2,
                            left: `calc(${(carril * 100) / carriles}% + 2px)`,
                            width: `calc(${100 / carriles}% - 4px)`,
                          }}
                          title={`${String(cita.hora_inicio).slice(0, 5)} · ${cita.paciente_nombre}${cita.motivo ? ` — ${cita.motivo}` : ''}`}
                        >
                          <p className="text-[11px] font-bold leading-tight truncate">
                            {String(cita.hora_inicio).slice(0, 5)} {cita.paciente_nombre}
                          </p>
                          {alto > 40 && (
                            <p className="text-[10px] opacity-85 leading-tight truncate">
                              {cita.motivo || cita.paciente_especie}
                            </p>
                          )}
                          {alto > 58 && cita.empleado_nombre && (
                            <p className="text-[10px] opacity-70 leading-tight truncate">🩺 {cita.empleado_nombre}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <CitaFormModal
        abierta={modal.abierta}
        inicial={modal.inicial}
        pacientes={pacientes}
        veterinarios={veterinarios}
        guardando={guardando}
        onGuardar={guardarCita}
        onCerrar={() => setModal({ abierta: false, inicial: null })}
      />
      <CitaDetallePanel
        cita={detalle}
        nombreClinica={nombreClinica}
        cambiandoEstado={cambiandoEstado}
        onCambiarEstado={cambiarEstado}
        onEditar={abrirEdicion}
        onEliminar={eliminarCita}
        onCerrar={() => setDetalle(null)}
      />
    </div>
  );
}
