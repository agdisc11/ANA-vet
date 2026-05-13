const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', (req, res) => {
  db.query('SELECT * FROM tutor', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.post('/', (req, res) => {
  const { nombre, apellidos, telefono, whatsapp, correo, direccion } = req.body;
  db.query(
    'INSERT INTO tutor (nombre, apellidos, telefono, whatsapp, correo, direccion) VALUES (?,?,?,?,?,?)',
    [nombre, apellidos, telefono, whatsapp, correo, direccion],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, mensaje: 'Tutor creado' });
    }
  );
});

module.exports = router;