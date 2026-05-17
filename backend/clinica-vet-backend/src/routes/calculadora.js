const express = require('express');
const router = express.Router();
const db = require('../db/connection');

/**
 * GET /api/calculadora/medicamentos
 * Devuelve el catálogo completo de medicamentos veterinarios.
 * Usado por la calculadora de Farmacia del módulo de Calculadoras Clínicas.
 */
router.get('/medicamentos', (req, res) => {
  const sql = `
    SELECT
      id,
      nombre,
      categoria,
      especie_destino,
      dosis_mg_por_kg,
      dosis_min_mg_kg,
      dosis_max_mg_kg,
      concentracion_mg_ml,
      via_administracion,
      notas_clinicas
    FROM catalogo_medicamentos
    ORDER BY categoria, nombre
  `;

  try {
    db.query(sql, (err, results) => {
      if (err) {
        console.error('[calculadora/medicamentos] Error en BD:', err.message);
        return res.status(500).json({
          error: 'Error al consultar el catálogo de medicamentos.',
          detalle: err.message,
        });
      }
      res.json(results);
    });
  } catch (err) {
    console.error('[calculadora/medicamentos] Error inesperado:', err.message);
    res.status(500).json({
      error: 'Error interno del servidor.',
      detalle: err.message,
    });
  }
});

/**
 * GET /api/calculadora/toxicologia
 * Devuelve el catálogo completo de toxinas veterinarias.
 * Usado por la calculadora de Toxicología del módulo de Calculadoras Clínicas.
 */
router.get('/toxicologia', (req, res) => {
  const sql = `
    SELECT
      id,
      toxina,
      especie_afectada,
      dosis_toxica_leve_mg_kg,
      dosis_toxica_moderada_mg_kg,
      dosis_toxica_letal_mg_kg,
      mecanismo,
      signos_clinicos,
      tratamiento_base,
      notas
    FROM catalogo_toxicologia
    ORDER BY toxina
  `;

  try {
    db.query(sql, (err, results) => {
      if (err) {
        console.error('[calculadora/toxicologia] Error en BD:', err.message);
        return res.status(500).json({
          error: 'Error al consultar el catálogo de toxicología.',
          detalle: err.message,
        });
      }
      res.json(results);
    });
  } catch (err) {
    console.error('[calculadora/toxicologia] Error inesperado:', err.message);
    res.status(500).json({
      error: 'Error interno del servidor.',
      detalle: err.message,
    });
  }
});

module.exports = router;
