const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate, validateQuery } = require('../middleware/validate');
const {
  crearPacienteSchema,
  actualizarPacienteSchema,
  reasignarTutorSchema,
  listarPacientesQuerySchema,
} = require('../validators/pacienteSchema');

/**
 * Router de pacientes.
 * Declarativo: autenticación → validación (Zod) → controlador.
 * La factory permite inyectar un controlador con servicio fake en los tests.
 */
function crearRouterPacientes({ pacientesController, carnetController }) {
  const router = express.Router();

  router.use(authMiddleware);

  router.get('/', validateQuery(listarPacientesQuerySchema), pacientesController.getAll);
  // Carnet de vacunación compartible (rutas fijas antes de '/:id')
  if (carnetController) {
    router.get('/:id/carnet', carnetController.obtenerEnlace);
    router.post('/:id/carnet/regenerar', carnetController.regenerar);
  }
  router.get('/:id', pacientesController.getById);
  router.post('/', validate(crearPacienteSchema), pacientesController.create);
  router.put('/:id/reasignar', validate(reasignarTutorSchema), pacientesController.reasignar);
  router.put('/:id', validate(actualizarPacienteSchema), pacientesController.update);
  router.delete('/:id', pacientesController.remove);

  return router;
}

const { pacientesController, carnetController } = require('../container');
const router = crearRouterPacientes({ pacientesController, carnetController });
router.crearRouterPacientes = crearRouterPacientes;

module.exports = router;
