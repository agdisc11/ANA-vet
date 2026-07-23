/**
 * Repositorio de estadísticas generales.
 *
 * Blindaje respecto a la versión anterior: los conteos ahora filtran por
 * clínica (antes eran GLOBALES: cualquier usuario veía los totales de
 * TODAS las clínicas — fuga de datos entre tenants).
 */
class StatsRepository {
  #query;

  constructor({ query }) {
    this.#query = query;
  }

  async conteosPorClinica(clinicaId) {
    const rows = await this.#query(
      `SELECT
         (SELECT COUNT(*) FROM tutor    WHERE clinica_id = ?) AS tutores,
         (SELECT COUNT(*) FROM paciente WHERE clinica_id = ?) AS pacientes,
         (SELECT COUNT(*) FROM consulta c JOIN expediente e ON c.expediente_id = e.id WHERE e.clinica_id = ?) AS consultas,
         (SELECT COUNT(*) FROM hospitalizacion h JOIN expediente e ON h.expediente_id = e.id WHERE e.clinica_id = ?) AS hospitalizaciones,
         (SELECT COUNT(*) FROM cirugia c JOIN expediente e ON c.expediente_id = e.id WHERE e.clinica_id = ?) AS cirugias,
         (SELECT COUNT(*) FROM vacuna v JOIN paciente p ON v.paciente_id = p.id WHERE p.clinica_id = ?) AS vacunas`,
      Array(6).fill(clinicaId)
    );
    return rows[0];
  }
}

module.exports = StatsRepository;
