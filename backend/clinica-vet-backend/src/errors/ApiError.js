/**
 * Errores tipados de la aplicación.
 *
 * Los servicios y entidades de dominio lanzan estos errores; el middleware
 * global `errorHandler` lee `err.status` y responde `{ error: message }`.
 * Así los controladores no necesitan try/catch ni conocer códigos HTTP
 * de cada caso de negocio.
 */
class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
}

class ValidationError extends ApiError {
  constructor(message = 'Datos inválidos') {
    super(400, message);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Recurso no encontrado') {
    super(404, message);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Credenciales incorrectas') {
    super(401, message);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Acceso denegado') {
    super(403, message);
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Conflicto con el estado actual del recurso') {
    super(409, message);
  }
}

module.exports = { ApiError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError, ConflictError };
