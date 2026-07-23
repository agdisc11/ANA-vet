const { z } = require('zod');
const { idRequerido, idOpcional, textoOpcional, enteroEnRango } = require('./tipos');
const Recordatorio = require('../domain/Recordatorio');

/** Esquemas DTO del módulo de recordatorios. */

const listarRecordatoriosQuerySchema = z.object({
  proximosDias: enteroEnRango('proximosDias', { defecto: 30, max: 365 }),
  vencidasDias: enteroEnRango('vencidasDias', { defecto: 30, max: 365 }),
});

const marcarEnviadoSchema = z.object({
  tipo: z.enum(Object.values(Recordatorio.TIPOS), {
    error: () => `tipo debe ser uno de: ${Object.values(Recordatorio.TIPOS).join(', ')}`,
  }),
  referencia_id: idRequerido('referencia_id'),
  paciente_id: idOpcional('paciente_id'),
  canal: textoOpcional('canal', 20),
});

module.exports = { listarRecordatoriosQuerySchema, marcarEnviadoSchema };
