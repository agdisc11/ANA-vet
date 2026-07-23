const express = require('express');
const { authMiddleware, clinicaOVeterinario } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { crearTutorSchema, actualizarTutorSchema } = require('../validators/tutorSchema');

/**
 * Router de tutores.
 * Baja y veto requieren permiso clínico (Administrador o Veterinario),
 * igual que en la versión anterior.
 */
function crearRouterTutores({ tutoresController }) {
  const router = express.Router();

  router.use(authMiddleware);

  router.get('/', tutoresController.getAll);
  router.post('/', validate(crearTutorSchema), tutoresController.create);
  router.put('/:id/vetar', clinicaOVeterinario, tutoresController.vetar);
  router.put('/:id', validate(actualizarTutorSchema), tutoresController.update);
  router.delete('/:id', clinicaOVeterinario, tutoresController.remove);

  return router;
}

const { tutoresController } = require('../container');
const router = crearRouterTutores({ tutoresController });
router.crearRouterTutores = crearRouterTutores;

module.exports = router;
