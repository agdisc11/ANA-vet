const Recibo = require('../../src/domain/Recibo');
const { ValidationError } = require('../../src/errors/ApiError');

const { ReciboItem } = Recibo;

const base = { paciente_id: 1, fecha: '2026-07-21' };
const item = (extra = {}) => ({
  nombre_servicio: 'Consulta general',
  precio_unitario: 350,
  cantidad: 1,
  ...extra,
});

describe('ReciboItem', () => {
  test('calcula subtotal = precio × cantidad con redondeo a 2 decimales', () => {
    expect(ReciboItem.crear(item({ precio_unitario: 150.5, cantidad: 2 })).subtotal).toBe(301);
    expect(ReciboItem.crear(item({ precio_unitario: 33.335, cantidad: 3 })).subtotal).toBe(100.01);
  });

  test('coerciona strings numéricas del cliente', () => {
    const it = ReciboItem.crear(item({ precio_unitario: '99.90', cantidad: '2' }));
    expect(it.subtotal).toBe(199.8);
  });

  test('rechaza item sin nombre, precio negativo o cantidad inválida', () => {
    expect(() => ReciboItem.crear(item({ nombre_servicio: '' }))).toThrow(ValidationError);
    expect(() => ReciboItem.crear(item({ precio_unitario: -1 }))).toThrow(ValidationError);
    expect(() => ReciboItem.crear(item({ cantidad: 0 }))).toThrow(ValidationError);
    expect(() => ReciboItem.crear(item({ cantidad: 1.5 }))).toThrow(ValidationError);
  });

  test('persiste el subtotal como string decimal(10,2)', () => {
    const datos = ReciboItem.crear(item({ precio_unitario: 150.5, cantidad: 2 })).aDatosPersistencia();
    expect(datos.subtotal).toBe('301.00');
  });
});

describe('Recibo (agregado)', () => {
  test('nace en borrador y su total es la suma de subtotales', () => {
    const recibo = Recibo.crear({
      ...base,
      items: [
        item({ precio_unitario: 350, cantidad: 1 }),
        item({ nombre_servicio: 'Vacuna triple', precio_unitario: 250.5, cantidad: 2 }),
      ],
    });
    expect(recibo.status).toBe('borrador');
    expect(recibo.total).toBe(851);
    expect(recibo.aDatosPersistencia().total).toBe('851.00');
  });

  test('rechaza recibo sin items', () => {
    expect(() => Recibo.crear({ ...base, items: [] })).toThrow(ValidationError);
    expect(() => Recibo.crear({ ...base, items: [] })).toThrow('Se requiere al menos un item');
  });

  test('rechaza fecha inválida', () => {
    expect(() => Recibo.crear({ paciente_id: 1, fecha: '21/07/2026', items: [item()] })).toThrow(
      ValidationError
    );
  });

  test('propaga la validación de items inválidos', () => {
    expect(() =>
      Recibo.crear({ ...base, items: [item(), item({ precio_unitario: 'gratis' })] })
    ).toThrow(ValidationError);
  });

  test('solo los borradores pueden eliminarse', () => {
    expect(Recibo.puedeEliminarse('borrador')).toBe(true);
    expect(Recibo.puedeEliminarse('finalizado')).toBe(false);
  });

  test('calcularTotal es utilizable con items sueltos (reemplazo en PUT)', () => {
    const items = [
      ReciboItem.crear(item({ precio_unitario: 100.1, cantidad: 1 })),
      ReciboItem.crear(item({ precio_unitario: 0.2, cantidad: 3 })),
    ];
    expect(Recibo.calcularTotal(items)).toBe(100.7);
  });
});
