const rateLimit = require('express-rate-limit');

/**
 * Limitadores de tasa para endpoints sensibles.
 *
 * loginLimiter: máx. 10 intentos FALLIDOS por IP cada 15 minutos
 * (skipSuccessfulRequests: los logins correctos no cuentan, así un
 * equipo compartiendo IP no se bloquea por uso normal).
 *
 * registroLimiter: máx. 5 registros de clínica por IP por hora
 * (previene creación masiva de cuentas).
 *
 * busquedaLimiter: la búsqueda global se dispara al teclear, así que el
 * tope es alto (holgado para varias recepcionistas tras la misma IP
 * pública) pero acota el coste de un script que la martillee: cada
 * petición son dos consultas con LIKE '%…%' contra la BD.
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos fallidos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
});

const registroLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados registros desde esta dirección. Intenta de nuevo más tarde.' },
});

const busquedaLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas búsquedas seguidas. Espera unos segundos.' },
});

module.exports = { loginLimiter, registroLimiter, busquedaLimiter };
