import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  consultasService, cirugiasService, hospitalizacionesService, vacunasService, expedientesService,
} from '../services/clinicoService';
import { queryKeys } from './queryKeys';

/**
 * Hooks de los dominios clínicos (TanStack Query).
 * Las mutaciones de creación invalidan tanto el listado global (…/all)
 * como el listado por expediente/paciente afectado.
 */

// ── Consultas ────────────────────────────────────────────────
export function useConsultas() {
  return useQuery({ queryKey: queryKeys.consultas.all(), queryFn: consultasService.listarTodas });
}
export function useConsultasPorExpediente(expedienteId) {
  return useQuery({
    queryKey: queryKeys.consultas.porExpediente(expedienteId),
    queryFn: () => consultasService.listarPorExpediente(expedienteId),
    enabled: !!expedienteId,
  });
}
export function useCrearConsulta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: consultasService.crear,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.consultas.all() });
      if (vars?.expediente_id) qc.invalidateQueries({ queryKey: queryKeys.consultas.porExpediente(vars.expediente_id) });
    },
  });
}

// ── Cirugías ─────────────────────────────────────────────────
export function useCirugias() {
  return useQuery({ queryKey: queryKeys.cirugias.all(), queryFn: cirugiasService.listarTodas });
}
export function useCirugiasPorExpediente(expedienteId) {
  return useQuery({
    queryKey: queryKeys.cirugias.porExpediente(expedienteId),
    queryFn: () => cirugiasService.listarPorExpediente(expedienteId),
    enabled: !!expedienteId,
  });
}
export function useCrearCirugia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cirugiasService.crear,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.cirugias.all() });
      if (vars?.expediente_id) qc.invalidateQueries({ queryKey: queryKeys.cirugias.porExpediente(vars.expediente_id) });
    },
  });
}
export function useCrearAnestesia() {
  return useMutation({ mutationFn: cirugiasService.crearAnestesia });
}

// ── Hospitalizaciones ────────────────────────────────────────
export function useHospitalizaciones() {
  return useQuery({ queryKey: queryKeys.hospitalizaciones.all(), queryFn: hospitalizacionesService.listarTodas });
}
export function useHospitalizacionesPorExpediente(expedienteId) {
  return useQuery({
    queryKey: queryKeys.hospitalizaciones.porExpediente(expedienteId),
    queryFn: () => hospitalizacionesService.listarPorExpediente(expedienteId),
    enabled: !!expedienteId,
  });
}
export function useCrearHospitalizacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: hospitalizacionesService.crear,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.hospitalizaciones.all() });
      if (vars?.expediente_id) qc.invalidateQueries({ queryKey: queryKeys.hospitalizaciones.porExpediente(vars.expediente_id) });
    },
  });
}

// ── Vacunas ──────────────────────────────────────────────────
export function useVacunas() {
  return useQuery({ queryKey: queryKeys.vacunas.all(), queryFn: vacunasService.listarTodas });
}
export function useVacunasPorPaciente(pacienteId) {
  return useQuery({
    queryKey: queryKeys.vacunas.porPaciente(pacienteId),
    queryFn: () => vacunasService.listarPorPaciente(pacienteId),
    enabled: !!pacienteId,
  });
}
export function useCrearVacuna() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vacunasService.crear,
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.vacunas.all() });
      if (vars?.paciente_id) qc.invalidateQueries({ queryKey: queryKeys.vacunas.porPaciente(vars.paciente_id) });
    },
  });
}

// ── Expedientes ──────────────────────────────────────────────
export function useExpedientes(pacienteId) {
  return useQuery({
    queryKey: queryKeys.expedientes.porPaciente(pacienteId),
    queryFn: () => expedientesService.listarPorPaciente(pacienteId),
    enabled: !!pacienteId,
  });
}
export function useCrearExpediente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: expedientesService.crear,
    onSuccess: (_d, vars) => {
      if (vars?.paciente_id) qc.invalidateQueries({ queryKey: queryKeys.expedientes.porPaciente(vars.paciente_id) });
    },
  });
}
