const asyncHandler = require('../middleware/asyncHandler');

/** Controlador del catálogo de servicios (capa HTTP, factory con DI). */
function crearServiciosCatalogoController({ servicioCatalogoService }) {
  return {
    // GET /api/servicios-catalogo  (?todos=1 incluye inactivos)
    getAll: asyncHandler(async (req, res) => {
      const servicios = await servicioCatalogoService.listar(req.user.clinica_id, {
        incluirInactivos: req.query.todos === '1',
      });
      res.json(servicios);
    }),

    // POST /api/servicios-catalogo
    create: asyncHandler(async (req, res) => {
      const servicioId = await servicioCatalogoService.crear(req.body, req.user.clinica_id);
      res.status(201).json({ mensaje: 'Servicio creado exitosamente', servicio_id: servicioId });
    }),

    // PUT /api/servicios-catalogo/:id
    update: asyncHandler(async (req, res) => {
      await servicioCatalogoService.actualizar(req.params.id, req.body, req.user.clinica_id);
      res.json({ mensaje: 'Servicio actualizado correctamente' });
    }),
  };
}

module.exports = { crearServiciosCatalogoController };
