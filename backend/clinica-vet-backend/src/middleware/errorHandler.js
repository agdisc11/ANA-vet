/**
 * Middleware global de manejo de errores.
 * Debe registrarse al FINAL de todas las rutas en index.js.
 *
 * Captura cualquier error pasado con next(err) o lanzado en rutas async.
 * Devuelve una respuesta JSON uniforme con el código HTTP apropiado.
 *
 * Detecta códigos de error específicos de MySQL para retornar mensajes
 * amigables al cliente sin exponer detalles internos de la base de datos.
 */

// Mapa de códigos de error MySQL → { status HTTP, mensaje amigable }
const MYSQL_ERROR_MAP = {
  // Duplicados
  ER_DUP_ENTRY:                  { status: 409, message: 'El registro ya existe (dato duplicado).' },

  // Clave foránea: referencia inexistente al insertar/actualizar
  ER_NO_REFERENCED_ROW:          { status: 400, message: 'El registro referenciado no existe (clave foránea inválida).' },
  ER_NO_REFERENCED_ROW_2:        { status: 400, message: 'El registro referenciado no existe (clave foránea inválida).' },

  // Clave foránea: no se puede eliminar porque otros registros dependen de este
  ER_ROW_IS_REFERENCED:          { status: 409, message: 'No se puede eliminar este registro porque otros datos dependen de él. Elimine primero los registros relacionados.' },
  ER_ROW_IS_REFERENCED_2:        { status: 409, message: 'No se puede eliminar este registro porque otros datos dependen de él. Elimine primero los registros relacionados.' },

  // Valores nulos / formato incorrecto
  ER_BAD_NULL_ERROR:             { status: 400, message: 'Un campo obligatorio no puede estar vacío.' },
  ER_DATA_TOO_LONG:              { status: 400, message: 'El valor ingresado excede la longitud máxima permitida para ese campo.' },
  ER_TRUNCATED_WRONG_VALUE:      { status: 400, message: 'El valor ingresado tiene un formato incorrecto para el campo.' },
  ER_WRONG_VALUE_FOR_FIELD:      { status: 400, message: 'El valor ingresado no es válido para ese campo.' },
  ER_WARN_DATA_OUT_OF_RANGE:     { status: 400, message: 'El valor numérico ingresado está fuera del rango permitido.' },

  // Tabla / columna inexistente (errores de desarrollo, no exponer detalles)
  ER_NO_SUCH_TABLE:              { status: 500, message: 'Error interno: tabla no encontrada. Contacte al administrador.' },
  ER_BAD_FIELD_ERROR:            { status: 500, message: 'Error interno: campo desconocido. Contacte al administrador.' },

  // Conexión / acceso
  ER_ACCESS_DENIED_ERROR:        { status: 503, message: 'Error de conexión a la base de datos. Contacte al administrador.' },
  ECONNREFUSED:                  { status: 503, message: 'No se pudo conectar a la base de datos. Intente más tarde.' },
  PROTOCOL_CONNECTION_LOST:      { status: 503, message: 'Se perdió la conexión con la base de datos. Intente más tarde.' },
};

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Evitar enviar respuesta si ya se inició el streaming
  if (res.headersSent) return next(err);

  // Detectar errores específicos de MySQL por su código
  const mysqlError = err.code && MYSQL_ERROR_MAP[err.code];

  const status  = mysqlError ? mysqlError.status  : (err.status || err.statusCode || 500);
  const message = mysqlError ? mysqlError.message : (err.message || 'Error interno del servidor');

  // Log detallado en consola — siempre incluye código MySQL si está disponible
  const mysqlCode = err.code ? ` [MySQL: ${err.code}]` : '';
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR ${status}]${mysqlCode} ${req.method} ${req.originalUrl} →`, err);
  } else {
    console.error(`[ERROR ${status}]${mysqlCode} ${req.method} ${req.originalUrl} → ${err.message || message}`);
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && err.stack ? { stack: err.stack } : {}),
  });
}

module.exports = errorHandler;
