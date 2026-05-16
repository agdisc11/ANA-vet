const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.post('/', (req, res) => {
  const { cirugia_id, protocolo, farmacos, dosis, observaciones } = req.body;

  if (!cirugia_id) {
    return res.status(400).json({ error: 'cirugia_id es requerido' });
  }

  db.query('SELECT id FROM cirugia WHERE id = ?', [cirugia_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) {
      return res.status(404).json({ error: `La cirugía con id ${cirugia_id} no existe` });
    }

    db.query(
      'INSERT INTO anestesia (cirugia_id, protocolo, farmacos, dosis, observaciones) VALUES (?,?,?,?,?)',
      [cirugia_id, protocolo, farmacos, dosis, observaciones],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: result.insertId, mensaje: 'Anestesia registrada' });
      }
    );
  });
});

module.exports = router;
