const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate, validateQuery } = require('../middleware/validate');
const { listarRecordatoriosQuerySchema, marcarEnviadoSchema } = require('../validators/recordatorioSchema');

function crearRouterRecordatorios({ recordatoriosController }) {
  const router = express.Router();
  router.use(authMiddleware);
  router.get('/', validateQuery(listarRecordatoriosQuerySchema), recordatoriosController.getAll);
  router.post('/enviado', validate(marcarEnviadoSchema), recordatoriosController.marcarEnviado);
  router.delete('/enviado/:tipo/:referencia_id', recordatoriosController.desmarcarEnviado);
  return router;
}

const { recordatoriosController } = require('../container');
const router = crearRouterRecordatorios({ recordatoriosController });
router.crearRouterRecordatorios = crearRouterRecordatorios;

module.exports = router;
