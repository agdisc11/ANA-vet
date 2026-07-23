import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tutoresService } from '../services/tutoresService';
import { queryKeys } from './queryKeys';

/** Lista de tutores (compartida por Pacientes, Tutores, selectores…). */
export function useTutores() {
  return useQuery({
    queryKey: queryKeys.tutores.all(),
    queryFn: tutoresService.listar,
  });
}

function useTutorMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.tutores.all() }),
  });
}

export function useCrearTutor() {
  return useTutorMutation(tutoresService.crear);
}

export function useDarDeBajaTutor() {
  return useTutorMutation((id) => tutoresService.darDeBaja(id));
}

export function useVetarTutor() {
  return useTutorMutation((id) => tutoresService.vetar(id));
}
