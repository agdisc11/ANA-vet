const bcrypt = require('bcryptjs');

/**
 * Manejo de contraseñas (envoltorio de bcryptjs).
 *
 * Los servicios reciben este módulo INYECTADO (DIP): en tests se
 * reemplaza por un fake y no se ejecuta criptografía real.
 */
const SALT_ROUNDS = 10;

function hashPassword(passwordPlano) {
  return bcrypt.hash(passwordPlano, SALT_ROUNDS);
}

function verificarPassword(passwordPlano, hash) {
  return bcrypt.compare(passwordPlano, hash);
}

/**
 * Password temporal legible: 8 alfanuméricos (sin caracteres ambiguos
 * como I/l/1/O/0) + 1 especial. Para empleados con correo autogenerado.
 */
function generarPasswordTemporal() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const especiales = '!@#$*';
  let pwd = '';
  for (let i = 0; i < 8; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd + especiales[Math.floor(Math.random() * especiales.length)];
}

module.exports = { hashPassword, verificarPassword, generarPasswordTemporal, SALT_ROUNDS };
