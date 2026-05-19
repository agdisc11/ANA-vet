const express = require('express');
const router = express.Router();
const db = require('../db/connection');
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
  const { producto_nombre, notas } = req.body;
  const clinica_id = req.user.clinica_id;
  const empleado_id = req.user.tipo === 'empleado' ? req.user.id : null;

  const sql = `
    INSERT INTO solicitud_reabastecimiento (producto_nombre, notas, clinica_id, empleado_id)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [producto_nombre, notas || null, clinica_id, empleado_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: result.insertId, message: 'Solicitud de reabastecimiento creada' });
  });
});

// ── GET /api/inventario/solicitudes ───────────────────────────
// Lista las solicitudes de reabastecimiento de la clínica (solo clínica/admin)
router.get('/solicitudes', soloClinica, (req, res) => {
  const sql = `
    SELECT sr.*, e.nombre AS empleado_nombre, e.apellidos AS empleado_apellidos
    FROM solicitud_reabastecimiento sr
    LEFT JOIN empleado e ON sr.empleado_id = e.id
    WHERE sr.clinica_id = ?
    ORDER BY sr.created_at DESC
  `;
  db.query(sql, [req.user.clinica_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
