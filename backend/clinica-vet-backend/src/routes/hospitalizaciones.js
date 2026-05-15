const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/all', (req, res) => {
  db.query(
    `SELECT h.*, e.paciente_id, p.nombre AS paciente_nombre, t.nombre AS tutor_nombre, t.apellidos AS tutor_apellidos
     FROM hospitalizacion h
     JOIN expediente e ON h.expediente_id = e.id
     JOIN paciente p ON e.paciente_id = p.id
     JOIN tutor t ON p.tutor_id = t.id
     ORDER BY h.fecha_ingreso DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

router.get('/:expediente_id', (req, res) => {
  db.query(
    'SELECT * FROM hospitalizacion WHERE expediente_id = ? ORDER BY fecha_ingreso DESC',
    [req.params.expediente_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

router.post('/', (req, res) => {
  const { expediente_id, fecha_ingreso, historia_clinica, abordaje_hospitalario, tratamiento_intrahospitalario, abordaje_diagnostico, seguimiento, revaloraciones, ajuste_plan_terapeutico, plan_diagnostico, tipo_alta, acta_responsiva } = req.body;
  if (!expediente_id) {
    return res.status(400).json({ error: 'expediente_id es requerido' });
  }
  db.query(
    'INSERT INTO hospitalizacion (expediente_id, fecha_ingreso, historia_clinica, abordaje_hospitalario, tratamiento_intrahospitalario, abordaje_diagnostico, seguimiento, revaloraciones, ajuste_plan_terapeutico, plan_diagnostico, tipo_alta, acta_responsiva) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
    [expediente_id, fecha_ingreso || null, historia_clinica || null, abordaje_hospitalario || null, tratamiento_intrahospitalario || null, abordaje_diagnostico || null, seguimiento || null, revaloraciones || null, ajuste_plan_terapeutico || null, plan_diagnostico || null, tipo_alta || null, acta_responsiva ? 1 : 0],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, mensaje: 'Hospitalización registrada' });
    }
  );
});

module.exports = router;