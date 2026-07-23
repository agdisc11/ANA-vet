const asyncHandler = require('../middleware/asyncHandler');

/** Controlador de consultas (capa HTTP, factory con DI). */
function crearConsultasController({ consultaService }) {
  return {
    // GET /api/consultas/all
    getAll: asyncHandler(async (req, res) => {
      res.json(await consultaService.listarTodas(req.user.clinica_id));
    }),

    // GET /api/consultas/:expediente_id
    getByExpediente: asyncHandler(async (req, res) => {
      res.json(
        await consultaService.listarPorExpediente(req.params.expediente_id, req.user.clinica_id)
      );
    }),

    // POST /api/consultas
    create: asyncHandler(async (req, res) => {
      const id = await consultaService.registrar(req.body, req.user.clinica_id);
      res.json({ id, mensaje: 'Consulta registrada' });
    }),
  };
}

module.exports = { crearConsultasController };
