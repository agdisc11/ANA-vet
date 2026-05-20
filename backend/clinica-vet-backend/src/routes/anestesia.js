const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authMiddleware } = require('../middleware/authMiddleware');

// Protege todas las rutas con autenticación
router.use(authMiddleware);

router.post('/', (req, res) => {
  const { cirugia_id, protocolo, farmacos, dosis, observaciones } = req.body;

  if (!cirugia_id) {
    return res.status(400).json({ error: 'cirugia_id es requerido' });
  }

  db.query(
    'INSERT INTO anestesia (cirugia_id, protocolo, farmacos, dosis, observaciones) VALUES (?,?,?,?,?)',
    [cirugia_id, protocolo || null, farmacos || null, dosis || null, observaciones || null],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
          return res.status(404).json({ error: `La cirugía con id ${cirugia_id} no existe` });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ id: result.insertId, mensaje: 'Anestesia registrada' });
    }
  );
});

module.exports = router;
