const { z } = require('zod');
const { textoRequerido, textoOpcional, idRequerido } = require('./tipos');

/**
 * Esquemas DTO del módulo empleados.
 */

const rolOpcional = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === '') return undefined;
    const n = Number(v);
    return Number.isNaN(n) ? v : n;
  },
  z.number('rol_id debe ser numérico')
    .int('rol_id debe ser un número entero')
    .positive('rol_id debe ser un número positivo')
    .optional()
);

const booleanoA01 = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === '') return undefined;
    if (v === true || v === 1 || v === '1' || v === 'true') return 1;
    if (v === false || v === 0 || v === '0' || v === 'false') return 0;
    return v;
  },
  z.number('activo debe ser booleano (true/false o 1/0)')
    .int()
    .min(0, 'activo debe ser booleano (true/false o 1/0)')
    .max(1, 'activo debe ser booleano (true/false o 1/0)')
    .optional()
);

/**
 * Alta de empleado. Con generar_correo=true el email y la contraseña
 * se generan en el servidor; sin él, ambos son obligatorios.
 */
const crearEmpleadoSchema = z
  .object({
    nombre: textoRequerido('nombre', 100),
    apellidos: textoRequerido('apellidos', 150),
    rol_id: idRequerido('rol_id'),
    telefono: textoOpcional('telefono', 30),
    generar_correo: z.preprocess(
      (v) => v === true || v === 1 || v === '1' || v === 'true',
      z.boolean()
    ),
    email: textoOpcional('email', 150),
    password: textoOpcional('password', 100),
  })
  .superRefine((datos, ctx) => {
    if (!datos.generar_correo && (!datos.email || !datos.password)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Debes proporcionar un email y contraseña, o activar generar_correo=true',
      });
    }
  });

const actualizarEmpleadoSchema = z.object({
  nombre: textoOpcional('nombre', 100),
  apellidos: textoOpcional('apellidos', 150),
  email: textoOpcional('email', 150),
  rol_id: rolOpcional,
  telefono: textoOpcional('telefono', 30),
  activo: booleanoA01,
});

const cambiarPasswordEmpleadoSchema = z.object({
  password_nueva: textoRequerido('password_nueva', 100),
});

module.exports = {
  crearEmpleadoSchema,
  actualizarEmpleadoSchema,
  cambiarPasswordEmpleadoSchema,
};
