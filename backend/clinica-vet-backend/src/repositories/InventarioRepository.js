const BaseRepository = require('./BaseRepository');

/**
 * Repositorio de inventario y solicitudes de reabastecimiento.
 */
class InventarioRepository extends BaseRepository {
  constructor({ query }) {
    super({
      query,
      tabla: 'inventario',
      columnas: ['nombre', 'descripcion', 'stock', 'stock_minimo', 'precio', 'unidad'],
    });
  }

  listarProductos(clinicaId) {
    return this.query('SELECT * FROM inventario WHERE clinica_id = ?', [clinicaId]);
  }

  /** { id, nombre } del producto, o null. */
  async obtenerProducto(id, clinicaId) {
    const rows = await this.query(
      'SELECT id, nombre FROM inventario WHERE id = ? AND clinica_id = ?',
      [id, clinicaId]
    );
    return rows[0] ?? null;
  }

  /** @returns {Promise<number>} filas afectadas */
  async incrementarStock(productoId, clinicaId, cantidad) {
    const resultado = await this.query(
      'UPDATE inventario SET stock = stock + ? WHERE id = ? AND clinica_id = ?',
      [cantidad, productoId, clinicaId]
    );
    return resultado.affectedRows;
  }

  // ── Solicitudes de reabastecimiento ──────────────────────────

  listarSolicitudes(clinicaId) {
    return this.query(
      `SELECT sr.*, CONCAT(e.nombre, ' ', e.apellidos) AS solicitado_por
       FROM solicitud_reabastecimiento sr
       LEFT JOIN empleados e ON sr.empleado_id = e.id
       WHERE sr.clinica_id = ?
       ORDER BY sr.creado_en DESC`,
      [clinicaId]
    );
  }

  async obtenerSolicitud(id, clinicaId) {
    const rows = await this.query(
      'SELECT * FROM solicitud_reabastecimiento WHERE id = ? AND clinica_id = ?',
      [id, clinicaId]
    );
    return rows[0] ?? null;
  }

  /** @returns {Promise<number>} id de la solicitud creada */
  async crearSolicitud(clinicaId, datos) {
    const resultado = await this.query(
      `INSERT INTO solicitud_reabastecimiento
         (producto_id, producto_nombre, cantidad, notas, clinica_id, empleado_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [datos.producto_id, datos.producto_nombre, datos.cantidad, datos.notas, clinicaId, datos.empleado_id]
    );
    return resultado.insertId;
  }

  /** @returns {Promise<number>} filas afectadas */
  async actualizarStatusSolicitud(id, clinicaId, status) {
    const resultado = await this.query(
      'UPDATE solicitud_reabastecimiento SET status = ? WHERE id = ? AND clinica_id = ?',
      [status, id, clinicaId]
    );
    return resultado.affectedRows;
  }
}

module.exports = InventarioRepository;
