const { z } = require('zod');
const { textoRequerido, textoOpcional, fechaRequerida, fechaOpcional } = require('./tipos');
const TratamientoTarea = require('../domain/TratamientoTarea');

/** Esquemas DTO de la hoja de tratamiento (Fase 3.6). */

const hora = (etiqueta) =>
  z.preprocess(
    (v) => (v === undefined || v === null || v === '' ? undefined : String(v).trim().slice(0, 5)),
    z.string({
      error: (issue) => (issue.input === undefined ? `Falta el campo requerido: ${etiqueta}` : `${etiqueta} inválida`),
    }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, `${etiqueta} debe tener formato HH:MM`)
  );

const categoria = z.preprocess(
  (v) => (v === undefined || v === null || v === '' ? TratamientoTarea.CATEGORIAS.OTRO : v),
  z.enum(Object.values(TratamientoTarea.CATEGORIAS), {
    error: () => `categoria debe ser una de: ${Object.values(TratamientoTarea.CATEGORIAS).join(', ')}`,
  })
);

const camposTarea = {
  fecha: fechaRequerida('fecha'),
  hora: hora('hora'),
  descripcion: textoRequerido('descripcion', 255),
  categoria,
  dosis: textoOpcional('dosis', 100),
  via: textoOpcional('via', 50),
  notas: textoOpcional('notas', 5000),
};

const crearTareaSchema = z.object(camposTarea);

const entero = (etiqueta, min, max, valorDefault) =>
  z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return valorDefault;
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    },
    z.number(`${etiqueta} debe ser numérico`).int(`${etiqueta} debe ser entero`)
      .min(min, `${etiqueta} mínimo: ${min}`).max(max, `${etiqueta} máximo: ${max}`)
  );

/** Pauta repetida: misma tarea cada N horas. */
const crearPautaSchema = z.object({
  ...camposTarea,
  cada_horas: entero('cada_horas', 1, 24, 8),
  repeticiones: entero('repeticiones', 1, 24, 3),
});

const completarTareaSchema = z.object({
  completada: z.preprocess(
    (v) => (v === undefined || v === null || v === '' ? true : v === true || v === 1 || v === '1' || v === 'true'),
    z.boolean()
  ),
});

const hojaQuerySchema = z.object({
  fecha: fechaOpcional('fecha').optional().default(null),
});

module.exports = { crearTareaSchema, crearPautaSchema, completarTareaSchema, hojaQuerySchema };
