const { z } = require('zod');
const { textoOpcional, idRequerido } = require('./tipos');
const Cita = require('../domain/Cita');

/**
 * Esquemas DTO del módulo Agenda/Citas.
 * La forma la valida Zod; las reglas de negocio (transiciones, traslapes,
 * medianoche) las validan la entidad Cita y CitaService.
 */

const fechaRequerida = (etiqueta) =>
  z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return undefined;
      if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
      const m = String(v).trim().match(/^(\d{4}-\d{2}-\d{2})/);
      return m ? m[1] : String(v).trim();
    },
    z.string({
      error: (issue) =>
        issue.input === undefined ? `Falta el campo requerido: ${etiqueta}` : `${etiqueta} inválida`,
    }).regex(/^\d{4}-\d{2}-\d{2}$/, `${etiqueta} debe tener formato YYYY-MM-DD`)
  );

const horaRequerida = (etiqueta) =>
  z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return undefined;
      // Acepta 'HH:MM' o 'HH:MM:SS' y normaliza a 'HH:MM'
      const m = String(v).trim().match(/^(\d{2}:\d{2})(:\d{2})?$/);
      return m ? m[1] : String(v).trim();
    },
    z.string({
      error: (issue) =>
        issue.input === undefined ? `Falta el campo requerido: ${etiqueta}` : `${etiqueta} inválida`,
    }).regex(/^([01]\d|2[0-3]):[0-5]\d$/, `${etiqueta} debe tener formato HH:MM (00:00–23:59)`)
  );

const empleadoOpcional = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return Number.isNaN(n) ? v : n;
  },
  z.number('empleado_id debe ser numérico')
    .int('empleado_id debe ser un número entero')
    .positive('empleado_id debe ser un número positivo')
    .nullable()
);

const duracionConDefault = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === '') return 30;
    const n = Number(v);
    return Number.isNaN(n) ? v : n;
  },
  z.number('duracion_min debe ser numérica')
    .int('duracion_min debe ser un número entero')
    .min(5, 'duracion_min mínima: 5 minutos')
    .max(480, 'duracion_min máxima: 480 minutos (8 h)')
);

const camposCita = {
  paciente_id: idRequerido('paciente_id'),
  empleado_id: empleadoOpcional,
  fecha: fechaRequerida('fecha'),
  hora_inicio: horaRequerida('hora_inicio'),
  duracion_min: duracionConDefault,
  motivo: textoOpcional('motivo', 255),
  notas: textoOpcional('notas', 5000),
};

const crearCitaSchema = z.object(camposCita);
const actualizarCitaSchema = z.object(camposCita);

const cambiarEstadoSchema = z.object({
  estado: z.enum(Object.values(Cita.ESTADOS), {
    error: () => `estado debe ser uno de: ${Object.values(Cita.ESTADOS).join(', ')}`,
  }),
});

/** Rango del listado; por defecto: de hoy a 13 días adelante (2 semanas de agenda). */
const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const enDiasISO = (dias) => {
  const d = new Date(Date.now() + dias * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const listarCitasQuerySchema = z.object({
  desde: fechaRequerida('desde').optional().default(hoyISO),
  hasta: fechaRequerida('hasta').optional().default(() => enDiasISO(13)),
  empleado_id: empleadoOpcional.optional().default(null),
  estado: z.enum(Object.values(Cita.ESTADOS)).optional().nullable().default(null),
});

module.exports = {
  crearCitaSchema,
  actualizarCitaSchema,
  cambiarEstadoSchema,
  listarCitasQuerySchema,
};
