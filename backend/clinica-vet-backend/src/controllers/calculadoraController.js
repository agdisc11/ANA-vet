const asyncHandler = require('../middleware/asyncHandler');

/** Controlador de catálogos de las calculadoras clínicas (factory con DI). */
function crearCalculadoraController({ catalogoClinicoRepository }) {
  return {
    // GET /api/calculadora/medicamentos
    medicamentos: asyncHandler(async (req, res) => {
      res.json(await catalogoClinicoRepository.medicamentos());
    }),

    // GET /api/calculadora/toxicologia
    toxicologia: asyncHandler(async (req, res) => {
      res.json(await catalogoClinicoRepository.toxicologia());
    }),
  };
}

module.exports = { crearCalculadoraController };
