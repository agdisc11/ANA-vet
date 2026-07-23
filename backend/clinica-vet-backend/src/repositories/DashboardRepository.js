/**
 * Repositorio de agregaciones del dashboard.
 * Solo lectura; todas las queries filtran por clínica.
 */
class DashboardRepository {
  #query;

  constructor({ query }) {
    this.#query = query;
  }

  async ingresosDelMes(clinicaId) {
    const rows = await this.#query(
      `SELECT COALESCE(SUM(total), 0) AS ingresos_mes
       FROM recibo
       WHERE clinica_id = ? AND status = 'finalizado'
         AND YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE())`,
      [clinicaId]
    );
    return parseFloat(rows[0].ingresos_mes);
  }

  async totalPacientes(clinicaId) {
    const rows = await this.#query(
      'SELECT COUNT(*) AS total FROM paciente WHERE clinica_id = ?',
      [clinicaId]
    );
    return rows[0].total;
  }

  async consultasDeHoy(clinicaId) {
    const rows = await this.#query(
      `SELECT COUNT(*) AS total
       FROM consulta c JOIN expediente e ON c.expediente_id = e.id
       WHERE e.clinica_id = ? AND c.fecha = CURDATE()`,
      [clinicaId]
    );
    return rows[0].total;
  }

  scorecardEmpleados(clinicaId) {
    return this.#query(
      `SELECT
         emp.id                                    AS empleado_id,
         CONCAT(emp.nombre, ' ', emp.apellidos)    AS empleado_nombre,
         r.nombre                                  AS rol,
         COALESCE(cons.total_consultas, 0)         AS total_consultas,
         COALESCE(cir.total_cirugias, 0)           AS total_cirugias,
         COALESCE(hosp.total_hospitalizaciones, 0) AS total_hospitalizaciones,
         (COALESCE(cons.total_consultas, 0) + COALESCE(cir.total_cirugias, 0) +
          COALESCE(hosp.total_hospitalizaciones, 0)) AS total_actividad
       FROM empleados emp
       LEFT JOIN roles r ON emp.rol_id = r.id
       LEFT JOIN (
         SELECT c.empleado_id, COUNT(*) AS total_consultas
         FROM consulta c JOIN expediente e ON c.expediente_id = e.id
         WHERE e.clinica_id = ? GROUP BY c.empleado_id
       ) cons ON emp.id = cons.empleado_id
       LEFT JOIN (
         SELECT ce.empleado_id, COUNT(*) AS total_cirugias
         FROM cirugia_empleados ce
         JOIN cirugia ci ON ce.cirugia_id = ci.id
         JOIN expediente e ON ci.expediente_id = e.id
         WHERE e.clinica_id = ? GROUP BY ce.empleado_id
       ) cir ON emp.id = cir.empleado_id
       LEFT JOIN (
         SELECT he.empleado_id, COUNT(*) AS total_hospitalizaciones
         FROM hospitalizacion_empleados he
         JOIN hospitalizacion h ON he.hospitalizacion_id = h.id
         JOIN expediente e ON h.expediente_id = e.id
         WHERE e.clinica_id = ? GROUP BY he.empleado_id
       ) hosp ON emp.id = hosp.empleado_id
       WHERE emp.clinica_id = ?
       ORDER BY total_actividad DESC, emp.nombre ASC`,
      [clinicaId, clinicaId, clinicaId, clinicaId]
    );
  }

  ingresosRecientes(clinicaId) {
    return this.#query(
      `SELECT r.id, r.total, r.fecha, p.nombre AS paciente, e.nombre AS empleado
       FROM recibo r
       JOIN paciente p ON r.paciente_id = p.id
       JOIN empleados e ON r.empleado_id = e.id
       WHERE r.clinica_id = ? AND r.status = 'finalizado'
       ORDER BY r.fecha DESC LIMIT 5`,
      [clinicaId]
    );
  }

  alertasInventario(clinicaId) {
    return this.#query(
      `SELECT id, nombre, stock FROM inventario
       WHERE clinica_id = ? AND stock <= 5
       ORDER BY stock ASC LIMIT 5`,
      [clinicaId]
    );
  }

  async consultasHoyDeEmpleado(empleadoId, clinicaId) {
    const rows = await this.#query(
      `SELECT COUNT(*) AS total
       FROM consulta c JOIN expediente e ON c.expediente_id = e.id
       WHERE c.empleado_id = ? AND e.clinica_id = ? AND c.fecha = CURDATE()`,
      [empleadoId, clinicaId]
    );
    return rows[0].total;
  }

  async cirugiasHoyDeEmpleado(empleadoId, clinicaId) {
    const rows = await this.#query(
      `SELECT COUNT(*) AS total
       FROM cirugia_empleados ce
       JOIN cirugia ci ON ce.cirugia_id = ci.id
       JOIN expediente e ON ci.expediente_id = e.id
       WHERE ce.empleado_id = ? AND e.clinica_id = ? AND ci.fecha = CURDATE()`,
      [empleadoId, clinicaId]
    );
    return rows[0].total;
  }
}

module.exports = DashboardRepository;
