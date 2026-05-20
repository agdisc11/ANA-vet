const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/connection');
const { authMiddleware, soloClinica, JWT_SECRET, SALT_ROUNDS } = require('../middleware/authMiddleware');

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
// Utilidad: genera un correo corporativo único para un empleado
// Formato: nombre.apellido@anavet-[clinica_id].com
// Limpia acentos, espacios y pasa a minúsculas.
// Si ya existe ese correo, agrega un sufijo numérico incremental.
// ============================================================
function limpiarTexto(str) {
  return str
    .normalize('NFD')                    // descompone caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '')     // elimina diacríticos
    .replace(/[^a-zA-Z0-9]/g, '')        // elimina todo lo que no sea alfanumérico
    .toLowerCase();
}

function generarBaseCorreo(nombre, apellidos, clinica_id) {
  const n = limpiarTexto(nombre.split(' ')[0]);          // primer nombre
  const a = limpiarTexto(apellidos.split(' ')[0]);       // primer apellido
  return `${n}.${a}@anavet-${clinica_id}.com`;
}

function resolverCorreoUnico(baseCorreo, clinica_id, callback) {
  // Busca todos los correos del dominio de esta clínica que coincidan con la base
  const dominio = `@anavet-${clinica_id}.com`;
  const localBase = baseCorreo.replace(dominio, '');

  db.query(
    'SELECT email FROM empleados WHERE email LIKE ?',
    [`${localBase}%${dominio}`],
    (err, rows) => {
      if (err) return callback(err, null);

      if (rows.length === 0) {
        // No hay conflicto, usar el correo base
        return callback(null, baseCorreo);
      }

      // Buscar el sufijo numérico más alto y sumar 1
      const existentes = rows.map(r => r.email);
      let contador = 1;
      let candidato = `${localBase}${contador}${dominio}`;
      while (existentes.includes(candidato)) {
        contador++;
        candidato = `${localBase}${contador}${dominio}`;
      }
      return callback(null, candidato);
    }
  );
}

// ============================================================
// POST /api/empleados
// Registra un nuevo empleado en la clínica autenticada
// Body: { nombre, apellidos, email, password, rol_id, telefono?, generar_correo? }
// Si generar_correo=true, el email se genera automáticamente y no es requerido en el body.
// Requiere: Bearer token de tipo 'clinica'
// ============================================================
// ── Utilidad: genera una contraseña temporal segura ──────────────────────────
function generarPasswordTemporal() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const especiales = '!@#$*';
  let pwd = '';
  // 8 caracteres alfanuméricos
  for (let i = 0; i < 8; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  // 1 carácter especial al final
  pwd += especiales[Math.floor(Math.random() * especiales.length)];
  return pwd;
}

router.post('/', authMiddleware, soloClinica, async (req, res) => {
  const { nombre, apellidos, rol_id, telefono, generar_correo } = req.body;
  // Normalizar: si generar_correo está activo ignoramos el email y password que vengan del body
  let email = generar_correo ? null : (req.body.email || '').trim();
  let password = generar_correo ? generarPasswordTemporal() : (req.body.password || '');

  // Validación: nombre y rol siempre requeridos
  if (!nombre || !apellidos || !rol_id) {
    return res.status(400).json({ error: 'Campos requeridos: nombre, apellidos, rol_id' });
  }
  // Solo exigir email y password cuando NO se autogenera
  if (!generar_correo && (!email || !password)) {
    return res.status(400).json({ error: 'Debes proporcionar un email y contraseña, o activar generar_correo=true' });
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

        // ── Rama: generar correo automáticamente ──────────────────────────
        if (generar_correo) {
          const baseCorreo = generarBaseCorreo(nombre, apellidos, req.user.clinica_id);

          resolverCorreoUnico(baseCorreo, req.user.clinica_id, async (errUniq, correoGenerado) => {
            if (errUniq) return res.status(500).json({ error: errUniq.message });

            try {
              const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

              db.query(
                'INSERT INTO empleados (clinica_id, rol_id, nombre, apellidos, email, password_hash, telefono) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [req.user.clinica_id, rol_id, nombre, apellidos, correoGenerado, password_hash, telefono || null],
                (err3, result) => {
                  if (err3) return res.status(500).json({ error: err3.message });
                  res.status(201).json({
                    mensaje: 'Empleado registrado exitosamente',
                    empleado_id: result.insertId,
                    correo_generado: correoGenerado,
                    // Alias para que el frontend pueda leer res.data.email y res.data.password_temporal
                    email: correoGenerado,
                    password_temporal: password,
                  });
                }
              );
            } catch (hashErr) {
              res.status(500).json({ error: hashErr.message });
            }
          });

        // ── Rama: email proporcionado manualmente ─────────────────────────
        } else {
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
