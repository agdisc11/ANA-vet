/**
 * Repositorio de datos para reportes PDF.
 * Solo lectura; todas las queries filtran por clínica.
 */
class ReporteRepository {
  #query;

  constructor({ query }) {
    this.#query = query;
  }

  pacientes(clinicaId) {
    return this.#query(
      `SELECT p.nombre, p.especie, p.raza,
              TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) AS edad,
              t.nombre AS tutor_nombre, t.telefono
       FROM paciente p
       LEFT JOIN tutor t ON p.tutor_id = t.id
       WHERE p.clinica_id = ?
       ORDER BY p.nombre`,
      [clinicaId]
    );
  }

  tutores(clinicaId) {
    return this.#query(
      `SELECT t.nombre, t.apellidos, t.telefono, t.correo, COUNT(p.id) AS total_pacientes
       FROM tutor t
       LEFT JOIN paciente p ON p.tutor_id = t.id
       WHERE t.clinica_id = ?
       GROUP BY t.id
       ORDER BY t.nombre`,
      [clinicaId]
    );
  }

  hospitalizaciones(clinicaId) {
    return this.#query(
      `SELECT h.fecha_ingreso, h.tipo_alta,
              p.nombre AS paciente_nombre, t.nombre AS tutor_nombre
       FROM hospitalizacion h
       LEFT JOIN expediente e ON h.expediente_id = e.id
       LEFT JOIN paciente p ON e.paciente_id = p.id
       LEFT JOIN tutor t ON p.tutor_id = t.id
       WHERE e.clinica_id = ?
       ORDER BY h.fecha_ingreso DESC
       LIMIT 50`,
      [clinicaId]
    );
  }

  cirugias(clinicaId) {
    return this.#query(
      `SELECT c.fecha, c.procedimiento,
              p.nombre AS paciente_nombre, t.nombre AS tutor_nombre
       FROM cirugia c
       LEFT JOIN expediente e ON c.expediente_id = e.id
       LEFT JOIN paciente p ON e.paciente_id = p.id
       LEFT JOIN tutor t ON p.tutor_id = t.id
       WHERE e.clinica_id = ?
       ORDER BY c.fecha DESC
       LIMIT 50`,
      [clinicaId]
    );
  }

  consultas(clinicaId) {
    return this.#query(
      `SELECT c.fecha, c.motivo, c.dx_presuntivo, e.dx_definitivo,
              p.nombre AS paciente_nombre, t.nombre AS tutor_nombre
       FROM consulta c
       LEFT JOIN expediente e ON c.expediente_id = e.id
       LEFT JOIN paciente p ON e.paciente_id = p.id
       LEFT JOIN tutor t ON p.tutor_id = t.id
       WHERE e.clinica_id = ?
       ORDER BY c.fecha DESC
       LIMIT 50`,
      [clinicaId]
    );
  }

  vacunas(clinicaId) {
    return this.#query(
      `SELECT v.fecha_aplicacion, v.nombre, v.proxima_dosis,
              p.nombre AS paciente_nombre, t.nombre AS tutor_nombre
       FROM vacuna v
       LEFT JOIN paciente p ON v.paciente_id = p.id
       LEFT JOIN tutor t ON p.tutor_id = t.id
       WHERE p.clinica_id = ?
       ORDER BY v.fecha_aplicacion DESC
       LIMIT 50`,
      [clinicaId]
    );
  }

  async resumenGeneral(clinicaId) {
    const rows = await this.#query(
      `SELECT
         (SELECT COUNT(*) FROM paciente WHERE clinica_id = ?) AS pacientes,
         (SELECT COUNT(*) FROM hospitalizacion h JOIN expediente e ON h.expediente_id = e.id WHERE e.clinica_id = ?) AS hospitalizaciones,
         (SELECT COUNT(*) FROM cirugia c JOIN expediente e ON c.expediente_id = e.id WHERE e.clinica_id = ?) AS cirugias,
         (SELECT COUNT(*) FROM consulta c JOIN expediente e ON c.expediente_id = e.id WHERE e.clinica_id = ?) AS consultas,
         (SELECT COUNT(*) FROM vacuna v JOIN paciente p ON v.paciente_id = p.id WHERE p.clinica_id = ?) AS vacunas,
         (SELECT COUNT(*) FROM tutor WHERE clinica_id = ?) AS tutores`,
      Array(6).fill(clinicaId)
    );
    return rows[0] ?? {};
  }

  async fichaPaciente(pacienteId, clinicaId) {
    const rows = await this.#query(
      `SELECT p.id, p.nombre, p.especie, p.raza,
              TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) AS edad,
              p.sexo, p.tatuaje, p.microchip, p.esquemas_preventivos,
              t.nombre AS tutor_nombre, t.apellidos AS tutor_apellidos,
              t.telefono, t.direccion
       FROM paciente p
       LEFT JOIN tutor t ON p.tutor_id = t.id
       WHERE p.id = ? AND p.clinica_id = ?
       LIMIT 1`,
      [pacienteId, clinicaId]
    );
    return rows[0] ?? null;
  }

  historialConsultas(pacienteId, clinicaId) {
    return this.#query(
      `SELECT c.fecha, c.motivo, c.dx_presuntivo
       FROM consulta c
       JOIN expediente e ON c.expediente_id = e.id
       WHERE e.paciente_id = ? AND e.clinica_id = ?
       ORDER BY c.fecha DESC LIMIT 15`,
      [pacienteId, clinicaId]
    );
  }

  historialVacunas(pacienteId, clinicaId) {
    return this.#query(
      `SELECT v.nombre, v.fecha_aplicacion, v.proxima_dosis
       FROM vacuna v
       JOIN paciente p ON v.paciente_id = p.id
       WHERE v.paciente_id = ? AND p.clinica_id = ?
       ORDER BY v.fecha_aplicacion DESC LIMIT 15`,
      [pacienteId, clinicaId]
    );
  }
}

module.exports = ReporteRepository;
