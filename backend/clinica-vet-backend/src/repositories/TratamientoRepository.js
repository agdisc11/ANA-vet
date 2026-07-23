/**
 * Repositorio de la hoja de tratamiento hospitalario (Fase 3.6).
 *
 * `tratamiento_tarea` no tiene clinica_id: el aislamiento se hace
 * SIEMPRE por hospitalizacion → expediente → clinica_id.
 */

const SELECT_TAREAS = `
  SELECT t.id, t.hospitalizacion_id,
         DATE_FORMAT(t.fecha, '%Y-%m-%d') AS fecha,
         TIME_FORMAT(t.hora, '%H:%i')     AS hora,
         t.descripcion, t.categoria, t.dosis, t.via, t.notas,
         t.completada, t.completada_en, t.completada_por,
         CONCAT(e.nombre, ' ', e.apellidos) AS completada_por_nombre
  FROM tratamiento_tarea t
  LEFT JOIN empleados e ON t.completada_por = e.id
`;

class TratamientoRepository {
  #query;

  constructor({ query }) {
    this.#query = query;
  }

  /** ¿La hospitalización pertenece a la clínica? (vía expediente) */
  async hospitalizacionEsDeClinica(hospitalizacionId, clinicaId) {
    const rows = await this.#query(
      `SELECT h.id FROM hospitalizacion h
       JOIN expediente e ON h.expediente_id = e.id
       WHERE h.id = ? AND e.clinica_id = ? LIMIT 1`,
      [hospitalizacionId, clinicaId]
    );
    return rows.length > 0;
  }

  /** Tareas de una hospitalización; opcionalmente de un día concreto. */
  listarPorHospitalizacion(hospitalizacionId, { fecha = null } = {}) {
    const condiciones = ['t.hospitalizacion_id = ?'];
    const params = [hospitalizacionId];
    if (fecha) {
      condiciones.push('t.fecha = ?');
      params.push(fecha);
    }
    return this.#query(
      `${SELECT_TAREAS} WHERE ${condiciones.join(' AND ')} ORDER BY t.fecha, t.hora, t.id`,
      params
    );
  }

  /** Pacientes internados hoy con el avance de su hoja (tablero de enfermería). */
  listarInternadosConAvance(clinicaId, fecha) {
    return this.#query(
      `SELECT h.id AS hospitalizacion_id, h.fecha_ingreso, h.tipo_alta,
              p.id AS paciente_id, p.nombre AS paciente_nombre, p.especie,
              COUNT(t.id)                                   AS total_tareas,
              COALESCE(SUM(t.completada = 1), 0)            AS tareas_completadas
       FROM hospitalizacion h
       JOIN expediente e ON h.expediente_id = e.id
       JOIN paciente p   ON e.paciente_id = p.id
       LEFT JOIN tratamiento_tarea t
              ON t.hospitalizacion_id = h.id AND t.fecha = ?
       WHERE e.clinica_id = ? AND h.tipo_alta IS NULL
       GROUP BY h.id, h.fecha_ingreso, h.tipo_alta, p.id, p.nombre, p.especie
       ORDER BY h.fecha_ingreso DESC`,
      [fecha, clinicaId]
    );
  }

  async crear(datos) {
    const resultado = await this.#query(
      `INSERT INTO tratamiento_tarea
         (hospitalizacion_id, fecha, hora, descripcion, categoria, dosis, via, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        datos.hospitalizacion_id, datos.fecha, datos.hora, datos.descripcion,
        datos.categoria, datos.dosis, datos.via, datos.notas,
      ]
    );
    return resultado.insertId;
  }

  /** Crea la misma tarea repetida cada `cadaHoras` (pauta de medicación). */
  async crearSerie(datosBase, horas) {
    const valores = horas.map((hora) => [
      datosBase.hospitalizacion_id, datosBase.fecha, hora, datosBase.descripcion,
      datosBase.categoria, datosBase.dosis, datosBase.via, datosBase.notas,
    ]);
    const resultado = await this.#query(
      `INSERT INTO tratamiento_tarea
         (hospitalizacion_id, fecha, hora, descripcion, categoria, dosis, via, notas)
       VALUES ?`,
      [valores]
    );
    return resultado.affectedRows;
  }

  /** Tarea con la clínica de su hospitalización (para verificar acceso). */
  async obtenerConClinica(tareaId) {
    const rows = await this.#query(
      `SELECT t.id, t.completada, e.clinica_id
       FROM tratamiento_tarea t
       JOIN hospitalizacion h ON t.hospitalizacion_id = h.id
       JOIN expediente e ON h.expediente_id = e.id
       WHERE t.id = ?`,
      [tareaId]
    );
    return rows[0] ?? null;
  }

  /** Firma o desfirma la tarea. */
  async marcarCompletada(tareaId, { completada, empleadoId }) {
    const resultado = await this.#query(
      `UPDATE tratamiento_tarea
       SET completada = ?,
           completada_en = ${completada ? 'CURRENT_TIMESTAMP' : 'NULL'},
           completada_por = ?
       WHERE id = ?`,
      [completada ? 1 : 0, completada ? empleadoId ?? null : null, tareaId]
    );
    return resultado.affectedRows;
  }

  async eliminar(tareaId) {
    const resultado = await this.#query('DELETE FROM tratamiento_tarea WHERE id = ?', [tareaId]);
    return resultado.affectedRows;
  }
}

module.exports = TratamientoRepository;
