const asyncHandler = require('../middleware/asyncHandler');

/** Controlador de vacunas (capa HTTP, factory con DI). */
function crearVacunasController({ vacunaService }) {
  return {
    // GET /api/vacunas/all
    getAll: asyncHandler(async (req, res) => {
      res.json(await vacunaService.listarTodas(req.user.clinica_id));
    }),

    // GET /api/vacunas/:paciente_id
    getByPaciente: asyncHandler(async (req, res) => {
      res.json(
        await vacunaService.listarPorPaciente(req.params.paciente_id, req.user.clinica_id)
      );
    }),

    // POST /api/vacunas
    create: asyncHandler(async (req, res) => {
      const id = await vacunaService.registrar(req.body, req.user.clinica_id);
      res.json({ id, mensaje: 'Vacuna registrada' });
    }),
  };
}

module.exports = { crearVacunasController };
