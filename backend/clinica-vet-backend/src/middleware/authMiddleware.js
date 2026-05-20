const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'saas_vet_secret_2026';
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
 * Middleware que permite acceso a tipo 'clinica' (Admin)
 * O a tipo 'empleado' con rol_id 2 (Veterinario).
 */
function clinicaOVeterinario(req, res, next) {
  if (!req.user) {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }
  const { tipo, rol_id } = req.user;
  if (tipo === 'clinica' || (tipo === 'empleado' && Number(rol_id) === 2)) {
    return next();
  }
  return res.status(403).json({ error: 'Acceso restringido a Administrador o Veterinario.' });
}

module.exports = { authMiddleware, soloClinica, soloEmpleado, clinicaOVeterinario, JWT_SECRET, SALT_ROUNDS };
