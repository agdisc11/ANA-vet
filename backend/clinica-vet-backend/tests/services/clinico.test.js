const ExpedienteService = require('../../src/services/ExpedienteService');
const ConsultaService = require('../../src/services/ConsultaService');
const HospitalizacionService = require('../../src/services/HospitalizacionService');
const CirugiaService = require('../../src/services/CirugiaService');
const VacunaService = require('../../src/services/VacunaService');
const { NotFoundError, ValidationError, ForbiddenError } = require('../../src/errors/ApiError');

const CLINICA = 42;

describe('ExpedienteService', () => {
  test('abrir rechaza pacientes de otra clínica con 403', async () => {
    const service = new ExpedienteService({
      expedienteRepository: { abrirHoy: jest.fn() },
      pacienteRepository: { existeEnClinica: jest.fn(async () => false) },
    });
    await expect(service.abrir(9, CLINICA)).rejects.toBeInstanceOf(ForbiddenError);
  });

  test('abrir crea el expediente cuando el paciente es de la clínica', async () => {
    const abrirHoy = jest.fn(async () => 7);
    const service = new ExpedienteService({
      expedienteRepository: { abrirHoy },
      pacienteRepository: { existeEnClinica: jest.fn(async () => true) },
    });
    await expect(service.abrir(9, CLINICA)).resolves.toBe(7);
    expect(abrirHoy).toHaveBeenCalledWith(CLINICA, 9);
  });
});

describe('ConsultaService', () => {
  const crearFakes = ({ expedienteValido = true, empleadoValido = true } = {}) => {
    const consultaRepository = { crear: jest.fn(async () => 3) };
    const service = new ConsultaService({
      consultaRepository,
      expedienteRepository: { existeEnClinica: jest.fn(async () => expedienteValido) },
      empleadoRepository: { existeEnClinica: jest.fn(async () => empleadoValido) },
    });
    return { service, consultaRepository };
  };

  test('404 con expediente de otra clínica', async () => {
    const { service, consultaRepository } = crearFakes({ expedienteValido: false });
    await expect(service.registrar({ expediente_id: 1 }, CLINICA)).rejects.toBeInstanceOf(NotFoundError);
    expect(consultaRepository.crear).not.toHaveBeenCalled();
  });

  test('blindaje: rechaza empleado_id de otra clínica', async () => {
    const { service } = crearFakes({ empleadoValido: false });
    await expect(
      service.registrar({ expediente_id: 1, empleado_id: 99 }, CLINICA)
    ).rejects.toBeInstanceOf(ValidationError);
  });

  test('registra cuando todo pertenece a la clínica', async () => {
    const { service } = crearFakes();
    await expect(service.registrar({ expediente_id: 1, motivo: 'Chequeo' }, CLINICA)).resolves.toBe(3);
  });
});

describe('CirugiaService — anestesia (fix de seguridad)', () => {
  test('rechaza anestesia sobre cirugías de otra clínica (antes se aceptaba cualquier cirugia_id)', async () => {
    const cirugiaRepository = {
      existeEnClinica: jest.fn(async () => false),
      crearAnestesia: jest.fn(),
    };
    const service = new CirugiaService({
      cirugiaRepository,
      expedienteRepository: { existeEnClinica: jest.fn() },
    });
    await expect(service.registrarAnestesia({ cirugia_id: 5 }, CLINICA)).rejects.toBeInstanceOf(NotFoundError);
    expect(cirugiaRepository.crearAnestesia).not.toHaveBeenCalled();
  });

  test('registra anestesia sobre cirugía propia', async () => {
    const cirugiaRepository = {
      existeEnClinica: jest.fn(async () => true),
      crearAnestesia: jest.fn(async () => 8),
    };
    const service = new CirugiaService({
      cirugiaRepository,
      expedienteRepository: { existeEnClinica: jest.fn() },
    });
    await expect(
      service.registrarAnestesia({ cirugia_id: 5, protocolo: 'TIVA' }, CLINICA)
    ).resolves.toBe(8);
    expect(cirugiaRepository.existeEnClinica).toHaveBeenCalledWith(5, CLINICA);
  });
});

describe('HospitalizacionService', () => {
  test('separa empleados_ids del resto y delega la creación transaccional', async () => {
    const crearConEmpleados = jest.fn(async () => 4);
    const service = new HospitalizacionService({
      hospitalizacionRepository: { crearConEmpleados },
      expedienteRepository: { existeEnClinica: jest.fn(async () => true) },
    });
    await service.registrar(
      { expediente_id: 1, historia_clinica: 'HC', empleados_ids: [10, 11], acta_responsiva: 1 },
      CLINICA
    );
    const [clinicaId, datos, empleadosIds] = crearConEmpleados.mock.calls[0];
    expect(clinicaId).toBe(CLINICA);
    expect(empleadosIds).toEqual([10, 11]);
    expect(datos).not.toHaveProperty('empleados_ids');
    expect(datos.historia_clinica).toBe('HC');
  });

  test('404 con expediente ajeno', async () => {
    const service = new HospitalizacionService({
      hospitalizacionRepository: { crearConEmpleados: jest.fn() },
      expedienteRepository: { existeEnClinica: jest.fn(async () => false) },
    });
    await expect(
      service.registrar({ expediente_id: 1, empleados_ids: [] }, CLINICA)
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('VacunaService', () => {
  test('404 con paciente de otra clínica', async () => {
    const service = new VacunaService({
      vacunaRepository: { crear: jest.fn() },
      pacienteRepository: { existeEnClinica: jest.fn(async () => false) },
    });
    await expect(
      service.registrar({ paciente_id: 9, nombre: 'Triple', fecha_aplicacion: '2026-07-01' }, CLINICA)
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
