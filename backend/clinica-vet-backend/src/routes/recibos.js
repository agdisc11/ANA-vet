const express = require('express');
const router = express.Router();
const { db } = require('../db/connection');
const { authMiddleware } = require('../middleware/authMiddleware');

// Protege TODAS las rutas con authMiddleware
router.use(authMiddleware);

// ============================================================
// GET /api/recibos/:paciente_id
// Lista todos los recibos de un paciente (de la clínica autenticada)
// ============================================================
router.get('/:paciente_id', (req, res) => {
  const sql = `
    SELECT r.id, r.paciente_id, r.expediente_id, r.empleado_id,
           r.fecha, r.motivo_consulta, r.total, r.status, r.created_at,
           p.nombre AS paciente_nombre,
           CONCAT(t.nombre, ' ', t.apellidos) AS tutor_nombre,
           CONCAT(e.nombre, ' ', e.apellidos) AS empleado_nombre
    FROM recibo r
    LEFT JOIN paciente p ON r.paciente_id = p.id
    LEFT JOIN tutor t ON p.tutor_id = t.id
    LEFT JOIN empleados e ON r.empleado_id = e.id
    WHERE r.paciente_id = ? AND r.clinica_id = ?
    ORDER BY r.fecha DESC, r.created_at DESC
  `;
  db.query(sql, [req.params.paciente_id, req.user.clinica_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ============================================================
// POST /api/recibos
// Crea un recibo nuevo (status: borrador) con sus items
// Body: { paciente_id, expediente_id?, empleado_id?, fecha, motivo_consulta?, items: [...] }
// items: [{ servicio_id?, nombre_servicio, precio_unitario, cantidad, notas? }]
// ============================================================
router.post('/', (req, res) => {
  const {
    paciente_id,
    expediente_id,
    empleado_id,
    fecha,
    motivo_consulta,
    items = [],
  } = req.body;

  // Aceptar fecha en formato DD/MM/YYYY (enviada por el helper hoy() del frontend)
  // o en formato ISO YYYY-MM-DD. Normalizamos a YYYY-MM-DD para MySQL.
  let fechaNormalizada = fecha;
  if (fecha && /^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
    const [d, m, y] = fecha.split('/');
    fechaNormalizada = `${y}-${m}-${d}`;
  }

  if (!paciente_id || !fechaNormalizada) {
    return res.status(400).json({ error: 'Campos requeridos: paciente_id, fecha' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Se requiere al menos un item en el recibo' });
  }

  // Validar que cada item tenga los campos mínimos
  for (const item of items) {
    if (!item.nombre_servicio || item.precio_unitario === undefined || !item.cantidad) {
      return res.status(400).json({
        error: 'Cada item requiere: nombre_servicio, precio_unitario, cantidad',
      });
    }
  }

  // Calcular total
  const total = items.reduce((sum, item) => {
    return sum + parseFloat(item.precio_unitario) * parseInt(item.cantidad, 10);
  }, 0);

  // Insertar recibo
  const sqlRecibo = `
    INSERT INTO recibo (clinica_id, paciente_id, expediente_id, empleado_id, fecha, motivo_consulta, total, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'borrador')
  `;
  db.query(
    sqlRecibo,
    [
      req.user.clinica_id,
      paciente_id,
      expediente_id || null,
      empleado_id || null,
      fechaNormalizada,
      motivo_consulta || null,
      total.toFixed(2),
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      const recibo_id = result.insertId;

      // Insertar items
      const sqlItem = `
        INSERT INTO recibo_item (recibo_id, servicio_id, nombre_servicio, precio_unitario, cantidad, subtotal, notas)
        VALUES ?
      `;
      const itemValues = items.map((item) => [
        recibo_id,
        item.servicio_id || null,
        item.nombre_servicio,
        parseFloat(item.precio_unitario),
        parseInt(item.cantidad, 10),
        (parseFloat(item.precio_unitario) * parseInt(item.cantidad, 10)).toFixed(2),
        item.notas || null,
      ]);

      db.query(sqlItem, [itemValues], (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.status(201).json({
          mensaje: 'Recibo creado exitosamente',
          recibo_id,
          total: parseFloat(total.toFixed(2)),
          status: 'borrador',
        });
      });
    }
  );
});

// ============================================================
// PUT /api/recibos/:id
// Actualiza items y/o status de un recibo (de la clínica autenticada)
// Body: { expediente_id?, empleado_id?, fecha?, motivo_consulta?, status?, items?: [...] }
// ============================================================
router.put('/:id', (req, res) => {
  const {
    expediente_id,
    empleado_id,
    fecha,
    motivo_consulta,
    status,
    items,
  } = req.body;

  // Verificar que el recibo pertenece a esta clínica
  db.query(
    'SELECT id, status FROM recibo WHERE id = ? AND clinica_id = ?',
    [req.params.id, req.user.clinica_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) return res.status(404).json({ error: 'Recibo no encontrado' });

      const recibo = rows[0];

      // Validar status si se envía
      if (status && !['borrador', 'finalizado'].includes(status)) {
        return res.status(400).json({ error: 'status debe ser: borrador o finalizado' });
      }

      // Función para actualizar items si se proporcionan
      const actualizarItems = (recibo_id, callback) => {
        if (!Array.isArray(items) || items.length === 0) return callback(null, null);

        // Validar items
        for (const item of items) {
          if (!item.nombre_servicio || item.precio_unitario === undefined || !item.cantidad) {
            return res.status(400).json({
              error: 'Cada item requiere: nombre_servicio, precio_unitario, cantidad',
            });
          }
        }

        // Eliminar items anteriores y reinsertar
        db.query('DELETE FROM recibo_item WHERE recibo_id = ?', [recibo_id], (err2) => {
          if (err2) return callback(err2);

          const sqlItem = `
            INSERT INTO recibo_item (recibo_id, servicio_id, nombre_servicio, precio_unitario, cantidad, subtotal, notas)
            VALUES ?
          `;
          const itemValues = items.map((item) => [
            recibo_id,
            item.servicio_id || null,
            item.nombre_servicio,
            parseFloat(item.precio_unitario),
            parseInt(item.cantidad, 10),
            (parseFloat(item.precio_unitario) * parseInt(item.cantidad, 10)).toFixed(2),
            item.notas || null,
          ]);

          const nuevoTotal = items.reduce((sum, item) => {
            return sum + parseFloat(item.precio_unitario) * parseInt(item.cantidad, 10);
          }, 0);

          db.query(sqlItem, [itemValues], (err3) => {
            if (err3) return callback(err3);
            callback(null, nuevoTotal.toFixed(2));
          });
        });
      };

      actualizarItems(recibo.id, (err2, nuevoTotal) => {
        if (err2) return res.status(500).json({ error: err2.message });

        const sqlUpdate = `
          UPDATE recibo SET
            expediente_id   = COALESCE(?, expediente_id),
            empleado_id     = COALESCE(?, empleado_id),
            fecha           = COALESCE(?, fecha),
            motivo_consulta = COALESCE(?, motivo_consulta),
            status          = COALESCE(?, status),
            total           = COALESCE(?, total)
          WHERE id = ? AND clinica_id = ?
        `;
        db.query(
          sqlUpdate,
          [
            expediente_id !== undefined ? expediente_id : null,
            empleado_id   !== undefined ? empleado_id   : null,
            fecha         || null,
            motivo_consulta !== undefined ? motivo_consulta : null,
            status        || null,
            nuevoTotal    || null,
            req.params.id,
            req.user.clinica_id,
          ],
          (err3, result) => {
            if (err3) return res.status(500).json({ error: err3.message });
            res.json({ mensaje: 'Recibo actualizado correctamente' });
          }
        );
      });
    }
  );
});

// ============================================================
// GET /api/recibos/:id/detalle
// Trae recibo completo con items, datos del paciente, tutor y empleado
// ============================================================
router.get('/:id/detalle', (req, res) => {
  const sqlRecibo = `
    SELECT
      r.id, r.clinica_id, r.paciente_id, r.expediente_id, r.empleado_id,
      r.fecha, r.motivo_consulta, r.total, r.status, r.created_at,
      p.nombre          AS paciente_nombre,
      p.especie         AS paciente_especie,
      p.raza            AS paciente_raza,
      p.sexo            AS paciente_sexo,
      t.id              AS tutor_id,
      t.nombre          AS tutor_nombre,
      t.apellidos       AS tutor_apellidos,
      t.telefono        AS tutor_telefono,
      t.email           AS tutor_email,
      e.nombre          AS empleado_nombre,
      e.apellidos       AS empleado_apellidos
    FROM recibo r
    LEFT JOIN paciente p  ON r.paciente_id  = p.id
    LEFT JOIN tutor t     ON p.tutor_id     = t.id
    LEFT JOIN empleados e ON r.empleado_id  = e.id
    WHERE r.id = ? AND r.clinica_id = ?
  `;

  db.query(sqlRecibo, [req.params.id, req.user.clinica_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: 'Recibo no encontrado' });

    const recibo = rows[0];

    const sqlItems = `
      SELECT id, servicio_id, nombre_servicio, precio_unitario, cantidad, subtotal, notas
      FROM recibo_item
      WHERE recibo_id = ?
      ORDER BY id ASC
    `;
    db.query(sqlItems, [recibo.id], (err2, items) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ ...recibo, items });
    });
  });
});

// ============================================================
// DELETE /api/recibos/:id
// Elimina un recibo SOLO si su status es 'borrador'
// ============================================================
router.delete('/:id', (req, res) => {
  db.query(
    'SELECT id, status FROM recibo WHERE id = ? AND clinica_id = ?',
    [req.params.id, req.user.clinica_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) return res.status(404).json({ error: 'Recibo no encontrado' });

      const recibo = rows[0];
      if (recibo.status !== 'borrador') {
        return res.status(409).json({
          error: 'Solo se pueden eliminar recibos en estado borrador',
        });
      }

      db.query(
        'DELETE FROM recibo WHERE id = ? AND clinica_id = ?',
        [req.params.id, req.user.clinica_id],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ mensaje: 'Recibo eliminado correctamente' });
        }
      );
    }
  );
});

module.exports = router;
