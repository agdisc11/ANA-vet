import API from '../api';

/**
 * Servicios de lectura: dashboard, estadísticas, catálogos de calculadora
 * y notificaciones. Único lugar con estas rutas del API.
 */

export const dashboardService = {
  resumenClinica: () => API.get('/dashboard/clinica').then((r) => r.data),
  resumenEmpleado: () => API.get('/dashboard/empleado').then((r) => r.data),
};

export const statsService = {
  obtener: () => API.get('/stats').then((r) => r.data),
};

export const calculadoraService = {
  medicamentos: () => API.get('/calculadora/medicamentos').then((r) => r.data),
  toxicologia: () => API.get('/calculadora/toxicologia').then((r) => r.data),
};

export const notificacionesService = {
  listar: () => API.get('/notificaciones').then((r) => r.data),
};
