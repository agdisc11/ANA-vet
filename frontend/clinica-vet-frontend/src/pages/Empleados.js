import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────────────────
// Empleados — Panel de gestión de empleados (solo rol 'clinica')
// ─────────────────────────────────────────────────────────────

const FORM_INITIAL = {
  nombre: '',
  apellidos: '',
  email: '',
  password: '',
  telefono: '',
  rol_id: '',
};

export default function Empleados() {
  const { tipo } = useAuth();
  const navigate = useNavigate();

  const [empleados, setEmpleados] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(FORM_INITIAL);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modo de correo: 'personal' | 'autogenerado'
  const [emailMode, setEmailMode] = useState('personal');

  // Modal de credenciales autogeneradas
  const [credenciales, setCredenciales] = useState(null); // { email, password }

  // Confirmación de eliminación
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Guardia de rol ──────────────────────────────────────────
  useEffect(() => {
    if (tipo && tipo !== 'clinica') {
      navigate('/', { replace: true });
    }
  }, [tipo, navigate]);

  // ── Carga inicial ───────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rolesRes, empleadosRes] = await Promise.all([
        API.get('/roles'),
        API.get('/empleados'),
      ]);
      setRoles(rolesRes.data);
      setEmpleados(empleadosRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Handlers del formulario ─────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = () => {
    setForm(FORM_INITIAL);
    setFormError(null);
    setEmailMode('personal');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setShowModal(false);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const generarCorreo = emailMode === 'autogenerado';

    // Validación básica — en modo autogenerado NO se exigen email ni password
    if (!form.nombre.trim() || !form.rol_id) {
      setFormError('Nombre y rol son obligatorios.');
      return;
    }
    if (!generarCorreo && (!form.email.trim() || !form.password.trim())) {
      setFormError('Correo y contraseña son obligatorios cuando no se autogenera el correo.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim(),
        telefono: form.telefono.trim(),
        rol_id: Number(form.rol_id),
        generar_correo: generarCorreo,
      };

      if (!generarCorreo) {
        // Solo incluir email y password cuando el usuario los proporcionó manualmente
        payload.email = form.email.trim();
        payload.password = form.password;
      }
      // En modo autogenerado NO enviamos email ni password: el backend los genera

      const res = await API.post('/empleados', payload);

      // Limpiar formulario y cerrar modal ANTES de mostrar credenciales
      setForm(FORM_INITIAL);
      setEmailMode('personal');
      setShowModal(false);

      if (generarCorreo && res.data?.email && res.data?.password_temporal) {
        // Mostrar modal verde con las credenciales autogeneradas que devolvió el backend
        setCredenciales({
          email: res.data.email,
          password: res.data.password_temporal,
        });
      } else {
        setSuccessMsg('Empleado registrado correctamente.');
        setTimeout(() => setSuccessMsg(null), 3500);
      }

      await fetchData();
    } catch (err) {
      setFormError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Error al registrar el empleado.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Eliminación ─────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.delete(`/empleados/${deleteTarget.id}`);
      setDeleteTarget(null);
      setSuccessMsg('Empleado eliminado correctamente.');
      setTimeout(() => setSuccessMsg(null), 3500);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar el empleado.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Gestión de Empleados
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Administra el equipo de tu clínica
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-xl shadow transition-colors duration-150"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Empleado
        </button>
      </div>

      {/* Toast de éxito */}
      {successMsg && (
        <div className="flex items-center gap-3 px-4 py-3 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 rounded-xl text-teal-700 dark:text-teal-300 text-sm font-medium animate-fade-in">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {successMsg}
        </div>
      )}

      {/* Error global */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-sm font-medium">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 dark:text-slate-500">
            <svg className="w-6 h-6 animate-spin mr-3 text-teal-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Cargando empleados…
          </div>
        ) : empleados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500 gap-3">
            <svg className="w-12 h-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm font-medium">No hay empleados registrados aún.</p>
            <button
              onClick={handleOpenModal}
              className="text-teal-600 dark:text-teal-400 text-sm font-semibold hover:underline"
            >
              Registrar el primero
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Empleado
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Correo
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Rol / Puesto
                  </th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {empleados.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors duration-100"
                  >
                    {/* Avatar + nombre */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-teal-700 dark:text-teal-300 font-bold text-sm">
                            {(emp.nombre?.[0] ?? '?').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">
                            {emp.nombre} {emp.apellidos ?? ''}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            ID #{emp.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {emp.email}
                    </td>

                    {/* Teléfono */}
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {emp.telefono || <span className="text-slate-300 dark:text-slate-600">—</span>}
                    </td>

                    {/* Rol */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-100 dark:border-teal-800">
                        {emp.rol_nombre ?? emp.rol ?? 'Sin rol'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setDeleteTarget(emp)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-150"
                        title="Eliminar empleado"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: Nuevo Empleado ─────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) handleCloseModal(); }}
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Header del modal */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                  <svg className="w-5 h-5 text-teal-600 dark:text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Registrar Empleado
                </h2>
              </div>
              <button
                onClick={handleCloseModal}
                disabled={submitting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-sm">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formError}
                </div>
              )}

              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej. María"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>

              {/* Apellidos */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Apellidos
                </label>
                <input
                  type="text"
                  name="apellidos"
                  value={form.apellidos}
                  onChange={handleChange}
                  placeholder="Ej. García López"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>

              {/* ── Switch: Modo de acceso ─────────────────────────── */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  ¿Cómo deseas registrar el acceso?
                </p>

                {/* Opción: Correo personal */}
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                    emailMode === 'personal'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="emailMode"
                    value="personal"
                    checked={emailMode === 'personal'}
                    onChange={() => setEmailMode('personal')}
                    className="sr-only"
                  />
                  {/* Indicador visual */}
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      emailMode === 'personal'
                        ? 'border-teal-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {emailMode === 'personal' && (
                      <span className="w-2 h-2 rounded-full bg-teal-500 block" />
                    )}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${emailMode === 'personal' ? 'text-teal-700 dark:text-teal-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      Correo personal
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Ingresa el correo y contraseña del empleado
                    </p>
                  </div>
                </label>

                {/* Opción: Generar correo único */}
                <label
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-150 ${
                    emailMode === 'autogenerado'
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="emailMode"
                    value="autogenerado"
                    checked={emailMode === 'autogenerado'}
                    onChange={() => setEmailMode('autogenerado')}
                    className="sr-only"
                  />
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      emailMode === 'autogenerado'
                        ? 'border-teal-500'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {emailMode === 'autogenerado' && (
                      <span className="w-2 h-2 rounded-full bg-teal-500 block" />
                    )}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold ${emailMode === 'autogenerado' ? 'text-teal-700 dark:text-teal-300' : 'text-slate-700 dark:text-slate-300'}`}>
                      Generar correo único de clínica
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      El sistema asignará un correo institucional automáticamente
                    </p>
                  </div>
                </label>
              </div>

              {/* Correo electrónico — visible solo en modo personal */}
              {emailMode === 'personal' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Correo electrónico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="empleado@clinica.com"
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
              ) : (
                <div className="flex items-start gap-3 px-4 py-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl">
                  <svg className="w-5 h-5 text-teal-500 dark:text-teal-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-teal-700 dark:text-teal-300 font-medium leading-snug">
                    El sistema generará un correo de acceso institucional de forma automática.
                  </p>
                </div>
              )}

              {/* Contraseña — visible solo en modo personal */}
              {emailMode === 'personal' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                  />
                </div>
              )}

              {/* Teléfono */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={form.telefono}
                  onChange={handleChange}
                  placeholder="Ej. 555-123-4567"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
                />
              </div>

              {/* Rol */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Rol / Puesto <span className="text-red-500">*</span>
                </label>
                <select
                  name="rol_id"
                  value={form.rol_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition appearance-none cursor-pointer"
                >
                  <option value="">— Selecciona un rol —</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors duration-150 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Guardando…
                    </>
                  ) : (
                    'Registrar Empleado'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Credenciales autogeneradas ────────────────── */}
      {credenciales && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4 bg-gradient-to-br from-teal-500 to-teal-600 text-white">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-bold">¡Empleado registrado!</h2>
                  <p className="text-teal-100 text-xs mt-0.5">Correo institucional generado automáticamente</p>
                </div>
              </div>
            </div>

            {/* Cuerpo */}
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Entrega estas credenciales al empleado. <strong className="text-slate-800 dark:text-slate-200">Guárdalas ahora</strong>, ya que la contraseña temporal no se mostrará de nuevo.
              </p>

              {/* Correo generado */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Correo de acceso
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm text-slate-800 dark:text-slate-100 break-all select-all">
                    {credenciales.email}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(credenciales.email)}
                    title="Copiar correo"
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-900/30 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Contraseña temporal */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Contraseña temporal
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl font-mono text-sm text-amber-800 dark:text-amber-200 break-all select-all">
                    {credenciales.password}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(credenciales.password)}
                    title="Copiar contraseña"
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-900/30 text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 border border-slate-200 dark:border-slate-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Aviso */}
              <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  Se recomienda que el empleado cambie su contraseña al iniciar sesión por primera vez.
                </p>
              </div>

              {/* Botón cerrar */}
              <button
                type="button"
                onClick={() => {
                  setCredenciales(null);
                  setSuccessMsg('Empleado registrado correctamente.');
                  setTimeout(() => setSuccessMsg(null), 3500);
                }}
                className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow transition-colors duration-150"
              >
                Entendido, cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Confirmar eliminación ──────────────────────── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteTarget(null); }}
        >
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Eliminar empleado?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {deleteTarget.nombre} {deleteTarget.apellidos ?? ''}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {deleteTarget.email}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors duration-150 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Eliminando…
                  </>
                ) : (
                  'Sí, eliminar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
