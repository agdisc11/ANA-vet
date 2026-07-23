const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate, validateQuery } = require('../middleware/validate');
const {
  crearCitaSchema,
  actualizarCitaSchema,
  cambiarEstadoSchema,
  listarCitasQuerySchema,
} = require('../validators/citaSchema');

/**
 * Router de la Agenda de citas.
 * Declarativo: autenticación → validación (Zod) → controlador.
 */
function crearRouterCitas({ citasController }) {
  const router = express.Router();

  router.use(authMiddleware);

  router.get('/', validateQuery(listarCitasQuerySchema), citasController.getAll);
  // Debe declararse antes de '/:id' para que 'veterinarios' no se interprete como id
  router.get('/veterinarios', citasController.getVeterinarios);
  router.get('/:id', citasController.getById);
  router.post('/', validate(crearCitaSchema), citasController.create);
  router.put('/:id/estado', validate(cambiarEstadoSchema), citasController.cambiarEstado);
  router.put('/:id', validate(actualizarCitaSchema), citasController.update);
  router.delete('/:id', citasController.remove);

  return router;
}

const { citasController } = require('../container');
const router = crearRouterCitas({ citasController });
router.crearRouterCitas = crearRouterCitas;

module.exports = router;
