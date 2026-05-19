const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authMiddleware, soloClinica, soloEmpleado } = require('../middleware/authMiddleware');

// Protege TODAS las rutas con authMiddleware
router.use(authMiddleware);

// ============================================================
// GET /api/dashboard/clinica
// Exclusivo para el rol de clínica (administrador/dueño)
// Devuelve:
//   - KPIs Globales: ingresos del mes, total pacientes, consultas hoy
//   - Scorecard de Empleados: actividad por empleado (consultas, cirugías, hospitalizaciones)
//   - Ingresos Recientes: últimos 5 recibos finalizados con paciente y empleado
//   - Alertas de Inventario: mock data temporal (tabla aún no creada)
// ============================================================
router.get('/clinica', soloClinica, (req, res) => {
  const clinica_id = req.user.clinica_id;

  // ── KPI 1: Total de ingresos del mes (recibos finalizados) ──
  const sqlIngresos = `
    SELECT COALESCE(SUM(total), 0) AS ingresos_mes
    FROM recibo
    WHERE clinica_id = ?
      AND status = 'finalizado'
      AND YEAR(fecha)  = YEAR(CURDATE())
      AND MONTH(fecha) = MONTH(CURDATE())
  `;

  // ── KPI 2: Total de pacientes registrados en la clínica ──
  const sqlPacientes = `
    SELECT COUNT(*) AS total_pacientes
    FROM paciente
    WHERE clinica_id = ?
  `;

  // ── KPI 3: Consultas realizadas hoy ──
  const sqlConsultasHoy = `
    SELECT COUNT(*) AS consultas_hoy
    FROM consulta c
    JOIN expediente e ON c.expediente_id = e.id
    WHERE e.clinica_id = ?
      AND c.fecha = CURDATE()
  `;

  // ── Scorecard de Empleados ──
  const sqlScorecard = `
    SELECT
      emp.id                                          AS empleado_id,
      CONCAT(emp.nombre, ' ', emp.apellidos)          AS empleado_nombre,
      r.nombre                                        AS rol,
      COALESCE(cons.total_consultas, 0)               AS total_consultas,
      COALESCE(cir.total_cirugias, 0)                 AS total_cirugias,
      COALESCE(hosp.total_hospitalizaciones, 0)       AS total_hospitalizaciones,
      (
        COALESCE(cons.total_consultas, 0) +
        COALESCE(cir.total_cirugias, 0) +
        COALESCE(hosp.total_hospitalizaciones, 0)
      )                                               AS total_actividad
    FROM empleados emp
    LEFT JOIN roles r ON emp.rol_id = r.id
    LEFT JOIN (
      SELECT c.empleado_id, COUNT(*) AS total_consultas
      FROM consulta c
      JOIN expediente e ON c.expediente_id = e.id
      WHERE e.clinica_id = ?
      GROUP BY c.empleado_id
    ) cons ON emp.id = cons.empleado_id
    LEFT JOIN (
      SELECT ce.empleado_id, COUNT(*) AS total_cirugias
      FROM cirugia_empleados ce
      JOIN cirugia ci ON ce.cirugia_id = ci.id
      JOIN expediente e ON ci.expediente_id = e.id
      WHERE e.clinica_id = ?
      GROUP BY ce.empleado_id
    ) cir ON emp.id = cir.empleado_id
    LEFT JOIN (
      SELECT he.empleado_id, COUNT(*) AS total_hospitalizaciones
      FROM hospitalizacion_empleados he
      JOIN hospitalizacion h ON he.hospitalizacion_id = h.id
      JOIN expediente e ON h.expediente_id = e.id
      WHERE e.clinica_id = ?
      GROUP BY he.empleado_id
    ) hosp ON emp.id = hosp.empleado_id
    WHERE emp.clinica_id = ?
    ORDER BY total_actividad DESC, emp.nombre ASC
  `;

  // ── Ingresos Recientes: últimos 5 recibos finalizados ──
  const sqlIngresosRecientes = `
    SELECT r.id, r.total, r.fecha, p.nombre AS paciente, e.nombre AS empleado
    FROM recibo r
    JOIN paciente p ON r.paciente_id = p.id
    JOIN empleados e ON r.empleado_id = e.id
    WHERE r.clinica_id = ?
      AND r.status = 'finalizado'
    ORDER BY r.fecha DESC
    LIMIT 5
  `;

  // ── Alertas de Inventario: productos con stock <= 5 ──
  const sqlAlertasInventario = `
    SELECT id, nombre, stock FROM inventario WHERE clinica_id = ? AND stock <= 5 ORDER BY stock ASC LIMIT 5
  `;

  // Ejecutar KPI de ingresos
  db.query(sqlIngresos, [clinica_id], (err, rowsIngresos) => {
    if (err) return res.status(500).json({ error: err.message });

    // Ejecutar KPI de pacientes
    db.query(sqlPacientes, [clinica_id], (err2, rowsPacientes) => {
      if (err2) return res.status(500).json({ error: err2.message });

      // Ejecutar KPI de consultas hoy
      db.query(sqlConsultasHoy, [clinica_id], (err3, rowsConsultasHoy) => {
        if (err3) return res.status(500).json({ error: err3.message });

        // Ejecutar scorecard de empleados
        db.query(sqlScorecard, [clinica_id, clinica_id, clinica_id, clinica_id], (err4, rowsScorecard) => {
          if (err4) return res.status(500).json({ error: err4.message });

          // Ejecutar ingresos recientes
          db.query(sqlIngresosRecientes, [clinica_id], (err5, rowsIngresosRecientes) => {
            if (err5) return res.status(500).json({ error: err5.message });

            // Ejecutar alertas de inventario
            db.query(sqlAlertasInventario, [clinica_id], (err6, rowsAlertasInventario) => {
              if (err6) return res.status(500).json({ error: err6.message });

              res.json({
                kpis: {
                  ingresos_mes:    parseFloat(rowsIngresos[0].ingresos_mes),
                  total_pacientes: rowsPacientes[0].total_pacientes,
                  consultas_hoy:   rowsConsultasHoy[0].consultas_hoy,
                },
                scorecard_empleados:  rowsScorecard,
                ingresos_recientes:   rowsIngresosRecientes,
                alertas_inventario:   rowsAlertasInventario,
              });
            });
          });
        });
      });
    });
  });
});

// ============================================================
// GET /api/dashboard/empleado
// Para el personal médico operativo (tipo 'empleado')
// Devuelve:
//   - Mis Tareas de Hoy: consultas y cirugías asignadas al empleado para hoy
// ============================================================
router.get('/empleado', soloEmpleado, (req, res) => {
  const empleado_id = req.user.id;
  const clinica_id  = req.user.clinica_id;

  // ── Consultas asignadas al empleado para hoy ──
  const sqlConsultasHoy = `
    SELECT COUNT(*) AS consultas_hoy
    FROM consulta c
    JOIN expediente e ON c.expediente_id = e.id
    WHERE c.empleado_id = ?
      AND e.clinica_id  = ?
      AND c.fecha       = CURDATE()
  `;

  // ── Cirugías asignadas al empleado para hoy ──
  const sqlCirugiasHoy = `
    SELECT COUNT(*) AS cirugias_hoy
    FROM cirugia_empleados ce
    JOIN cirugia ci ON ce.cirugia_id = ci.id
    JOIN expediente e ON ci.expediente_id = e.id
    WHERE ce.empleado_id = ?
      AND e.clinica_id   = ?
      AND ci.fecha       = CURDATE()
  `;

  // Ejecutar consultas hoy
  db.query(sqlConsultasHoy, [empleado_id, clinica_id], (err, rowsConsultas) => {
    if (err) return res.status(500).json({ error: err.message });

    // Ejecutar cirugías hoy
    db.query(sqlCirugiasHoy, [empleado_id, clinica_id], (err2, rowsCirugias) => {
      if (err2) return res.status(500).json({ error: err2.message });

      res.json({
        tareas_hoy: {
          consultas_hoy: rowsConsultas[0].consultas_hoy,
          cirugias_hoy:  rowsCirugias[0].cirugias_hoy,
          total_tareas:  rowsConsultas[0].consultas_hoy + rowsCirugias[0].cirugias_hoy,
        },
      });
    });
  });
});

module.exports = router;
