const asyncHandler = require('../middleware/asyncHandler');

/** Controlador de roles (capa HTTP, factory con DI). */
function crearRolesController({ rolService }) {
  return {
    // GET /api/roles
    getAll: asyncHandler(async (req, res) => {
      res.json(await rolService.listar(req.user.clinica_id));
    }),

    // GET /api/roles/:id
    getById: asyncHandler(async (req, res) => {
      res.json(await rolService.obtener(req.params.id, req.user.clinica_id));
    }),

    // POST /api/roles
    create: asyncHandler(async (req, res) => {
      const rolId = await rolService.crear(req.body, req.user.clinica_id);
      res.status(201).json({ mensaje: 'Rol creado exitosamente', rol_id: rolId });
    }),

    // PUT /api/roles/:id
    update: asyncHandler(async (req, res) => {
      await rolService.actualizar(req.params.id, req.body, req.user.clinica_id);
      res.json({ mensaje: 'Rol actualizado correctamente' });
    }),

    // DELETE /api/roles/:id
    remove: asyncHandler(async (req, res) => {
      await rolService.eliminar(req.params.id, req.user.clinica_id);
      res.json({ mensaje: 'Rol eliminado correctamente' });
    }),
  };
}

module.exports = { crearRolesController };
