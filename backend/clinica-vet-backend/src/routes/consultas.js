const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/all', (req, res) => {
  db.query(
    `SELECT c.*, e.paciente_id, p.nombre AS paciente_nombre, t.nombre AS tutor_nombre, t.apellidos AS tutor_apellidos,
            emp.id AS empleado_id, emp.nombre AS empleado_nombre, emp.apellidos AS empleado_apellidos
     FROM consulta c
     JOIN expediente e ON c.expediente_id = e.id
     JOIN paciente p ON e.paciente_id = p.id
     JOIN tutor t ON p.tutor_id = t.id
     LEFT JOIN empleados emp ON c.empleado_id = emp.id
     ORDER BY c.fecha DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

router.get('/:expediente_id', (req, res) => {
  db.query(
    `SELECT c.*, emp.id AS empleado_id, emp.nombre AS empleado_nombre, emp.apellidos AS empleado_apellidos
     FROM consulta c
     LEFT JOIN empleados emp ON c.empleado_id = emp.id
     WHERE c.expediente_id = ?
     ORDER BY c.fecha DESC`,
    [req.params.expediente_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

router.post('/', (req, res) => {
  const {
    expediente_id,
    fecha,
    motivo,
    resumen,
    anamnesis,
    examen_fisico,
    examenes_sistemicos,
    lista_problemas,
    dx_presuntivo,
    abordaje_dx,
    tratamiento,
    dx_definitivo,
    tratamiento_etiologico,
    indicaciones,
    seguimiento_medico,
    empleado_id
  } = req.body;

  if (!expediente_id) {
    return res.status(400).json({ error: 'expediente_id es requerido' });
  }

  db.query(
    'INSERT INTO consulta (expediente_id, empleado_id, fecha, motivo, resumen, anamnesis, examen_fisico, examenes_sistemicos, lista_problemas, dx_presuntivo, abordaje_dx, tratamiento, dx_definitivo, tratamiento_etiologico, indicaciones, seguimiento_medico) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [
      expediente_id,
      empleado_id || null,
      fecha || null,
      motivo || null,
      resumen || null,
      anamnesis || null,
      examen_fisico || null,
      examenes_sistemicos || null,
      lista_problemas || null,
      dx_presuntivo || null,
      abordaje_dx || null,
      tratamiento || null,
      dx_definitivo || null,
      tratamiento_etiologico || null,
      indicaciones || null,
      seguimiento_medico || null
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, mensaje: 'Consulta registrada' });
    }
  );
});

module.exports = router;
