const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authMiddleware, soloClinica } = require('../middleware/authMiddleware');

// ============================================================
// GET /api/roles
// Lista todos los roles de la clínica autenticada
// Requiere: Bearer token de tipo 'clinica'
// ============================================================
router.get('/', authMiddleware, soloClinica, (req, res) => {
  db.query(
    'SELECT id, nombre, descripcion, created_at FROM roles WHERE clinica_id = ? ORDER BY nombre ASC',
    [req.user.clinica_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// ============================================================
// GET /api/roles/:id
// Obtiene un rol específico de la clínica autenticada
// ============================================================
router.get('/:id', authMiddleware, soloClinica, (req, res) => {
  db.query(
    'SELECT id, nombre, descripcion, created_at FROM roles WHERE id = ? AND clinica_id = ?',
    [req.params.id, req.user.clinica_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) return res.status(404).json({ error: 'Rol no encontrado' });
      res.json(rows[0]);
    }
  );
});

// ============================================================
// POST /api/roles
// Crea un nuevo rol en la clínica autenticada
// Body: { nombre, descripcion? }
// Requiere: Bearer token de tipo 'clinica'
// ============================================================
router.post('/', authMiddleware, soloClinica, (req, res) => {
  const { nombre, descripcion } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'Campo requerido: nombre' });
  }

  db.query(
    'INSERT INTO roles (clinica_id, nombre, descripcion) VALUES (?, ?, ?)',
    [req.user.clinica_id, nombre, descripcion || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        mensaje: 'Rol creado exitosamente',
        rol_id: result.insertId,
      });
    }
  );
});

// ============================================================
// PUT /api/roles/:id
// Actualiza un rol de la clínica autenticada
// Body: { nombre?, descripcion? }
// ============================================================
router.put('/:id', authMiddleware, soloClinica, (req, res) => {
  const { nombre, descripcion } = req.body;

  db.query(
    'SELECT id FROM roles WHERE id = ? AND clinica_id = ?',
    [req.params.id, req.user.clinica_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) return res.status(404).json({ error: 'Rol no encontrado' });

      db.query(
        `UPDATE roles SET
          nombre      = COALESCE(?, nombre),
          descripcion = COALESCE(?, descripcion)
        WHERE id = ? AND clinica_id = ?`,
        [nombre || null, descripcion || null, req.params.id, req.user.clinica_id],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ mensaje: 'Rol actualizado correctamente' });
        }
      );
    }
  );
});

// ============================================================
// DELETE /api/roles/:id
// Elimina un rol de la clínica autenticada
// NOTA: Fallará si hay empleados asignados a ese rol (ON DELETE RESTRICT)
// ============================================================
router.delete('/:id', authMiddleware, soloClinica, (req, res) => {
  db.query(
    'DELETE FROM roles WHERE id = ? AND clinica_id = ?',
    [req.params.id, req.user.clinica_id],
    (err, result) => {
      if (err) {
        // Error de FK: hay empleados usando este rol
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
          return res.status(409).json({
            error: 'No se puede eliminar el rol porque hay empleados asignados a él. Reasigna o elimina esos empleados primero.',
          });
        }
        return res.status(500).json({ error: err.message });
      }
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Rol no encontrado' });
      res.json({ mensaje: 'Rol eliminado correctamente' });
    }
  );
});

module.exports = router;
