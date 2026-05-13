const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.post('/', (req, res) => {
  const { cirugia_id, protocolo, farmacos, dosis, observaciones } = req.body;
  db.query(
    'INSERT INTO anestesia (cirugia_id, protocolo, farmacos, dosis, observaciones) VALUES (?,?,?,?,?)',
    [cirugia_id, protocolo, farmacos, dosis, observaciones],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, mensaje: 'Anestesia registrada' });
    }
  );
});

module.exports = router;