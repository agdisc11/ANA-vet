import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  empleadosService, rolesService, inventarioService, serviciosCatalogoService,
} from '../services/adminService';
import { queryKeys } from './queryKeys';

/** Hooks de los dominios administrativos (TanStack Query). */

// ── Empleados ────────────────────────────────────────────────
export function useEmpleados() {
  return useQuery({ queryKey: queryKeys.empleados.all(), queryFn: empleadosService.listar });
}
function useEmpleadoMutation(mutationFn) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.empleados.all() }),
  });
}
export function useCrearEmpleado() {
  return useEmpleadoMutation(empleadosService.crear);
}
export function useActualizarEmpleado() {
  return useEmpleadoMutation(({ id, payload }) => empleadosService.actualizar(id, payload));
}
export function useEliminarEmpleado() {
  return useEmpleadoMutation((id) => empleadosService.eliminar(id));
}

// ── Roles ────────────────────────────────────────────────────
export function useRoles() {
  return useQuery({ queryKey: queryKeys.roles.all(), queryFn: rolesService.listar });
}

// ── Inventario ───────────────────────────────────────────────
export function useProductos() {
  return useQuery({ queryKey: queryKeys.inventario.productos(), queryFn: inventarioService.listarProductos });
}
export function useSolicitudesReabastecimiento(enabled = true) {
  return useQuery({
    queryKey: queryKeys.inventario.solicitudes(),
    queryFn: inventarioService.listarSolicitudes,
    enabled,
  });
}
export function useCrearProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inventarioService.crear,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.inventario.productos() }),
  });
}
export function useActualizarProducto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => inventarioService.actualizar(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.inventario.productos() }),
  });
}
export function useReabastecer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: inventarioService.reabastecer,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.inventario.solicitudes() }),
  });
}
export function useActualizarSolicitud() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => inventarioService.actualizarSolicitud(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.inventario.solicitudes() });
      // 'completado' suma stock → refrescar productos
      qc.invalidateQueries({ queryKey: queryKeys.inventario.productos() });
    },
  });
}

// ── Catálogo de servicios ────────────────────────────────────
export function useServiciosCatalogo({ incluirInactivos = false } = {}) {
  return useQuery({
    queryKey: queryKeys.serviciosCatalogo.all(incluirInactivos),
    queryFn: () => serviciosCatalogoService.listar({ incluirInactivos }),
  });
}
