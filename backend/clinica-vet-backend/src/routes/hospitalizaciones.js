const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/:expediente_id', (req, res) => {
  db.query('SELECT * FROM hospitalizacion WHERE expediente_id = ?', [req.params.expediente_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.post('/', (req, res) => {
  const { expediente_id, fecha_ingreso, historia_clinica, abordaje_hospitalario, tratamiento_intrahospitalario, abordaje_diagnostico } = req.body;
  db.query(
    'INSERT INTO hospitalizacion (expediente_id, fecha_ingreso, historia_clinica, abordaje_hospitalario, tratamiento_intrahospitalario, abordaje_diagnostico) VALUES (?,?,?,?,?,?)',
    [expediente_id, fecha_ingreso, historia_clinica, abordaje_hospitalario, tratamiento_intrahospitalario, abordaje_diagnostico],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, mensaje: 'Hospitalización registrada' });
    }
  );
});

module.exports = router;