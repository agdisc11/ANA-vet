const asyncHandler = require('../middleware/asyncHandler');

/**
 * Controlador de tutores (capa HTTP, factory con DI).
 * Conserva los contratos de respuesta del frontend actual.
 */
function crearTutoresController({ tutorService }) {
  return {
    // GET /api/tutores
    getAll: asyncHandler(async (req, res) => {
      const tutores = await tutorService.listar(req.user.clinica_id);
      res.json(tutores);
    }),

    // POST /api/tutores
    create: asyncHandler(async (req, res) => {
      const { id, codigo } = await tutorService.crear(req.body, req.user.clinica_id);
      res.status(201).json({ id, codigo, mensaje: 'Tutor creado' });
    }),

    // PUT /api/tutores/:id
    update: asyncHandler(async (req, res) => {
      await tutorService.actualizar(req.params.id, req.body, req.user.clinica_id);
      res.json({ mensaje: 'Tutor actualizado' });
    }),

    // DELETE /api/tutores/:id — baja lógica (estatus 'inactivo')
    remove: asyncHandler(async (req, res) => {
      await tutorService.darDeBaja(req.params.id, req.user.clinica_id);
      res.json({ mensaje: 'Tutor dado de baja correctamente.' });
    }),

    // PUT /api/tutores/:id/vetar
    vetar: asyncHandler(async (req, res) => {
      await tutorService.vetar(req.params.id, req.user.clinica_id);
      res.json({ mensaje: 'Tutor vetado correctamente.' });
    }),
  };
}

module.exports = { crearTutoresController };
