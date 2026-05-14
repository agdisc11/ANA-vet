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
  if (!nombre || !apellidos) {
    return res.status(400).json({ error: 'nombre y apellidos son requeridos' });
  }

  const codigo = `TUT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
  db.query(
    'INSERT INTO tutor (nombre, apellidos, telefono, whatsapp, correo, direccion, codigo) VALUES (?,?,?,?,?,?,?)',
    [nombre, apellidos, telefono || null, whatsapp || null, correo || null, direccion || null, codigo],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, codigo, mensaje: 'Tutor creado' });
    }
  );
});

module.exports = router;