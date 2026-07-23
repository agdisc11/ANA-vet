import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import API, { registerUnauthorizedHandler } from '../api';
import { authService } from '../services/authService';
import { useToast } from './ToastContext';

// ─────────────────────────────────────────────────────────────
// AuthContext — Gestión global de sesión SaaS multi-tenant
// Soporta dos tipos de usuario: 'clinica' y 'empleado'
// ─────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

const SESSION_KEY = 'ana_vet_session';

/**
 * Lee la sesión guardada en localStorage.
 * Devuelve null si no existe o está corrupta.
 */
function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Persiste la sesión en localStorage e inyecta el token
 * como header por defecto en todas las peticiones de axios.
 */
function persistSession(session) {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    API.defaults.headers.common['Authorization'] = `Bearer ${session.token}`;
  } else {
    localStorage.removeItem(SESSION_KEY);
    delete API.defaults.headers.common['Authorization'];
  }
}

export function AuthProvider({ children }) {
  const toast = useToast();
  const [session, setSession] = useState(() => {
    const saved = loadSession();
    if (saved?.token) {
      // Restaurar el header de axios al recargar la página
      API.defaults.headers.common['Authorization'] = `Bearer ${saved.token}`;
    }
    return saved;
  });

  // Sincroniza localStorage cada vez que cambia la sesión
  useEffect(() => {
    persistSession(session);
  }, [session]);

  // Ref para leer la sesión actual sin recrear el handler en cada cambio
  const sessionRef = useRef(session);
  useEffect(() => { sessionRef.current = session; }, [session]);

  // Cierra la sesión automáticamente cuando el backend rechaza el
  // token (401). Evita dejar al usuario con pantallas rotas.
  // Sin efectos secundarios dentro del updater de estado para no
  // duplicar el toast en React StrictMode.
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      if (!sessionRef.current) return;
      setSession(null);
      toast.warning('Tu sesión expiró. Inicia sesión nuevamente.');
    });
    return () => registerUnauthorizedHandler(null);
  }, [toast]);

  // ── Login Clínica (Administrador) ──────────────────────────
  // POST /api/clinicas/login  →  { token, tipo, clinica: {...} }
  const loginClinica = useCallback(async (email, password) => {
    const data = await authService.loginClinica(email, password);

    const newSession = {
      token:      data.token,
      tipo:       'clinica',           // 'clinica' | 'empleado'
      clinica_id: data.clinica.id,
      rol:        'Administrador',
      user: {
        id:        data.clinica.id,
        nombre:    data.clinica.nombre,
        email:     data.clinica.email,
        telefono:  data.clinica.telefono,
        direccion: data.clinica.direccion,
        logo_url:  data.clinica.logo_url,
      },
    };

    setSession(newSession);
    return newSession;
  }, []);

  // ── Login Empleado (Veterinario / Recepcionista / Auxiliar) ─
  // POST /api/empleados/login  →  { token, tipo, empleado: {...} }
  const loginEmpleado = useCallback(async (email, password) => {
    const data = await authService.loginEmpleado(email, password);

    const newSession = {
      token:      data.token,
      tipo:       'empleado',
      clinica_id: data.empleado.clinica_id,
      rol:        data.empleado.rol_nombre,
      user: {
        id:             data.empleado.id,
        nombre:         data.empleado.nombre,
        apellidos:      data.empleado.apellidos,
        email:          data.empleado.email,
        telefono:       data.empleado.telefono,
        rol_id:         data.empleado.rol_id,
        rol_nombre:     data.empleado.rol_nombre,
        clinica_nombre: data.empleado.clinica_nombre,
      },
    };

    setSession(newSession);
    return newSession;
  }, []);

  // ── Logout ─────────────────────────────────────────────────
  // Solo limpia la sesión. La redirección a /login la maneja
  // <ProtectedRoute> en App.js al detectar que isLoggedIn es false,
  // sin necesidad de recargar la página completa.
  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
    delete API.defaults.headers.common['Authorization'];
  }, []);

  // ── Valores expuestos al árbol de componentes ───────────────
  const value = {
    // Estado
    token:      session?.token      ?? null,
    tipo:       session?.tipo       ?? null,   // 'clinica' | 'empleado' | null
    rol:        session?.rol        ?? null,
    clinica_id: session?.clinica_id ?? null,
    user:       session?.user       ?? null,
    isLoggedIn: !!session?.token,

    // Acciones
    loginClinica,
    loginEmpleado,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook de acceso rápido al contexto de autenticación.
 * Lanza error si se usa fuera del AuthProvider.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}

export default AuthContext;
