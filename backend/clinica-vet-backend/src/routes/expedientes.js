const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { crearExpedienteSchema } = require('../validators/clinicoSchema');

function crearRouterExpedientes({ expedientesController }) {
  const router = express.Router();
  router.use(authMiddleware);
  router.get('/:paciente_id', expedientesController.getByPaciente);
  router.post('/', validate(crearExpedienteSchema), expedientesController.create);
  return router;
}

const { expedientesController } = require('../container');
const router = crearRouterExpedientes({ expedientesController });
router.crearRouterExpedientes = crearRouterExpedientes;

module.exports = router;
