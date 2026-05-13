const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/:paciente_id', (req, res) => {
  db.query('SELECT * FROM expediente WHERE paciente_id = ?', [req.params.paciente_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.post('/', (req, res) => {
  const { paciente_id, anamnesis, examen_fisico, examenes_sistemicos, lista_problemas, dx_presuntivo, abordaje_dx, dx_definitivo } = req.body;
  db.query(
    'INSERT INTO expediente (paciente_id, fecha_apertura, anamnesis, examen_fisico, examenes_sistemicos, lista_problemas, dx_presuntivo, abordaje_dx, dx_definitivo) VALUES (?,CURDATE(),?,?,?,?,?,?,?)',
    [paciente_id, anamnesis, examen_fisico, examenes_sistemicos, lista_problemas, dx_presuntivo, abordaje_dx, dx_definitivo],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, mensaje: 'Expediente creado' });
    }
  );
});

module.exports = router;