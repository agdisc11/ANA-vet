const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { authMiddleware, soloClinica } = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'saas_vet_secret_2026';
const SALT_ROUNDS = 10;

// ============================================================
// POST /api/empleados/login
// Login de un empleado (veterinario, recepcionista, etc.)
// Body: { email, password }
// Responde con JWT tipo 'empleado'
// ============================================================
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Campos requeridos: email, password' });
  }

  const sql = `
    SELECT e.*, r.nombre AS rol_nombre, c.nombre AS clinica_nombre, c.activa AS clinica_activa
    FROM empleados e
    LEFT JOIN roles r ON e.rol_id = r.id
    LEFT JOIN clinicas c ON e.clinica_id = c.id
    WHERE e.email = ?
  `;

  db.query(sql, [email], async (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const empleado = rows[0];

    if (!empleado.activo) {
      return res.status(403).json({ error: 'Tu cuenta está desactivada. Contacta al administrador de tu clínica.' });
    }

    if (!empleado.clinica_activa) {
      return res.status(403).json({ error: 'La clínica está suspendida. Contacta al administrador del sistema.' });
    }

    const passwordOk = await bcrypt.compare(password, empleado.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      {
        id: empleado.id,
        tipo: 'empleado',
        clinica_id: empleado.clinica_id,
        rol_id: empleado.rol_id,
        nombre: `${empleado.nombre} ${empleado.apellidos}`,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      tipo: 'empleado',
      empleado: {
        id: empleado.id,
        nombre: empleado.nombre,
        apellidos: empleado.apellidos,
        email: empleado.email,
        telefono: empleado.telefono,
        rol_id: empleado.rol_id,
        rol_nombre: empleado.rol_nombre,
        clinica_id: empleado.clinica_id,
        clinica_nombre: empleado.clinica_nombre,
      },
    });
  });
});

// ============================================================
// GET /api/empleados
// Lista todos los empleados de la clínica autenticada
// Requiere: Bearer token de tipo 'clinica'
// ============================================================
router.get('/', authMiddleware, soloClinica, (req, res) => {
  const sql = `
    SELECT e.id, e.nombre, e.apellidos, e.email, e.telefono, e.activo, e.created_at,
           r.id AS rol_id, r.nombre AS rol_nombre
    FROM empleados e
    LEFT JOIN roles r ON e.rol_id = r.id
    WHERE e.clinica_id = ?
    ORDER BY e.nombre ASC
  `;
  db.query(sql, [req.user.clinica_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ============================================================
// GET /api/empleados/:id
// Obtiene un empleado específico de la clínica autenticada
// ============================================================
router.get('/:id', authMiddleware, soloClinica, (req, res) => {
  const sql = `
    SELECT e.id, e.nombre, e.apellidos, e.email, e.telefono, e.activo, e.created_at,
           r.id AS rol_id, r.nombre AS rol_nombre
    FROM empleados e
    LEFT JOIN roles r ON e.rol_id = r.id
    WHERE e.id = ? AND e.clinica_id = ?
  `;
  db.query(sql, [req.params.id, req.user.clinica_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: 'Empleado no encontrado' });
    res.json(rows[0]);
  });
});

// ============================================================
// POST /api/empleados
// Registra un nuevo empleado en la clínica autenticada
// Body: { nombre, apellidos, email, password, rol_id, telefono? }
// Requiere: Bearer token de tipo 'clinica'
// ============================================================
router.post('/', authMiddleware, soloClinica, async (req, res) => {
  const { nombre, apellidos, email, password, rol_id, telefono } = req.body;

  if (!nombre || !apellidos || !email || !password || !rol_id) {
    return res.status(400).json({ error: 'Campos requeridos: nombre, apellidos, email, password, rol_id' });
  }

  try {
    // Verificar que el rol pertenece a esta clínica
    db.query(
      'SELECT id FROM roles WHERE id = ? AND clinica_id = ?',
      [rol_id, req.user.clinica_id],
      async (err, rolRows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (rolRows.length === 0) {
          return res.status(400).json({ error: 'El rol_id no existe o no pertenece a tu clínica' });
        }

        // Verificar email único
        db.query('SELECT id FROM empleados WHERE email = ?', [email], async (err2, emailRows) => {
          if (err2) return res.status(500).json({ error: err2.message });
          if (emailRows.length > 0) {
            return res.status(409).json({ error: 'Ya existe un empleado registrado con ese email' });
          }

          const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

          db.query(
            'INSERT INTO empleados (clinica_id, rol_id, nombre, apellidos, email, password_hash, telefono) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.user.clinica_id, rol_id, nombre, apellidos, email, password_hash, telefono || null],
            (err3, result) => {
              if (err3) return res.status(500).json({ error: err3.message });
              res.status(201).json({
                mensaje: 'Empleado registrado exitosamente',
                empleado_id: result.insertId,
              });
            }
          );
        });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PUT /api/empleados/:id
// Actualiza datos de un empleado (sin cambiar password)
// Body: { nombre?, apellidos?, email?, rol_id?, telefono?, activo? }
// Requiere: Bearer token de tipo 'clinica'
// ============================================================
router.put('/:id', authMiddleware, soloClinica, (req, res) => {
  const { nombre, apellidos, email, rol_id, telefono, activo } = req.body;

  // Verificar que el empleado pertenece a esta clínica
  db.query(
    'SELECT id FROM empleados WHERE id = ? AND clinica_id = ?',
    [req.params.id, req.user.clinica_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) return res.status(404).json({ error: 'Empleado no encontrado' });

      // Si se cambia el rol, verificar que pertenece a la clínica
      const verificarRol = (callback) => {
        if (!rol_id) return callback(null);
        db.query(
          'SELECT id FROM roles WHERE id = ? AND clinica_id = ?',
          [rol_id, req.user.clinica_id],
          (err2, rolRows) => {
            if (err2) return res.status(500).json({ error: err2.message });
            if (rolRows.length === 0) {
              return res.status(400).json({ error: 'El rol_id no existe o no pertenece a tu clínica' });
            }
            callback(null);
          }
        );
      };

      verificarRol(() => {
        db.query(
          `UPDATE empleados SET
            nombre    = COALESCE(?, nombre),
            apellidos = COALESCE(?, apellidos),
            email     = COALESCE(?, email),
            rol_id    = COALESCE(?, rol_id),
            telefono  = COALESCE(?, telefono),
            activo    = COALESCE(?, activo)
          WHERE id = ? AND clinica_id = ?`,
          [
            nombre    || null,
            apellidos || null,
            email     || null,
            rol_id    || null,
            telefono  || null,
            activo !== undefined ? activo : null,
            req.params.id,
            req.user.clinica_id,
          ],
          (err3, result) => {
            if (err3) return res.status(500).json({ error: err3.message });
            res.json({ mensaje: 'Empleado actualizado correctamente' });
          }
        );
      });
    }
  );
});

// ============================================================
// PUT /api/empleados/:id/cambiar-password
// Cambia la contraseña de un empleado (lo hace el admin de la clínica)
// Body: { password_nueva }
// Requiere: Bearer token de tipo 'clinica'
// ============================================================
router.put('/:id/cambiar-password', authMiddleware, soloClinica, async (req, res) => {
  const { password_nueva } = req.body;

  if (!password_nueva) {
    return res.status(400).json({ error: 'Campo requerido: password_nueva' });
  }

  db.query(
    'SELECT id FROM empleados WHERE id = ? AND clinica_id = ?',
    [req.params.id, req.user.clinica_id],
    async (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) return res.status(404).json({ error: 'Empleado no encontrado' });

      const nuevo_hash = await bcrypt.hash(password_nueva, SALT_ROUNDS);
      db.query(
        'UPDATE empleados SET password_hash = ? WHERE id = ?',
        [nuevo_hash, req.params.id],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ mensaje: 'Contraseña del empleado actualizada' });
        }
      );
    }
  );
});

// ============================================================
// DELETE /api/empleados/:id
// Elimina (o desactiva) un empleado de la clínica
// Requiere: Bearer token de tipo 'clinica'
// ============================================================
router.delete('/:id', authMiddleware, soloClinica, (req, res) => {
  db.query(
    'DELETE FROM empleados WHERE id = ? AND clinica_id = ?',
    [req.params.id, req.user.clinica_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Empleado no encontrado' });
      res.json({ mensaje: 'Empleado eliminado correctamente' });
    }
  );
});

module.exports = router;
