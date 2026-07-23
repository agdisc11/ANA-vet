import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tratamientoService } from '../services/tratamientoService';

const CLAVE = ['tratamiento'];

/** Internados con el avance de su hoja (tablero de enfermería). */
export function useInternados(fecha) {
  return useQuery({
    queryKey: [...CLAVE, 'internados', fecha ?? null],
    queryFn: () => tratamientoService.internados(fecha),
    refetchInterval: 60_000,
  });
}

/** Hoja de tratamiento de una hospitalización. */
export function useHojaTratamiento(hospitalizacionId, fecha) {
  return useQuery({
    queryKey: [...CLAVE, 'hoja', String(hospitalizacionId), fecha ?? null],
    queryFn: () => tratamientoService.hoja(hospitalizacionId, fecha),
    enabled: !!hospitalizacionId,
    refetchInterval: 60_000, // turnos que comparten la tablet
  });
}

function useTratamientoMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useCompletarTarea() {
  return useTratamientoMutation(({ tareaId, completada }) =>
    tratamientoService.completar(tareaId, completada)
  );
}

export function useCrearTarea() {
  return useTratamientoMutation(({ hospitalizacionId, payload }) =>
    tratamientoService.crearTarea(hospitalizacionId, payload)
  );
}

export function useCrearPauta() {
  return useTratamientoMutation(({ hospitalizacionId, payload }) =>
    tratamientoService.crearPauta(hospitalizacionId, payload)
  );
}

export function useEliminarTarea() {
  return useTratamientoMutation((tareaId) => tratamientoService.eliminar(tareaId));
}
