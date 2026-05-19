const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const { authMiddleware } = require('../middleware/authMiddleware');

// Protege TODAS las rutas con authMiddleware
router.use(authMiddleware);

// ============================================================
// GET /api/servicios-catalogo
// Lista los servicios activos de la clínica autenticada
// Query params opcionales: ?todos=1 para incluir inactivos
// ============================================================
router.get('/', (req, res) => {
  const soloActivos = req.query.todos !== '1';
  const sql = `
    SELECT id, clinica_id, categoria, nombre, precio, activo, created_at
    FROM servicio_catalogo
    WHERE clinica_id = ?${soloActivos ? ' AND activo = 1' : ''}
    ORDER BY categoria ASC, nombre ASC
  `;
  db.query(sql, [req.user.clinica_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ============================================================
// POST /api/servicios-catalogo
// Crea un nuevo servicio en el catálogo de la clínica autenticada
// Body: { categoria, nombre, precio, activo? }
// ============================================================
router.post('/', (req, res) => {
  const { categoria, nombre, precio, activo } = req.body;

  if (!categoria || !nombre || precio === undefined) {
    return res.status(400).json({ error: 'Campos requeridos: categoria, nombre, precio' });
  }

  const categoriasValidas = [
    'Consulta',
    'Laboratorio',
    'Gabinete',
    'Hospitalizacion',
    'Cirugia',
    'Procedimiento Ambulatorio',
  ];
  if (!categoriasValidas.includes(categoria)) {
    return res.status(400).json({
      error: `categoria debe ser uno de: ${categoriasValidas.join(', ')}`,
    });
  }

  db.query(
    `INSERT INTO servicio_catalogo (clinica_id, categoria, nombre, precio, activo)
     VALUES (?, ?, ?, ?, ?)`,
    [
      req.user.clinica_id,
      categoria,
      nombre,
      parseFloat(precio),
      activo !== undefined ? (activo ? 1 : 0) : 1,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        mensaje: 'Servicio creado exitosamente',
        servicio_id: result.insertId,
      });
    }
  );
});

// ============================================================
// PUT /api/servicios-catalogo/:id
// Edita nombre, precio y/o activo de un servicio
// Body: { nombre?, precio?, activo?, categoria? }
// ============================================================
router.put('/:id', (req, res) => {
  const { nombre, precio, activo, categoria } = req.body;

  // Verificar que el servicio pertenece a esta clínica
  db.query(
    'SELECT id FROM servicio_catalogo WHERE id = ? AND clinica_id = ?',
    [req.params.id, req.user.clinica_id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      if (rows.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });

      // Validar categoría si se envía
      if (categoria) {
        const categoriasValidas = [
          'Consulta',
          'Laboratorio',
          'Gabinete',
          'Hospitalizacion',
          'Cirugia',
          'Procedimiento Ambulatorio',
        ];
        if (!categoriasValidas.includes(categoria)) {
          return res.status(400).json({
            error: `categoria debe ser uno de: ${categoriasValidas.join(', ')}`,
          });
        }
      }

      db.query(
        `UPDATE servicio_catalogo SET
          nombre    = COALESCE(?, nombre),
          precio    = COALESCE(?, precio),
          activo    = COALESCE(?, activo),
          categoria = COALESCE(?, categoria)
        WHERE id = ? AND clinica_id = ?`,
        [
          nombre    || null,
          precio    !== undefined ? parseFloat(precio) : null,
          activo    !== undefined ? (activo ? 1 : 0)   : null,
          categoria || null,
          req.params.id,
          req.user.clinica_id,
        ],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ mensaje: 'Servicio actualizado correctamente' });
        }
      );
    }
  );
});

module.exports = router;
