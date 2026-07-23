/**
 * Repositorio de hospitalizaciones.
 * Sin clinica_id propio: el aislamiento va vía JOIN con `expediente`.
 *
 * Blindaje respecto a la versión anterior: los empleados asignados se
 * insertan con INSERT…SELECT filtrado por clinica_id — es imposible
 * asignar personal de otra clínica (antes se insertaba cualquier id).
 */
class HospitalizacionRepository {
  #query;
  #withTransaction;

  constructor({ query, withTransaction }) {
    this.#query = query;
    this.#withTransaction = withTransaction;
  }

  listarPorClinica(clinicaId) {
    return this.#query(
      `SELECT h.*, e.paciente_id, p.nombre AS paciente_nombre,
              t.nombre AS tutor_nombre, t.apellidos AS tutor_apellidos,
              GROUP_CONCAT(DISTINCT CONCAT(emp.nombre, ' ', emp.apellidos) ORDER BY emp.nombre SEPARATOR ', ') AS empleados_nombres
       FROM hospitalizacion h
       JOIN expediente e ON h.expediente_id = e.id
       JOIN paciente p ON e.paciente_id = p.id
       JOIN tutor t ON p.tutor_id = t.id
       LEFT JOIN hospitalizacion_empleados he ON h.id = he.hospitalizacion_id
       LEFT JOIN empleados emp ON he.empleado_id = emp.id
       WHERE e.clinica_id = ?
       GROUP BY h.id, e.paciente_id, p.nombre, t.nombre, t.apellidos
       ORDER BY h.fecha_ingreso DESC`,
      [clinicaId]
    );
  }

  listarPorExpediente(expedienteId, clinicaId) {
    return this.#query(
      `SELECT h.*,
              GROUP_CONCAT(DISTINCT he.empleado_id ORDER BY he.empleado_id SEPARATOR ',') AS empleados_ids,
              GROUP_CONCAT(DISTINCT CONCAT(emp.nombre, ' ', emp.apellidos) ORDER BY emp.nombre SEPARATOR ', ') AS empleados_nombres
       FROM hospitalizacion h
       JOIN expediente e ON h.expediente_id = e.id
       LEFT JOIN hospitalizacion_empleados he ON h.id = he.hospitalizacion_id
       LEFT JOIN empleados emp ON he.empleado_id = emp.id
       WHERE h.expediente_id = ? AND e.clinica_id = ?
       GROUP BY h.id
       ORDER BY h.fecha_ingreso DESC`,
      [expedienteId, clinicaId]
    );
  }

  /** Alta transaccional: hospitalización + personal asignado. @returns {Promise<number>} id */
  async crearConEmpleados(clinicaId, datos, empleadosIds) {
    return this.#withTransaction(async (tx) => {
      const resultado = await tx.query(
        `INSERT INTO hospitalizacion
           (expediente_id, fecha_ingreso, historia_clinica, abordaje_hospitalario,
            tratamiento_intrahospitalario, abordaje_diagnostico, seguimiento, revaloraciones,
            ajuste_plan_terapeutico, plan_diagnostico, tipo_alta, acta_responsiva)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          datos.expediente_id, datos.fecha_ingreso, datos.historia_clinica,
          datos.abordaje_hospitalario, datos.tratamiento_intrahospitalario,
          datos.abordaje_diagnostico, datos.seguimiento, datos.revaloraciones,
          datos.ajuste_plan_terapeutico, datos.plan_diagnostico,
          datos.tipo_alta, datos.acta_responsiva,
        ]
      );
      const hospitalizacionId = resultado.insertId;

      if (empleadosIds.length > 0) {
        await tx.query(
          `INSERT IGNORE INTO hospitalizacion_empleados (hospitalizacion_id, empleado_id)
           SELECT ?, id FROM empleados WHERE id IN (?) AND clinica_id = ?`,
          [hospitalizacionId, empleadosIds, clinicaId]
        );
      }
      return hospitalizacionId;
    });
  }
}

module.exports = HospitalizacionRepository;
