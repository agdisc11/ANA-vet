const asyncHandler = require('../middleware/asyncHandler');

/** Controlador de expedientes (capa HTTP, factory con DI). */
function crearExpedientesController({ expedienteService }) {
  return {
    // GET /api/expedientes/:paciente_id
    getByPaciente: asyncHandler(async (req, res) => {
      const expedientes = await expedienteService.listarPorPaciente(
        req.params.paciente_id,
        req.user.clinica_id
      );
      res.json(expedientes);
    }),

    // POST /api/expedientes
    create: asyncHandler(async (req, res) => {
      const id = await expedienteService.abrir(req.body.paciente_id, req.user.clinica_id);
      res.json({ id, mensaje: 'Expediente creado' });
    }),
  };
}

module.exports = { crearExpedientesController };
