const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/:paciente_id', (req, res) => {
  db.query('SELECT * FROM vacuna WHERE paciente_id = ?', [req.params.paciente_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.post('/', (req, res) => {
  const { paciente_id, nombre, fecha_aplicacion, proxima_dosis, lote } = req.body;
  db.query(
    'INSERT INTO vacuna (paciente_id, nombre, fecha_aplicacion, proxima_dosis, lote) VALUES (?,?,?,?,?)',
    [paciente_id, nombre, fecha_aplicacion, proxima_dosis, lote],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, mensaje: 'Vacuna registrada' });
    }
  );
});

module.exports = router;