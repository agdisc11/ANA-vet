import API from '../api';

/**
 * Capa de servicio de la búsqueda global (Fase 4.1).
 * Único lugar del frontend que conoce la ruta de /buscar.
 */
export const busquedaService = {
  /**
   * @param {string} q       término (el backend exige 2+ caracteres)
   * @param {number} [limite] resultados por tipo
   * @returns {Promise<{ q: string, total: number, resultados: object[] }>}
   */
  buscar: (q, limite) => API.get('/buscar', { params: { q, limite } }).then((r) => r.data),
};
