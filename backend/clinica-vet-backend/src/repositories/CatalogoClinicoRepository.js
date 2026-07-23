/**
 * Repositorio de catálogos clínicos de referencia (medicamentos y
 * toxicología). Son catálogos GLOBALES del sistema — no llevan clinica_id
 * a propósito: los consumen las calculadoras clínicas de todas las clínicas.
 */
class CatalogoClinicoRepository {
  #query;

  constructor({ query }) {
    this.#query = query;
  }

  medicamentos() {
    return this.#query(
      `SELECT id, nombre, categoria, especie_destino, dosis_mg_por_kg,
              dosis_min_mg_kg, dosis_max_mg_kg, concentracion_mg_ml,
              via_administracion, notas_clinicas
       FROM catalogo_medicamentos
       ORDER BY categoria, nombre`
    );
  }

  toxicologia() {
    return this.#query(
      `SELECT id, toxina, especie_afectada, dosis_toxica_leve_mg_kg,
              dosis_toxica_moderada_mg_kg, dosis_toxica_letal_mg_kg,
              mecanismo, signos_clinicos, tratamiento_base, notas
       FROM catalogo_toxicologia
       ORDER BY toxina`
    );
  }
}

module.exports = CatalogoClinicoRepository;
