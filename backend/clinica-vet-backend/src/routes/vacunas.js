const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/:paciente_id', (req, res) => {
  db.query(
    'SELECT * FROM vacuna WHERE paciente_id = ? ORDER BY fecha_aplicacion DESC',
    [req.params.paciente_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

router.post('/', (req, res) => {
  const { paciente_id, nombre, fecha_aplicacion, proxima_dosis, lote, fabricante, via_administracion, dosis, observaciones } = req.body;
  if (!paciente_id || !nombre || !fecha_aplicacion) {
    return res.status(400).json({ error: 'paciente_id, nombre y fecha_aplicacion son requeridos' });
  }
  db.query(
    'INSERT INTO vacuna (paciente_id, nombre, fecha_aplicacion, proxima_dosis, lote, fabricante, via_administracion, dosis, observaciones) VALUES (?,?,?,?,?,?,?,?,?)',
    [paciente_id, nombre, fecha_aplicacion, proxima_dosis || null, lote || null, fabricante || null, via_administracion || null, dosis || null, observaciones || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, mensaje: 'Vacuna registrada' });
    }
  );
});

module.exports = router;