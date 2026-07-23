const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { completarTareaSchema } = require('../validators/tratamientoSchema');

/**
 * Acciones sobre tareas sueltas de la hoja de tratamiento.
 * (La hoja por hospitalización vive en /api/hospitalizaciones/:id/tratamiento.)
 */
function crearRouterTratamiento({ tratamientoController }) {
  const router = express.Router();
  router.use(authMiddleware);
  router.put('/tareas/:tareaId/completar', validate(completarTareaSchema), tratamientoController.completar);
  router.delete('/tareas/:tareaId', tratamientoController.eliminar);
  return router;
}

const { tratamientoController } = require('../container');
const router = crearRouterTratamiento({ tratamientoController });
router.crearRouterTratamiento = crearRouterTratamiento;

module.exports = router;
