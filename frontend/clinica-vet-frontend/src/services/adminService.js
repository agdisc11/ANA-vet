import API from '../api';

/**
 * Servicios administrativos: empleados, roles, inventario y catálogo de
 * servicios. Único lugar con estas rutas del API.
 */

export const empleadosService = {
  listar: () => API.get('/empleados').then((r) => r.data),
  crear: (payload) => API.post('/empleados', payload).then((r) => r.data),
  actualizar: (id, payload) => API.put(`/empleados/${id}`, payload).then((r) => r.data),
  eliminar: (id) => API.delete(`/empleados/${id}`).then((r) => r.data),
  cambiarPassword: (id, password_nueva) =>
    API.put(`/empleados/${id}/cambiar-password`, { password_nueva }).then((r) => r.data),
};

export const rolesService = {
  listar: () => API.get('/roles').then((r) => r.data),
};

export const inventarioService = {
  listarProductos: () => API.get('/inventario').then((r) => r.data),
  listarSolicitudes: () => API.get('/inventario/solicitudes').then((r) => r.data),
  crear: (payload) => API.post('/inventario', payload).then((r) => r.data),
  actualizar: (id, payload) => API.put(`/inventario/${id}`, payload).then((r) => r.data),
  reabastecer: (payload) => API.post('/inventario/reabastecer', payload).then((r) => r.data),
  actualizarSolicitud: (id, status) =>
    API.put(`/inventario/solicitudes/${id}`, { status }).then((r) => r.data),
};

export const serviciosCatalogoService = {
  listar: ({ incluirInactivos = false } = {}) =>
    API.get(`/servicios-catalogo${incluirInactivos ? '?todos=1' : ''}`).then((r) => r.data),
  crear: (payload) => API.post('/servicios-catalogo', payload).then((r) => r.data),
  actualizar: (id, payload) => API.put(`/servicios-catalogo/${id}`, payload).then((r) => r.data),
};
