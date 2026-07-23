const express = require('express');
const { authMiddleware, soloClinica } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { crearRolSchema, actualizarRolSchema } = require('../validators/adminSchema');

/** Router de roles — gestión exclusiva del administrador (tipo 'clinica'). */
function crearRouterRoles({ rolesController }) {
  const router = express.Router();
  router.use(authMiddleware, soloClinica);
  router.get('/', rolesController.getAll);
  router.get('/:id', rolesController.getById);
  router.post('/', validate(crearRolSchema), rolesController.create);
  router.put('/:id', validate(actualizarRolSchema), rolesController.update);
  router.delete('/:id', rolesController.remove);
  return router;
}

const { rolesController } = require('../container');
const router = crearRouterRoles({ rolesController });
router.crearRouterRoles = crearRouterRoles;

module.exports = router;
