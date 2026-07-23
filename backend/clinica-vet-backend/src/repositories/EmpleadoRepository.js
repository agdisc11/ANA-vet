const BaseRepository = require('./BaseRepository');

/**
 * Repositorio de empleados. Único lugar con SQL de la tabla `empleados`.
 *
 * Nota: el email de empleado es ÚNICO a nivel global (sirve para el login),
 * por eso buscarPorEmail/existeEmail/emailsConPatron no filtran por clínica;
 * todo lo demás exige clinicaId (BaseRepository).
 */

const SELECT_LISTA = `
  SELECT e.id, e.nombre, e.apellidos, e.email, e.telefono, e.activo, e.created_at,
         r.id AS rol_id, r.nombre AS rol_nombre
  FROM empleados e
  LEFT JOIN roles r ON e.rol_id = r.id
`;

class EmpleadoRepository extends BaseRepository {
  constructor({ query }) {
    super({
      query,
      tabla: 'empleados',
      columnas: [
        'rol_id', 'nombre', 'apellidos', 'email',
        'password_hash', 'telefono', 'activo',
      ],
    });
  }

  /** Empleados activos con su rol (selector de la Agenda). */
  async listarActivos(clinicaId) {
    return this.query(
      `SELECT e.id, e.nombre, e.apellidos, r.nombre AS rol_nombre
       FROM empleados e
       LEFT JOIN roles r ON e.rol_id = r.id
       WHERE e.clinica_id = ? AND e.activo = 1
       ORDER BY e.nombre`,
      [clinicaId]
    );
  }

  /** Listado completo para la página de Empleados (contrato legacy). */
  async listarPorClinica(clinicaId) {
    return this.query(`${SELECT_LISTA} WHERE e.clinica_id = ? ORDER BY e.nombre ASC`, [clinicaId]);
  }

  async obtenerPorId(id, clinicaId) {
    const rows = await this.query(
      `${SELECT_LISTA} WHERE e.id = ? AND e.clinica_id = ?`,
      [id, clinicaId]
    );
    return rows[0] ?? null;
  }

  /** Fila completa + rol + clínica (para el login), o null. */
  async buscarPorEmailConRelaciones(email) {
    const rows = await this.query(
      `SELECT e.*, r.nombre AS rol_nombre, c.nombre AS clinica_nombre, c.activa AS clinica_activa
       FROM empleados e
       LEFT JOIN roles r ON e.rol_id = r.id
       LEFT JOIN clinicas c ON e.clinica_id = c.id
       WHERE e.email = ?`,
      [email]
    );
    return rows[0] ?? null;
  }

  async existeEmail(email) {
    const rows = await this.query('SELECT id FROM empleados WHERE email = ? LIMIT 1', [email]);
    return rows.length > 0;
  }

  /** Correos que comparten prefijo/dominio (resolución de colisiones). */
  async emailsConPatron(patron) {
    const rows = await this.query('SELECT email FROM empleados WHERE email LIKE ?', [patron]);
    return rows.map((r) => r.email);
  }
}

module.exports = EmpleadoRepository;
