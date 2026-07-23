import API from '../api';

/**
 * Servicios de los dominios clínicos. Único lugar del frontend que conoce
 * las rutas de consultas, cirugías, hospitalizaciones y vacunas.
 */

export const consultasService = {
  listarTodas: () => API.get('/consultas/all').then((r) => r.data),
  listarPorExpediente: (expedienteId) => API.get(`/consultas/${expedienteId}`).then((r) => r.data),
  crear: (payload) => API.post('/consultas', payload).then((r) => r.data),
};

export const cirugiasService = {
  listarTodas: () => API.get('/cirugias/all').then((r) => r.data),
  listarPorExpediente: (expedienteId) => API.get(`/cirugias/${expedienteId}`).then((r) => r.data),
  crear: (payload) => API.post('/cirugias', payload).then((r) => r.data),
  crearAnestesia: (payload) => API.post('/anestesia', payload).then((r) => r.data),
};

export const hospitalizacionesService = {
  listarTodas: () => API.get('/hospitalizaciones/all').then((r) => r.data),
  listarPorExpediente: (expedienteId) => API.get(`/hospitalizaciones/${expedienteId}`).then((r) => r.data),
  crear: (payload) => API.post('/hospitalizaciones', payload).then((r) => r.data),
};

export const vacunasService = {
  listarTodas: () => API.get('/vacunas/all').then((r) => r.data),
  listarPorPaciente: (pacienteId) => API.get(`/vacunas/${pacienteId}`).then((r) => r.data),
  crear: (payload) => API.post('/vacunas', payload).then((r) => r.data),
};

export const expedientesService = {
  listarPorPaciente: (pacienteId) => API.get(`/expedientes/${pacienteId}`).then((r) => r.data),
  crear: (payload) => API.post('/expedientes', payload).then((r) => r.data),
};
