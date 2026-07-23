import API from '../api';

/**
 * Capa de servicio de pacientes: ÚNICO lugar del frontend que conoce
 * las rutas y formas de la API de pacientes. Los componentes y hooks
 * dependen de estas funciones, no de axios directamente (DIP en el front).
 */
export const pacientesService = {
  listar: () => API.get('/pacientes').then((r) => r.data),

  obtener: (id) => API.get(`/pacientes/${id}`).then((r) => r.data),

  crear: (payload) => API.post('/pacientes', payload).then((r) => r.data),

  actualizar: (id, payload) => API.put(`/pacientes/${id}`, payload).then((r) => r.data),

  reasignarTutor: (id, nuevoTutorId) =>
    API.put(`/pacientes/${id}/reasignar`, { nuevo_tutor_id: nuevoTutorId }).then((r) => r.data),

  eliminar: (id) => API.delete(`/pacientes/${id}`).then((r) => r.data),
};
