const { NotFoundError } = require('../errors/ApiError');

/**
 * Servicio de inventario y reabastecimiento.
 *
 * La regla de negocio central vive aquí: al marcar una solicitud como
 * 'completado' se suma la cantidad al stock del producto (por su id).
 * Los mensajes de respuesta conservan el contrato de la versión anterior
 * (clave `message`, distintos avisos si el stock no pudo actualizarse).
 */
class InventarioService {
  #inventario;

  constructor({ inventarioRepository }) {
    this.#inventario = inventarioRepository;
  }

  listarProductos(clinicaId) {
    return this.#inventario.listarProductos(clinicaId);
  }

  /** @returns {Promise<number>} id del producto creado */
  crearProducto(dto, clinicaId) {
    return this.#inventario.insert(clinicaId, dto);
  }

  async actualizarProducto(id, dto, clinicaId) {
    const afectadas = await this.#inventario.updateById(id, clinicaId, dto);
    if (afectadas === 0) throw new NotFoundError('Producto no encontrado');
  }

  listarSolicitudes(clinicaId) {
    return this.#inventario.listarSolicitudes(clinicaId);
  }

  /** @returns {Promise<number>} id de la solicitud creada */
  async solicitarReabastecimiento(dto, clinicaId, usuarioId) {
    const producto = await this.#inventario.obtenerProducto(dto.producto_id, clinicaId);
    if (!producto) {
      throw new NotFoundError('Producto no encontrado en el inventario de esta clínica');
    }
    return this.#inventario.crearSolicitud(clinicaId, {
      producto_id: dto.producto_id,
      // El nombre sale de la BD para garantizar consistencia
      producto_nombre: dto.producto_nombre || producto.nombre,
      cantidad: dto.cantidad ?? 1,
      notas: dto.notas ?? null,
      empleado_id: usuarioId,
    });
  }

  /**
   * Cambia el status de una solicitud; con 'completado' además suma el
   * stock. @returns {Promise<{message: string, stockError?: string}>}
   */
  async actualizarSolicitud(id, status, clinicaId) {
    const solicitud = await this.#inventario.obtenerSolicitud(id, clinicaId);
    if (!solicitud) throw new NotFoundError('Solicitud no encontrada');

    const afectadas = await this.#inventario.actualizarStatusSolicitud(id, clinicaId, status);
    if (afectadas === 0) throw new NotFoundError('Solicitud no encontrada');

    if (status !== 'completado') {
      return { message: 'Solicitud actualizada' };
    }

    // Solicitudes previas a la migración add_producto_id pueden no tener producto_id
    if (!solicitud.producto_id) {
      return {
        message:
          'Solicitud marcada como completada, pero el stock no fue actualizado ' +
          'porque la solicitud no tiene producto_id. Actualice la base de datos con la migración provista.',
      };
    }

    try {
      const stockAfectado = await this.#inventario.incrementarStock(
        solicitud.producto_id,
        clinicaId,
        solicitud.cantidad ?? 1
      );
      if (stockAfectado === 0) {
        return { message: 'Solicitud marcada como completada, pero el producto no fue encontrado en el inventario' };
      }
      return { message: 'Solicitud completada y stock actualizado en inventario' };
    } catch (err) {
      return {
        message: 'Solicitud marcada como completada, pero hubo un error al actualizar el stock',
        stockError: err.message,
      };
    }
  }
}

module.exports = InventarioService;
