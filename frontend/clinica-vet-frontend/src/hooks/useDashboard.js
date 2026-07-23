import { useQuery } from '@tanstack/react-query';
import { dashboardService, statsService, calculadoraService, notificacionesService } from '../services/dashboardService';
import { queryKeys } from './queryKeys';

/** Hooks de lectura: dashboard, stats, calculadora y notificaciones. */

export function useDashboardClinica(enabled = true) {
  return useQuery({ queryKey: queryKeys.dashboard.clinica(), queryFn: dashboardService.resumenClinica, enabled });
}

export function useDashboardEmpleado(enabled = true) {
  return useQuery({ queryKey: queryKeys.dashboard.empleado(), queryFn: dashboardService.resumenEmpleado, enabled });
}

export function useStats() {
  return useQuery({ queryKey: queryKeys.stats.all(), queryFn: statsService.obtener });
}

export function useMedicamentos() {
  return useQuery({
    queryKey: queryKeys.calculadora.medicamentos(),
    queryFn: calculadoraService.medicamentos,
    staleTime: 60 * 60_000, // catálogo estable: 1 h
  });
}

export function useToxicologia() {
  return useQuery({
    queryKey: queryKeys.calculadora.toxicologia(),
    queryFn: calculadoraService.toxicologia,
    staleTime: 60 * 60_000,
  });
}

export function useNotificaciones() {
  return useQuery({
    queryKey: ['notificaciones'],
    queryFn: notificacionesService.listar,
    refetchInterval: 5 * 60_000, // recordatorios: refrescar cada 5 min
    staleTime: 60_000,
  });
}
