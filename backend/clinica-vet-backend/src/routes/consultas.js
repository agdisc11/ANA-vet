const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { crearConsultaSchema } = require('../validators/clinicoSchema');

function crearRouterConsultas({ consultasController }) {
  const router = express.Router();
  router.use(authMiddleware);
  // '/all' debe declararse antes de '/:expediente_id'
  router.get('/all', consultasController.getAll);
  router.get('/:expediente_id', consultasController.getByExpediente);
  router.post('/', validate(crearConsultaSchema), consultasController.create);
  return router;
}

const { consultasController } = require('../container');
const router = crearRouterConsultas({ consultasController });
router.crearRouterConsultas = crearRouterConsultas;

module.exports = router;
