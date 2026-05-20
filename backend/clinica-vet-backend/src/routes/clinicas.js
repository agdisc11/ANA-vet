const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');
const { authMiddleware, soloClinica, JWT_SECRET, SALT_ROUNDS } = require('../middleware/authMiddleware');

// ============================================================
// POST /api/clinicas/registro
// Registra una nueva clínica en el sistema SaaS
// Body: { nombre, email, password, telefono?, direccion? }
// ============================================================
router.post('/registro', async (req, res) => {
  const { nombre, email, password, telefono, direccion } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: 'Campos requeridos: nombre, email, password' });
  }

  try {
    // Verificar si el email ya existe
    db.query('SELECT id FROM clinicas WHERE email = ?', [email], async (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length > 0) {
        return res.status(409).json({ error: 'Ya existe una clínica registrada con ese email' });
      }

      const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

      db.query(
        'INSERT INTO clinicas (nombre, email, password_hash, telefono, direccion) VALUES (?, ?, ?, ?, ?)',
        [nombre, email, password_hash, telefono || null, direccion || null],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: err2.message });

          // Crear roles por defecto para la nueva clínica
          const clinica_id = result.insertId;
          const rolesDefault = [
            [clinica_id, 'Administrador', 'Acceso total: gestión de empleados, reportes y configuración'],
            [clinica_id, 'Veterinario',   'Acceso a expedientes, consultas, cirugías y hospitalizaciones'],
            [clinica_id, 'Recepcionista', 'Registro de tutores, pacientes y citas'],
            [clinica_id, 'Auxiliar',      'Apoyo en consultas y hospitalización, sin acceso a reportes'],
          ];

          db.query(
            'INSERT INTO roles (clinica_id, nombre, descripcion) VALUES ?',
            [rolesDefault],
            (err3) => {
              if (err3) console.warn('Advertencia: no se pudieron crear roles por defecto:', err3.message);
            }
          );

          res.status(201).json({
            mensaje: 'Clínica registrada exitosamente',
            clinica_id,
          });
        }
      );
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// POST /api/clinicas/login
// Login de la clínica (administrador)
// Body: { email, password }
// Responde con JWT tipo 'clinica'
// ============================================================
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Campos requeridos: email, password' });
  }

  db.query('SELECT * FROM clinicas WHERE email = ?', [email], async (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const clinica = rows[0];

    if (!clinica.activa) {
      return res.status(403).json({ error: 'Esta clínica está suspendida. Contacte al administrador del sistema.' });
    }

    const passwordOk = await bcrypt.compare(password, clinica.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      {
        id: clinica.id,
        tipo: 'clinica',
        clinica_id: clinica.id,
        nombre: clinica.nombre,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      tipo: 'clinica',
      clinica: {
        id: clinica.id,
        nombre: clinica.nombre,
        email: clinica.email,
        telefono: clinica.telefono,
        direccion: clinica.direccion,
        logo_url: clinica.logo_url,
      },
    });
  });
});

// ============================================================
// GET /api/clinicas/perfil
// Devuelve el perfil de la clínica autenticada
// Requiere: Bearer token de tipo 'clinica'
// ============================================================
router.get('/perfil', authMiddleware, soloClinica, (req, res) => {
  db.query(
    'SELECT id, nombre, email, telefono, direccion, logo_url, activa, created_at FROM clinicas WHERE id = ?',
    [req.user.clinica_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) return res.status(404).json({ error: 'Clínica no encontrada' });
      res.json(rows[0]);
    }
  );
});

// ============================================================
// PUT /api/clinicas/perfil
// Actualiza datos de la clínica autenticada (sin cambiar password)
// Body: { nombre?, telefono?, direccion?, logo_url? }
// ============================================================
router.put('/perfil', authMiddleware, soloClinica, (req, res) => {
  const { nombre, telefono, direccion, logo_url } = req.body;

  db.query(
    'UPDATE clinicas SET nombre = COALESCE(?, nombre), telefono = COALESCE(?, telefono), direccion = COALESCE(?, direccion), logo_url = COALESCE(?, logo_url) WHERE id = ?',
    [nombre || null, telefono || null, direccion || null, logo_url || null, req.user.clinica_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ mensaje: 'Perfil de clínica actualizado' });
    }
  );
});

// ============================================================
// PUT /api/clinicas/cambiar-password
// Cambia la contraseña de la clínica autenticada
// Body: { password_actual, password_nueva }
// ============================================================
router.put('/cambiar-password', authMiddleware, soloClinica, async (req, res) => {
  const { password_actual, password_nueva } = req.body;

  if (!password_actual || !password_nueva) {
    return res.status(400).json({ error: 'Campos requeridos: password_actual, password_nueva' });
  }

  db.query('SELECT password_hash FROM clinicas WHERE id = ?', [req.user.clinica_id], async (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: 'Clínica no encontrada' });

    const ok = await bcrypt.compare(password_actual, rows[0].password_hash);
    if (!ok) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

    const nuevo_hash = await bcrypt.hash(password_nueva, SALT_ROUNDS);
    db.query('UPDATE clinicas SET password_hash = ? WHERE id = ?', [nuevo_hash, req.user.clinica_id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ mensaje: 'Contraseña actualizada correctamente' });
    });
  });
});

module.exports = router;
