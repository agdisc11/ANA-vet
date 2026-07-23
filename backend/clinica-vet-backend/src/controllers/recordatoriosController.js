const asyncHandler = require('../middleware/asyncHandler');

/** Controlador de recordatorios (capa HTTP, factory con DI). */
function crearRecordatoriosController({ recordatorioService }) {
  return {
    // GET /api/recordatorios?proximosDias=&vencidasDias=
    getAll: asyncHandler(async (req, res) => {
      const { proximosDias, vencidasDias } = req.queryValidada ?? {};
      const recordatorios = await recordatorioService.listar(req.user.clinica_id, {
        proximosDias, vencidasDias,
      });
      res.json(recordatorios);
    }),

    // POST /api/recordatorios/enviado
    marcarEnviado: asyncHandler(async (req, res) => {
      await recordatorioService.marcarEnviado(req.user.clinica_id, req.body, req.user.id);
      res.status(201).json({ mensaje: 'Recordatorio marcado como enviado' });
    }),

    // DELETE /api/recordatorios/enviado/:tipo/:referencia_id
    desmarcarEnviado: asyncHandler(async (req, res) => {
      await recordatorioService.desmarcarEnviado(
        req.user.clinica_id,
        req.params.tipo,
        req.params.referencia_id
      );
      res.json({ mensaje: 'Recordatorio disponible para reenvío' });
    }),
  };
}

module.exports = { crearRecordatoriosController };
