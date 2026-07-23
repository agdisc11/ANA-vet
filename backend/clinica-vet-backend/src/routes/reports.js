const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');

function crearRouterReports({ reportsController }) {
  const router = express.Router();
  router.use(authMiddleware);
  router.get('/pacientes', reportsController.reportePacientes);
  router.get('/tutores', reportsController.reporteTutores);
  router.get('/hospitalizaciones', reportsController.reporteHospitalizaciones);
  router.get('/cirugias', reportsController.reporteCirugias);
  router.get('/consultas', reportsController.reporteConsultas);
  router.get('/vacunas', reportsController.reporteVacunas);
  router.get('/general', reportsController.reporteGeneral);
  router.get('/expediente/:paciente_id', reportsController.reporteExpediente);
  return router;
}

const { reportsController } = require('../container');
const router = crearRouterReports({ reportsController });
router.crearRouterReports = crearRouterReports;

module.exports = router;
