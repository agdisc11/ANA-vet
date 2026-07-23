const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');

/**
 * Estadísticas generales de la clínica autenticada.
 * Blindaje: la versión anterior NO exigía token y contaba datos de
 * TODAS las clínicas; ahora requiere sesión y filtra por clínica.
 */
function crearRouterStats({ dashboardController }) {
  const router = express.Router();
  router.get('/', authMiddleware, dashboardController.stats);
  return router;
}

const { dashboardController } = require('../container');
const router = crearRouterStats({ dashboardController });
router.crearRouterStats = crearRouterStats;

module.exports = router;
