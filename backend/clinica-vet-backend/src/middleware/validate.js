const { ValidationError } = require('../errors/ApiError');

/**
 * Middleware de validación con esquemas Zod.
 *
 * - `validate(schema)`      → valida y NORMALIZA req.body (trim, ''→null, coerciones).
 * - `validateQuery(schema)` → valida req.query y deja el resultado en req.queryValidada
 *                             (en Express 5 req.query es de solo lectura).
 *
 * Si la validación falla responde 400 con { error } vía el errorHandler global,
 * uniendo los mensajes de todos los campos inválidos.
 */
function formatearIssues(zodError) {
  const mensajes = [...new Set(zodError.issues.map((i) => i.message))];
  return mensajes.join('; ');
}

function validate(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.body ?? {});
    if (!resultado.success) {
      return next(new ValidationError(formatearIssues(resultado.error)));
    }
    req.body = resultado.data;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const resultado = schema.safeParse(req.query ?? {});
    if (!resultado.success) {
      return next(new ValidationError(formatearIssues(resultado.error)));
    }
    req.queryValidada = resultado.data;
    next();
  };
}

module.exports = { validate, validateQuery };
