const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { crearServicioSchema, actualizarServicioSchema } = require('../validators/adminSchema');

function crearRouterServiciosCatalogo({ serviciosCatalogoController }) {
  const router = express.Router();
  router.use(authMiddleware);
  router.get('/', serviciosCatalogoController.getAll);
  router.post('/', validate(crearServicioSchema), serviciosCatalogoController.create);
  router.put('/:id', validate(actualizarServicioSchema), serviciosCatalogoController.update);
  return router;
}

const { serviciosCatalogoController } = require('../container');
const router = crearRouterServiciosCatalogo({ serviciosCatalogoController });
router.crearRouterServiciosCatalogo = crearRouterServiciosCatalogo;

module.exports = router;
