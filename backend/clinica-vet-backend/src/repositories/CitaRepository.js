const BaseRepository = require('./BaseRepository');
const Cita = require('../domain/Cita');

/**
 * Repositorio de citas. Único lugar con SQL de la tabla `cita`.
 * Las lecturas enriquecen con paciente, tutor (para recordatorios
 * por WhatsApp) y veterinario asignado.
 */

const BASE_SELECT = `
  SELECT c.*,
    DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
    p.nombre  AS paciente_nombre,
    p.especie AS paciente_especie,
    p.raza    AS paciente_raza,
    t.id      AS tutor_id,
    CONCAT(t.nombre, ' ', t.apellidos) AS tutor_nombre,
    t.telefono AS tutor_telefono,
    t.whatsapp AS tutor_whatsapp,
    CONCAT(e.nombre, ' ', e.apellidos) AS empleado_nombre
  FROM cita c
  JOIN paciente p  ON c.paciente_id = p.id
  LEFT JOIN tutor t     ON p.tutor_id = t.id
  LEFT JOIN empleados e ON c.empleado_id = e.id
`;

class CitaRepository extends BaseRepository {
  constructor({ query }) {
    super({
      query,
      tabla: 'cita',
      columnas: [
        'paciente_id', 'empleado_id', 'fecha', 'hora_inicio',
        'duracion_min', 'motivo', 'notas', 'estado',
      ],
    });
  }

  /** Citas de la clínica en [desde, hasta], con filtros opcionales. */
  async listarPorRango(clinicaId, { desde, hasta, empleadoId = null, estado = null }) {
    const condiciones = ['c.clinica_id = ?', 'c.fecha BETWEEN ? AND ?'];
    const params = [clinicaId, desde, hasta];

    if (empleadoId) {
      condiciones.push('c.empleado_id = ?');
      params.push(empleadoId);
    }
    if (estado) {
      condiciones.push('c.estado = ?');
      params.push(estado);
    }

    return this.query(
      `${BASE_SELECT} WHERE ${condiciones.join(' AND ')} ORDER BY c.fecha, c.hora_inicio`,
      params
    );
  }

  async obtenerPorId(id, clinicaId) {
    const rows = await this.query(
      `${BASE_SELECT} WHERE c.id = ? AND c.clinica_id = ?`,
      [id, clinicaId]
    );
    return rows[0] ?? null;
  }

  /**
   * Primera cita ACTIVA del mismo veterinario que se traslape con
   * [horaInicio, horaFin) en esa fecha, o null. `excluirId` omite la
   * propia cita al editar.
   */
  async buscarTraslape(clinicaId, { empleadoId, fecha, horaInicio, horaFin, excluirId = null }) {
    const marcadoresActivos = Cita.ESTADOS_ACTIVOS.map(() => '?').join(', ');
    const rows = await this.query(
      `SELECT c.id, c.hora_inicio, c.duracion_min, p.nombre AS paciente_nombre
       FROM cita c
       JOIN paciente p ON c.paciente_id = p.id
       WHERE c.clinica_id = ?
         AND c.empleado_id = ?
         AND c.fecha = ?
         AND c.estado IN (${marcadoresActivos})
         AND c.id != ?
         AND NOT (
           ADDTIME(c.hora_inicio, SEC_TO_TIME(c.duracion_min * 60)) <= ?
           OR c.hora_inicio >= ?
         )
       LIMIT 1`,
      [clinicaId, empleadoId, fecha, ...Cita.ESTADOS_ACTIVOS, excluirId ?? -1, horaInicio, horaFin]
    );
    return rows[0] ?? null;
  }
}

module.exports = CitaRepository;
