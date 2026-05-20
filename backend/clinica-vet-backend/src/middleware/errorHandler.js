/**
 * Middleware global de manejo de errores.
 * Debe registrarse al FINAL de todas las rutas en index.js.
 *
 * Captura cualquier error pasado con next(err) o lanzado en rutas async.
 * Devuelve una respuesta JSON uniforme con el código HTTP apropiado.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Evitar enviar respuesta si ya se inició el streaming
  if (res.headersSent) return next(err);

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  // Log detallado en consola (solo en desarrollo)
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR ${status}] ${req.method} ${req.originalUrl} →`, err);
  } else {
    console.error(`[ERROR ${status}] ${req.method} ${req.originalUrl} → ${message}`);
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {}),
  });
}

module.exports = errorHandler;
