import API from '../api';

/** Capa de servicio de recibos. */
export const recibosService = {
  listarPorPaciente: (pacienteId) => API.get(`/recibos/${pacienteId}`).then((r) => r.data),
  detalle: (id) => API.get(`/recibos/${id}/detalle`).then((r) => r.data),
  crear: (payload) => API.post('/recibos', payload).then((r) => r.data),
  actualizar: (id, payload) => API.put(`/recibos/${id}`, payload).then((r) => r.data),
};
