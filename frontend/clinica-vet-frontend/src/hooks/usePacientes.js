import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pacientesService } from '../services/pacientesService';
import { queryKeys } from './queryKeys';

/**
 * Hooks de datos de pacientes (TanStack Query).
 *
 * Ventajas sobre el patrón anterior (useState + useEffect + función
 * `cargar` en cada página):
 *   - Caché compartida: entrar dos veces a Pacientes no vuelve a pedir
 *     todo; se revalida en segundo plano (la UI se siente instantánea).
 *   - Invalidación declarativa: tras crear/editar/reasignar, la lista se
 *     refresca sola — no hay que acordarse de llamar `cargar()`.
 *   - Estados isLoading/isError/isPending listos, sin cablearlos a mano.
 */

export function usePacientes() {
  return useQuery({
    queryKey: queryKeys.pacientes.all(),
    queryFn: pacientesService.listar,
  });
}

export function usePaciente(id) {
  return useQuery({
    queryKey: queryKeys.pacientes.detail(id),
    queryFn: () => pacientesService.obtener(id),
    enabled: !!id,
  });
}

export function useCrearPaciente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: pacientesService.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pacientes.all() }),
  });
}

export function useActualizarPaciente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => pacientesService.actualizar(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.pacientes.all() });
      qc.invalidateQueries({ queryKey: queryKeys.pacientes.detail(id) });
    },
  });
}

export function useReasignarTutor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, nuevoTutorId }) => pacientesService.reasignarTutor(id, nuevoTutorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.pacientes.all() }),
  });
}
