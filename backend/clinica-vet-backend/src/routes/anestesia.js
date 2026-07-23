const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { crearAnestesiaSchema } = require('../validators/clinicoSchema');

/**
 * Ruta de anestesia — delega en el controlador de cirugías
 * (la anestesia pertenece al agregado de cirugía).
 */
function crearRouterAnestesia({ cirugiasController }) {
  const router = express.Router();
  router.use(authMiddleware);
  router.post('/', validate(crearAnestesiaSchema), cirugiasController.registrarAnestesia);
  return router;
}

const { cirugiasController } = require('../container');
const router = crearRouterAnestesia({ cirugiasController });
router.crearRouterAnestesia = crearRouterAnestesia;

module.exports = router;
