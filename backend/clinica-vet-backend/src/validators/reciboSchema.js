const { z } = require('zod');
const { textoRequerido, textoOpcional, idRequerido } = require('./tipos');
const Recibo = require('../domain/Recibo');

/**
 * Esquemas DTO del módulo recibos.
 *
 * `fechaFlexible` acepta 'DD/MM/YYYY' (helper hoy() del frontend),
 * 'YYYY-MM-DD' o ISO con hora, y normaliza a 'YYYY-MM-DD'. La versión
 * anterior solo normalizaba en el POST; ahora el PUT también queda cubierto.
 */

const normalizarFecha = (v) => {
  if (v === undefined || v === null || v === '') return undefined;
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
  const s = String(v).trim();
  const ddmmyyyy = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) return `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`;
  const iso = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return iso ? iso[1] : s;
};

const fechaFlexible = (etiqueta) =>
  z.preprocess(
    normalizarFecha,
    z.string({
      error: (issue) =>
        issue.input === undefined ? `Falta el campo requerido: ${etiqueta}` : `${etiqueta} inválida`,
    }).regex(/^\d{4}-\d{2}-\d{2}$/, `${etiqueta} debe tener formato YYYY-MM-DD o DD/MM/YYYY`)
  );

const referenciaOpcional = (etiqueta) =>
  z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return null;
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    },
    z.number(`${etiqueta} debe ser numérico`)
      .int(`${etiqueta} debe ser un número entero`)
      .positive(`${etiqueta} debe ser un número positivo`)
      .nullable()
  );

const numeroRequerido = (etiqueta, { min = 0, entero = false } = {}) =>
  z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return undefined;
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    },
    (() => {
      let esquema = z.number({
        error: (issue) =>
          issue.input === undefined
            ? 'Cada item requiere: nombre_servicio, precio_unitario, cantidad'
            : `${etiqueta} debe ser numérico`,
      }).min(min, `${etiqueta} debe ser mayor o igual a ${min}`);
      if (entero) esquema = esquema.int(`${etiqueta} debe ser un número entero`);
      return esquema;
    })()
  );

const itemSchema = z.object({
  servicio_id: referenciaOpcional('servicio_id'),
  // Item que sale del inventario: al finalizar el recibo descuenta stock
  producto_id: referenciaOpcional('producto_id'),
  nombre_servicio: textoRequerido('nombre_servicio', 200),
  precio_unitario: numeroRequerido('precio_unitario', { min: 0 }),
  cantidad: numeroRequerido('cantidad', { min: 1, entero: true }),
  notas: textoOpcional('notas', 5000),
});

const crearReciboSchema = z.object({
  paciente_id: idRequerido('paciente_id'),
  expediente_id: referenciaOpcional('expediente_id'),
  empleado_id: referenciaOpcional('empleado_id'),
  fecha: fechaFlexible('fecha'),
  motivo_consulta: textoOpcional('motivo_consulta', 5000),
  items: z.array(itemSchema, {
    error: () => 'Se requiere al menos un item en el recibo',
  }).min(1, 'Se requiere al menos un item en el recibo'),
});

/**
 * PUT parcial con semántica COALESCE: los campos ausentes (o vacíos)
 * conservan su valor actual. Un arreglo de items vacío se ignora
 * (comportamiento de la versión anterior).
 */
const actualizarReciboSchema = z.object({
  expediente_id: referenciaOpcional('expediente_id'),
  empleado_id: referenciaOpcional('empleado_id'),
  fecha: fechaFlexible('fecha').optional(),
  motivo_consulta: textoOpcional('motivo_consulta', 5000),
  status: z.preprocess(
    (v) => (v === undefined || v === null || v === '' ? undefined : v),
    z.enum(Object.values(Recibo.ESTADOS), {
      error: () => 'status debe ser: borrador o finalizado',
    }).optional()
  ),
  items: z.preprocess(
    (v) => (Array.isArray(v) && v.length > 0 ? v : undefined),
    z.array(itemSchema).optional()
  ),
});

module.exports = { crearReciboSchema, actualizarReciboSchema, itemSchema };
