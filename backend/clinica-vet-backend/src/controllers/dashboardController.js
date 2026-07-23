const asyncHandler = require('../middleware/asyncHandler');

/** Controlador del dashboard (capa HTTP, factory con DI). */
function crearDashboardController({ dashboardService, statsRepository }) {
  return {
    // GET /api/dashboard/clinica
    resumenClinica: asyncHandler(async (req, res) => {
      res.json(await dashboardService.resumenClinica(req.user.clinica_id));
    }),

    // GET /api/dashboard/empleado
    resumenEmpleado: asyncHandler(async (req, res) => {
      res.json(await dashboardService.resumenEmpleado(req.user.id, req.user.clinica_id));
    }),

    // GET /api/stats — conteos generales de la clínica autenticada
    stats: asyncHandler(async (req, res) => {
      res.json(await statsRepository.conteosPorClinica(req.user.clinica_id));
    }),
  };
}

module.exports = { crearDashboardController };
