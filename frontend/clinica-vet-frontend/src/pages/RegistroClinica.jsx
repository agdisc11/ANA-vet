import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import { mensajeError } from '../lib/queryClient';

// ─────────────────────────────────────────────────────────────
// RegistroClinica.js — Pantalla de registro de nueva clínica
// Ruta pública: /registro
// POST → /api/clinicas/registro
// ─────────────────────────────────────────────────────────────

export default function RegistroClinica() {
  const navigate = useNavigate();

  const [nombre,    setNombre]    = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [showPass,  setShowPass]  = useState(false);
  const [showConf,  setShowConf]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await authService.registrarClinica({ nombre, email, password });
      navigate('/login', {
        state: { successMsg: '¡Clínica registrada con éxito! Ya puedes iniciar sesión.' },
      });
    } catch (err) {
      setError(mensajeError(err, 'Error de conexión con el servidor'));
    } finally {
      setLoading(false);
    }
  };

  // ── Ícono de ojo (mostrar/ocultar contraseña) ──────────────
  const EyeIcon = ({ open }) =>
    open ? (
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
    );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-6">

      {/* ── Card principal ── */}
      <div className="w-full max-w-md">

        {/* Logo / Marca */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/30 mb-3">
            <span className="text-2xl">🐾</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">ANA-vet</h1>
          <p className="text-slate-400 text-sm mt-0.5">Sistema de gestión veterinaria</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">

          {/* Encabezado de la card */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500/15 border border-teal-500/25">
                <span className="text-xl">🏥</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Registrar nueva clínica</h2>
                <p className="text-xs text-slate-400">Crea la cuenta de administrador principal</p>
              </div>
            </div>
          </div>

          {/* ── Formulario ── */}
          <form onSubmit={handleSubmit} className="p-5 space-y-3">

            {/* Nombre de la clínica */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-300">
                Nombre de la Clínica
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </span>
                <input
                  type="text"
                  required
                  autoComplete="organization"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Clínica Veterinaria Ejemplo"
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

            {/* Correo electrónico */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-300">
                Correo Electrónico
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
                  placeholder="correo@miclinica.com"
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
            <div className="space-y-1">
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
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
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
                  <EyeIcon open={showPass} />
                </button>
              </div>
            </div>

            {/* Confirmar contraseña */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-300">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                <input
                  type={showConf ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repite la contraseña"
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
                  onClick={() => setShowConf(!showConf)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  tabIndex={-1}
                >
                  <EyeIcon open={showConf} />
                </button>
              </div>
            </div>

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
                  Registrando...
                </>
              ) : (
                'Registrar Clínica'
              )}
            </button>

            {/* Enlace de vuelta al login */}
            <p className="text-center text-sm text-slate-400">
              ¿Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="text-teal-400 hover:text-teal-300 font-medium transition-colors"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-4">
          ANA-vet © {new Date().getFullYear()} — Sistema veterinario multi-clínica
        </p>
      </div>
    </div>
  );
}
