const { z } = require('zod');

/**
 * Constructores de tipos Zod reutilizables con mensajes en español.
 *
 * Normalizan la entrada además de validarla:
 *   - textoRequerido / textoOpcional → trim; '' → null (en opcionales)
 *   - idRequerido                    → coerción a número ('5' → 5)
 *   - fechaOpcional                  → recorta ISO con hora a YYYY-MM-DD
 *
 * Un solo lugar para cambiar el formato de los mensajes de validación (DRY/OCP).
 */

const textoRequerido = (etiqueta, max = 255) =>
  z.preprocess(
    (v) => (v === undefined || v === null ? '' : String(v).trim()),
    z.string()
      .min(1, `Falta el campo requerido: ${etiqueta}`)
      .max(max, `${etiqueta}: máximo ${max} caracteres`)
  );

const textoOpcional = (etiqueta, max = 255) =>
  z.preprocess(
    (v) => {
      if (v === undefined || v === null) return null;
      const s = String(v).trim();
      return s === '' ? null : s;
    },
    z.string().max(max, `${etiqueta}: máximo ${max} caracteres`).nullable()
  );

const idRequerido = (etiqueta) =>
  z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return undefined;
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    },
    z.number({
      error: (issue) =>
        issue.input === undefined
          ? `Falta el campo requerido: ${etiqueta}`
          : `${etiqueta} debe ser numérico`,
    })
      .int(`${etiqueta} debe ser un número entero`)
      .positive(`${etiqueta} debe ser un número positivo`)
  );

/** Como fechaOpcional pero obligatoria. */
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

/** ID numérico opcional: ''/null → null; '5' → 5. */
const idOpcional = (etiqueta) =>
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

/** Booleano flexible normalizado a 0/1 (columnas tinyint). Ausente → valorDefault. */
const booleano01 = (etiqueta, valorDefault = 0) =>
  z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return valorDefault;
      return v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0;
    },
    z.number().int().min(0).max(1)
  );

/** Acepta 'YYYY-MM-DD', ISO completo, objetos Date, '' o null. Normaliza a 'YYYY-MM-DD' | null. */
const fechaOpcional = (etiqueta) =>
  z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return null;
      if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
      const m = String(v).trim().match(/^(\d{4}-\d{2}-\d{2})/);
      return m ? m[1] : String(v).trim();
    },
    z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, `${etiqueta} debe tener formato YYYY-MM-DD`)
      .nullable()
  );

/**
 * Entero opcional acotado a un rango, con valor por defecto si falta.
 * Pensado para parámetros de query (?limite=5, ?proximosDias=30):
 * ausente o '' → `defecto`; '7' → 7; fuera de rango → 400.
 */
const enteroEnRango = (etiqueta, { defecto, min = 0, max }) =>
  z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return defecto;
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    },
    z.number(`${etiqueta} debe ser numérico`)
      .int(`${etiqueta} debe ser entero`)
      .min(min, min === 0 ? `${etiqueta} no puede ser negativo` : `${etiqueta} mínimo: ${min}`)
      .max(max, `${etiqueta} máximo: ${max}`)
  );

module.exports = {
  textoRequerido, textoOpcional, idRequerido, idOpcional,
  fechaRequerida, fechaOpcional, booleano01, enteroEnRango,
};
