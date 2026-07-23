const asyncHandler = require('../middleware/asyncHandler');

/**
 * Controlador de inventario (capa HTTP, factory con DI).
 * Nota de contrato: este módulo usa la clave `message` (no `mensaje`)
 * en sus respuestas — así lo consume el frontend actual.
 */
function crearInventarioController({ inventarioService }) {
  return {
    // GET /api/inventario
    getAll: asyncHandler(async (req, res) => {
      res.json(await inventarioService.listarProductos(req.user.clinica_id));
    }),

    // POST /api/inventario
    create: asyncHandler(async (req, res) => {
      const id = await inventarioService.crearProducto(req.body, req.user.clinica_id);
      res.status(201).json({ id, message: 'Producto agregado al inventario' });
    }),

    // PUT /api/inventario/:id
    update: asyncHandler(async (req, res) => {
      await inventarioService.actualizarProducto(req.params.id, req.body, req.user.clinica_id);
      res.json({ message: 'Producto actualizado' });
    }),

    // POST /api/inventario/reabastecer
    solicitar: asyncHandler(async (req, res) => {
      const id = await inventarioService.solicitarReabastecimiento(
        req.body,
        req.user.clinica_id,
        req.user.id
      );
      res.status(201).json({ id, message: 'Solicitud de reabastecimiento creada' });
    }),

    // GET /api/inventario/solicitudes
    getSolicitudes: asyncHandler(async (req, res) => {
      res.json(await inventarioService.listarSolicitudes(req.user.clinica_id));
    }),

    // PUT /api/inventario/solicitudes/:id
    updateSolicitud: asyncHandler(async (req, res) => {
      const resultado = await inventarioService.actualizarSolicitud(
        req.params.id,
        req.body.status,
        req.user.clinica_id
      );
      res.json(resultado);
    }),
  };
}

module.exports = { crearInventarioController };
