const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validate, validateQuery } = require('../middleware/validate');
const { crearHospitalizacionSchema } = require('../validators/clinicoSchema');
const { crearTareaSchema, crearPautaSchema, hojaQuerySchema } = require('../validators/tratamientoSchema');

function crearRouterHospitalizaciones({ hospitalizacionesController, tratamientoController }) {
  const router = express.Router();
  router.use(authMiddleware);

  // Rutas fijas antes de las paramétricas
  router.get('/all', hospitalizacionesController.getAll);

  // Hoja de tratamiento hospitalario (Fase 3.6)
  if (tratamientoController) {
    router.get('/internados', validateQuery(hojaQuerySchema), tratamientoController.internados);
    router.get('/:id/tratamiento', validateQuery(hojaQuerySchema), tratamientoController.hoja);
    router.post('/:id/tratamiento/pauta', validate(crearPautaSchema), tratamientoController.crearPauta);
    router.post('/:id/tratamiento', validate(crearTareaSchema), tratamientoController.crearTarea);
  }

  router.get('/:expediente_id', hospitalizacionesController.getByExpediente);
  router.post('/', validate(crearHospitalizacionSchema), hospitalizacionesController.create);

  return router;
}

const { hospitalizacionesController, tratamientoController } = require('../container');
const router = crearRouterHospitalizaciones({ hospitalizacionesController, tratamientoController });
router.crearRouterHospitalizaciones = crearRouterHospitalizaciones;

module.exports = router;
