const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authMiddleware } = require('../middleware/authMiddleware');

// Protege todas las rutas con autenticación
router.use(authMiddleware);

router.get('/all', (req, res) => {
  const clinicaId = req.user.clinica_id;
  db.query(
    `SELECT c.id, c.fecha, c.procedimiento, c.notas, c.consentimiento,
            a.protocolo, a.farmacos, a.dosis, a.observaciones,
            e.paciente_id, p.nombre AS paciente_nombre,
            t.nombre AS tutor_nombre, t.apellidos AS tutor_apellidos,
            GROUP_CONCAT(DISTINCT CONCAT(emp.nombre, ' ', emp.apellidos) ORDER BY emp.nombre SEPARATOR ', ') AS empleados_nombres
     FROM cirugia c
     LEFT JOIN anestesia a ON c.id = a.cirugia_id
     JOIN expediente e ON c.expediente_id = e.id
     JOIN paciente p ON e.paciente_id = p.id
     JOIN tutor t ON p.tutor_id = t.id
     LEFT JOIN cirugia_empleados ce ON c.id = ce.cirugia_id
     LEFT JOIN empleados emp ON ce.empleado_id = emp.id
     WHERE e.clinica_id = ?
     GROUP BY c.id, a.id, e.paciente_id, p.nombre, t.nombre, t.apellidos
     ORDER BY c.fecha DESC`,
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
    `SELECT c.id, c.fecha, c.procedimiento, c.plan_quirurgico, c.notas, c.consentimiento,
            a.protocolo, a.farmacos, a.dosis, a.observaciones,
            GROUP_CONCAT(DISTINCT ce.empleado_id ORDER BY ce.empleado_id SEPARATOR ',') AS empleados_ids,
            GROUP_CONCAT(DISTINCT CONCAT(emp.nombre, ' ', emp.apellidos) ORDER BY emp.nombre SEPARATOR ', ') AS empleados_nombres
     FROM cirugia c
     JOIN expediente e ON c.expediente_id = e.id
     LEFT JOIN anestesia a ON c.id = a.cirugia_id
     LEFT JOIN cirugia_empleados ce ON c.id = ce.cirugia_id
     LEFT JOIN empleados emp ON ce.empleado_id = emp.id
     WHERE c.expediente_id = ? AND e.clinica_id = ?
     GROUP BY c.id, a.id
     ORDER BY c.fecha DESC`,
    [req.params.expediente_id, clinicaId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

router.post('/', (req, res) => {
  const { expediente_id, fecha, procedimiento, plan_quirurgico, notas, consentimiento, empleados_ids } = req.body;
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
        'INSERT INTO cirugia (expediente_id, fecha, procedimiento, plan_quirurgico, notas, consentimiento) VALUES (?,?,?,?,?,?)',
        [expediente_id, fecha || null, procedimiento || null, plan_quirurgico || null, notas || null, consentimiento || null],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });

          const cirugiaId = result.insertId;

          // Si no hay empleados, responder de inmediato
          if (!Array.isArray(empleados_ids) || empleados_ids.length === 0) {
            return res.json({ id: cirugiaId, mensaje: 'Cirugía registrada' });
          }

          // Insertar relaciones en tabla puente cirugia_empleados de forma secuencial
          const insertarEmpleado = (index) => {
            if (index >= empleados_ids.length) {
              return res.json({ id: cirugiaId, mensaje: 'Cirugía registrada' });
            }
            const empId = parseInt(empleados_ids[index], 10);
            if (!empId || isNaN(empId)) return insertarEmpleado(index + 1);

            db.query(
              'INSERT IGNORE INTO cirugia_empleados (cirugia_id, empleado_id) VALUES (?, ?)',
              [cirugiaId, empId],
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
