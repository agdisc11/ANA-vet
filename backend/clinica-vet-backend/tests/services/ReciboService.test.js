const ReciboService = require('../../src/services/ReciboService');
const { NotFoundError, ValidationError, ForbiddenError, ConflictError } = require('../../src/errors/ApiError');

const CLINICA = 42;

function crearFakes({
  pacienteExiste = true,
  empleadoExiste = true,
  estado = { id: 9, status: 'borrador' },
  insertId = 9,
} = {}) {
  const reciboRepository = {
    listarPorPaciente: jest.fn(async () => []),
    obtenerEstado: jest.fn(async () => estado),
    // Incluye stock_descontado: el POS (Fase 3.4) lo consulta al finalizar
    obtenerEstadoCompleto: jest.fn(async () => (estado ? { ...estado, stock_descontado: 0 } : null)),
    obtenerDetalle: jest.fn(async () => null),
    crearConItems: jest.fn(async () => insertId),
    actualizarConItems: jest.fn(async () => undefined),
    itemsConProducto: jest.fn(async () => []),
    descontarStock: jest.fn(async () => ({ descontados: [] })),
    deleteById: jest.fn(async () => 1),
  };
  const pacienteRepository = { existeEnClinica: jest.fn(async () => pacienteExiste) };
  const empleadoRepository = { existeEnClinica: jest.fn(async () => empleadoExiste) };
  const service = new ReciboService({ reciboRepository, pacienteRepository, empleadoRepository });
  return { service, reciboRepository, pacienteRepository, empleadoRepository };
}

const dto = {
  paciente_id: 3,
  empleado_id: 7,
  fecha: '2026-07-21',
  motivo_consulta: 'Consulta general',
  items: [
    { nombre_servicio: 'Consulta', precio_unitario: 350, cantidad: 1 },
    { nombre_servicio: 'Desparasitante', precio_unitario: 120.5, cantidad: 2 },
  ],
};

describe('ReciboService.crear', () => {
  test('crea el recibo con total calculado en el dominio (no confía en el cliente)', async () => {
    const { service, reciboRepository } = crearFakes({ insertId: 33 });
    const resultado = await service.crear(dto, CLINICA);

    expect(resultado).toEqual({ recibo_id: 33, total: 591, status: 'borrador' });
    const [clinicaId, datosRecibo, itemsDatos] = reciboRepository.crearConItems.mock.calls[0];
    expect(clinicaId).toBe(CLINICA);
    expect(datosRecibo.total).toBe('591.00');
    expect(datosRecibo.status).toBe('borrador');
    expect(itemsDatos).toHaveLength(2);
    expect(itemsDatos[1].subtotal).toBe('241.00');
  });

  test('403 si el paciente no pertenece a la clínica (contrato original)', async () => {
    const { service, reciboRepository } = crearFakes({ pacienteExiste: false });
    await expect(service.crear(dto, CLINICA)).rejects.toBeInstanceOf(ForbiddenError);
    expect(reciboRepository.crearConItems).not.toHaveBeenCalled();
  });

  test('rechaza empleado de otra clínica', async () => {
    const { service } = crearFakes({ empleadoExiste: false });
    await expect(service.crear(dto, CLINICA)).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('ReciboService.actualizar', () => {
  test('404 si el recibo no existe en la clínica', async () => {
    const { service } = crearFakes({ estado: null });
    await expect(service.actualizar(9, { status: 'finalizado' }, CLINICA)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });

  test('con items: reemplaza y recalcula el total en el dominio', async () => {
    const { service, reciboRepository } = crearFakes();
    await service.actualizar(9, { items: dto.items }, CLINICA);

    const [id, clinicaId, campos, itemsDatos] = reciboRepository.actualizarConItems.mock.calls[0];
    expect(id).toBe(9);
    expect(clinicaId).toBe(CLINICA);
    expect(campos.total).toBe('591.00');
    expect(itemsDatos).toHaveLength(2);
  });

  test('sin items: solo actualiza campos y no toca el total', async () => {
    const { service, reciboRepository } = crearFakes();
    await service.actualizar(9, { status: 'finalizado' }, CLINICA);

    const [, , campos, itemsDatos] = reciboRepository.actualizarConItems.mock.calls[0];
    expect(campos.status).toBe('finalizado');
    expect(campos.total).toBeNull();
    expect(itemsDatos).toBeNull();
  });
});

describe('ReciboService.eliminar', () => {
  test('elimina borradores', async () => {
    const { service, reciboRepository } = crearFakes();
    await service.eliminar(9, CLINICA);
    expect(reciboRepository.deleteById).toHaveBeenCalledWith(9, CLINICA);
  });

  test('409 para recibos finalizados (historial financiero)', async () => {
    const { service, reciboRepository } = crearFakes({ estado: { id: 9, status: 'finalizado' } });
    await expect(service.eliminar(9, CLINICA)).rejects.toBeInstanceOf(ConflictError);
    expect(reciboRepository.deleteById).not.toHaveBeenCalled();
  });

  test('404 si no existe', async () => {
    const { service } = crearFakes({ estado: null });
    await expect(service.eliminar(9, CLINICA)).rejects.toBeInstanceOf(NotFoundError);
  });
});
