import API from '../api';

/**
 * Servicio de autenticación: las llamadas HTTP de login/registro.
 * La gestión del token de axios y de localStorage vive en AuthContext
 * (es infraestructura de sesión, no acceso a datos).
 */
export const authService = {
  loginClinica: (email, password) => API.post('/clinicas/login', { email, password }).then((r) => r.data),
  loginEmpleado: (email, password) => API.post('/empleados/login', { email, password }).then((r) => r.data),
  registrarClinica: (payload) => API.post('/clinicas/registro', payload).then((r) => r.data),
};
