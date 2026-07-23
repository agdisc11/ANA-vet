const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateQuery } = require('../middleware/validate');
const { buscarQuerySchema } = require('../validators/busquedaSchema');

/**
 * Búsqueda global de la clínica autenticada (command palette Ctrl+K).
 * El limitador de tasa se monta en index.js, como el resto (mantiene
 * este router puro para los tests).
 */
function crearRouterBuscar({ buscarController }) {
  const router = express.Router();
  router.get('/', authMiddleware, validateQuery(buscarQuerySchema), buscarController.buscar);
  return router;
}

const { buscarController } = require('../container');
const router = crearRouterBuscar({ buscarController });
router.crearRouterBuscar = crearRouterBuscar;

module.exports = router;
