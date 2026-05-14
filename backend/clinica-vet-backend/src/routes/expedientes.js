const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/:paciente_id', (req, res) => {
  db.query(
    'SELECT * FROM expediente WHERE paciente_id = ? ORDER BY fecha_apertura DESC',
    [req.params.paciente_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

router.post('/', (req, res) => {
  const { paciente_id } = req.body;
  if (!paciente_id) {
    return res.status(400).json({ error: 'paciente_id es requerido' });
  }

  db.query(
    'INSERT INTO expediente (paciente_id, fecha_apertura) VALUES (?, CURDATE())',
    [paciente_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, mensaje: 'Expediente creado' });
    }
  );
});

module.exports = router;