const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/:expediente_id', (req, res) => {
  db.query('SELECT * FROM cirugia WHERE expediente_id = ?', [req.params.expediente_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.post('/', (req, res) => {
  const { expediente_id, fecha, procedimiento, plan_quirurgico, notas } = req.body;
  db.query(
    'INSERT INTO cirugia (expediente_id, fecha, procedimiento, plan_quirurgico, notas) VALUES (?,?,?,?,?)',
    [expediente_id, fecha, procedimiento, plan_quirurgico, notas],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, mensaje: 'Cirugía registrada' });
    }
  );
});

module.exports = router;