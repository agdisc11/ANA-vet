const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', (req, res) => {
  db.query('SELECT id, nombre, apellidos, telefono, whatsapp, correo, direccion, codigo, estatus FROM tutor ORDER BY nombre', (err, results) => {
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

router.put('/:id', (req, res) => {
  const { nombre, apellidos, telefono, whatsapp, correo, direccion } = req.body;
  if (!nombre || !apellidos) {
    return res.status(400).json({ error: 'nombre y apellidos son requeridos' });
  }
  db.query(
    'UPDATE tutor SET nombre=?, apellidos=?, telefono=?, whatsapp=?, correo=?, direccion=? WHERE id=?',
    [nombre, apellidos, telefono || null, whatsapp || null, correo || null, direccion || null, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Tutor no encontrado' });
      res.json({ mensaje: 'Tutor actualizado' });
    }
  );
});

// Soft Delete: Dar de baja (estatus = 'inactivo')
router.delete('/:id', (req, res) => {
  if (!req.user || req.user.rol !== 'clinica') {
    return res.status(403).json({ error: 'Acceso denegado. Solo el administrador de la clínica puede dar de baja tutores.' });
  }

  const tutorId = req.params.id;
  const clinicaId = req.user.clinica_id;

  db.query(
    "UPDATE tutor SET estatus = 'inactivo' WHERE id = ? AND clinica_id = ?",
    [tutorId, clinicaId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Tutor no encontrado o no pertenece a esta clínica.' });
      }
      res.json({ mensaje: 'Tutor dado de baja correctamente.' });
    }
  );
});

// Vetar tutor (estatus = 'vetado')
router.put('/:id/vetar', (req, res) => {
  if (!req.user || req.user.rol !== 'clinica') {
    return res.status(403).json({ error: 'Acceso denegado. Solo el administrador de la clínica puede vetar tutores.' });
  }

  const tutorId = req.params.id;
  const clinicaId = req.user.clinica_id;

  db.query(
    "UPDATE tutor SET estatus = 'vetado' WHERE id = ? AND clinica_id = ?",
    [tutorId, clinicaId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Tutor no encontrado o no pertenece a esta clínica.' });
      }
      res.json({ mensaje: 'Tutor vetado correctamente.' });
    }
  );
});

module.exports = router;
