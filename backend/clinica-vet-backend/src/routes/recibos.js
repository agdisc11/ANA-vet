const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { crearReciboSchema, actualizarReciboSchema } = require('../validators/reciboSchema');

/**
 * Router de recibos.
 * Nota de rutas: '/:id/detalle' tiene dos segmentos, por lo que no
 * colisiona con '/:paciente_id' (un segmento).
 */
function crearRouterRecibos({ recibosController }) {
  const router = express.Router();

  router.use(authMiddleware);

  router.get('/:id/detalle', recibosController.getDetalle);
  router.get('/:paciente_id', recibosController.getByPaciente);
  router.post('/', validate(crearReciboSchema), recibosController.create);
  router.put('/:id', validate(actualizarReciboSchema), recibosController.update);
  router.delete('/:id', recibosController.remove);

  return router;
}

const { recibosController } = require('../container');
const router = crearRouterRecibos({ recibosController });
router.crearRouterRecibos = crearRouterRecibos;

module.exports = router;
