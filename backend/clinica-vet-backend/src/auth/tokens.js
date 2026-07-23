const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

/**
 * Firma de tokens de sesión (envoltorio de jsonwebtoken).
 *
 * Aquí vive la ÚNICA definición del payload de cada tipo de token;
 * antes estaba duplicada en las rutas de clinicas y empleados.
 * Inyectado en los servicios (DIP) → en tests se usa un firmador fake.
 */
const EXPIRACION = '8h';

/** Token de administrador de clínica (tipo 'clinica'). */
function firmarTokenClinica(clinica) {
  return jwt.sign(
    {
      id: clinica.id,
      tipo: 'clinica',
      clinica_id: clinica.id,
      nombre: clinica.nombre,
    },
    JWT_SECRET,
    { expiresIn: EXPIRACION }
  );
}

/** Token de empleado; incluye rol_nombre para el RBAC sin ir a la BD. */
function firmarTokenEmpleado(empleado) {
  return jwt.sign(
    {
      id: empleado.id,
      tipo: 'empleado',
      clinica_id: empleado.clinica_id,
      rol_id: empleado.rol_id,
      rol_nombre: empleado.rol_nombre,
      nombre: `${empleado.nombre} ${empleado.apellidos}`,
    },
    JWT_SECRET,
    { expiresIn: EXPIRACION }
  );
}

module.exports = { firmarTokenClinica, firmarTokenEmpleado, EXPIRACION };
