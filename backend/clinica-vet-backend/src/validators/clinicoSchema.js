const { z } = require('zod');
const {
  textoRequerido, textoOpcional, idRequerido, idOpcional,
  fechaRequerida, fechaOpcional, booleano01,
} = require('./tipos');

/**
 * Esquemas DTO del núcleo clínico:
 * expedientes, consultas, hospitalizaciones, cirugías, anestesia y vacunas.
 */

const TEXTO_CLINICO_MAX = 20000; // columnas TEXT

const textoClinico = (etiqueta) => textoOpcional(etiqueta, TEXTO_CLINICO_MAX);

/** IDs de empleados asignados: descarta entradas no numéricas (comportamiento legacy). */
const empleadosIds = z.preprocess(
  (v) => (Array.isArray(v)
    ? v.map(Number).filter((n) => Number.isInteger(n) && n > 0)
    : []),
  z.array(z.number())
);

// ── Expedientes ──────────────────────────────────────────────
const crearExpedienteSchema = z.object({
  paciente_id: idRequerido('paciente_id'),
});

// ── Consultas ────────────────────────────────────────────────
const crearConsultaSchema = z.object({
  expediente_id: idRequerido('expediente_id'),
  empleado_id: idOpcional('empleado_id'),
  fecha: fechaOpcional('fecha'),
  motivo: textoClinico('motivo'),
  anamnesis: textoClinico('anamnesis'),
  examen_fisico: textoClinico('examen_fisico'),
  indicaciones: textoClinico('indicaciones'),
  examenes_sistemicos: textoClinico('examenes_sistemicos'),
  lista_problemas: textoClinico('lista_problemas'),
  dx_presuntivo: textoClinico('dx_presuntivo'),
  abordaje_dx: textoClinico('abordaje_dx'),
  tratamiento: textoClinico('tratamiento'),
  tratamiento_etiologico: textoClinico('tratamiento_etiologico'),
  seguimiento_medico: textoClinico('seguimiento_medico'),
  resumen: textoClinico('resumen'),
});

// ── Hospitalizaciones ────────────────────────────────────────
const crearHospitalizacionSchema = z.object({
  expediente_id: idRequerido('expediente_id'),
  fecha_ingreso: fechaOpcional('fecha_ingreso'),
  historia_clinica: textoClinico('historia_clinica'),
  abordaje_hospitalario: textoClinico('abordaje_hospitalario'),
  tratamiento_intrahospitalario: textoClinico('tratamiento_intrahospitalario'),
  abordaje_diagnostico: textoClinico('abordaje_diagnostico'),
  seguimiento: textoClinico('seguimiento'),
  revaloraciones: textoClinico('revaloraciones'),
  ajuste_plan_terapeutico: textoClinico('ajuste_plan_terapeutico'),
  plan_diagnostico: textoClinico('plan_diagnostico'),
  tipo_alta: textoOpcional('tipo_alta', 100),
  acta_responsiva: booleano01('acta_responsiva', 0),
  empleados_ids: empleadosIds,
});

// ── Cirugías ─────────────────────────────────────────────────
const crearCirugiaSchema = z.object({
  expediente_id: idRequerido('expediente_id'),
  fecha: fechaOpcional('fecha'),
  procedimiento: textoClinico('procedimiento'),
  plan_quirurgico: textoClinico('plan_quirurgico'),
  notas: textoClinico('notas'),
  consentimiento: textoClinico('consentimiento'),
  empleados_ids: empleadosIds,
});

// ── Anestesia ────────────────────────────────────────────────
const crearAnestesiaSchema = z.object({
  cirugia_id: idRequerido('cirugia_id'),
  protocolo: textoClinico('protocolo'),
  farmacos: textoClinico('farmacos'),
  dosis: textoClinico('dosis'),
  observaciones: textoClinico('observaciones'),
});

// ── Vacunas ──────────────────────────────────────────────────
const crearVacunaSchema = z.object({
  paciente_id: idRequerido('paciente_id'),
  nombre: textoRequerido('nombre', 100),
  fecha_aplicacion: fechaRequerida('fecha_aplicacion'),
  proxima_dosis: fechaOpcional('proxima_dosis'),
  lote: textoOpcional('lote', 50),
  fabricante: textoOpcional('fabricante', 255),
  via_administracion: textoOpcional('via_administracion', 50),
  dosis: textoOpcional('dosis', 100),
  observaciones: textoClinico('observaciones'),
});

module.exports = {
  crearExpedienteSchema,
  crearConsultaSchema,
  crearHospitalizacionSchema,
  crearCirugiaSchema,
  crearAnestesiaSchema,
  crearVacunaSchema,
};
