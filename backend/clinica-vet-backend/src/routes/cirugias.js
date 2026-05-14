const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/:expediente_id', (req, res) => {
  db.query(
    `SELECT c.*, a.protocolo, a.farmacos, a.dosis, a.observaciones
     FROM cirugia c
     LEFT JOIN anestesia a ON c.id = a.cirugia_id
     WHERE c.expediente_id = ?
     ORDER BY c.fecha DESC`,
    [req.params.expediente_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

router.post('/', (req, res) => {
  const { expediente_id, fecha, procedimiento, plan_quirurgico, notas, consentimiento } = req.body;
  if (!expediente_id) {
    return res.status(400).json({ error: 'expediente_id es requerido' });
  }
  db.query(
    'INSERT INTO cirugia (expediente_id, fecha, procedimiento, plan_quirurgico, notas, consentimiento) VALUES (?,?,?,?,?,?)',
    [expediente_id, fecha || null, procedimiento || null, plan_quirurgico || null, notas || null, consentimiento || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, mensaje: 'Cirugía registrada' });
    }
  );
});

module.exports = router;