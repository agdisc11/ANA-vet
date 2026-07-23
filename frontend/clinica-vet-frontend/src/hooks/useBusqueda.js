import { useQuery } from '@tanstack/react-query';
import { busquedaService } from '../services/busquedaService';
import { queryKeys } from './queryKeys';

/** Espejo de Busqueda.LONGITUD_MINIMA del backend: por debajo no se consulta. */
export const LONGITUD_MINIMA = 2;

/**
 * Búsqueda global de pacientes y tutores.
 *
 * El término debe llegar YA diferido (useDebounce): la clave de caché
 * es el término, así que volver a escribir algo buscado hace un instante
 * se resuelve desde la caché sin tocar la red.
 *
 * @param {string} termino
 * @param {{ enabled?: boolean }} opciones
 */
export function useBusqueda(termino, { enabled = true } = {}) {
  const q = (termino ?? '').trim();

  return useQuery({
    queryKey: queryKeys.busqueda.termino(q),
    queryFn: () => busquedaService.buscar(q),
    enabled: enabled && q.length >= LONGITUD_MINIMA,
    // Mantiene en pantalla los resultados anteriores mientras llegan los
    // nuevos: sin esto la lista parpadea a vacío entre pulsación y pulsación.
    placeholderData: (previos) => previos,
  });
}
