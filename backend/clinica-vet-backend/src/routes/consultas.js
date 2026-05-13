const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/:expediente_id', (req, res) => {
  db.query('SELECT * FROM consulta WHERE expediente_id = ?', [req.params.expediente_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.post('/', (req, res) => {
  const { expediente_id, fecha, motivo, anamnesis, examen_fisico, indicaciones } = req.body;
  db.query(
    'INSERT INTO consulta (expediente_id, fecha, motivo, anamnesis, examen_fisico, indicaciones) VALUES (?,?,?,?,?,?)',
    [expediente_id, fecha, motivo, anamnesis, examen_fisico, indicaciones],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, mensaje: 'Consulta registrada' });
    }
  );
});

module.exports = router;