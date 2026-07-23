import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { citasService } from '../services/citasService';

/**
 * Hooks de citas (Agenda y Flujo del día).
 * El flujo del día usa `refetchInterval` para comportarse como un
 * tablero vivo: si otro usuario mueve una cita, se refleja solo.
 */
const CLAVE = ['citas'];

export function useCitasPorRango({ desde, hasta, empleadoId = null }, opciones = {}) {
  return useQuery({
    queryKey: [...CLAVE, { desde, hasta, empleadoId }],
    queryFn: () => citasService.listar({ desde, hasta, ...(empleadoId ? { empleado_id: empleadoId } : {}) }),
    enabled: !!desde && !!hasta,
    ...opciones,
  });
}

export function useVeterinarios() {
  return useQuery({
    queryKey: ['citas', 'veterinarios'],
    queryFn: citasService.veterinarios,
    staleTime: 10 * 60_000,
  });
}

export function useCambiarEstadoCita() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }) => citasService.cambiarEstado(id, estado),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}
