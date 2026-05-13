const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', (req, res) => {
  const sql = `
    SELECT p.*, CONCAT(t.nombre, ' ', t.apellidos) AS tutor
    FROM paciente p
    JOIN tutor t ON p.tutor_id = t.id
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.get('/:id', (req, res) => {
  db.query('SELECT * FROM paciente WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ mensaje: 'No encontrado' });
    res.json(results[0]);
  });
});

router.post('/', (req, res) => {
  const { tutor_id, nombre, especie, raza, sexo, fecha_nacimiento, funcion_zootecnica, tatuaje, microchip } = req.body;
  
  // Validar campos requeridos
  if (!tutor_id || !nombre || !especie || !sexo) {
    return res.status(400).json({ error: 'Faltan campos requeridos: tutor_id, nombre, especie, sexo' });
  }
  
  db.query(
    'INSERT INTO paciente (tutor_id, nombre, especie, raza, sexo, fecha_nacimiento, funcion_zootecnica, tatuaje, microchip) VALUES (?,?,?,?,?,?,?,?,?)',
    [tutor_id, nombre, especie, raza || null, sexo, fecha_nacimiento || null, funcion_zootecnica || null, tatuaje || null, microchip || null],
    (err, result) => {
      if (err) {
        console.error('Error al insertar paciente:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: result.insertId, mensaje: 'Paciente creado' });
    }
  );
});

router.put('/:id', (req, res) => {
  const { nombre, especie, raza, sexo, fecha_nacimiento, funcion_zootecnica, tatuaje, microchip } = req.body;
  db.query(
    'UPDATE paciente SET nombre=?, especie=?, raza=?, sexo=?, fecha_nacimiento=?, funcion_zootecnica=?, tatuaje=?, microchip=? WHERE id=?',
    [nombre, especie, raza, sexo, fecha_nacimiento, funcion_zootecnica, tatuaje, microchip, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Paciente actualizado' });
    }
  );
});

module.exports = router;