const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { crearCirugiaSchema } = require('../validators/clinicoSchema');

function crearRouterCirugias({ cirugiasController }) {
  const router = express.Router();
  router.use(authMiddleware);
  // '/all' debe declararse antes de '/:expediente_id'
  router.get('/all', cirugiasController.getAll);
  router.get('/:expediente_id', cirugiasController.getByExpediente);
  router.post('/', validate(crearCirugiaSchema), cirugiasController.create);
  return router;
}

const { cirugiasController } = require('../container');
const router = crearRouterCirugias({ cirugiasController });
router.crearRouterCirugias = crearRouterCirugias;

module.exports = router;
