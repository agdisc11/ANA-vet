const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  throw new Error(
    'FATAL: La variable de entorno JWT_SECRET no está definida. ' +
    'La aplicación no puede iniciarse sin ella. ' +
    'Defínela en tu archivo .env antes de arrancar el servidor.'
  );
}
const JWT_SECRET = process.env.JWT_SECRET;
const SALT_ROUNDS = 10;

/**
 * Middleware de autenticación JWT.
 * Verifica el token en el header Authorization: Bearer <token>
 * Inyecta req.user con { id, tipo, clinica_id }
 *   - tipo: 'clinica' | 'empleado'
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, tipo, clinica_id, nombre }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/**
 * Middleware que exige que el usuario autenticado sea de tipo 'clinica'
 * (es decir, el administrador/dueño de la clínica).
 */
function soloClinica(req, res, next) {
  if (!req.user || req.user.tipo !== 'clinica') {
    return res.status(403).json({ error: 'Acceso restringido a administradores de clínica' });
  }
  next();
}

/**
 * Middleware que exige que el usuario autenticado sea de tipo 'empleado'.
 */
function soloEmpleado(req, res, next) {
  if (!req.user || req.user.tipo !== 'empleado') {
    return res.status(403).json({ error: 'Acceso restringido a empleados' });
  }
  next();
}

/**
 * Middleware que permite acceso a tipo 'clinica' (Admin) o a empleados
 * con permiso clínico (rol "Veterinario").
 *
 * Antes comparaba rol_id === 2, que solo era "Veterinario" en la primera
 * clínica registrada (los IDs de roles son AUTO_INCREMENT globales).
 * Ahora delega en el RBAC por nombre de rol (src/auth/permisos.js).
 */
const { requierePermiso } = require('../auth/permisos');
const clinicaOVeterinario = requierePermiso('clinico.acceso');

module.exports = { authMiddleware, soloClinica, soloEmpleado, clinicaOVeterinario, JWT_SECRET, SALT_ROUNDS };
