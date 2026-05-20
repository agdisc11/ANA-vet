const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authMiddleware } = require('../middleware/authMiddleware');

// Protege todas las rutas con autenticación
router.use(authMiddleware);

router.get('/all', (req, res) => {
  const clinicaId = req.user.clinica_id;
  db.query(
    `SELECT v.*, p.nombre AS paciente_nombre, t.nombre AS tutor_nombre, t.apellidos AS tutor_apellidos
     FROM vacuna v
     JOIN paciente p ON v.paciente_id = p.id
     JOIN tutor t ON p.tutor_id = t.id
     WHERE p.clinica_id = ?
     ORDER BY v.fecha_aplicacion DESC`,
    [clinicaId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

router.get('/:paciente_id', (req, res) => {
  const clinicaId = req.user.clinica_id;
  db.query(
    `SELECT v.*
     FROM vacuna v
     JOIN paciente p ON v.paciente_id = p.id
     WHERE v.paciente_id = ? AND p.clinica_id = ?
     ORDER BY v.fecha_aplicacion DESC`,
    [req.params.paciente_id, clinicaId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

router.post('/', (req, res) => {
  const { paciente_id, nombre, fecha_aplicacion, proxima_dosis, lote, fabricante, via_administracion, dosis, observaciones } = req.body;
  if (!paciente_id || !nombre || !fecha_aplicacion) {
    return res.status(400).json({ error: 'paciente_id, nombre y fecha_aplicacion son requeridos' });
  }

  const clinicaId = req.user.clinica_id;

  // Verificar que el paciente pertenece a la clínica autenticada
  db.query(
    'SELECT id FROM paciente WHERE id = ? AND clinica_id = ?',
    [paciente_id, clinicaId],
    (errCheck, rows) => {
      if (errCheck) return res.status(500).json({ error: errCheck.message });
      if (rows.length === 0) return res.status(404).json({ error: 'Paciente no encontrado o no pertenece a esta clínica' });

      db.query(
        'INSERT INTO vacuna (paciente_id, nombre, fecha_aplicacion, proxima_dosis, lote, fabricante, via_administracion, dosis, observaciones) VALUES (?,?,?,?,?,?,?,?,?)',
        [paciente_id, nombre, fecha_aplicacion, proxima_dosis || null, lote || null, fabricante || null, via_administracion || null, dosis || null, observaciones || null],
        (err, result) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ id: result.insertId, mensaje: 'Vacuna registrada' });
        }
      );
    }
  );
});

module.exports = router;
