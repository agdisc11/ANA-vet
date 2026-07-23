const asyncHandler = require('../middleware/asyncHandler');

/**
 * Controlador de cirugías + anestesia (capa HTTP, factory con DI).
 * La ruta /api/anestesia usa el handler registrarAnestesia de aquí:
 * la anestesia pertenece al agregado de cirugía.
 */
function crearCirugiasController({ cirugiaService }) {
  return {
    // GET /api/cirugias/all
    getAll: asyncHandler(async (req, res) => {
      res.json(await cirugiaService.listarTodas(req.user.clinica_id));
    }),

    // GET /api/cirugias/:expediente_id
    getByExpediente: asyncHandler(async (req, res) => {
      res.json(
        await cirugiaService.listarPorExpediente(req.params.expediente_id, req.user.clinica_id)
      );
    }),

    // POST /api/cirugias
    create: asyncHandler(async (req, res) => {
      const id = await cirugiaService.registrar(req.body, req.user.clinica_id);
      res.json({ id, mensaje: 'Cirugía registrada' });
    }),

    // POST /api/anestesia
    registrarAnestesia: asyncHandler(async (req, res) => {
      const id = await cirugiaService.registrarAnestesia(req.body, req.user.clinica_id);
      res.json({ id, mensaje: 'Anestesia registrada' });
    }),
  };
}

module.exports = { crearCirugiasController };
