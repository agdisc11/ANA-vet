/**
 * Envuelve un handler async para que cualquier promesa rechazada
 * llegue al errorHandler global vía next(err).
 *
 * Elimina la necesidad de try/catch en cada controlador.
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
