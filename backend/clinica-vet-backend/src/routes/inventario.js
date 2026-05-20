const express = require('express');
const router = express.Router();
const { db } = require('../db/connection');
const { authMiddleware, soloClinica } = require('../middleware/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// ── GET /api/inventario ────────────────────────────────────────
// Devuelve todos los productos del inventario de la clínica autenticada
router.get('/', (req, res) => {
  const sql = 'SELECT * FROM inventario WHERE clinica_id = ?';
  db.query(sql, [req.user.clinica_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ── POST /api/inventario ───────────────────────────────────────
// Agrega un nuevo producto al inventario (solo clínica/admin)
router.post('/', soloClinica, (req, res) => {
  const { nombre, descripcion, stock, stock_minimo, precio, unidad } = req.body;
  const sql = `
    INSERT INTO inventario (nombre, descripcion, stock, stock_minimo, precio, unidad, clinica_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    sql,
    [nombre, descripcion || null, stock ?? 0, stock_minimo ?? 0, precio ?? 0, unidad || null, req.user.clinica_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, message: 'Producto agregado al inventario' });
    }
  );
});

// ── PUT /api/inventario/:id ────────────────────────────────────
// Actualiza un producto del inventario (solo clínica/admin)
router.put('/:id', soloClinica, (req, res) => {
  const { nombre, descripcion, stock, stock_minimo, precio, unidad } = req.body;
  const sql = `
    UPDATE inventario
    SET nombre = ?, descripcion = ?, stock = ?, stock_minimo = ?, precio = ?, unidad = ?
    WHERE id = ? AND clinica_id = ?
  `;
  db.query(
    sql,
    [nombre, descripcion || null, stock ?? 0, stock_minimo ?? 0, precio ?? 0, unidad || null, req.params.id, req.user.clinica_id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json({ message: 'Producto actualizado' });
    }
  );
});

// ── POST /api/inventario/reabastecer ──────────────────────────
// Crea una solicitud de reabastecimiento (empleados y clínica)
router.post('/reabastecer', (req, res) => {
  const { producto_nombre, notas, cantidad } = req.body;
  const clinica_id = req.user.clinica_id;

  // empleado_id es NOT NULL en la tabla; usamos req.user.id en ambos casos (empleado y clínica).
  const empleado_id = req.user.id;

  const sql = `
    INSERT INTO solicitud_reabastecimiento (producto_nombre, cantidad, notas, clinica_id, empleado_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [producto_nombre, cantidad ?? 1, notas || null, clinica_id, empleado_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, message: 'Solicitud de reabastecimiento creada' });
  });
});

// ── GET /api/inventario/solicitudes ───────────────────────────
// Lista las solicitudes de reabastecimiento de la clínica (solo clínica/admin)
// FIX: la tabla de empleados se llama 'empleados' (plural), no 'empleado'
router.get('/solicitudes', soloClinica, (req, res) => {
  const sql = `
    SELECT sr.*, CONCAT(e.nombre, ' ', e.apellidos) AS solicitado_por
    FROM solicitud_reabastecimiento sr
    LEFT JOIN empleados e ON sr.empleado_id = e.id
    WHERE sr.clinica_id = ?
    ORDER BY sr.creado_en DESC
  `;
  db.query(sql, [req.user.clinica_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ── PUT /api/inventario/solicitudes/:id ───────────────────────
// Actualiza el status de una solicitud (solo clínica/admin).
// FIX: cuando status = 'completado', suma la cantidad al stock del producto en inventario.
router.put('/solicitudes/:id', soloClinica, (req, res) => {
  const { status } = req.body;
  const solicitudId = req.params.id;
  const clinica_id = req.user.clinica_id;

  // Primero obtenemos la solicitud para conocer producto_nombre y cantidad
  const getSql = `
    SELECT * FROM solicitud_reabastecimiento
    WHERE id = ? AND clinica_id = ?
  `;
  db.query(getSql, [solicitudId, clinica_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const solicitud = rows[0];

    // Actualizar el status de la solicitud
    const updateSolicitudSql = `
      UPDATE solicitud_reabastecimiento
      SET status = ?
      WHERE id = ? AND clinica_id = ?
    `;
    db.query(updateSolicitudSql, [status, solicitudId, clinica_id], (err2, result) => {
      if (err2) return res.status(500).json({ error: err2.message });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      // Si el nuevo status es 'completado', actualizar el stock en inventario
      if (status === 'completado') {
        const cantidad = solicitud.cantidad ?? 1;
        const updateStockSql = `
          UPDATE inventario
          SET stock = stock + ?
          WHERE LOWER(nombre) = LOWER(?) AND clinica_id = ?
        `;
        db.query(updateStockSql, [cantidad, solicitud.producto_nombre, clinica_id], (err3) => {
          if (err3) {
            // Loguear el error pero no revertir el status; la solicitud ya fue marcada como completada
            console.error('Error actualizando stock en inventario:', err3.message);
            return res.json({
              message: 'Solicitud marcada como completada, pero hubo un error al actualizar el stock',
              stockError: err3.message
            });
          }
          res.json({ message: 'Solicitud completada y stock actualizado en inventario' });
        });
      } else {
        res.json({ message: 'Solicitud actualizada' });
      }
    });
  });
});

module.exports = router;
