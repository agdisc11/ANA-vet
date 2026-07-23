import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { PageHeader, FormPanel, FormField } from '../components/ui';
import { useConsultasPorExpediente, useCrearConsulta } from '../hooks/useClinico';
import { useEmpleados } from '../hooks/useAdmin';
import { mensajeError } from '../lib/queryClient';

const CAMPOS = [
  { key: 'motivo', label: 'Motivo de consulta' },
  { key: 'anamnesis', label: 'Anamnesis' },
  { key: 'examen_fisico', label: 'Examen físico' },
  { key: 'examenes_sistemicos', label: 'Exámenes sistémicos' },
  { key: 'lista_problemas', label: 'Lista de problemas' },
  { key: 'dx_presuntivo', label: 'Dx presuntivo' },
  { key: 'abordaje_dx', label: 'Abordaje diagnóstico' },
  { key: 'dx_definitivo', label: 'Dx definitivo' },
  { key: 'indicaciones', label: 'Indicaciones' },
  { key: 'tratamiento', label: 'Tratamiento' },
  { key: 'tratamiento_etiologico', label: 'Tratamiento etiológico' },
  { key: 'seguimiento_medico', label: 'Seguimiento médico' },
];

const EMPTY = Object.fromEntries([['fecha', ''], ['empleado_id', ''], ...CAMPOS.map((f) => [f.key, ''])]);

function Field({ label, value }) {
  if (!value) return null;
  return (
    <div className="py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

export default function Consulta() {
  const { expedienteId, pacienteId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: consultas = [] } = useConsultasPorExpediente(expedienteId);
  const { data: empleados = [], isLoading: cargandoEmpleados } = useEmpleados();
  const crearConsulta = useCrearConsulta();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const guardar = async () => {
    if (!form.fecha) { toast.warning('La fecha de la consulta es obligatoria'); return; }
    try {
      await crearConsulta.mutateAsync({ expediente_id: expedienteId, ...form, empleado_id: form.empleado_id || null });
      toast.success('Consulta registrada correctamente');
      setForm(EMPTY);
      setMostrarForm(false);
    } catch (e) {
      toast.error(mensajeError(e, 'Error al registrar la consulta'));
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
        title="Consultas"
        subtitle={`${consultas.length} consulta${consultas.length !== 1 ? 's' : ''} registrada${consultas.length !== 1 ? 's' : ''}`}
        action={
          <button onClick={() => { setMostrarForm(!mostrarForm); setForm(EMPTY); }} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva consulta
          </button>
        }
      />

      <FormPanel
        open={mostrarForm}
        onClose={() => setMostrarForm(false)}
        title="Registrar consulta"
        footer={
          <>
            <button onClick={guardar} disabled={crearConsulta.isPending} className="btn-success disabled:opacity-50">
              {crearConsulta.isPending ? 'Guardando...' : 'Guardar consulta'}
            </button>
            <button onClick={() => setMostrarForm(false)} className="btn-secondary">Cancelar</button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <FormField label="Fecha *" type="date" value={form.fecha} onChange={(v) => setForm({ ...form, fecha: v })} />
          <FormField label="Médico encargado">
            <select value={form.empleado_id} onChange={(e) => setForm({ ...form, empleado_id: e.target.value })} className="input" disabled={cargandoEmpleados}>
              <option value="">{cargandoEmpleados ? 'Cargando personal…' : '— Sin asignar —'}</option>
              {empleados.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.nombre} {emp.apellidos}{emp.rol_nombre ? ` (${emp.rol_nombre})` : ''}</option>
              ))}
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {CAMPOS.map((f) => (
            <FormField key={f.key} label={f.label}>
              <textarea rows={3} placeholder={f.label} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className="input resize-none" />
            </FormField>
          ))}
        </div>
      </FormPanel>

      <div className="space-y-4">
        {consultas.map((c) => (
          <div key={c.id} className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-violet-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {new Date(c.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              {c.empleado_nombre && (
                <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-medium">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {c.empleado_nombre} {c.empleado_apellidos}
                </span>
              )}
              {c.dx_definitivo && <span className="badge-green ml-auto">{c.dx_definitivo}</span>}
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {CAMPOS.map((f) => <Field key={f.key} label={f.label} value={c[f.key]} />)}
            </div>
          </div>
        ))}

        {consultas.length === 0 && (
          <div className="card p-10 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sin consultas registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
