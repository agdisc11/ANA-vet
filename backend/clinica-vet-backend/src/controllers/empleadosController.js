const asyncHandler = require('../middleware/asyncHandler');

/**
 * Controlador de empleados (capa HTTP, factory con DI).
 */
function crearEmpleadosController({ empleadoService }) {
  return {
    // POST /api/empleados/login
    login: asyncHandler(async (req, res) => {
      const sesion = await empleadoService.login(req.body);
      res.json(sesion);
    }),

    // GET /api/empleados — cualquier usuario autenticado de la clínica
    getAll: asyncHandler(async (req, res) => {
      const empleados = await empleadoService.listar(req.user.clinica_id);
      res.json(empleados);
    }),

    // GET /api/empleados/:id
    getById: asyncHandler(async (req, res) => {
      const empleado = await empleadoService.obtener(req.params.id, req.user.clinica_id);
      res.json(empleado);
    }),

    // POST /api/empleados
    create: asyncHandler(async (req, res) => {
      const resultado = await empleadoService.crear(req.body, req.user.clinica_id);
      res.status(201).json({
        mensaje: 'Empleado registrado exitosamente',
        ...resultado,
      });
    }),

    // PUT /api/empleados/:id
    update: asyncHandler(async (req, res) => {
      await empleadoService.actualizar(req.params.id, req.body, req.user.clinica_id);
      res.json({ mensaje: 'Empleado actualizado correctamente' });
    }),

    // PUT /api/empleados/:id/cambiar-password
    cambiarPassword: asyncHandler(async (req, res) => {
      await empleadoService.cambiarPassword(
        req.params.id,
        req.user.clinica_id,
        req.body.password_nueva
      );
      res.json({ mensaje: 'Contraseña del empleado actualizada' });
    }),

    // DELETE /api/empleados/:id
    remove: asyncHandler(async (req, res) => {
      await empleadoService.eliminar(req.params.id, req.user.clinica_id);
      res.json({ mensaje: 'Empleado eliminado correctamente' });
    }),
  };
}

module.exports = { crearEmpleadosController };
