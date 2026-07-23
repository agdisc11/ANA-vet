import API from '../api';

/**
 * Carnet de vacunación (Fase 3.5).
 * `consultarPublico` es la única llamada del frontend que no requiere
 * sesión: el token de la URL hace de credencial.
 */
export const carnetService = {
  obtenerEnlace: (pacienteId) => API.get(`/pacientes/${pacienteId}/carnet`).then((r) => r.data),
  regenerar: (pacienteId) => API.post(`/pacientes/${pacienteId}/carnet/regenerar`).then((r) => r.data),
  consultarPublico: (token) => API.get(`/publico/carnet/${token}`).then((r) => r.data),
};

/** URL compartible del carnet (la que va en el QR y en WhatsApp). */
export function urlCarnet(token) {
  return `${window.location.origin}/carnet/${token}`;
}
