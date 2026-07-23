const express = require('express');
const { authMiddleware, soloClinica } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const {
  productoSchema,
  solicitudReabastecimientoSchema,
  actualizarSolicitudSchema,
} = require('../validators/adminSchema');

/**
 * Router de inventario.
 * Lectura y solicitudes: cualquier usuario autenticado de la clínica.
 * Gestión de productos y resolución de solicitudes: solo administrador.
 */
function crearRouterInventario({ inventarioController }) {
  const router = express.Router();

  router.use(authMiddleware);

  router.get('/', inventarioController.getAll);
  // Rutas fijas antes de las paramétricas
  router.get('/solicitudes', soloClinica, inventarioController.getSolicitudes);
  router.post('/reabastecer', validate(solicitudReabastecimientoSchema), inventarioController.solicitar);
  router.put('/solicitudes/:id', soloClinica, validate(actualizarSolicitudSchema), inventarioController.updateSolicitud);
  router.post('/', soloClinica, validate(productoSchema), inventarioController.create);
  router.put('/:id', soloClinica, validate(productoSchema), inventarioController.update);

  return router;
}

const { inventarioController } = require('../container');
const router = crearRouterInventario({ inventarioController });
router.crearRouterInventario = crearRouterInventario;

module.exports = router;
