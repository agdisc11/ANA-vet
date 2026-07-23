import API from '../api';

/** Capa de servicio de recordatorios (Fase 3.2). */
export const recordatoriosService = {
  listar: (params) => API.get('/recordatorios', { params }).then((r) => r.data),
  marcarEnviado: (payload) => API.post('/recordatorios/enviado', payload).then((r) => r.data),
  desmarcarEnviado: (tipo, referenciaId) =>
    API.delete(`/recordatorios/enviado/${tipo}/${referenciaId}`).then((r) => r.data),
};
