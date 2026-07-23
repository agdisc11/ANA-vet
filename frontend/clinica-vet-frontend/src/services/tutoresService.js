import API from '../api';

/** Capa de servicio de tutores: único lugar con las rutas del API de tutores. */
export const tutoresService = {
  listar: () => API.get('/tutores').then((r) => r.data),
  crear: (payload) => API.post('/tutores', payload).then((r) => r.data),
  actualizar: (id, payload) => API.put(`/tutores/${id}`, payload).then((r) => r.data),
  darDeBaja: (id) => API.delete(`/tutores/${id}`).then((r) => r.data),
  vetar: (id) => API.put(`/tutores/${id}/vetar`).then((r) => r.data),
};
