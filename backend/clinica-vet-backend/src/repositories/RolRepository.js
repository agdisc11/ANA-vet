const BaseRepository = require('./BaseRepository');

/**
 * Repositorio de roles.
 * Los módulos migrados usan por ahora `existeEnClinica` (heredado) para
 * validar rol_id; el CRUD de routes/roles.js migrará aquí con su módulo.
 */
class RolRepository extends BaseRepository {
  constructor({ query }) {
    super({
      query,
      tabla: 'roles',
      columnas: ['nombre', 'descripcion'],
    });
  }

  listarPorClinica(clinicaId) {
    return this.query(
      'SELECT id, nombre, descripcion, created_at FROM roles WHERE clinica_id = ? ORDER BY nombre ASC',
      [clinicaId]
    );
  }

  async obtenerPorId(id, clinicaId) {
    const rows = await this.query(
      'SELECT id, nombre, descripcion, created_at FROM roles WHERE id = ? AND clinica_id = ?',
      [id, clinicaId]
    );
    return rows[0] ?? null;
  }
}

module.exports = RolRepository;
