const express = require('express');
const { authMiddleware, soloClinica } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
  registroClinicaSchema,
  loginSchema,
  actualizarPerfilSchema,
  cambiarPasswordSchema,
} = require('../validators/clinicaSchema');

/**
 * Router de clinicas (tenant + autenticación del administrador).
 * registro y login son públicos (con rate-limit montado en index.js);
 * el resto exige token de tipo 'clinica'.
 */
function crearRouterClinicas({ clinicasController }) {
  const router = express.Router();

  router.post('/registro', validate(registroClinicaSchema), clinicasController.registro);
  router.post('/login', validate(loginSchema), clinicasController.login);

  router.get('/perfil', authMiddleware, soloClinica, clinicasController.perfil);
  router.put('/perfil', authMiddleware, soloClinica, validate(actualizarPerfilSchema), clinicasController.actualizarPerfil);
  router.put('/cambiar-password', authMiddleware, soloClinica, validate(cambiarPasswordSchema), clinicasController.cambiarPassword);

  return router;
}

const { clinicasController } = require('../container');
const router = crearRouterClinicas({ clinicasController });
router.crearRouterClinicas = crearRouterClinicas;

module.exports = router;
