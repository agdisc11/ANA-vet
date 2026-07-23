/**
 * Repositorio de vacunas.
 * Sin clinica_id propio: el aislamiento va vía JOIN con `paciente`.
 */
class VacunaRepository {
  #query;

  constructor({ query }) {
    this.#query = query;
  }

  listarPorClinica(clinicaId) {
    return this.#query(
      `SELECT v.*, p.nombre AS paciente_nombre, t.nombre AS tutor_nombre, t.apellidos AS tutor_apellidos
       FROM vacuna v
       JOIN paciente p ON v.paciente_id = p.id
       JOIN tutor t ON p.tutor_id = t.id
       WHERE p.clinica_id = ?
       ORDER BY v.fecha_aplicacion DESC`,
      [clinicaId]
    );
  }

  listarPorPaciente(pacienteId, clinicaId) {
    return this.#query(
      `SELECT v.*
       FROM vacuna v
       JOIN paciente p ON v.paciente_id = p.id
       WHERE v.paciente_id = ? AND p.clinica_id = ?
       ORDER BY v.fecha_aplicacion DESC`,
      [pacienteId, clinicaId]
    );
  }

  /** @returns {Promise<number>} id de la vacuna registrada */
  async crear(datos) {
    const resultado = await this.#query(
      `INSERT INTO vacuna
         (paciente_id, nombre, fecha_aplicacion, proxima_dosis, lote, fabricante, via_administracion, dosis, observaciones)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        datos.paciente_id, datos.nombre, datos.fecha_aplicacion, datos.proxima_dosis,
        datos.lote, datos.fabricante, datos.via_administracion, datos.dosis, datos.observaciones,
      ]
    );
    return resultado.insertId;
  }
}

module.exports = VacunaRepository;
