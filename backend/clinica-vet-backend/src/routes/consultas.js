const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/:expediente_id', (req, res) => {
  db.query(
    'SELECT * FROM consulta WHERE expediente_id = ? ORDER BY fecha DESC',
    [req.params.expediente_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

router.post('/', (req, res) => {
  const {
    expediente_id,
    fecha,
    motivo,
    resumen,
    anamnesis,
    examen_fisico,
    examenes_sistemicos,
    lista_problemas,
    dx_presuntivo,
    abordaje_dx,
    tratamiento,
    dx_definitivo,
    tratamiento_etiologico,
    indicaciones,
    seguimiento_medico
  } = req.body;
  if (!expediente_id) {
    return res.status(400).json({ error: 'expediente_id es requerido' });
  }

  db.query(
    'INSERT INTO consulta (expediente_id, fecha, motivo, resumen, anamnesis, examen_fisico, examenes_sistemicos, lista_problemas, dx_presuntivo, abordaje_dx, tratamiento, dx_definitivo, tratamiento_etiologico, indicaciones, seguimiento_medico) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [
      expediente_id,
      fecha || null,
      motivo || null,
      resumen || null,
      anamnesis || null,
      examen_fisico || null,
      examenes_sistemicos || null,
      lista_problemas || null,
      dx_presuntivo || null,
      abordaje_dx || null,
      tratamiento || null,
      dx_definitivo || null,
      tratamiento_etiologico || null,
      indicaciones || null,
      seguimiento_medico || null
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, mensaje: 'Consulta registrada' });
    }
  );
});

module.exports = router;