import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────────────────
// Login.js — Pantalla de inicio de sesión doble (ANA-vet)
// Pestaña 1: Login de Clínica (Administrador)
// Pestaña 2: Login de Empleado (Veterinario / Recepcionista)
// ─────────────────────────────────────────────────────────────

const TAB_CLINICA  = 'clinica';
const TAB_EMPLEADO = 'empleado';

export default function Login() {
  const { loginClinica, loginEmpleado } = useAuth();
  const navigate = useNavigate();

  const location = useLocation();
  const successMsg = location.state?.successMsg || '';

  const [activeTab, setActiveTab] = useState(TAB_CLINICA);
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showPass, setShowPass] = useState(false);

  // Limpia el formulario al cambiar de pestaña
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setEmail('');
    setPassword('');
    setError('');
    setShowPass(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (activeTab === TAB_CLINICA) {
        await loginClinica(email, password);
      } else {
        await loginEmpleado(email, password);
      }
      navigate('/', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        'Error al iniciar sesión. Verifica tus credenciales.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Metadatos por pestaña ──────────────────────────────────
  const tabMeta = {
    [TAB_CLINICA]: {
      label:       'Clínica',
      sublabel:    'Administrador principal',
      icon:        '🏥',
      placeholder: 'correo@miclinica.com',
      btnText:     'Ingresar como Clínica',
      hint:        'Acceso completo: empleados, reportes y configuración.',
    },
    [TAB_EMPLEADO]: {
      label:       'Empleado',
      sublabel:    'Veterinario / Recepcionista',
      icon:        '👨‍⚕️',
      placeholder: 'correo@empleado.com',
      btnText:     'Ingresar como Empleado',
      hint:        'Acceso según tu rol asignado por la clínica.',
    },
  };

  const meta = tabMeta[activeTab];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">

      {/* ── Card principal ── */}
      <div className="w-full max-w-md">

        {/* Logo / Marca */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/30 mb-4">
            <span className="text-3xl">🐾</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">ANA-vet</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema de gestión veterinaria</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">

          {/* ── Pestañas ── */}
          <div className="flex border-b border-slate-700/50">
            {[TAB_CLINICA, TAB_EMPLEADO].map((tab) => {
              const isActive = activeTab === tab;
              const m = tabMeta[tab];
              return (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`
                    flex-1 flex flex-col items-center gap-0.5 py-4 px-3 text-sm font-medium
                    transition-all duration-200 focus:outline-none
                    ${isActive
                      ? 'bg-teal-500/10 text-teal-400 border-b-2 border-teal-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 border-b-2 border-transparent'
                    }
                  `}
                >
                  <span className="text-xl">{m.icon}</span>
                  <span>{m.label}</span>
                  <span className={`text-xs font-normal ${isActive ? 'text-teal-500/80' : 'text-slate-500'}`}>
                    {m.sublabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Formulario ── */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* Hint de rol */}
            <p className="text-xs text-slate-400 bg-slate-700/40 rounded-lg px-3 py-2 border border-slate-600/30">
              {meta.hint}
            </p>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                Correo electrónico
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={meta.placeholder}
                  className="
                    w-full pl-10 pr-4 py-2.5 rounded-xl text-sm
                    bg-slate-700/50 border border-slate-600/50
                    text-slate-100 placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50
                    transition-all duration-200
                  "
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="
                    w-full pl-10 pr-10 py-2.5 rounded-xl text-sm
                    bg-slate-700/50 border border-slate-600/50
                    text-slate-100 placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50
                    transition-all duration-200
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mensaje de éxito (viene de /registro) */}
            {successMsg && (
              <div className="flex items-start gap-2 bg-teal-500/10 border border-teal-500/30 rounded-xl px-3 py-2.5">
                <svg className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-teal-400">{successMsg}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5">
                <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Botón de submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full py-2.5 px-4 rounded-xl text-sm font-semibold
                bg-teal-500 hover:bg-teal-400 active:bg-teal-600
                text-white shadow-lg shadow-teal-500/20
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-200
                flex items-center justify-center gap-2
              "
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </>
              ) : (
                meta.btnText
              )}
            </button>

            {/* Enlace de registro — solo visible en la pestaña Clínica */}
            {activeTab === TAB_CLINICA && (
              <p className="text-center text-sm text-slate-400">
                ¿No tienes cuenta?{' '}
                <Link
                  to="/registro"
                  className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
                >
                  Registra tu clínica
                </Link>
              </p>
            )}
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-6">
          ANA-vet © {new Date().getFullYear()} — Sistema veterinario multi-clínica
        </p>
      </div>
    </div>
  );
}
