const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authMiddleware } = require('../middleware/authMiddleware');

// Protege todas las rutas con autenticación
router.use(authMiddleware);

const BASE_SQL = `
  SELECT p.*, CONCAT(t.nombre, ' ', t.apellidos) AS tutor,
    TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) AS edad
  FROM paciente p
  LEFT JOIN tutor t ON p.tutor_id = t.id
`;

router.get('/', (req, res) => {
  const clinicaId = req.user.clinica_id;
  db.query(BASE_SQL + ' WHERE p.clinica_id = ? ORDER BY p.nombre', [clinicaId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.get('/:id', (req, res) => {
  const clinicaId = req.user.clinica_id;
  const sql = BASE_SQL + ' WHERE p.id = ? AND p.clinica_id = ?';

  db.query(sql, [req.params.id, clinicaId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ mensaje: 'No encontrado' });
    res.json(results[0]);
  });
});

router.post('/', (req, res) => {
  const { tutor_id, nombre, especie, raza, sexo, fecha_nacimiento, funcion_zootecnica, tatuaje, microchip, esquemas_preventivos } = req.body;
  
  // Validar campos requeridos
  if (!tutor_id || !nombre || !especie || !sexo) {
    return res.status(400).json({ error: 'Faltan campos requeridos: tutor_id, nombre, especie, sexo' });
  }

  const clinicaId = req.user.clinica_id;
  
  db.query(
    'INSERT INTO paciente (clinica_id, tutor_id, nombre, especie, raza, sexo, fecha_nacimiento, funcion_zootecnica, tatuaje, microchip, esquemas_preventivos) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [clinicaId, tutor_id, nombre, especie, raza || null, sexo, fecha_nacimiento || null, funcion_zootecnica || null, tatuaje || null, microchip || null, esquemas_preventivos || null],
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
  const { nombre, especie, raza, sexo, fecha_nacimiento, funcion_zootecnica, tatuaje, microchip, esquemas_preventivos } = req.body;
  if (!nombre || !especie || !sexo) {
    return res.status(400).json({ error: 'Faltan campos requeridos: nombre, especie, sexo' });
  }
  const clinicaId = req.user.clinica_id;
  db.query(
    'UPDATE paciente SET nombre=?, especie=?, raza=?, sexo=?, fecha_nacimiento=?, funcion_zootecnica=?, tatuaje=?, microchip=?, esquemas_preventivos=? WHERE id=? AND clinica_id=?',
    [nombre, especie, raza || null, sexo, fecha_nacimiento || null, funcion_zootecnica || null, tatuaje || null, microchip || null, esquemas_preventivos || null, req.params.id, clinicaId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Paciente no encontrado' });
      res.json({ mensaje: 'Paciente actualizado' });
    }
  );
});

router.put('/:id/reasignar', (req, res) => {
  const { nuevo_tutor_id } = req.body;
  if (!nuevo_tutor_id) {
    return res.status(400).json({ error: 'Falta el campo requerido: nuevo_tutor_id' });
  }
  const clinicaId = req.user.clinica_id;
  db.query(
    'UPDATE paciente SET tutor_id = ? WHERE id = ? AND clinica_id = ?',
    [nuevo_tutor_id, req.params.id, clinicaId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Paciente no encontrado' });
      res.json({ mensaje: 'Tutor reasignado correctamente' });
    }
  );
});

router.delete('/:id', (req, res) => {
  const clinicaId = req.user.clinica_id;
  db.query('DELETE FROM paciente WHERE id=? AND clinica_id=?', [req.params.id, clinicaId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Paciente no encontrado' });
    res.json({ mensaje: 'Paciente eliminado' });
  });
});

module.exports = router;
