const express = require('express');
const { authMiddleware, soloClinica, soloEmpleado } = require('../middleware/authMiddleware');

function crearRouterDashboard({ dashboardController }) {
  const router = express.Router();
  router.use(authMiddleware);
  router.get('/clinica', soloClinica, dashboardController.resumenClinica);
  router.get('/empleado', soloEmpleado, dashboardController.resumenEmpleado);
  return router;
}

const { dashboardController } = require('../container');
const router = crearRouterDashboard({ dashboardController });
router.crearRouterDashboard = crearRouterDashboard;

module.exports = router;
