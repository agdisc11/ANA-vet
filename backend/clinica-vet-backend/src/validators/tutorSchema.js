const { z } = require('zod');
const { textoRequerido, textoOpcional } = require('./tipos');

/**
 * Esquemas DTO del módulo tutores.
 */
const camposTutor = {
  nombre: textoRequerido('nombre', 100),
  apellidos: textoRequerido('apellidos', 100),
  telefono: textoOpcional('telefono', 30),
  whatsapp: textoOpcional('whatsapp', 30),
  correo: textoOpcional('correo', 150),
  direccion: textoOpcional('direccion', 500),
};

const crearTutorSchema = z.object(camposTutor);
const actualizarTutorSchema = z.object(camposTutor);

module.exports = { crearTutorSchema, actualizarTutorSchema };
