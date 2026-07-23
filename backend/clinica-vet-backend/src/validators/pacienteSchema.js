const { z } = require('zod');
const { textoRequerido, textoOpcional, idRequerido, fechaOpcional } = require('./tipos');

/**
 * Esquemas de validación (DTO) del módulo pacientes.
 * Las claves desconocidas se descartan automáticamente (z.object strip),
 * así el frontend puede reenviar campos calculados (tutor, edad) sin efecto.
 */

const camposComunes = {
  nombre: textoRequerido('nombre', 100),
  especie: textoRequerido('especie', 50),
  sexo: textoRequerido('sexo', 20),
  raza: textoOpcional('raza', 100),
  fecha_nacimiento: fechaOpcional('fecha_nacimiento'),
  funcion_zootecnica: textoOpcional('funcion_zootecnica', 255),
  tatuaje: textoOpcional('tatuaje', 255),
  microchip: textoOpcional('microchip', 50),
  esquemas_preventivos: textoOpcional('esquemas_preventivos', 5000),
};

const crearPacienteSchema = z.object({
  tutor_id: idRequerido('tutor_id'),
  ...camposComunes,
});

const actualizarPacienteSchema = z.object(camposComunes);

const reasignarTutorSchema = z.object({
  nuevo_tutor_id: idRequerido('nuevo_tutor_id'),
});

/**
 * Query de listado. Sin `page` se devuelve la lista completa
 * (comportamiento legacy que espera el frontend actual);
 * con `page` se responde paginado { data, pagination }.
 */
const listarPacientesQuerySchema = z.object({
  q: textoOpcional('q', 100).optional().default(null),
  page: z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return null;
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    },
    z.number('page debe ser numérico').int('page debe ser entero').min(1, 'page debe ser ≥ 1').nullable()
  ).default(null),
  limit: z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return 20;
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    },
    z.number('limit debe ser numérico').int('limit debe ser entero').min(1, 'limit debe ser ≥ 1').max(100, 'limit máximo: 100')
  ).default(20),
});

module.exports = {
  crearPacienteSchema,
  actualizarPacienteSchema,
  reasignarTutorSchema,
  listarPacientesQuerySchema,
};
