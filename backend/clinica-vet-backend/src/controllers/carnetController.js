const asyncHandler = require('../middleware/asyncHandler');

/**
 * Controlador del carnet de vacunación (Fase 3.5).
 * `publico` es el único handler sin autenticación del sistema:
 * el token opaco de la URL hace de credencial.
 */
function crearCarnetController({ carnetService }) {
  return {
    // GET /api/pacientes/:id/carnet — enlace compartible (requiere sesión)
    obtenerEnlace: asyncHandler(async (req, res) => {
      const { token, nuevo } = await carnetService.obtenerOCrearToken(
        req.params.id,
        req.user.clinica_id
      );
      res.json({ token, nuevo });
    }),

    // POST /api/pacientes/:id/carnet/regenerar — revoca el enlace anterior
    regenerar: asyncHandler(async (req, res) => {
      const { token } = await carnetService.regenerarToken(req.params.id, req.user.clinica_id);
      res.json({ token, mensaje: 'Enlace anterior revocado' });
    }),

    // GET /api/publico/carnet/:token — PÚBLICO, solo lectura
    publico: asyncHandler(async (req, res) => {
      const carnet = await carnetService.carnetPorToken(req.params.token);
      res.json(carnet);
    }),
  };
}

module.exports = { crearCarnetController };
