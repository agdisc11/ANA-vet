import axios from 'axios';

const API = axios.create({
  // Vite expone las variables de entorno como import.meta.env.VITE_*
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─────────────────────────────────────────────────────────────
// Manejo centralizado de sesión expirada (401).
// AuthProvider registra su handler de logout; el interceptor lo
// invoca cuando una petición autenticada es rechazada por token
// inválido/expirado. Se ignoran los 401 de los endpoints de login
// (credenciales incorrectas) y las peticiones sin sesión activa.
// ─────────────────────────────────────────────────────────────
let onUnauthorized = null;

export function registerUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

// Solo los endpoints de autenticación: un 401 aquí significa
// "credenciales incorrectas", no "sesión expirada".
const AUTH_ENDPOINTS = ['/clinicas/login', '/empleados/login'];

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const isAuthEndpoint = AUTH_ENDPOINTS.some((e) => url.includes(e));
    const hasSession = !!API.defaults.headers.common['Authorization'];

    if (status === 401 && hasSession && !isAuthEndpoint && typeof onUnauthorized === 'function') {
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default API;
