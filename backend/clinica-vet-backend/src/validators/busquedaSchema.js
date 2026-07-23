const { z } = require('zod');
const { textoRequerido, enteroEnRango } = require('./tipos');
const Busqueda = require('../domain/Busqueda');

/**
 * Esquema DTO de la búsqueda global (Fase 4.1).
 *
 * Valida la FORMA (hay `q`, no excede el máximo, `limite` es un entero
 * del rango permitido); la regla de NEGOCIO —cuántos caracteres hacen
 * que una búsqueda valga la pena— vive en el dominio `Busqueda`, que
 * es también quien define aquí los límites.
 */
const buscarQuerySchema = z.object({
  q: textoRequerido('q', Busqueda.LONGITUD_MAXIMA),
  limite: enteroEnRango('limite', {
    defecto: Busqueda.LIMITE_DEFAULT,
    min: 1,
    max: Busqueda.LIMITE_MAX,
  }),
});

module.exports = { buscarQuerySchema };
