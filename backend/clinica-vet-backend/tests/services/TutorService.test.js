const TutorService = require('../../src/services/TutorService');
const { NotFoundError, ValidationError } = require('../../src/errors/ApiError');

const CLINICA = 42;

function crearFakes({ insertId = 21, afectadas = 1 } = {}) {
  const tutorRepository = {
    listarPorClinica: jest.fn(async () => []),
    insert: jest.fn(async () => insertId),
    updateById: jest.fn(async () => afectadas),
  };
  const service = new TutorService({ tutorRepository });
  return { service, tutorRepository };
}

describe('TutorService.crear', () => {
  test('genera código TUT- y devuelve id y código', async () => {
    const { service, tutorRepository } = crearFakes();
    const { id, codigo } = await service.crear({ nombre: 'Ana', apellidos: 'Pérez' }, CLINICA);

    expect(id).toBe(21);
    expect(codigo).toMatch(/^TUT-\d+-\d{4}$/);
    const [clinicaId, datos] = tutorRepository.insert.mock.calls[0];
    expect(clinicaId).toBe(CLINICA);
    expect(datos.codigo).toBe(codigo);
    expect(datos.nombre).toBe('Ana');
  });

  test('propaga la invariante de la entidad (nombre y apellidos requeridos)', async () => {
    const { service } = crearFakes();
    await expect(service.crear({ nombre: 'Ana' }, CLINICA)).rejects.toBeInstanceOf(ValidationError);
  });
});

describe('TutorService — baja lógica y veto', () => {
  test('darDeBaja marca estatus inactivo (nunca DELETE físico)', async () => {
    const { service, tutorRepository } = crearFakes();
    await service.darDeBaja(7, CLINICA);
    expect(tutorRepository.updateById).toHaveBeenCalledWith(7, CLINICA, { estatus: 'inactivo' });
  });

  test('vetar marca estatus vetado y bandera vetado=1', async () => {
    const { service, tutorRepository } = crearFakes();
    await service.vetar(7, CLINICA);
    expect(tutorRepository.updateById).toHaveBeenCalledWith(7, CLINICA, {
      estatus: 'vetado',
      vetado: 1,
    });
  });

  test('404 si el tutor no pertenece a la clínica', async () => {
    const { service } = crearFakes({ afectadas: 0 });
    await expect(service.darDeBaja(7, CLINICA)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.vetar(7, CLINICA)).rejects.toBeInstanceOf(NotFoundError);
  });
});
