const { z } = require('zod');
const { textoRequerido, textoOpcional, idRequerido } = require('./tipos');

/**
 * Esquemas DTO de los módulos administrativos:
 * roles, inventario y catálogo de servicios.
 */

// ── Roles ────────────────────────────────────────────────────
const crearRolSchema = z.object({
  nombre: textoRequerido('nombre', 100),
  descripcion: textoOpcional('descripcion', 5000),
});

const actualizarRolSchema = z.object({
  nombre: textoOpcional('nombre', 100),
  descripcion: textoOpcional('descripcion', 5000),
});

// ── Inventario ───────────────────────────────────────────────
const cantidadNoNegativa = (etiqueta, valorDefault = 0) =>
  z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return valorDefault;
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    },
    z.number(`${etiqueta} debe ser numérico`).min(0, `${etiqueta} no puede ser negativo`)
  );

const productoSchema = z.object({
  nombre: textoRequerido('nombre', 200),
  descripcion: textoOpcional('descripcion', 5000),
  stock: cantidadNoNegativa('stock', 0),
  stock_minimo: cantidadNoNegativa('stock_minimo', 0),
  precio: cantidadNoNegativa('precio', 0),
  unidad: textoOpcional('unidad', 50),
});

const solicitudReabastecimientoSchema = z.object({
  producto_id: idRequerido('producto_id'),
  producto_nombre: textoOpcional('producto_nombre', 200),
  cantidad: z.preprocess(
    (v) => {
      if (v === undefined || v === null || v === '') return 1;
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    },
    z.number('cantidad debe ser numérica').int('cantidad debe ser un entero').min(1, 'cantidad mínima: 1')
  ),
  notas: textoOpcional('notas', 5000),
});

const actualizarSolicitudSchema = z.object({
  status: textoRequerido('status', 50),
});

// ── Catálogo de servicios ────────────────────────────────────
const CATEGORIAS_SERVICIO = [
  'Consulta',
  'Laboratorio',
  'Gabinete',
  'Hospitalizacion',
  'Cirugia',
  'Procedimiento Ambulatorio',
];

const categoriaServicio = z.enum(CATEGORIAS_SERVICIO, {
  error: () => `categoria debe ser uno de: ${CATEGORIAS_SERVICIO.join(', ')}`,
});

const precioServicio = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === '') return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? v : n;
  },
  z.number({
    error: (issue) =>
      issue.input === undefined ? 'Falta el campo requerido: precio' : 'precio debe ser numérico',
  }).min(0, 'precio no puede ser negativo')
);

const activo01 = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === '') return undefined;
    return v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0;
  },
  z.number().int().min(0).max(1).optional()
);

const crearServicioSchema = z.object({
  categoria: categoriaServicio,
  nombre: textoRequerido('nombre', 200),
  precio: precioServicio,
  activo: activo01.default(1),
});

const actualizarServicioSchema = z.object({
  categoria: categoriaServicio.optional(),
  nombre: textoOpcional('nombre', 200),
  precio: precioServicio.optional(),
  activo: activo01,
});

module.exports = {
  crearRolSchema,
  actualizarRolSchema,
  productoSchema,
  solicitudReabastecimientoSchema,
  actualizarSolicitudSchema,
  crearServicioSchema,
  actualizarServicioSchema,
  CATEGORIAS_SERVICIO,
};
