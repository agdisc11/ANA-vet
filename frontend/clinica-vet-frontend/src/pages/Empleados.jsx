import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { PageHeader, DataTable, Modal, FormField } from '../components/ui';
import { useEmpleados, useRoles, useCrearEmpleado, useEliminarEmpleado } from '../hooks/useAdmin';
import { mensajeError } from '../lib/queryClient';

const FORM_INITIAL = { nombre: '', apellidos: '', email: '', password: '', telefono: '', rol_id: '' };

export default function Empleados() {
  const { tipo } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();

  const { data: empleados = [], isLoading } = useEmpleados();
  const { data: roles = [] } = useRoles();
  const crearEmpleado = useCrearEmpleado();
  const eliminarEmpleado = useEliminarEmpleado();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(FORM_INITIAL);
  const [formError, setFormError] = useState(null);
  const [emailMode, setEmailMode] = useState('personal'); // 'personal' | 'autogenerado'
  const [credenciales, setCredenciales] = useState(null); // { email, password }

  // Guardia de rol: solo el administrador de la clínica
  useEffect(() => {
    if (tipo && tipo !== 'clinica') navigate('/', { replace: true });
  }, [tipo, navigate]);

  const setCampo = (name) => (v) => setForm((prev) => ({ ...prev, [name]: v }));

  const abrirModal = () => { setForm(FORM_INITIAL); setFormError(null); setEmailMode('personal'); setShowModal(true); };

  const handleSubmit = async () => {
    setFormError(null);
    const generarCorreo = emailMode === 'autogenerado';

    if (!form.nombre.trim() || !form.rol_id) {
      setFormError('Nombre y rol son obligatorios.');
      return;
    }
    if (!generarCorreo && (!form.email.trim() || !form.password.trim())) {
      setFormError('Correo y contraseña son obligatorios cuando no se autogenera el correo.');
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      apellidos: form.apellidos.trim(),
      telefono: form.telefono.trim(),
      rol_id: Number(form.rol_id),
      generar_correo: generarCorreo,
    };
    if (!generarCorreo) { payload.email = form.email.trim(); payload.password = form.password; }

    try {
      const res = await crearEmpleado.mutateAsync(payload);
      setShowModal(false);
      setForm(FORM_INITIAL);
      setEmailMode('personal');

      if (generarCorreo && res?.email && res?.password_temporal) {
        setCredenciales({ email: res.email, password: res.password_temporal });
      } else {
        toast.success('Empleado registrado correctamente.');
      }
    } catch (err) {
      setFormError(mensajeError(err, 'Error al registrar el empleado.'));
    }
  };

  const eliminar = async (emp) => {
    const ok = await confirm({
      title: '¿Eliminar empleado?',
      message: `${emp.nombre} ${emp.apellidos ?? ''} (${emp.email}) será eliminado. Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar', tone: 'danger',
    });
    if (!ok) return;
    try {
      await eliminarEmpleado.mutateAsync(emp.id);
      toast.success('Empleado eliminado correctamente.');
    } catch (err) {
      toast.error(mensajeError(err, 'Error al eliminar el empleado.'));
    }
  };

  const columns = [
    {
      header: 'Empleado',
      cell: (emp) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-teal-700 dark:text-teal-300 font-bold text-sm">{(emp.nombre?.[0] ?? '?').toUpperCase()}</span>
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{emp.nombre} {emp.apellidos ?? ''}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">ID #{emp.id}</p>
          </div>
        </div>
      ),
    },
    { header: 'Correo', className: 'text-slate-600 dark:text-slate-300', cell: (emp) => emp.email },
    { header: 'Teléfono', className: 'text-slate-600 dark:text-slate-300', cell: (emp) => emp.telefono || '—' },
    {
      header: 'Rol / Puesto',
      cell: (emp) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-800">
          {emp.rol_nombre ?? emp.rol ?? 'Sin rol'}
        </span>
      ),
    },
    {
      header: 'Acciones', align: 'right', stopPropagation: true,
      cell: (emp) => (
        <button onClick={() => eliminar(emp)} title="Eliminar empleado" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Eliminar
        </button>
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Gestión de Empleados"
        subtitle="Administra el equipo de tu clínica"
        action={
          <button onClick={abrirModal} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold shadow-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Empleado
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={empleados}
        loading={isLoading}
        empty={{
          title: 'No hay empleados registrados aún.',
          action: <button onClick={abrirModal} className="text-teal-600 dark:text-teal-400 text-sm font-semibold hover:underline">Registrar el primero</button>,
        }}
      />

      {/* Modal: Nuevo Empleado */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Registrar Empleado"
        maxWidth="max-w-md"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleSubmit} disabled={crearEmpleado.isPending} className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors disabled:opacity-60">
              {crearEmpleado.isPending ? 'Guardando…' : 'Registrar Empleado'}
            </button>
          </>
        }
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {formError && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-sm">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formError}
            </div>
          )}

          <FormField label="Nombre *" value={form.nombre} onChange={setCampo('nombre')} placeholder="Ej. María" />
          <FormField label="Apellidos" value={form.apellidos} onChange={setCampo('apellidos')} placeholder="Ej. García López" />

          {/* Modo de acceso */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">¿Cómo deseas registrar el acceso?</p>
            {[
              { val: 'personal', titulo: 'Correo personal', desc: 'Ingresa el correo y contraseña del empleado' },
              { val: 'autogenerado', titulo: 'Generar correo único de clínica', desc: 'El sistema asignará un correo institucional automáticamente' },
            ].map((opt) => (
              <label key={opt.val} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${emailMode === opt.val ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                <input type="radio" name="emailMode" value={opt.val} checked={emailMode === opt.val} onChange={() => setEmailMode(opt.val)} className="sr-only" />
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${emailMode === opt.val ? 'border-teal-500' : 'border-slate-300 dark:border-slate-600'}`}>
                  {emailMode === opt.val && <span className="w-2 h-2 rounded-full bg-teal-500 block" />}
                </span>
                <div>
                  <p className={`text-sm font-semibold ${emailMode === opt.val ? 'text-teal-700 dark:text-teal-300' : 'text-slate-700 dark:text-slate-300'}`}>{opt.titulo}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {emailMode === 'personal' ? (
            <>
              <FormField label="Correo electrónico *" type="email" value={form.email} onChange={setCampo('email')} placeholder="empleado@clinica.com" />
              <FormField label="Contraseña *" type="password" value={form.password} onChange={setCampo('password')} placeholder="Mínimo 6 caracteres" minLength={6} />
            </>
          ) : (
            <div className="flex items-start gap-3 px-4 py-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl">
              <svg className="w-5 h-5 text-teal-500 dark:text-teal-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-teal-700 dark:text-teal-300 font-medium leading-snug">El sistema generará un correo de acceso institucional de forma automática.</p>
            </div>
          )}

          <FormField label="Teléfono" type="tel" value={form.telefono} onChange={setCampo('telefono')} placeholder="Ej. 555-123-4567" />

          <FormField label="Rol / Puesto *">
            <select value={form.rol_id} onChange={(e) => setCampo('rol_id')(e.target.value)} className="input">
              <option value="">— Selecciona un rol —</option>
              {roles.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}
            </select>
          </FormField>
        </div>
      </Modal>

      {/* Modal: Credenciales autogeneradas */}
      <Modal open={!!credenciales} onClose={() => { setCredenciales(null); toast.success('Empleado registrado correctamente.'); }} maxWidth="max-w-md">
        {credenciales && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">¡Empleado registrado!</h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Correo institucional generado automáticamente</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Entrega estas credenciales al empleado. <strong className="text-slate-800 dark:text-slate-200">Guárdalas ahora</strong>, la contraseña temporal no se mostrará de nuevo.
            </p>
            {[
              { label: 'Correo de acceso', valor: credenciales.email, tono: 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100' },
              { label: 'Contraseña temporal', valor: credenciales.password, tono: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200' },
            ].map((c) => (
              <div key={c.label} className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{c.label}</p>
                <div className="flex items-center gap-2">
                  <div className={`flex-1 px-4 py-3 border rounded-xl font-mono text-sm break-all select-all ${c.tono}`}>{c.valor}</div>
                  <button type="button" onClick={() => navigator.clipboard?.writeText(c.valor)} title={`Copiar ${c.label.toLowerCase()}`} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-900/30 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200 dark:border-slate-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => { setCredenciales(null); toast.success('Empleado registrado correctamente.'); }} className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow transition-colors">
              Entendido, cerrar
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
