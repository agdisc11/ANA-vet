const express = require('express');
const { authMiddleware, soloClinica } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const { loginSchema } = require('../validators/clinicaSchema');
const {
  crearEmpleadoSchema,
  actualizarEmpleadoSchema,
  cambiarPasswordEmpleadoSchema,
} = require('../validators/empleadoSchema');

/**
 * Router de empleados.
 * - login: público (rate-limit en index.js)
 * - listado: cualquier usuario autenticado de la clínica
 * - gestión (alta/edición/baja/contraseña): solo el administrador (tipo 'clinica')
 */
function crearRouterEmpleados({ empleadosController }) {
  const router = express.Router();

  router.post('/login', validate(loginSchema), empleadosController.login);

  router.get('/', authMiddleware, empleadosController.getAll);
  router.get('/:id', authMiddleware, soloClinica, empleadosController.getById);
  router.post('/', authMiddleware, soloClinica, validate(crearEmpleadoSchema), empleadosController.create);
  router.put('/:id/cambiar-password', authMiddleware, soloClinica, validate(cambiarPasswordEmpleadoSchema), empleadosController.cambiarPassword);
  router.put('/:id', authMiddleware, soloClinica, validate(actualizarEmpleadoSchema), empleadosController.update);
  router.delete('/:id', authMiddleware, soloClinica, empleadosController.remove);

  return router;
}

const { empleadosController } = require('../container');
const router = crearRouterEmpleados({ empleadosController });
router.crearRouterEmpleados = crearRouterEmpleados;

module.exports = router;
