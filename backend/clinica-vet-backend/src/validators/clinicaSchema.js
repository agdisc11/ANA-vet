const { z } = require('zod');
const { textoRequerido, textoOpcional } = require('./tipos');

/**
 * Esquemas DTO del módulo clinicas (tenant + autenticación).
 */

const registroClinicaSchema = z.object({
  nombre: textoRequerido('nombre', 150),
  email: textoRequerido('email', 150),
  password: textoRequerido('password', 100),
  telefono: textoOpcional('telefono', 30),
  direccion: textoOpcional('direccion', 500),
});

const loginSchema = z.object({
  email: textoRequerido('email', 150),
  password: textoRequerido('password', 100),
});

const actualizarPerfilSchema = z.object({
  nombre: textoOpcional('nombre', 150),
  telefono: textoOpcional('telefono', 30),
  direccion: textoOpcional('direccion', 500),
  logo_url: textoOpcional('logo_url', 500),
});

const cambiarPasswordSchema = z.object({
  password_actual: textoRequerido('password_actual', 100),
  password_nueva: textoRequerido('password_nueva', 100),
});

module.exports = {
  registroClinicaSchema,
  loginSchema,
  actualizarPerfilSchema,
  cambiarPasswordSchema,
};
