const PacienteService = require('../../src/services/PacienteService');
const { NotFoundError, ValidationError } = require('../../src/errors/ApiError');

/**
 * Los repositorios se reemplazan por fakes: gracias a la inyección de
 * dependencias (DIP) el servicio se prueba sin MySQL.
 */
function crearFakes({ tutorExiste = true, insertId = 10, afectadas = 1, paciente = null } = {}) {
  const pacienteRepository = {
    listarPorClinica: jest.fn(async () => []),
    obtenerPorId: jest.fn(async () => paciente),
    insert: jest.fn(async () => insertId),
    updateById: jest.fn(async () => afectadas),
    deleteById: jest.fn(async () => afectadas),
  };
  const tutorRepository = {
    existeEnClinica: jest.fn(async () => tutorExiste),
  };
  const service = new PacienteService({ pacienteRepository, tutorRepository });
  return { service, pacienteRepository, tutorRepository };
}

const dtoValido = { tutor_id: 3, nombre: 'Firulais', especie: 'Perro', sexo: 'Macho' };
const CLINICA = 42;

describe('PacienteService.crear', () => {
  test('crea el paciente y devuelve el id', async () => {
    const { service, pacienteRepository, tutorRepository } = crearFakes({ insertId: 77 });
    const id = await service.crear(dtoValido, CLINICA);

    expect(id).toBe(77);
    expect(tutorRepository.existeEnClinica).toHaveBeenCalledWith(3, CLINICA);
    const [clinicaId, datos] = pacienteRepository.insert.mock.calls[0];
    expect(clinicaId).toBe(CLINICA);
    expect(datos.tutor_id).toBe(3);
    expect(datos.nombre).toBe('Firulais');
  });

  test('rechaza tutor de otra clínica (blindaje multi-tenant) sin tocar la BD', async () => {
    const { service, pacienteRepository } = crearFakes({ tutorExiste: false });
    await expect(service.crear(dtoValido, CLINICA)).rejects.toBeInstanceOf(ValidationError);
    expect(pacienteRepository.insert).not.toHaveBeenCalled();
  });

  test('propaga las invariantes de la entidad (fecha futura)', async () => {
    const { service } = crearFakes();
    const futura = new Date(Date.now() + 86_400_000 * 30).toISOString().slice(0, 10);
    await expect(
      service.crear({ ...dtoValido, fecha_nacimiento: futura }, CLINICA)
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('PacienteService.obtener', () => {
  test('devuelve el paciente cuando existe', async () => {
    const fila = { id: 5, nombre: 'Luna', tutor: 'Ana Pérez', edad: 2 };
    const { service } = crearFakes({ paciente: fila });
    await expect(service.obtener(5, CLINICA)).resolves.toEqual(fila);
  });

  test('lanza NotFoundError cuando no existe en la clínica', async () => {
    const { service } = crearFakes({ paciente: null });
    await expect(service.obtener(999, CLINICA)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('PacienteService.actualizar / reasignarTutor / eliminar', () => {
  test('actualizar lanza NotFoundError si no afectó filas', async () => {
    const { service } = crearFakes({ afectadas: 0 });
    await expect(
      service.actualizar(1, { nombre: 'Max', especie: 'Perro', sexo: 'Macho' }, CLINICA)
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  test('reasignarTutor verifica que el nuevo tutor sea de la clínica', async () => {
    const { service, pacienteRepository } = crearFakes({ tutorExiste: false });
    await expect(service.reasignarTutor(1, 8, CLINICA)).rejects.toBeInstanceOf(ValidationError);
    expect(pacienteRepository.updateById).not.toHaveBeenCalled();
  });

  test('reasignarTutor actualiza tutor_id cuando todo es válido', async () => {
    const { service, pacienteRepository } = crearFakes();
    await service.reasignarTutor(1, 8, CLINICA);
    expect(pacienteRepository.updateById).toHaveBeenCalledWith(1, CLINICA, { tutor_id: 8 });
  });

  test('eliminar lanza NotFoundError si el paciente no existe', async () => {
    const { service } = crearFakes({ afectadas: 0 });
    await expect(service.eliminar(1, CLINICA)).rejects.toBeInstanceOf(NotFoundError);
  });

  test('eliminar resuelve sin error cuando el paciente existía', async () => {
    const { service } = crearFakes({ afectadas: 1 });
    await expect(service.eliminar(1, CLINICA)).resolves.toBeUndefined();
  });
});
