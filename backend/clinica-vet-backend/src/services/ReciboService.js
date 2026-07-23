const Recibo = require('../domain/Recibo');
const { NotFoundError, ValidationError, ForbiddenError, ConflictError } = require('../errors/ApiError'); // eslint-disable-line no-unused-vars

/**
 * Servicio de recibos: reglas de negocio y orquestación.
 *
 * Garantías:
 *   - Multi-tenant: el paciente debe pertenecer a la clínica (403, contrato
 *     de la versión anterior) y el empleado también (verificación nueva).
 *   - El total NUNCA viene del cliente: lo calcula el agregado Recibo.
 *   - Solo los borradores se eliminan; lo finalizado es historial (409).
 */
class ReciboService {
  #recibos;
  #pacientes;
  #empleados;

  constructor({ reciboRepository, pacienteRepository, empleadoRepository }) {
    this.#recibos = reciboRepository;
    this.#pacientes = pacienteRepository;
    this.#empleados = empleadoRepository;
  }

  listarPorPaciente(pacienteId, clinicaId) {
    return this.#recibos.listarPorPaciente(pacienteId, clinicaId);
  }

  async detalle(id, clinicaId) {
    const recibo = await this.#recibos.obtenerDetalle(id, clinicaId);
    if (!recibo) throw new NotFoundError('Recibo no encontrado');
    return recibo;
  }

  /** @returns {Promise<{recibo_id: number, total: number, status: string}>} */
  async crear(dto, clinicaId) {
    const pacienteValido = await this.#pacientes.existeEnClinica(dto.paciente_id, clinicaId);
    if (!pacienteValido) throw new ForbiddenError('El paciente no pertenece a esta clínica');
    await this.#verificarEmpleado(dto.empleado_id, clinicaId);

    const recibo = Recibo.crear(dto);
    const reciboId = await this.#recibos.crearConItems(
      clinicaId,
      recibo.aDatosPersistencia(),
      recibo.items.map((item) => item.aDatosPersistencia())
    );

    return { recibo_id: reciboId, total: recibo.total, status: recibo.status };
  }

  async actualizar(id, dto, clinicaId) {
    const existente = await this.#recibos.obtenerEstadoCompleto(id, clinicaId);
    if (!existente) throw new NotFoundError('Recibo no encontrado');
    await this.#verificarEmpleado(dto.empleado_id, clinicaId);

    // Si vienen items se reemplazan todos y el total se recalcula en el dominio
    let itemsDatos = null;
    let nuevoTotal = null;
    if (dto.items) {
      const items = dto.items.map((i) => Recibo.ReciboItem.crear(i));
      itemsDatos = items.map((item) => item.aDatosPersistencia());
      nuevoTotal = Recibo.calcularTotal(items).toFixed(2);
    }

    await this.#recibos.actualizarConItems(
      id,
      clinicaId,
      {
        expediente_id: dto.expediente_id,
        empleado_id: dto.empleado_id,
        fecha: dto.fecha,
        motivo_consulta: dto.motivo_consulta,
        status: dto.status,
        total: nuevoTotal,
      },
      itemsDatos
    );

    // POS: al pasar a 'finalizado' se descuenta el inventario una sola vez
    const seFinaliza = dto.status === Recibo.ESTADOS.FINALIZADO;
    if (seFinaliza && !existente.stock_descontado) {
      return this.#descontarInventario(id, clinicaId);
    }
    return null;
  }

  /**
   * Descuenta del inventario los productos vendidos en el recibo.
   * @returns {Promise<{productos_descontados: number}|null>}
   * @throws {ConflictError} si algún producto no tiene existencias
   */
  async #descontarInventario(reciboId, clinicaId) {
    const items = await this.#recibos.itemsConProducto(reciboId);
    const movimientos = Recibo.calcularDescuentoStock(items);
    if (movimientos.length === 0) return null;

    try {
      await this.#recibos.descontarStock(reciboId, clinicaId, movimientos);
      return { productos_descontados: movimientos.length };
    } catch (err) {
      if (err.code === 'STOCK_INSUFICIENTE') {
        throw new ConflictError(
          `Stock insuficiente de "${err.producto}": se requieren ${err.solicitado} y hay ${err.disponible}. ` +
          'El recibo no se finalizó.'
        );
      }
      throw err;
    }
  }

  async eliminar(id, clinicaId) {
    const existente = await this.#recibos.obtenerEstado(id, clinicaId);
    if (!existente) throw new NotFoundError('Recibo no encontrado');
    if (!Recibo.puedeEliminarse(existente.status)) {
      throw new ConflictError('Solo se pueden eliminar recibos en estado borrador');
    }
    await this.#recibos.deleteById(id, clinicaId);
  }

  async #verificarEmpleado(empleadoId, clinicaId) {
    if (empleadoId === null || empleadoId === undefined) return;
    const existe = await this.#empleados.existeEnClinica(empleadoId, clinicaId);
    if (!existe) throw new ValidationError('El empleado indicado no existe en esta clínica');
  }
}

module.exports = ReciboService;
