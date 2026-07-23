/**
 * Repositorio de recordatorios (Fase 3.2).
 *
 * Reúne los eventos que ameritan contactar al tutor (vacunas próximas o
 * vencidas y citas próximas) JUNTO con sus datos de contacto, y marca
 * cuáles ya se enviaron (LEFT JOIN con recordatorio_enviado).
 *
 * Sin clinica_id propio en vacuna/cita → el aislamiento va por
 * paciente.clinica_id / cita.clinica_id en cada query.
 */

// Vacunas cuya próxima dosis cae en la ventana [hoy - vencidasDias, hoy + proximosDias]
const SQL_VACUNAS = `
  SELECT
    v.id                         AS referencia_id,
    'vacuna'                     AS tipo,
    v.proxima_dosis              AS fecha,
    NULL                         AS hora,
    v.nombre                     AS detalle,
    p.id                         AS paciente_id,
    p.nombre                     AS paciente_nombre,
    t.id                         AS tutor_id,
    CONCAT(t.nombre, ' ', t.apellidos) AS tutor_nombre,
    t.telefono, t.whatsapp,
    re.enviado_en
  FROM vacuna v
  JOIN paciente p ON v.paciente_id = p.id
  LEFT JOIN tutor t ON p.tutor_id = t.id
  LEFT JOIN recordatorio_enviado re
         ON re.tipo = 'vacuna' AND re.referencia_id = v.id AND re.clinica_id = ?
  WHERE p.clinica_id = ?
    AND v.proxima_dosis IS NOT NULL
    AND v.proxima_dosis BETWEEN DATE_SUB(CURDATE(), INTERVAL ? DAY)
                            AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
`;

// Citas activas dentro de los próximos N días
const SQL_CITAS = `
  SELECT
    c.id                         AS referencia_id,
    'cita'                       AS tipo,
    c.fecha                      AS fecha,
    DATE_FORMAT(c.hora_inicio, '%H:%i') AS hora,
    c.motivo                     AS detalle,
    p.id                         AS paciente_id,
    p.nombre                     AS paciente_nombre,
    t.id                         AS tutor_id,
    CONCAT(t.nombre, ' ', t.apellidos) AS tutor_nombre,
    t.telefono, t.whatsapp,
    re.enviado_en
  FROM cita c
  JOIN paciente p ON c.paciente_id = p.id
  LEFT JOIN tutor t ON p.tutor_id = t.id
  LEFT JOIN recordatorio_enviado re
         ON re.tipo = 'cita' AND re.referencia_id = c.id AND re.clinica_id = ?
  WHERE c.clinica_id = ?
    AND c.estado IN ('programada', 'confirmada')
    AND c.fecha BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
`;

class RecordatorioRepository {
  #query;

  constructor({ query }) {
    this.#query = query;
  }

  /**
   * @param {number} clinicaId
   * @param {{proximosDias?: number, vencidasDias?: number}} opciones
   * @returns {Promise<Array>} filas de vacunas y citas con contacto
   */
  async listarPendientes(clinicaId, { proximosDias = 30, vencidasDias = 30 } = {}) {
    const [vacunas, citas] = await Promise.all([
      this.#query(SQL_VACUNAS, [clinicaId, clinicaId, vencidasDias, proximosDias]),
      this.#query(SQL_CITAS, [clinicaId, clinicaId, proximosDias]),
    ]);
    return [...vacunas, ...citas];
  }

  /** Nombre de la clínica (para la firma del mensaje). */
  async nombreClinica(clinicaId) {
    const rows = await this.#query('SELECT nombre FROM clinicas WHERE id = ?', [clinicaId]);
    return rows[0]?.nombre ?? null;
  }

  /**
   * Registra el envío. Idempotente: si ya existía se actualiza la fecha
   * (UNIQUE por clinica+tipo+referencia).
   */
  async registrarEnvio(clinicaId, { tipo, referencia_id, paciente_id, canal = 'whatsapp', enviado_por = null }) {
    await this.#query(
      `INSERT INTO recordatorio_enviado (clinica_id, tipo, referencia_id, paciente_id, canal, enviado_por)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE enviado_en = CURRENT_TIMESTAMP, enviado_por = VALUES(enviado_por)`,
      [clinicaId, tipo, referencia_id, paciente_id ?? null, canal, enviado_por]
    );
  }

  /** Borra el registro de envío (permite reenviar). */
  async borrarEnvio(clinicaId, tipo, referenciaId) {
    const resultado = await this.#query(
      'DELETE FROM recordatorio_enviado WHERE clinica_id = ? AND tipo = ? AND referencia_id = ?',
      [clinicaId, tipo, referenciaId]
    );
    return resultado.affectedRows;
  }
}

module.exports = RecordatorioRepository;
