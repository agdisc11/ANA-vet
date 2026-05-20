const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authMiddleware } = require('../middleware/authMiddleware');

// Roles con permiso para vetar/dar de baja tutores:
// tipo 'clinica' (Administrador) O tipo 'empleado' con rol_id 2 (Veterinario)
function puedeGestionarTutores(req, res, next) {
  if (!req.user) {
    return res.status(403).json({ error: 'Acceso denegado.' });
  }
  const { tipo, rol_id } = req.user;
  if (tipo === 'clinica' || (tipo === 'empleado' && Number(rol_id) === 2)) {
    return next();
  }
  return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de Administrador o Veterinario.' });
}

// Protege todas las rutas con autenticación
router.use(authMiddleware);

router.get('/', (req, res) => {
  const clinicaId = req.user.clinica_id;
  db.query(
    'SELECT id, nombre, apellidos, telefono, whatsapp, correo, direccion, codigo, estatus FROM tutor WHERE clinica_id = ? ORDER BY nombre',
    [clinicaId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    }
  );
});

router.post('/', (req, res) => {
  const { nombre, apellidos, telefono, whatsapp, correo, direccion } = req.body;
  if (!nombre || !apellidos) {
    return res.status(400).json({ error: 'nombre y apellidos son requeridos' });
  }

  const clinicaId = req.user.clinica_id;
  const codigo = `TUT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

  db.query(
    'INSERT INTO tutor (clinica_id, nombre, apellidos, telefono, whatsapp, correo, direccion, codigo) VALUES (?,?,?,?,?,?,?,?)',
    [clinicaId, nombre, apellidos, telefono || null, whatsapp || null, correo || null, direccion || null, codigo],
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
  const clinicaId = req.user.clinica_id;
  db.query(
    'UPDATE tutor SET nombre=?, apellidos=?, telefono=?, whatsapp=?, correo=?, direccion=? WHERE id=? AND clinica_id=?',
    [nombre, apellidos, telefono || null, whatsapp || null, correo || null, direccion || null, req.params.id, clinicaId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Tutor no encontrado' });
      res.json({ mensaje: 'Tutor actualizado' });
    }
  );
});

// Soft Delete: Dar de baja (estatus = 'inactivo')
router.delete('/:id', puedeGestionarTutores, (req, res) => {
  const tutorId = req.params.id;
  const clinicaId = req.user.clinica_id;

  db.query(
    "UPDATE tutor SET estatus = 'inactivo' WHERE id = ? AND clinica_id = ?",
    [tutorId, clinicaId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Tutor no encontrado.' });
      }
      res.json({ mensaje: 'Tutor dado de baja correctamente.' });
    }
  );
});

// Vetar tutor (estatus = 'vetado')
router.put('/:id/vetar', puedeGestionarTutores, (req, res) => {
  const tutorId = req.params.id;
  const clinicaId = req.user.clinica_id;

  db.query(
    "UPDATE tutor SET estatus = 'vetado', vetado = 1 WHERE id = ? AND clinica_id = ?",
    [tutorId, clinicaId],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Tutor no encontrado.' });
      }
      res.json({ mensaje: 'Tutor vetado correctamente.' });
    }
  );
});

module.exports = router;
