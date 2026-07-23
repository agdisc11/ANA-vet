const CitaService = require('../../src/services/CitaService');
const { NotFoundError, ValidationError, ConflictError } = require('../../src/errors/ApiError');

const CLINICA = 42;

const filaExistente = {
  id: 5,
  paciente_id: 1,
  empleado_id: 9,
  fecha: '2026-08-01',
  hora_inicio: '10:00:00',
  duracion_min: 30,
  motivo: 'Revisión',
  notas: null,
  estado: 'programada',
};

function crearFakes({
  pacienteExiste = true,
  empleadoExiste = true,
  traslape = null,
  fila = filaExistente,
  insertId = 55,
} = {}) {
  const citaRepository = {
    listarPorRango: jest.fn(async () => []),
    obtenerPorId: jest.fn(async () => fila),
    buscarTraslape: jest.fn(async () => traslape),
    insert: jest.fn(async () => insertId),
    updateById: jest.fn(async () => 1),
    deleteById: jest.fn(async () => 1),
  };
  const pacienteRepository = { existeEnClinica: jest.fn(async () => pacienteExiste) };
  const empleadoRepository = { existeEnClinica: jest.fn(async () => empleadoExiste) };
  const service = new CitaService({ citaRepository, pacienteRepository, empleadoRepository });
  return { service, citaRepository, pacienteRepository, empleadoRepository };
}

const dto = {
  paciente_id: 1,
  empleado_id: 9,
  fecha: '2026-08-01',
  hora_inicio: '10:00',
  duracion_min: 30,
  motivo: 'Vacunación',
  notas: null,
};

describe('CitaService.agendar', () => {
  test('agenda y devuelve el id; persiste estado programada', async () => {
    const { service, citaRepository } = crearFakes();
    const id = await service.agendar(dto, CLINICA);

    expect(id).toBe(55);
    const [clinicaId, datos] = citaRepository.insert.mock.calls[0];
    expect(clinicaId).toBe(CLINICA);
    expect(datos.estado).toBe('programada');
    expect(datos.hora_inicio).toBe('10:00');
  });

  test('rechaza paciente de otra clínica', async () => {
    const { service, citaRepository } = crearFakes({ pacienteExiste: false });
    await expect(service.agendar(dto, CLINICA)).rejects.toBeInstanceOf(ValidationError);
    expect(citaRepository.insert).not.toHaveBeenCalled();
  });

  test('rechaza veterinario de otra clínica', async () => {
    const { service } = crearFakes({ empleadoExiste: false });
    await expect(service.agendar(dto, CLINICA)).rejects.toBeInstanceOf(ValidationError);
  });

  test('409 cuando el veterinario tiene una cita traslapada', async () => {
    const { service, citaRepository } = crearFakes({
      traslape: { id: 3, hora_inicio: '10:15:00', duracion_min: 30, paciente_nombre: 'Luna' },
    });
    await expect(service.agendar(dto, CLINICA)).rejects.toBeInstanceOf(ConflictError);
    expect(citaRepository.insert).not.toHaveBeenCalled();
  });

  test('sin veterinario asignado no se verifica traslape', async () => {
    const { service, citaRepository } = crearFakes();
    await service.agendar({ ...dto, empleado_id: null }, CLINICA);
    expect(citaRepository.buscarTraslape).not.toHaveBeenCalled();
    expect(citaRepository.insert).toHaveBeenCalled();
  });
});

describe('CitaService.cambiarEstado', () => {
  test('aplica una transición válida', async () => {
    const { service, citaRepository } = crearFakes();
    const estado = await service.cambiarEstado(5, 'confirmada', CLINICA);
    expect(estado).toBe('confirmada');
    expect(citaRepository.updateById).toHaveBeenCalledWith(5, CLINICA, { estado: 'confirmada' });
  });

  test('rechaza una transición inválida (la valida la entidad)', async () => {
    const { service, citaRepository } = crearFakes({
      fila: { ...filaExistente, estado: 'atendida' },
    });
    await expect(service.cambiarEstado(5, 'confirmada', CLINICA)).rejects.toBeInstanceOf(ValidationError);
    expect(citaRepository.updateById).not.toHaveBeenCalled();
  });

  test('404 si la cita no existe en la clínica', async () => {
    const { service } = crearFakes({ fila: null });
    await expect(service.cambiarEstado(5, 'confirmada', CLINICA)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('CitaService.reagendar', () => {
  test('conserva el estado actual al editar', async () => {
    const { service, citaRepository } = crearFakes({
      fila: { ...filaExistente, estado: 'confirmada' },
    });
    await service.reagendar(5, { ...dto, hora_inicio: '12:00' }, CLINICA);

    const [, , datos] = citaRepository.updateById.mock.calls[0];
    expect(datos.estado).toBe('confirmada');
    expect(datos.hora_inicio).toBe('12:00');
  });

  test('excluye la propia cita del chequeo de traslape', async () => {
    const { service, citaRepository } = crearFakes();
    await service.reagendar(5, dto, CLINICA);
    expect(citaRepository.buscarTraslape.mock.calls[0][1].excluirId).toBe(5);
  });

  test('no permite editar una cita atendida', async () => {
    const { service } = crearFakes({ fila: { ...filaExistente, estado: 'atendida' } });
    await expect(service.reagendar(5, dto, CLINICA)).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('CitaService.eliminar', () => {
  test('elimina citas no atendidas', async () => {
    const { service, citaRepository } = crearFakes();
    await service.eliminar(5, CLINICA);
    expect(citaRepository.deleteById).toHaveBeenCalledWith(5, CLINICA);
  });

  test('protege el historial: no elimina citas atendidas', async () => {
    const { service, citaRepository } = crearFakes({ fila: { ...filaExistente, estado: 'atendida' } });
    await expect(service.eliminar(5, CLINICA)).rejects.toBeInstanceOf(ConflictError);
    expect(citaRepository.deleteById).not.toHaveBeenCalled();
  });
});
