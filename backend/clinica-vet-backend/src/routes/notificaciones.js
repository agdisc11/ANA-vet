const express = require('express');
const router = express.Router();
const { query } = require('../db/connection');
const { authMiddleware } = require('../middleware/authMiddleware');
const asyncHandler = require('../middleware/asyncHandler');

// ============================================================
// GET /api/notificaciones
// Recordatorios próximos de la clínica autenticada:
//   - Vacunas con proxima_dosis en los próximos 7 días
//   - Consultas programadas para hoy o mañana
//   - Citas de agenda (programadas/confirmadas) para hoy o mañana
// Requiere: Bearer token (clinica o empleado)
// ============================================================

const SQL_VACUNAS = `
  SELECT
    v.id,
    v.proxima_dosis AS fecha,
    p.nombre AS paciente_nombre,
    CONCAT('Próxima dosis de ', v.nombre, ' para ', p.nombre) AS mensaje
  FROM vacuna v
  JOIN paciente p ON v.paciente_id = p.id
  WHERE p.clinica_id = ?
    AND v.proxima_dosis IS NOT NULL
    AND v.proxima_dosis BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
  ORDER BY v.proxima_dosis ASC
`;

const SQL_CONSULTAS = `
  SELECT
    c.id,
    c.fecha,
    c.motivo,
    p.nombre AS paciente_nombre,
    CONCAT('Consulta de ', p.nombre,
      CASE WHEN c.fecha = CURDATE() THEN ' — HOY' ELSE ' — Mañana' END,
      CASE WHEN c.motivo IS NOT NULL THEN CONCAT(': ', c.motivo) ELSE '' END
    ) AS mensaje
  FROM consulta c
  JOIN expediente e ON c.expediente_id = e.id
  JOIN paciente p ON e.paciente_id = p.id
  WHERE p.clinica_id = ?
    AND c.fecha IN (CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY))
  ORDER BY c.fecha ASC
`;

const SQL_CITAS = `
  SELECT
    c.id,
    c.fecha,
    c.hora_inicio,
    c.motivo,
    p.nombre AS paciente_nombre,
    CONCAT('Cita de ', p.nombre,
      CASE WHEN c.fecha = CURDATE() THEN ' — HOY ' ELSE ' — Mañana ' END,
      DATE_FORMAT(c.hora_inicio, '%H:%i'),
      CASE WHEN c.motivo IS NOT NULL THEN CONCAT(': ', c.motivo) ELSE '' END
    ) AS mensaje
  FROM cita c
  JOIN paciente p ON c.paciente_id = p.id
  WHERE c.clinica_id = ?
    AND c.fecha IN (CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY))
    AND c.estado IN ('programada', 'confirmada')
  ORDER BY c.fecha ASC, c.hora_inicio ASC
`;

function clasificarConsulta(motivo) {
  const texto = motivo || '';
  if (/cirugía|operación|quirúrgico/i.test(texto)) {
    return { requiere_ayuno: true, nota: 'Requiere ayuno estricto de 12 horas' };
  }
  if (/biometría|química|laboratorio/i.test(texto)) {
    return { tipo_consulta: 'Revisión de Laboratorio' };
  }
  return { tipo_consulta: 'Consulta General' };
}

router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const clinicaId = req.user.clinica_id;

  const [vacunas, consultas, citas] = await Promise.all([
    query(SQL_VACUNAS, [clinicaId]),
    query(SQL_CONSULTAS, [clinicaId]),
    query(SQL_CITAS, [clinicaId]),
  ]);

  const notificaciones = [
    ...vacunas.map((v) => ({
      id: `vacuna-${v.id}`,
      tipo: 'vacuna',
      mensaje: v.mensaje,
      fecha: v.fecha,
      paciente: v.paciente_nombre,
    })),
    ...consultas.map((c) => ({
      id: `consulta-${c.id}`,
      tipo: 'consulta',
      mensaje: c.mensaje,
      fecha: c.fecha,
      paciente: c.paciente_nombre,
      ...clasificarConsulta(c.motivo),
    })),
    ...citas.map((c) => ({
      id: `cita-${c.id}`,
      tipo: 'cita',
      mensaje: c.mensaje,
      fecha: c.fecha,
      hora: String(c.hora_inicio).slice(0, 5),
      paciente: c.paciente_nombre,
    })),
  ].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  res.json(notificaciones);
}));

module.exports = router;
