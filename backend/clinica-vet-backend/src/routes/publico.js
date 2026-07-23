const express = require('express');
const rateLimit = require('express-rate-limit');

/**
 * Rutas PÚBLICAS (sin sesión). Hoy solo el carnet de vacunación.
 *
 * Rate-limit propio: al no haber autenticación, se limita el ritmo por
 * IP para que nadie pueda barrer tokens por fuerza bruta (el espacio es
 * de 128 bits, pero el límite lo hace inviable también en volumen).
 */
const carnetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas consultas. Intenta de nuevo en unos minutos.' },
});

function crearRouterPublico({ carnetController }) {
  const router = express.Router();
  router.get('/carnet/:token', carnetLimiter, carnetController.publico);
  return router;
}

const { carnetController } = require('../container');
const router = crearRouterPublico({ carnetController });
router.crearRouterPublico = crearRouterPublico;

module.exports = router;
