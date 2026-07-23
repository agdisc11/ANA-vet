const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { crearVacunaSchema } = require('../validators/clinicoSchema');

function crearRouterVacunas({ vacunasController }) {
  const router = express.Router();
  router.use(authMiddleware);
  // '/all' debe declararse antes de '/:paciente_id'
  router.get('/all', vacunasController.getAll);
  router.get('/:paciente_id', vacunasController.getByPaciente);
  router.post('/', validate(crearVacunaSchema), vacunasController.create);
  return router;
}

const { vacunasController } = require('../container');
const router = crearRouterVacunas({ vacunasController });
router.crearRouterVacunas = crearRouterVacunas;

module.exports = router;
