const asyncHandler = require('../middleware/asyncHandler');

/** Controlador de hospitalizaciones (capa HTTP, factory con DI). */
function crearHospitalizacionesController({ hospitalizacionService }) {
  return {
    // GET /api/hospitalizaciones/all
    getAll: asyncHandler(async (req, res) => {
      res.json(await hospitalizacionService.listarTodas(req.user.clinica_id));
    }),

    // GET /api/hospitalizaciones/:expediente_id
    getByExpediente: asyncHandler(async (req, res) => {
      res.json(
        await hospitalizacionService.listarPorExpediente(
          req.params.expediente_id,
          req.user.clinica_id
        )
      );
    }),

    // POST /api/hospitalizaciones
    create: asyncHandler(async (req, res) => {
      const id = await hospitalizacionService.registrar(req.body, req.user.clinica_id);
      res.json({ id, mensaje: 'Hospitalización registrada' });
    }),
  };
}

module.exports = { crearHospitalizacionesController };
