import API from '../api';

/** Hoja de tratamiento hospitalario (Fase 3.6). */
export const tratamientoService = {
  internados: (fecha) => API.get('/hospitalizaciones/internados', { params: fecha ? { fecha } : {} }).then((r) => r.data),
  hoja: (hospitalizacionId, fecha) =>
    API.get(`/hospitalizaciones/${hospitalizacionId}/tratamiento`, { params: fecha ? { fecha } : {} }).then((r) => r.data),
  crearTarea: (hospitalizacionId, payload) =>
    API.post(`/hospitalizaciones/${hospitalizacionId}/tratamiento`, payload).then((r) => r.data),
  crearPauta: (hospitalizacionId, payload) =>
    API.post(`/hospitalizaciones/${hospitalizacionId}/tratamiento/pauta`, payload).then((r) => r.data),
  completar: (tareaId, completada) =>
    API.put(`/tratamiento/tareas/${tareaId}/completar`, { completada }).then((r) => r.data),
  eliminar: (tareaId) => API.delete(`/tratamiento/tareas/${tareaId}`).then((r) => r.data),
};
