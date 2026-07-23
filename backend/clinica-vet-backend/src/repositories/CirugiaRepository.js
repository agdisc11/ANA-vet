/**
 * Repositorio de cirugías y su anestesia asociada.
 * Sin clinica_id propio: el aislamiento va vía JOIN con `expediente`.
 */
class CirugiaRepository {
  #query;
  #withTransaction;

  constructor({ query, withTransaction }) {
    this.#query = query;
    this.#withTransaction = withTransaction;
  }

  listarPorClinica(clinicaId) {
    return this.#query(
      `SELECT c.id, c.fecha, c.procedimiento, c.notas, c.consentimiento,
              a.protocolo, a.farmacos, a.dosis, a.observaciones,
              e.paciente_id, p.nombre AS paciente_nombre,
              t.nombre AS tutor_nombre, t.apellidos AS tutor_apellidos,
              GROUP_CONCAT(DISTINCT CONCAT(emp.nombre, ' ', emp.apellidos) ORDER BY emp.nombre SEPARATOR ', ') AS empleados_nombres
       FROM cirugia c
       LEFT JOIN anestesia a ON c.id = a.cirugia_id
       JOIN expediente e ON c.expediente_id = e.id
       JOIN paciente p ON e.paciente_id = p.id
       JOIN tutor t ON p.tutor_id = t.id
       LEFT JOIN cirugia_empleados ce ON c.id = ce.cirugia_id
       LEFT JOIN empleados emp ON ce.empleado_id = emp.id
       WHERE e.clinica_id = ?
       GROUP BY c.id, a.id, e.paciente_id, p.nombre, t.nombre, t.apellidos
       ORDER BY c.fecha DESC`,
      [clinicaId]
    );
  }

  listarPorExpediente(expedienteId, clinicaId) {
    return this.#query(
      `SELECT c.id, c.fecha, c.procedimiento, c.plan_quirurgico, c.notas, c.consentimiento,
              a.protocolo, a.farmacos, a.dosis, a.observaciones,
              GROUP_CONCAT(DISTINCT ce.empleado_id ORDER BY ce.empleado_id SEPARATOR ',') AS empleados_ids,
              GROUP_CONCAT(DISTINCT CONCAT(emp.nombre, ' ', emp.apellidos) ORDER BY emp.nombre SEPARATOR ', ') AS empleados_nombres
       FROM cirugia c
       JOIN expediente e ON c.expediente_id = e.id
       LEFT JOIN anestesia a ON c.id = a.cirugia_id
       LEFT JOIN cirugia_empleados ce ON c.id = ce.cirugia_id
       LEFT JOIN empleados emp ON ce.empleado_id = emp.id
       WHERE c.expediente_id = ? AND e.clinica_id = ?
       GROUP BY c.id, a.id
       ORDER BY c.fecha DESC`,
      [expedienteId, clinicaId]
    );
  }

  /** ¿La cirugía pertenece (vía expediente) a la clínica? */
  async existeEnClinica(cirugiaId, clinicaId) {
    const rows = await this.#query(
      `SELECT c.id FROM cirugia c
       JOIN expediente e ON c.expediente_id = e.id
       WHERE c.id = ? AND e.clinica_id = ? LIMIT 1`,
      [cirugiaId, clinicaId]
    );
    return rows.length > 0;
  }

  /** Alta transaccional: cirugía + personal asignado (filtrado por clínica). */
  async crearConEmpleados(clinicaId, datos, empleadosIds) {
    return this.#withTransaction(async (tx) => {
      const resultado = await tx.query(
        `INSERT INTO cirugia (expediente_id, fecha, procedimiento, plan_quirurgico, notas, consentimiento)
         VALUES (?,?,?,?,?,?)`,
        [
          datos.expediente_id, datos.fecha, datos.procedimiento,
          datos.plan_quirurgico, datos.notas, datos.consentimiento,
        ]
      );
      const cirugiaId = resultado.insertId;

      if (empleadosIds.length > 0) {
        await tx.query(
          `INSERT IGNORE INTO cirugia_empleados (cirugia_id, empleado_id)
           SELECT ?, id FROM empleados WHERE id IN (?) AND clinica_id = ?`,
          [cirugiaId, empleadosIds, clinicaId]
        );
      }
      return cirugiaId;
    });
  }

  /** @returns {Promise<number>} id de la anestesia registrada */
  async crearAnestesia(datos) {
    const resultado = await this.#query(
      'INSERT INTO anestesia (cirugia_id, protocolo, farmacos, dosis, observaciones) VALUES (?,?,?,?,?)',
      [datos.cirugia_id, datos.protocolo, datos.farmacos, datos.dosis, datos.observaciones]
    );
    return resultado.insertId;
  }
}

module.exports = CirugiaRepository;
