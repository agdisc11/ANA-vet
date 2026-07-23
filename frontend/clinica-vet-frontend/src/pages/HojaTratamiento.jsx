import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { Modal, FormField } from '../components/ui';
import {
  useHojaTratamiento, useCompletarTarea, useCrearTarea, useCrearPauta, useEliminarTarea,
} from '../hooks/useTratamiento';
import { mensajeError } from '../lib/queryClient';

// ─────────────────────────────────────────────────────────────
// Hoja de tratamiento hospitalario (Fase 3.6)
// Diseñada para tablet: checkboxes grandes, texto legible a un brazo
// de distancia y firma automática de quién aplicó cada tarea.
// ─────────────────────────────────────────────────────────────

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const CATEGORIAS = [
  { valor: 'medicacion', etiqueta: '💊 Medicación' },
  { valor: 'fluidos', etiqueta: '💧 Fluidos' },
  { valor: 'constantes', etiqueta: '🌡️ Constantes' },
  { valor: 'alimentacion', etiqueta: '🍽️ Alimentación' },
  { valor: 'otro', etiqueta: '📋 Otro' },
];

const ESTILO_ESTADO = {
  completada: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-900/20',
  atrasada: 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20',
  ahora: 'border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 ring-2 ring-amber-200 dark:ring-amber-800',
  pendiente: 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900',
};

const ETIQUETA_ESTADO = {
  atrasada: { texto: 'Atrasada', clase: 'badge-red' },
  ahora: { texto: 'Ahora', clase: 'badge-yellow' },
};

const EMPTY_TAREA = { descripcion: '', hora: '08:00', categoria: 'medicacion', dosis: '', via: '', notas: '', cada_horas: 8, repeticiones: 3 };

function Tarea({ tarea, onToggle, onEliminar, ocupado }) {
  const estado = tarea.estado || 'pendiente';
  const etiqueta = ETIQUETA_ESTADO[estado];
  // MySQL devuelve 0/1: sin el doble ! React pintaría un "0" suelto
  const completada = !!tarea.completada;

  return (
    <div className={`rounded-2xl border-2 p-4 transition-all ${ESTILO_ESTADO[estado]}`}>
      <div className="flex items-start gap-4">
        {/* Checkbox grande para dedo en tablet */}
        <button
          onClick={() => onToggle(tarea)}
          disabled={ocupado}
          aria-label={completada ? 'Marcar como no aplicada' : 'Marcar como aplicada'}
          className={`flex-shrink-0 w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all disabled:opacity-50 ${
            completada
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-emerald-400'
          }`}
        >
          {completada && (
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`text-base font-semibold ${completada ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
              {tarea.descripcion}
            </p>
            {etiqueta && !completada && <span className={`${etiqueta.clase} flex-shrink-0`}>{etiqueta.texto}</span>}
          </div>

          {(tarea.dosis || tarea.via) && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {[tarea.dosis, tarea.via].filter(Boolean).join(' · ')}
            </p>
          )}
          {tarea.notas && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{tarea.notas}</p>}

          {completada && (
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2 font-medium">
              ✓ Aplicada{tarea.completada_por_nombre ? ` por ${tarea.completada_por_nombre}` : ''}
              {tarea.completada_en ? ` · ${new Date(tarea.completada_en).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </p>
          )}
        </div>

        <button
          onClick={() => onEliminar(tarea)}
          title="Eliminar tarea"
          className="flex-shrink-0 p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function HojaTratamiento() {
  const { hospitalizacionId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [searchParams] = useSearchParams();
  const pacienteId = searchParams.get('paciente');

  const [fecha, setFecha] = useState(hoyISO());
  const [modalTarea, setModalTarea] = useState(false);
  const [form, setForm] = useState(EMPTY_TAREA);
  const [esPauta, setEsPauta] = useState(false);

  const { data: hoja, isLoading } = useHojaTratamiento(hospitalizacionId, fecha);
  const completarTarea = useCompletarTarea();
  const crearTarea = useCrearTarea();
  const crearPauta = useCrearPauta();
  const eliminarTarea = useEliminarTarea();

  const resumen = hoja?.resumen ?? { total: 0, completadas: 0, atrasadas: 0, progreso: 0 };
  const bloques = hoja?.bloques ?? [];

  const setCampo = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const toggle = async (tarea) => {
    try {
      await completarTarea.mutateAsync({ tareaId: tarea.id, completada: !tarea.completada });
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo actualizar la tarea'));
    }
  };

  const eliminar = async (tarea) => {
    const ok = await confirm({
      title: 'Eliminar tarea', message: `Se eliminará "${tarea.descripcion}" de la hoja.`,
      confirmText: 'Eliminar', tone: 'danger',
    });
    if (!ok) return;
    try {
      await eliminarTarea.mutateAsync(tarea.id);
      toast.success('Tarea eliminada');
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo eliminar'));
    }
  };

  const guardar = async () => {
    if (!form.descripcion.trim()) { toast.warning('Describe la tarea'); return; }
    const payload = { ...form, fecha };
    try {
      if (esPauta) {
        const { creadas } = await crearPauta.mutateAsync({ hospitalizacionId, payload });
        toast.success(`Pauta creada: ${creadas} toma${creadas !== 1 ? 's' : ''}`);
      } else {
        await crearTarea.mutateAsync({ hospitalizacionId, payload });
        toast.success('Tarea agregada');
      }
      setModalTarea(false);
      setForm(EMPTY_TAREA);
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo guardar la tarea'));
    }
  };

  return (
    <div className="animate-fade-in">
      <button onClick={() => (pacienteId ? navigate(`/expediente/${pacienteId}`) : navigate(-1))} className="back-link">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver
      </button>

      {/* Encabezado con progreso */}
      <div className="card p-5 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Hoja de tratamiento</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {resumen.completadas} de {resumen.total} aplicadas
              {resumen.atrasadas > 0 && (
                <span className="ml-2 text-red-600 dark:text-red-400 font-semibold">· {resumen.atrasadas} atrasada{resumen.atrasadas !== 1 ? 's' : ''}</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input w-auto py-2" />
            <button onClick={() => { setForm(EMPTY_TAREA); setEsPauta(false); setModalTarea(true); }} className="btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Agregar
            </button>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${resumen.progreso === 100 ? 'bg-emerald-500' : 'bg-violet-500'}`}
              style={{ width: `${resumen.progreso}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 text-right">{resumen.progreso}% completado</p>
        </div>
      </div>

      {/* Cronograma por horas */}
      {isLoading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}</div>
      ) : bloques.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">🗓️</div>
          <p className="font-medium text-slate-600 dark:text-slate-300">Sin tareas para este día</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Agrega la medicación, fluidos o constantes que deben aplicarse.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {bloques.map((bloque) => (
            <section key={bloque.hora}>
              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-lg font-bold text-slate-700 dark:text-slate-200 tabular-nums">{bloque.hora}</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {bloque.tareas.filter((t) => t.completada).length}/{bloque.tareas.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {bloque.tareas.map((t) => (
                  <Tarea key={t.id} tarea={t} onToggle={toggle} onEliminar={eliminar} ocupado={completarTarea.isPending} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal: agregar tarea o pauta */}
      <Modal
        open={modalTarea}
        onClose={() => setModalTarea(false)}
        title={esPauta ? 'Nueva pauta repetida' : 'Nueva tarea'}
        maxWidth="max-w-md"
        footer={
          <>
            <button onClick={() => setModalTarea(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={guardar} disabled={crearTarea.isPending || crearPauta.isPending} className="btn-primary flex-1 justify-center">
              {crearTarea.isPending || crearPauta.isPending ? 'Guardando…' : 'Agregar'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button onClick={() => setEsPauta(false)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${!esPauta ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'}`}>
              Una vez
            </button>
            <button onClick={() => setEsPauta(true)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${esPauta ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'}`}>
              Cada N horas
            </button>
          </div>

          <FormField label="Descripción *" value={form.descripcion} onChange={setCampo('descripcion')} placeholder="Ej: Enrofloxacina 5 mg/kg" />

          <div className="grid grid-cols-2 gap-3">
            <FormField label={esPauta ? 'Primera toma' : 'Hora'} type="time" value={form.hora} onChange={setCampo('hora')} />
            <FormField label="Categoría">
              <select value={form.categoria} onChange={(e) => setCampo('categoria')(e.target.value)} className="input">
                {CATEGORIAS.map((c) => <option key={c.valor} value={c.valor}>{c.etiqueta}</option>)}
              </select>
            </FormField>
          </div>

          {esPauta && (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Cada (horas)" type="number" min="1" max="24" value={form.cada_horas} onChange={setCampo('cada_horas')} />
              <FormField label="N.º de tomas" type="number" min="1" max="24" value={form.repeticiones} onChange={setCampo('repeticiones')} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Dosis" value={form.dosis} onChange={setCampo('dosis')} placeholder="Ej: 2 ml" />
            <FormField label="Vía" value={form.via} onChange={setCampo('via')} placeholder="IV, SC, VO…" />
          </div>

          <FormField label="Notas">
            <textarea rows={2} value={form.notas} onChange={(e) => setCampo('notas')(e.target.value)} className="input resize-none" placeholder="Indicaciones especiales" />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
