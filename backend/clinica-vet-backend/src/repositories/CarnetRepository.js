/**
 * Repositorio del carnet de vacunación público (Fase 3.5).
 *
 * OJO: `obtenerPorToken` es la ÚNICA consulta del sistema que no filtra
 * por clinica_id, y es correcto: el token opaco ES la credencial. Solo
 * devuelve datos del carnet (mascota + vacunas + clínica), nunca datos
 * del tutor ni información clínica sensible.
 */
class CarnetRepository {
  #query;

  constructor({ query }) {
    this.#query = query;
  }

  /** Token actual del paciente (null si aún no se generó). */
  async obtenerToken(pacienteId, clinicaId) {
    const rows = await this.#query(
      'SELECT carnet_token FROM paciente WHERE id = ? AND clinica_id = ?',
      [pacienteId, clinicaId]
    );
    if (rows.length === 0) return undefined; // paciente inexistente en la clínica
    return rows[0].carnet_token ?? null;
  }

  async guardarToken(pacienteId, clinicaId, token) {
    const resultado = await this.#query(
      'UPDATE paciente SET carnet_token = ? WHERE id = ? AND clinica_id = ?',
      [token, pacienteId, clinicaId]
    );
    return resultado.affectedRows;
  }

  /** Datos públicos de la mascota y su clínica a partir del token. */
  async obtenerPorToken(token) {
    const rows = await this.#query(
      `SELECT p.id, p.nombre, p.especie, p.raza, p.sexo, p.fecha_nacimiento, p.microchip,
              TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) AS edad,
              c.nombre AS clinica_nombre, c.telefono AS clinica_telefono, c.direccion AS clinica_direccion
       FROM paciente p
       JOIN clinicas c ON p.clinica_id = c.id
       WHERE p.carnet_token = ?`,
      [token]
    );
    return rows[0] ?? null;
  }

  /** Vacunas del carnet (solo lo que corresponde mostrar al tutor). */
  async vacunasDePaciente(pacienteId) {
    return this.#query(
      `SELECT nombre, fecha_aplicacion, proxima_dosis, lote, fabricante, via_administracion, dosis
       FROM vacuna
       WHERE paciente_id = ?
       ORDER BY fecha_aplicacion DESC`,
      [pacienteId]
    );
  }
}

module.exports = CarnetRepository;
