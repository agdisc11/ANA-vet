const asyncHandler = require('../middleware/asyncHandler');

/**
 * Controlador de recibos (capa HTTP, factory con DI).
 * Contratos de respuesta idénticos a la versión anterior.
 */
function crearRecibosController({ reciboService }) {
  return {
    // GET /api/recibos/:paciente_id — historial de recibos del paciente
    getByPaciente: asyncHandler(async (req, res) => {
      const recibos = await reciboService.listarPorPaciente(
        req.params.paciente_id,
        req.user.clinica_id
      );
      res.json(recibos);
    }),

    // GET /api/recibos/:id/detalle — recibo completo con items
    getDetalle: asyncHandler(async (req, res) => {
      const recibo = await reciboService.detalle(req.params.id, req.user.clinica_id);
      res.json(recibo);
    }),

    // POST /api/recibos — crea borrador con items (transaccional)
    create: asyncHandler(async (req, res) => {
      const { recibo_id, total, status } = await reciboService.crear(req.body, req.user.clinica_id);
      res.status(201).json({
        mensaje: 'Recibo creado exitosamente',
        recibo_id,
        total,
        status,
      });
    }),

    // PUT /api/recibos/:id — actualización parcial y/o reemplazo de items.
    // Al finalizar, descuenta del inventario los productos vendidos (POS).
    update: asyncHandler(async (req, res) => {
      const inventario = await reciboService.actualizar(req.params.id, req.body, req.user.clinica_id);
      res.json({
        mensaje: 'Recibo actualizado correctamente',
        ...(inventario ? { inventario } : {}),
      });
    }),

    // DELETE /api/recibos/:id — solo borradores
    remove: asyncHandler(async (req, res) => {
      await reciboService.eliminar(req.params.id, req.user.clinica_id);
      res.json({ mensaje: 'Recibo eliminado correctamente' });
    }),
  };
}

module.exports = { crearRecibosController };
