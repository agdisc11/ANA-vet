import { QueryClient } from '@tanstack/react-query';

/**
 * Cliente de TanStack Query compartido por toda la app.
 *
 * Defaults pensados para un panel de gestión:
 *  - staleTime 30s: evita refetch en cada montaje/navegación (la app se
 *    siente instantánea al volver a una lista ya cargada).
 *  - retry 1: un reintento ante fallos de red transitorios, sin insistir
 *    en errores reales (401/404/400 no se reintentan, ver más abajo).
 *  - refetchOnWindowFocus: revalida al volver a la pestaña (datos frescos
 *    tras dejar la clínica abierta un rato).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: (failCount, error) => {
        const status = error?.response?.status;
        // No reintentar errores del cliente (auth, validación, no encontrado)
        if (status && status >= 400 && status < 500) return false;
        return failCount < 1;
      },
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Mensaje de error legible desde un error de axios (contrato { error } del backend). */
export function mensajeError(error, fallback = 'Ocurrió un error') {
  return error?.response?.data?.error || error?.message || fallback;
}
