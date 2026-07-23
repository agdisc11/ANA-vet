const asyncHandler = require('../middleware/asyncHandler');

/** Controlador de búsqueda global (capa HTTP, factory con DI). */
function crearBuscarController({ busquedaService }) {
  return {
    // GET /api/buscar?q=&limite=
    buscar: asyncHandler(async (req, res) => {
      const { q, limite } = req.queryValidada ?? {};
      const resultado = await busquedaService.buscar(req.user.clinica_id, { q, limite });
      res.json(resultado);
    }),
  };
}

module.exports = { crearBuscarController };
