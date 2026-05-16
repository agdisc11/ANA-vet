const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');

// Rutas para generar reportes en PDF
router.get('/pacientes', reportsController.reportePacientes);
router.get('/hospitalizaciones', reportsController.reporteHospitalizaciones);
router.get('/cirugias', reportsController.reporteCirugias);
router.get('/consultas', reportsController.reporteConsultas);
router.get('/vacunas', reportsController.reporteVacunas);
router.get('/general', reportsController.reporteGeneral);
router.get('/expediente/:paciente_id', reportsController.reporteExpediente);

module.exports = router;
