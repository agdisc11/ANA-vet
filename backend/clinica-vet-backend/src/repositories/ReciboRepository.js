const BaseRepository = require('./BaseRepository');

/**
 * Repositorio del agregado Recibo (recibo + recibo_item).
 *
 * La creación y la actualización con items son TRANSACCIONALES vía el
 * helper `withTransaction` inyectado (commit/rollback/release automáticos);
 * antes esto eran ~60 líneas de callbacks anidados por endpoint.
 */

const SELECT_LISTA = `
  SELECT r.id, r.paciente_id, r.expediente_id, r.empleado_id,
         r.fecha, r.motivo_consulta, r.total, r.status, r.created_at,
         p.nombre AS paciente_nombre,
         CONCAT(t.nombre, ' ', t.apellidos) AS tutor_nombre,
         CONCAT(e.nombre, ' ', e.apellidos) AS empleado_nombre
  FROM recibo r
  LEFT JOIN paciente p  ON r.paciente_id = p.id
  LEFT JOIN tutor t     ON p.tutor_id    = t.id
  LEFT JOIN empleados e ON r.empleado_id = e.id
`;

const SELECT_DETALLE = `
  SELECT
    r.id, r.clinica_id, r.paciente_id, r.expediente_id, r.empleado_id,
    DATE_FORMAT(r.fecha, '%Y-%m-%d') AS fecha,
    r.motivo_consulta, r.total, r.status, r.created_at,
    p.nombre    AS paciente_nombre,
    p.especie   AS paciente_especie,
    p.raza      AS paciente_raza,
    p.sexo      AS paciente_sexo,
    t.id        AS tutor_id,
    t.nombre    AS tutor_nombre,
    t.apellidos AS tutor_apellidos,
    t.telefono  AS tutor_telefono,
    t.correo    AS tutor_email,
    e.nombre    AS empleado_nombre,
    e.apellidos AS empleado_apellidos
  FROM recibo r
  LEFT JOIN paciente p  ON r.paciente_id = p.id
  LEFT JOIN tutor t     ON p.tutor_id    = t.id
  LEFT JOIN empleados e ON r.empleado_id = e.id
  WHERE r.id = ? AND r.clinica_id = ?
`;

const INSERT_ITEMS = `
  INSERT INTO recibo_item
    (recibo_id, servicio_id, producto_id, nombre_servicio, precio_unitario, cantidad, subtotal, notas)
  VALUES ?
`;

class ReciboRepository extends BaseRepository {
  #withTransaction;

  constructor({ query, withTransaction }) {
    super({
      query,
      tabla: 'recibo',
      columnas: [
        'paciente_id', 'expediente_id', 'empleado_id',
        'fecha', 'motivo_consulta', 'total', 'status',
      ],
    });
    this.#withTransaction = withTransaction;
  }

  listarPorPaciente(pacienteId, clinicaId) {
    return this.query(
      `${SELECT_LISTA}
       WHERE r.paciente_id = ? AND r.clinica_id = ?
       ORDER BY r.fecha DESC, r.created_at DESC`,
      [pacienteId, clinicaId]
    );
  }

  /** { id, status } o null — para verificar existencia y reglas de estado. */
  async obtenerEstado(id, clinicaId) {
    const rows = await this.query(
      'SELECT id, status FROM recibo WHERE id = ? AND clinica_id = ?',
      [id, clinicaId]
    );
    return rows[0] ?? null;
  }

  /** Recibo completo con items, paciente, tutor y empleado; o null. */
  async obtenerDetalle(id, clinicaId) {
    const rows = await this.query(SELECT_DETALLE, [id, clinicaId]);
    if (rows.length === 0) return null;
    const items = await this.query(
      `SELECT id, servicio_id, nombre_servicio, precio_unitario, cantidad, subtotal, notas
       FROM recibo_item WHERE recibo_id = ? ORDER BY id ASC`,
      [rows[0].id]
    );
    return { ...rows[0], items };
  }

  /** @returns {Promise<number>} id del recibo creado (transaccional) */
  async crearConItems(clinicaId, datosRecibo, itemsDatos) {
    return this.#withTransaction(async (tx) => {
      const resultado = await tx.query(
        `INSERT INTO recibo
           (clinica_id, paciente_id, expediente_id, empleado_id, fecha, motivo_consulta, total, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clinicaId,
          datosRecibo.paciente_id,
          datosRecibo.expediente_id,
          datosRecibo.empleado_id,
          datosRecibo.fecha,
          datosRecibo.motivo_consulta,
          datosRecibo.total,
          datosRecibo.status,
        ]
      );
      await ReciboRepository.#insertarItems(tx, resultado.insertId, itemsDatos);
      return resultado.insertId;
    });
  }

  /**
   * Actualización parcial (COALESCE: null conserva el valor actual).
   * Si `itemsDatos` no es null se reemplazan TODOS los items (transaccional).
   */
  async actualizarConItems(id, clinicaId, campos, itemsDatos = null) {
    return this.#withTransaction(async (tx) => {
      if (itemsDatos) {
        await tx.query('DELETE FROM recibo_item WHERE recibo_id = ?', [id]);
        await ReciboRepository.#insertarItems(tx, id, itemsDatos);
      }
      await tx.query(
        `UPDATE recibo SET
           expediente_id   = COALESCE(?, expediente_id),
           empleado_id     = COALESCE(?, empleado_id),
           fecha           = COALESCE(?, fecha),
           motivo_consulta = COALESCE(?, motivo_consulta),
           status          = COALESCE(?, status),
           total           = COALESCE(?, total)
         WHERE id = ? AND clinica_id = ?`,
        [
          campos.expediente_id ?? null,
          campos.empleado_id ?? null,
          campos.fecha ?? null,
          campos.motivo_consulta ?? null,
          campos.status ?? null,
          campos.total ?? null,
          id,
          clinicaId,
        ]
      );
    });
  }

  static async #insertarItems(tx, reciboId, itemsDatos) {
    const valores = itemsDatos.map((item) => [
      reciboId,
      item.servicio_id,
      item.producto_id ?? null,
      item.nombre_servicio,
      item.precio_unitario,
      item.cantidad,
      item.subtotal,
      item.notas,
    ]);
    await tx.query(INSERT_ITEMS, [valores]);
  }

  /** Items del recibo que provienen del inventario (para descontar stock). */
  async itemsConProducto(reciboId) {
    return this.query(
      `SELECT producto_id, cantidad, nombre_servicio
       FROM recibo_item
       WHERE recibo_id = ? AND producto_id IS NOT NULL`,
      [reciboId]
    );
  }

  /** { id, status, stock_descontado } o null. */
  async obtenerEstadoCompleto(id, clinicaId) {
    const rows = await this.query(
      'SELECT id, status, stock_descontado FROM recibo WHERE id = ? AND clinica_id = ?',
      [id, clinicaId]
    );
    return rows[0] ?? null;
  }

  /**
   * Descuenta stock de los productos vendidos y marca el recibo como
   * descontado, todo en UNA transacción: si algún producto no tiene
   * existencias suficientes se revierte completo.
   *
   * El UPDATE lleva `stock >= ?` en el WHERE, así que dos cobros
   * simultáneos no pueden dejar el stock negativo (control optimista).
   *
   * @returns {Promise<{descontados: Array}>}
   * @throws {Error} con code 'STOCK_INSUFICIENTE' y detalle del producto
   */
  async descontarStock(reciboId, clinicaId, movimientos) {
    return this.#withTransaction(async (tx) => {
      for (const mov of movimientos) {
        const resultado = await tx.query(
          `UPDATE inventario SET stock = stock - ?
           WHERE id = ? AND clinica_id = ? AND stock >= ?`,
          [mov.cantidad, mov.producto_id, clinicaId, mov.cantidad]
        );
        if (resultado.affectedRows === 0) {
          const filas = await tx.query(
            'SELECT nombre, stock FROM inventario WHERE id = ? AND clinica_id = ?',
            [mov.producto_id, clinicaId]
          );
          const error = new Error('STOCK_INSUFICIENTE');
          error.code = 'STOCK_INSUFICIENTE';
          error.producto = filas[0]?.nombre ?? `producto #${mov.producto_id}`;
          error.disponible = filas[0]?.stock ?? 0;
          error.solicitado = mov.cantidad;
          throw error; // withTransaction hace rollback
        }
      }

      await tx.query(
        'UPDATE recibo SET stock_descontado = 1 WHERE id = ? AND clinica_id = ?',
        [reciboId, clinicaId]
      );
      return { descontados: movimientos };
    });
  }
}

module.exports = ReciboRepository;
