import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { PageHeader, FormPanel, FormField } from '../components/ui';
import { useCirugiasPorExpediente, useCrearCirugia, useCrearAnestesia } from '../hooks/useClinico';
import { useEmpleados } from '../hooks/useAdmin';
import { mensajeError } from '../lib/queryClient';

const FORM_EMPTY = {
  fecha: '', procedimiento: '', plan_quirurgico: '', notas: '', consentimiento: '',
  protocolo: '', farmacos: '', dosis: '', observaciones_anestesia: '', empleados_ids: [],
};

const CAMPOS_CX = [
  { key: 'procedimiento', label: 'Procedimiento' },
  { key: 'plan_quirurgico', label: 'Plan quirúrgico' },
  { key: 'notas', label: 'Notas' },
  { key: 'consentimiento', label: 'Consentimiento' },
];

const CAMPOS_ANEST = [
  { key: 'protocolo', label: 'Protocolo' },
  { key: 'farmacos', label: 'Fármacos' },
  { key: 'dosis', label: 'Dosis' },
  { key: 'observaciones_anestesia', label: 'Observaciones' },
];

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export default function Cirugia() {
  const { expedienteId, pacienteId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const { data: cirugias = [] } = useCirugiasPorExpediente(expedienteId);
  const { data: empleados = [], isLoading: cargandoEmpleados } = useEmpleados();
  const crearCirugia = useCrearCirugia();
  const crearAnestesia = useCrearAnestesia();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(FORM_EMPTY);

  const toggleEmpleado = (id) => {
    const idStr = String(id);
    setForm((prev) => ({
      ...prev,
      empleados_ids: prev.empleados_ids.includes(idStr)
        ? prev.empleados_ids.filter((e) => e !== idStr)
        : [...prev.empleados_ids, idStr],
    }));
  };

  const guardar = async () => {
    const ok = await confirm({ title: '¿Guardar cirugía?', message: 'Confirma que los datos son correctos.', confirmText: 'Sí, guardar', tone: 'warning' });
    if (!ok) return;
    try {
      const res = await crearCirugia.mutateAsync({
        expediente_id: expedienteId,
        fecha: form.fecha,
        procedimiento: form.procedimiento,
        plan_quirurgico: form.plan_quirurgico,
        notas: form.notas,
        consentimiento: form.consentimiento,
        empleados_ids: form.empleados_ids.map(Number),
      });
      await crearAnestesia.mutateAsync({
        cirugia_id: res.id,
        protocolo: form.protocolo,
        farmacos: form.farmacos,
        dosis: form.dosis,
        observaciones: form.observaciones_anestesia,
      });
      setForm(FORM_EMPTY);
      setMostrarForm(false);
      toast.success('Cirugía guardada correctamente.');
    } catch (e) {
      toast.error(mensajeError(e, 'Error al guardar. Intenta de nuevo.'));
    }
  };

  return (
    <div className="animate-fade-in">
      <button onClick={() => navigate(`/expediente/${pacienteId}`)} className="back-link">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver al expediente
      </button>

      <PageHeader
        title="Cirugías"
        subtitle={`${cirugias.length} procedimiento${cirugias.length !== 1 ? 's' : ''} registrado${cirugias.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={() => { setMostrarForm(!mostrarForm); setForm(FORM_EMPTY); }} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva cirugía
          </button>
        }
      />

      <FormPanel
        open={mostrarForm}
        onClose={() => setMostrarForm(false)}
        title="Registrar cirugía"
        footer={
          <>
            <button onClick={guardar} disabled={crearCirugia.isPending || crearAnestesia.isPending} className="btn-success disabled:opacity-50">Guardar cirugía</button>
            <button onClick={() => setMostrarForm(false)} className="btn-secondary">Cancelar</button>
          </>
        }
      >
        <div className="mb-4">
          <FormField label="Fecha *" type="date" value={form.fecha} onChange={(v) => setForm({ ...form, fecha: v })} className="max-w-xs" />
        </div>

        {/* Selección múltiple de personal médico (N:M) */}
        <div className="mb-5">
          <label className="input-label mb-2 block">
            Personal médico participante
            {form.empleados_ids.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-semibold">
                {form.empleados_ids.length} seleccionado{form.empleados_ids.length !== 1 ? 's' : ''}
              </span>
            )}
          </label>
          {cargandoEmpleados ? (
            <p className="text-sm text-slate-400 py-2">Cargando personal…</p>
          ) : empleados.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">No hay empleados registrados en esta clínica.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {empleados.map((emp) => {
                const selected = form.empleados_ids.includes(String(emp.id));
                return (
                  <label key={emp.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none ${selected ? 'border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-500' : 'border-slate-200 dark:border-slate-700 hover:border-red-300 dark:hover:border-red-600 hover:bg-red-50/50 dark:hover:bg-red-900/10'}`}>
                    <input type="checkbox" className="sr-only" checked={selected} onChange={() => toggleEmpleado(emp.id)} />
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${selected ? 'bg-red-500 border-red-500' : 'border-slate-300 dark:border-slate-600'}`}>
                      {selected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{emp.nombre} {emp.apellidos}</p>
                      {emp.rol_nombre && <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{emp.rol_nombre}</p>}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Datos de la cirugía</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {CAMPOS_CX.map((f) => (
            <FormField key={f.key} label={f.label}>
              <textarea rows={3} placeholder={f.label} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="input resize-none" />
            </FormField>
          ))}
        </div>

        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Protocolo anestésico</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CAMPOS_ANEST.map((f) => (
            <FormField key={f.key} label={f.label}>
              <textarea rows={3} placeholder={f.label} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="input resize-none" />
            </FormField>
          ))}
        </div>
      </FormPanel>

      <div className="space-y-4">
        {cirugias.map((c) => (
          <div key={c.id} className="card p-5">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(c.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              {c.procedimiento && <span className="badge-red ml-auto">{c.procedimiento}</span>}
            </div>
            {c.empleados_nombres && (
              <div className="mb-3 flex items-start gap-2">
                <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-xs text-slate-500 dark:text-slate-400"><span className="font-semibold">Personal:</span> {c.empleados_nombres}</p>
              </div>
            )}
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {CAMPOS_CX.filter((f) => f.key !== 'procedimiento').map((f) => <Field key={f.key} label={f.label} value={c[f.key]} />)}
            </div>
            {(c.protocolo || c.farmacos || c.dosis || c.observaciones) && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-2">Protocolo anestésico</p>
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  <Field label="Protocolo" value={c.protocolo} />
                  <Field label="Fármacos" value={c.farmacos} />
                  <Field label="Dosis" value={c.dosis} />
                  <Field label="Observaciones" value={c.observaciones} />
                </div>
              </div>
            )}
          </div>
        ))}

        {cirugias.length === 0 && (
          <div className="card p-10 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sin cirugías registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
