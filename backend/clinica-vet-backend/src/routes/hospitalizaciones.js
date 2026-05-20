const express = require('express');
const router = express.Router();
const { db } = require('../db/connection');
const { authMiddleware } = require('../middleware/authMiddleware');

// Protege todas las rutas con autenticación
router.use(authMiddleware);

router.get('/all', (req, res) => {
  const clinicaId = req.user.clinica_id;
  db.query(
    `SELECT h.*, e.paciente_id, p.nombre AS paciente_nombre,
            t.nombre AS tutor_nombre, t.apellidos AS tutor_apellidos,
            GROUP_CONCAT(DISTINCT CONCAT(emp.nombre, ' ', emp.apellidos) ORDER BY emp.nombre SEPARATOR ', ') AS empleados_nombres
     FROM hospitalizacion h
     JOIN expediente e ON h.expediente_id = e.id
     JOIN paciente p ON e.paciente_id = p.id
     JOIN tutor t ON p.tutor_id = t.id
     LEFT JOIN hospitalizacion_empleados he ON h.id = he.hospitalizacion_id
     LEFT JOIN empleados emp ON he.empleado_id = emp.id
     WHERE e.clinica_id = ?
     GROUP BY h.id, e.paciente_id, p.nombre, t.nombre, t.apellidos
     ORDER BY h.fecha_ingreso DESC`,
    [clinicaId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

router.get('/:expediente_id', (req, res) => {
  const clinicaId = req.user.clinica_id;
  db.query(
    `SELECT h.*,
            GROUP_CONCAT(DISTINCT he.empleado_id ORDER BY he.empleado_id SEPARATOR ',') AS empleados_ids,
            GROUP_CONCAT(DISTINCT CONCAT(emp.nombre, ' ', emp.apellidos) ORDER BY emp.nombre SEPARATOR ', ') AS empleados_nombres
     FROM hospitalizacion h
     JOIN expediente e ON h.expediente_id = e.id
     LEFT JOIN hospitalizacion_empleados he ON h.id = he.hospitalizacion_id
     LEFT JOIN empleados emp ON he.empleado_id = emp.id
     WHERE h.expediente_id = ? AND e.clinica_id = ?
     GROUP BY h.id
     ORDER BY h.fecha_ingreso DESC`,
    [req.params.expediente_id, clinicaId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

router.post('/', (req, res) => {
  const {
    expediente_id, fecha_ingreso, historia_clinica, abordaje_hospitalario,
    tratamiento_intrahospitalario, abordaje_diagnostico, seguimiento,
    revaloraciones, ajuste_plan_terapeutico, plan_diagnostico,
    tipo_alta, acta_responsiva, empleados_ids
  } = req.body;

  if (!expediente_id) {
    return res.status(400).json({ error: 'expediente_id es requerido' });
  }

  const clinicaId = req.user.clinica_id;

  // Verificar que el expediente pertenece a la clínica autenticada
  db.query(
    'SELECT id FROM expediente WHERE id = ? AND clinica_id = ?',
    [expediente_id, clinicaId],
    (errCheck, rows) => {
      if (errCheck) return res.status(500).json({ error: errCheck.message });
      if (rows.length === 0) return res.status(404).json({ error: 'Expediente no encontrado o no pertenece a esta clínica' });

      db.query(
        'INSERT INTO hospitalizacion (expediente_id, fecha_ingreso, historia_clinica, abordaje_hospitalario, tratamiento_intrahospitalario, abordaje_diagnostico, seguimiento, revaloraciones, ajuste_plan_terapeutico, plan_diagnostico, tipo_alta, acta_responsiva) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [
          expediente_id,
          fecha_ingreso || null,
          historia_clinica || null,
          abordaje_hospitalario || null,
          tratamiento_intrahospitalario || null,
          abordaje_diagnostico || null,
          seguimiento || null,
          revaloraciones || null,
          ajuste_plan_terapeutico || null,
          plan_diagnostico || null,
          tipo_alta || null,
          acta_responsiva ? 1 : 0
        ],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });

          const hospId = result.insertId;

          // Si no hay empleados, responder de inmediato
          if (!Array.isArray(empleados_ids) || empleados_ids.length === 0) {
            return res.json({ id: hospId, mensaje: 'Hospitalización registrada' });
          }

          // Insertar relaciones en tabla puente hospitalizacion_empleados de forma secuencial
          const insertarEmpleado = (index) => {
            if (index >= empleados_ids.length) {
              return res.json({ id: hospId, mensaje: 'Hospitalización registrada' });
            }
            const empId = parseInt(empleados_ids[index], 10);
            if (!empId || isNaN(empId)) return insertarEmpleado(index + 1);

            db.query(
              'INSERT IGNORE INTO hospitalizacion_empleados (hospitalizacion_id, empleado_id) VALUES (?, ?)',
              [hospId, empId],
              (err2) => {
                if (err2) return res.status(500).json({ error: err2.message });
                insertarEmpleado(index + 1);
              }
            );
          };

          insertarEmpleado(0);
        }
      );
    }
  );
});

module.exports = router;
