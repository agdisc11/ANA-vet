const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/all', (req, res) => {
  db.query(
    `SELECT v.*, p.nombre AS paciente_nombre, t.nombre AS tutor_nombre, t.apellidos AS tutor_apellidos
     FROM vacuna v
     JOIN paciente p ON v.paciente_id = p.id
     JOIN tutor t ON p.tutor_id = t.id
     ORDER BY v.fecha_aplicacion DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

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