/**
 * Repositorio de consultas.
 * La tabla `consulta` NO tiene clinica_id: el aislamiento multi-tenant
 * se garantiza en cada query vía JOIN con `expediente` (que sí lo tiene).
 * Por eso no extiende BaseRepository.
 */

const COLUMNAS_INSERT = [
  'expediente_id', 'empleado_id', 'fecha', 'motivo', 'anamnesis',
  'examen_fisico', 'indicaciones', 'examenes_sistemicos', 'lista_problemas',
  'dx_presuntivo', 'abordaje_dx', 'tratamiento', 'tratamiento_etiologico',
  'seguimiento_medico', 'resumen',
];

class ConsultaRepository {
  #query;

  constructor({ query }) {
    this.#query = query;
  }

  listarPorClinica(clinicaId) {
    return this.#query(
      `SELECT c.*, e.paciente_id, p.nombre AS paciente_nombre, t.nombre AS tutor_nombre, t.apellidos AS tutor_apellidos,
              emp.id AS empleado_id, emp.nombre AS empleado_nombre, emp.apellidos AS empleado_apellidos
       FROM consulta c
       JOIN expediente e ON c.expediente_id = e.id
       JOIN paciente p ON e.paciente_id = p.id
       JOIN tutor t ON p.tutor_id = t.id
       LEFT JOIN empleados emp ON c.empleado_id = emp.id
       WHERE e.clinica_id = ?
       ORDER BY c.fecha DESC`,
      [clinicaId]
    );
  }

  listarPorExpediente(expedienteId, clinicaId) {
    return this.#query(
      `SELECT c.*, emp.id AS empleado_id, emp.nombre AS empleado_nombre, emp.apellidos AS empleado_apellidos
       FROM consulta c
       JOIN expediente e ON c.expediente_id = e.id
       LEFT JOIN empleados emp ON c.empleado_id = emp.id
       WHERE c.expediente_id = ? AND e.clinica_id = ?
       ORDER BY c.fecha DESC`,
      [expedienteId, clinicaId]
    );
  }

  /** @returns {Promise<number>} id de la consulta registrada */
  async crear(datos) {
    const resultado = await this.#query(
      `INSERT INTO consulta (${COLUMNAS_INSERT.join(', ')})
       VALUES (${COLUMNAS_INSERT.map(() => '?').join(', ')})`,
      COLUMNAS_INSERT.map((columna) => datos[columna] ?? null)
    );
    return resultado.insertId;
  }
}

module.exports = ConsultaRepository;
