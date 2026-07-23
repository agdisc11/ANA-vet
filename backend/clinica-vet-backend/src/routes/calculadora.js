const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * Catálogos de referencia para las calculadoras clínicas.
 * Blindaje: ahora requieren sesión (antes eran públicos).
 */
function crearRouterCalculadora({ calculadoraController }) {
  const router = express.Router();
  router.use(authMiddleware);
  router.get('/medicamentos', calculadoraController.medicamentos);
  router.get('/toxicologia', calculadoraController.toxicologia);
  return router;
}

const { calculadoraController } = require('../container');
const router = crearRouterCalculadora({ calculadoraController });
router.crearRouterCalculadora = crearRouterCalculadora;

module.exports = router;
