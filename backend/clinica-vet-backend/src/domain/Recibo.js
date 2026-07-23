const { ValidationError } = require('../errors/ApiError');

/**
 * Agregado de dominio Recibo (raíz) + ReciboItem (objeto de valor).
 *
 * El TOTAL se calcula aquí y solo aquí (antes estaba duplicado en el POST
 * y el PUT de la ruta): total = Σ subtotales; subtotal = precio × cantidad.
 * Los montos se redondean a 2 decimales en cada paso, igual que la BD
 * (decimal(10,2)).
 *
 * Estados del recibo (enum en BD): borrador → finalizado.
 * Solo un borrador puede eliminarse; un recibo finalizado es historial
 * financiero.
 */

const ESTADOS = Object.freeze({
  BORRADOR: 'borrador',
  FINALIZADO: 'finalizado',
});

const redondear2 = (n) => Math.round(n * 100) / 100;

class ReciboItem {
  #datos;

  constructor(datos) {
    this.#datos = { ...datos };
  }

  /** @throws {ValidationError} */
  static crear(dto) {
    const item = new ReciboItem({
      servicio_id: dto.servicio_id ?? null,
      // Items que son productos del inventario: al finalizar descuentan stock
      producto_id: dto.producto_id ?? null,
      nombre_servicio:
        typeof dto.nombre_servicio === 'string' ? dto.nombre_servicio.trim() : dto.nombre_servicio,
      precio_unitario: Number(dto.precio_unitario),
      cantidad: Number(dto.cantidad),
      notas: dto.notas ?? null,
    });
    item.#validarInvariantes();
    return item;
  }

  #validarInvariantes() {
    const { nombre_servicio, precio_unitario, cantidad } = this.#datos;
    if (!nombre_servicio) {
      throw new ValidationError('Cada item requiere: nombre_servicio, precio_unitario, cantidad');
    }
    if (!Number.isFinite(precio_unitario) || precio_unitario < 0) {
      throw new ValidationError(`${nombre_servicio}: precio_unitario debe ser un número mayor o igual a 0`);
    }
    if (!Number.isInteger(cantidad) || cantidad < 1) {
      throw new ValidationError(`${nombre_servicio}: cantidad debe ser un entero mayor o igual a 1`);
    }
  }

  get nombreServicio() { return this.#datos.nombre_servicio; }
  get precioUnitario() { return this.#datos.precio_unitario; }
  get cantidad() { return this.#datos.cantidad; }
  get productoId() { return this.#datos.producto_id ?? null; }

  /** ¿Este item consume inventario al finalizar el recibo? */
  esProducto() { return this.productoId !== null; }

  /** precio × cantidad, redondeado a 2 decimales. */
  get subtotal() {
    return redondear2(this.#datos.precio_unitario * this.#datos.cantidad);
  }

  /** Fila lista para recibo_item (subtotal como string '0.00', igual que decimal). */
  aDatosPersistencia() {
    return { ...this.#datos, subtotal: this.subtotal.toFixed(2) };
  }
}

class Recibo {
  #datos;
  #items;

  constructor(datos, items = []) {
    this.#datos = { ...datos };
    this.#items = [...items];
  }

  /**
   * Crea un recibo nuevo en estado borrador con sus items.
   * @throws {ValidationError}
   */
  static crear(dto) {
    const items = (dto.items ?? []).map((i) => ReciboItem.crear(i));
    const recibo = new Recibo(
      {
        paciente_id: dto.paciente_id,
        expediente_id: dto.expediente_id ?? null,
        empleado_id: dto.empleado_id ?? null,
        fecha: dto.fecha,
        motivo_consulta: dto.motivo_consulta ?? null,
        status: ESTADOS.BORRADOR,
      },
      items
    );
    recibo.#validarInvariantes();
    return recibo;
  }

  #validarInvariantes() {
    if (!this.#datos.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(String(this.#datos.fecha).slice(0, 10))) {
      throw new ValidationError('El recibo requiere una fecha válida (YYYY-MM-DD)');
    }
    if (this.#items.length === 0) {
      throw new ValidationError('Se requiere al menos un item en el recibo');
    }
  }

  get items() { return [...this.#items]; }
  get status() { return this.#datos.status; }

  /** Suma de subtotales, redondeada a 2 decimales. */
  get total() {
    return Recibo.calcularTotal(this.#items);
  }

  /** @param {ReciboItem[]} items */
  static calcularTotal(items) {
    return redondear2(items.reduce((suma, item) => suma + item.subtotal, 0));
  }

  /** Solo los borradores pueden eliminarse; lo finalizado es historial. */
  static puedeEliminarse(status) {
    return status === ESTADOS.BORRADOR;
  }

  /**
   * Unidades a descontar del inventario por producto, sumando items
   * repetidos del mismo producto. (POS, Fase 3.4)
   * @param {Array<{producto_id: number|null, cantidad: number}>} items
   * @returns {Array<{producto_id: number, cantidad: number}>}
   */
  static calcularDescuentoStock(items = []) {
    const porProducto = new Map();
    for (const item of items) {
      const productoId = item.producto_id ?? null;
      if (productoId === null) continue; // los servicios no consumen inventario
      const cantidad = Number(item.cantidad) || 0;
      if (cantidad <= 0) continue;
      porProducto.set(productoId, (porProducto.get(productoId) || 0) + cantidad);
    }
    return [...porProducto.entries()].map(([producto_id, cantidad]) => ({ producto_id, cantidad }));
  }

  /** Fila lista para la tabla recibo (total como string '0.00'). */
  aDatosPersistencia() {
    return { ...this.#datos, total: this.total.toFixed(2) };
  }
}

Recibo.ESTADOS = ESTADOS;
Recibo.ReciboItem = ReciboItem;

module.exports = Recibo;
