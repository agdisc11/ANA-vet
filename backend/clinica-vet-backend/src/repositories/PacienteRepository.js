const BaseRepository = require('./BaseRepository');

/**
 * Repositorio de pacientes.
 * Único lugar del sistema que conoce el SQL de la tabla `paciente`.
 */

const BASE_SELECT = `
  SELECT p.*, CONCAT(t.nombre, ' ', t.apellidos) AS tutor,
    TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) AS edad
  FROM paciente p
  LEFT JOIN tutor t ON p.tutor_id = t.id
`;

class PacienteRepository extends BaseRepository {
  constructor({ query }) {
    super({
      query,
      tabla: 'paciente',
      columnas: [
        'tutor_id', 'nombre', 'especie', 'raza', 'sexo', 'fecha_nacimiento',
        'funcion_zootecnica', 'tatuaje', 'microchip', 'esquemas_preventivos',
      ],
    });
  }

  /**
   * Lista pacientes de la clínica con búsqueda y paginación opcionales.
   * - Sin `page`: devuelve el arreglo completo (contrato legacy del frontend).
   * - Con `page`: devuelve { datos, total }.
   */
  async listarPorClinica(clinicaId, { q = null, page = null, limit = 20 } = {}) {
    const condiciones = ['p.clinica_id = ?'];
    const params = [clinicaId];

    if (q) {
      condiciones.push(
        "(p.nombre LIKE ? OR p.especie LIKE ? OR p.raza LIKE ? OR CONCAT(t.nombre, ' ', t.apellidos) LIKE ?)"
      );
      const patron = `%${q}%`;
      params.push(patron, patron, patron, patron);
    }

    const where = ` WHERE ${condiciones.join(' AND ')}`;
    const orden = ' ORDER BY p.nombre';

    if (page === null) {
      return this.query(BASE_SELECT + where + orden, params);
    }

    const offset = (page - 1) * limit;
    const [datos, totalRows] = await Promise.all([
      this.query(BASE_SELECT + where + orden + ' LIMIT ? OFFSET ?', [...params, limit, offset]),
      this.query(
        `SELECT COUNT(*) AS total FROM paciente p LEFT JOIN tutor t ON p.tutor_id = t.id${where}`,
        params
      ),
    ]);
    return { datos, total: totalRows[0].total };
  }

  /**
   * Búsqueda para el command palette (Ctrl+K): pocas columnas, pocas filas.
   *
   * Deliberadamente NO reutiliza `listarPorClinica`: aquí interesa la
   * latencia (se dispara con cada tecleo), así que se piden solo los
   * campos que pinta el palette y se evita el COUNT(*) de la paginación.
   * Busca también por microchip: es el caso real de "llegó un perro
   * perdido con chip".
   *
   * @param {number} clinicaId
   * @param {string} patron — patrón LIKE ya escapado (Busqueda#patronLike)
   * @param {number} limite
   */
  async buscarGlobal(clinicaId, patron, limite) {
    return this.query(
      `SELECT p.id, p.nombre, p.especie, p.raza, p.microchip, p.tutor_id,
              CONCAT(t.nombre, ' ', COALESCE(t.apellidos, '')) AS tutor
       FROM paciente p
       LEFT JOIN tutor t ON p.tutor_id = t.id
       WHERE p.clinica_id = ?
         AND (p.nombre LIKE ?
              OR p.microchip LIKE ?
              OR CONCAT(t.nombre, ' ', COALESCE(t.apellidos, '')) LIKE ?)
       ORDER BY p.nombre
       LIMIT ?`,
      [clinicaId, patron, patron, patron, limite]
    );
  }

  /** Paciente con nombre del tutor y edad calculada, o null. */
  async obtenerPorId(id, clinicaId) {
    const rows = await this.query(
      BASE_SELECT + ' WHERE p.id = ? AND p.clinica_id = ?',
      [id, clinicaId]
    );
    return rows[0] ?? null;
  }
}

module.exports = PacienteRepository;
