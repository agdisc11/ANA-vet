const BaseRepository = require('./BaseRepository');

/**
 * Repositorio del catálogo de servicios de la clínica.
 */
class ServicioCatalogoRepository extends BaseRepository {
  constructor({ query }) {
    super({
      query,
      tabla: 'servicio_catalogo',
      columnas: ['categoria', 'nombre', 'precio', 'activo'],
    });
  }

  listarPorClinica(clinicaId, { incluirInactivos = false } = {}) {
    return this.query(
      `SELECT id, clinica_id, categoria, nombre, precio, activo, created_at
       FROM servicio_catalogo
       WHERE clinica_id = ?${incluirInactivos ? '' : ' AND activo = 1'}
       ORDER BY categoria ASC, nombre ASC`,
      [clinicaId]
    );
  }
}

module.exports = ServicioCatalogoRepository;
