import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recordatoriosService } from '../services/recordatoriosService';

const CLAVE = ['recordatorios'];

export function useRecordatorios(params = {}) {
  return useQuery({
    queryKey: [...CLAVE, params],
    queryFn: () => recordatoriosService.listar(params),
  });
}

function useRecordatorioMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: CLAVE }),
  });
}

export function useMarcarEnviado() {
  return useRecordatorioMutation(recordatoriosService.marcarEnviado);
}

export function useDesmarcarEnviado() {
  return useRecordatorioMutation(({ tipo, referenciaId }) =>
    recordatoriosService.desmarcarEnviado(tipo, referenciaId)
  );
}
