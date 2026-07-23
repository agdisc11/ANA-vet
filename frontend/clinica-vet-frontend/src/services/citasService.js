import API from '../api';

/** Capa de servicio de la Agenda (citas). */
export const citasService = {
  listar: (params) => API.get('/citas', { params }).then((r) => r.data),
  veterinarios: () => API.get('/citas/veterinarios').then((r) => r.data),
  crear: (payload) => API.post('/citas', payload).then((r) => r.data),
  actualizar: (id, payload) => API.put(`/citas/${id}`, payload).then((r) => r.data),
  cambiarEstado: (id, estado) => API.put(`/citas/${id}/estado`, { estado }).then((r) => r.data),
  eliminar: (id) => API.delete(`/citas/${id}`).then((r) => r.data),
};
