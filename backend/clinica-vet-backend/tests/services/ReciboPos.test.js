const ReciboService = require('../../src/services/ReciboService');
const Recibo = require('../../src/domain/Recibo');
const { ConflictError } = require('../../src/errors/ApiError');

const CLINICA = 42;

describe('Recibo.calcularDescuentoStock (dominio)', () => {
  test('ignora los servicios (sin producto_id)', () => {
    expect(Recibo.calcularDescuentoStock([
      { producto_id: null, cantidad: 3 },
      { cantidad: 2 },
    ])).toEqual([]);
  });

  test('suma cantidades del mismo producto repetido', () => {
    expect(Recibo.calcularDescuentoStock([
      { producto_id: 7, cantidad: 2 },
      { producto_id: 9, cantidad: 1 },
      { producto_id: 7, cantidad: 3 },
    ])).toEqual([
      { producto_id: 7, cantidad: 5 },
      { producto_id: 9, cantidad: 1 },
    ]);
  });

  test('descarta cantidades no positivas', () => {
    expect(Recibo.calcularDescuentoStock([
      { producto_id: 7, cantidad: 0 },
      { producto_id: 8, cantidad: -2 },
      { producto_id: 9, cantidad: 1 },
    ])).toEqual([{ producto_id: 9, cantidad: 1 }]);
  });
});

function crearFakes({ estado = { id: 9, status: 'borrador', stock_descontado: 0 }, itemsProducto = [], errorStock = null } = {}) {
  const reciboRepository = {
    obtenerEstado: jest.fn(async () => estado),
    obtenerEstadoCompleto: jest.fn(async () => estado),
    actualizarConItems: jest.fn(async () => undefined),
    itemsConProducto: jest.fn(async () => itemsProducto),
    descontarStock: jest.fn(async () => {
      if (errorStock) throw errorStock;
      return { descontados: [] };
    }),
    deleteById: jest.fn(async () => 1),
  };
  const service = new ReciboService({
    reciboRepository,
    pacienteRepository: { existeEnClinica: jest.fn(async () => true) },
    empleadoRepository: { existeEnClinica: jest.fn(async () => true) },
  });
  return { service, reciboRepository };
}

describe('POS — descuento de stock al finalizar', () => {
  test('finalizar con productos descuenta el inventario', async () => {
    const { service, reciboRepository } = crearFakes({
      itemsProducto: [{ producto_id: 7, cantidad: 2 }, { producto_id: 7, cantidad: 1 }],
    });

    const resultado = await service.actualizar(9, { status: 'finalizado' }, CLINICA);

    expect(resultado).toEqual({ productos_descontados: 1 });
    expect(reciboRepository.descontarStock).toHaveBeenCalledWith(9, CLINICA, [
      { producto_id: 7, cantidad: 3 },
    ]);
  });

  test('no descuenta dos veces si ya se había descontado', async () => {
    const { service, reciboRepository } = crearFakes({
      estado: { id: 9, status: 'finalizado', stock_descontado: 1 },
      itemsProducto: [{ producto_id: 7, cantidad: 2 }],
    });

    const resultado = await service.actualizar(9, { status: 'finalizado' }, CLINICA);

    expect(resultado).toBeNull();
    expect(reciboRepository.descontarStock).not.toHaveBeenCalled();
  });

  test('un recibo solo de servicios no toca el inventario', async () => {
    const { service, reciboRepository } = crearFakes({ itemsProducto: [] });
    const resultado = await service.actualizar(9, { status: 'finalizado' }, CLINICA);

    expect(resultado).toBeNull();
    expect(reciboRepository.descontarStock).not.toHaveBeenCalled();
  });

  test('guardar como borrador no descuenta stock', async () => {
    const { service, reciboRepository } = crearFakes({
      itemsProducto: [{ producto_id: 7, cantidad: 2 }],
    });
    await service.actualizar(9, { motivo_consulta: 'Ajuste' }, CLINICA);
    expect(reciboRepository.descontarStock).not.toHaveBeenCalled();
  });

  test('stock insuficiente → 409 con el detalle del producto', async () => {
    const error = Object.assign(new Error('STOCK_INSUFICIENTE'), {
      code: 'STOCK_INSUFICIENTE', producto: 'Alimento premium', disponible: 1, solicitado: 5,
    });
    const { service } = crearFakes({
      itemsProducto: [{ producto_id: 7, cantidad: 5 }],
      errorStock: error,
    });

    await expect(service.actualizar(9, { status: 'finalizado' }, CLINICA))
      .rejects.toBeInstanceOf(ConflictError);
    await expect(service.actualizar(9, { status: 'finalizado' }, CLINICA))
      .rejects.toThrow(/Alimento premium.*se requieren 5.*hay 1/s);
  });
});

describe('POS — items con producto_id se persisten', () => {
  test('crear un recibo conserva producto_id en el item', async () => {
    const item = Recibo.ReciboItem.crear({
      producto_id: 7, nombre_servicio: 'Alimento premium', precio_unitario: 350, cantidad: 2,
    });
    expect(item.esProducto()).toBe(true);
    expect(item.aDatosPersistencia().producto_id).toBe(7);
    expect(item.subtotal).toBe(700);
  });

  test('un servicio del catálogo no es producto', () => {
    const item = Recibo.ReciboItem.crear({
      servicio_id: 3, nombre_servicio: 'Consulta', precio_unitario: 350, cantidad: 1,
    });
    expect(item.esProducto()).toBe(false);
    expect(item.aDatosPersistencia().producto_id).toBeNull();
  });
});
