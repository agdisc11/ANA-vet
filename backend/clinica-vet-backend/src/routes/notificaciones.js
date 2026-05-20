const express = require('express');
const router = express.Router();
const { db } = require('../db/connection');
const { authMiddleware } = require('../middleware/authMiddleware');

// ============================================================
// GET /api/notificaciones
// Devuelve recordatorios próximos de la clínica autenticada:
//   - Vacunas con proxima_dosis en los próximos 7 días
//   - Consultas programadas para hoy o mañana
// Requiere: Bearer token (clinica o empleado)
// ============================================================
router.get('/', authMiddleware, (req, res) => {
  const clinica_id = req.user.clinica_id;

  // ── Query 1: Vacunas con próxima dosis en los próximos 7 días ──
  const sqlVacunas = `
    SELECT
      v.id,
      v.nombre AS vacuna_nombre,
      v.proxima_dosis AS fecha,
      p.nombre AS paciente_nombre,
      'vacuna' AS tipo,
      CONCAT('Próxima dosis de ', v.nombre, ' para ', p.nombre) AS mensaje
    FROM vacuna v
    JOIN paciente p ON v.paciente_id = p.id
    WHERE p.clinica_id = ?
      AND v.proxima_dosis IS NOT NULL
      AND v.proxima_dosis BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
    ORDER BY v.proxima_dosis ASC
  `;

  // ── Query 2: Consultas programadas para hoy o mañana ──
  const sqlConsultas = `
    SELECT
      c.id,
      c.fecha,
      c.motivo,
      p.nombre AS paciente_nombre,
      'consulta' AS tipo,
      CONCAT('Consulta de ', p.nombre,
        CASE
          WHEN c.fecha = CURDATE() THEN ' — HOY'
          ELSE ' — Mañana'
        END,
        CASE WHEN c.motivo IS NOT NULL THEN CONCAT(': ', c.motivo) ELSE '' END
      ) AS mensaje
    FROM consulta c
    JOIN expediente e ON c.expediente_id = e.id
    JOIN paciente p ON e.paciente_id = p.id
    WHERE p.clinica_id = ?
      AND c.fecha IN (CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY))
    ORDER BY c.fecha ASC
  `;

  // Ejecutar ambas queries en paralelo
  db.query(sqlVacunas, [clinica_id], (errV, vacunas) => {
    if (errV) return res.status(500).json({ error: errV.message });

    db.query(sqlConsultas, [clinica_id], (errC, consultas) => {
      if (errC) return res.status(500).json({ error: errC.message });

      // Unificar y ordenar por fecha
      const notificaciones = [
        ...vacunas.map(v => ({
          id: `vacuna-${v.id}`,
          tipo: 'vacuna',
          mensaje: v.mensaje,
          fecha: v.fecha,
          paciente: v.paciente_nombre,
        })),
        ...consultas.map(c => {
          const motivo = c.motivo || '';
          const esCirugia = /cirugía|operación|quirúrgico/i.test(motivo);
          const esLaboratorio = /biometría|química|laboratorio/i.test(motivo);

          const clasificacion = {};
          if (esCirugia) {
            clasificacion.requiere_ayuno = true;
            clasificacion.nota = 'Requiere ayuno estricto de 12 horas';
          } else if (esLaboratorio) {
            clasificacion.tipo = 'Revisión de Laboratorio';
          } else {
            clasificacion.tipo = 'Consulta General';
          }

          return {
            id: `consulta-${c.id}`,
            tipo: 'consulta',
            mensaje: c.mensaje,
            fecha: c.fecha,
            paciente: c.paciente_nombre,
            ...clasificacion,
          };
        }),
      ].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

      res.json(notificaciones);
    });
  });
});

module.exports = router;
