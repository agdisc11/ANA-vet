const CarnetService = require('../../src/services/CarnetService');
const { NotFoundError } = require('../../src/errors/ApiError');

const CLINICA = 42;

function crearFakes({ pacienteExiste = true, tokenActual = null, carnet = null, vacunas = [] } = {}) {
  const carnetRepository = {
    obtenerToken: jest.fn(async () => tokenActual),
    guardarToken: jest.fn(async () => 1),
    obtenerPorToken: jest.fn(async () => carnet),
    vacunasDePaciente: jest.fn(async () => vacunas),
  };
  const pacienteRepository = { existeEnClinica: jest.fn(async () => pacienteExiste) };
  const service = new CarnetService({ carnetRepository, pacienteRepository });
  return { service, carnetRepository, pacienteRepository };
}

describe('CarnetService — token', () => {
  test('genera un token de 32 hex la primera vez', async () => {
    const { service, carnetRepository } = crearFakes({ tokenActual: null });
    const { token, nuevo } = await service.obtenerOCrearToken(1, CLINICA);

    expect(token).toMatch(/^[a-f0-9]{32}$/);
    expect(nuevo).toBe(true);
    expect(carnetRepository.guardarToken).toHaveBeenCalledWith(1, CLINICA, token);
  });

  test('reutiliza el token existente (el enlace no cambia)', async () => {
    const existente = 'a'.repeat(32);
    const { service, carnetRepository } = crearFakes({ tokenActual: existente });
    const { token, nuevo } = await service.obtenerOCrearToken(1, CLINICA);

    expect(token).toBe(existente);
    expect(nuevo).toBe(false);
    expect(carnetRepository.guardarToken).not.toHaveBeenCalled();
  });

  test('regenerar produce un token distinto (revoca el anterior)', async () => {
    const existente = 'a'.repeat(32);
    const { service, carnetRepository } = crearFakes({ tokenActual: existente });
    const { token } = await service.regenerarToken(1, CLINICA);

    expect(token).not.toBe(existente);
    expect(token).toMatch(/^[a-f0-9]{32}$/);
    expect(carnetRepository.guardarToken).toHaveBeenCalledWith(1, CLINICA, token);
  });

  test('dos tokens generados no colisionan', () => {
    const tokens = new Set(Array.from({ length: 200 }, () => CarnetService.generarToken()));
    expect(tokens.size).toBe(200);
  });

  test('404 si el paciente no es de la clínica', async () => {
    const { service } = crearFakes({ pacienteExiste: false });
    await expect(service.obtenerOCrearToken(1, CLINICA)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.regenerarToken(1, CLINICA)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('CarnetService — consulta pública', () => {
  const carnetFila = {
    id: 7, nombre: 'Firulais', especie: 'Perro', raza: 'Labrador', sexo: 'Macho',
    edad: 3, microchip: '985112', clinica_nombre: 'Clínica Demo',
    clinica_telefono: '5551234', clinica_direccion: 'Calle 1',
  };

  test('devuelve mascota, clínica y vacunas', async () => {
    const { service } = crearFakes({
      carnet: carnetFila,
      vacunas: [{ nombre: 'Rabia', fecha_aplicacion: '2026-01-10', proxima_dosis: '2027-01-10' }],
    });
    const carnet = await service.carnetPorToken('a'.repeat(32));

    expect(carnet.paciente.nombre).toBe('Firulais');
    expect(carnet.clinica.nombre).toBe('Clínica Demo');
    expect(carnet.vacunas).toHaveLength(1);
  });

  test('NO expone datos del tutor ni el id interno del paciente', async () => {
    const { service } = crearFakes({ carnet: carnetFila });
    const carnet = await service.carnetPorToken('a'.repeat(32));

    const serializado = JSON.stringify(carnet);
    expect(carnet.paciente.id).toBeUndefined();
    expect(serializado).not.toMatch(/tutor/i);
    expect(serializado).not.toMatch(/clinica_id/);
  });

  test('404 con token inexistente', async () => {
    const { service } = crearFakes({ carnet: null });
    await expect(service.carnetPorToken('b'.repeat(32))).rejects.toBeInstanceOf(NotFoundError);
  });

  test('404 con token mal formado, sin tocar la BD', async () => {
    const { service, carnetRepository } = crearFakes();
    await expect(service.carnetPorToken('abc')).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.carnetPorToken("' OR 1=1 --")).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.carnetPorToken(null)).rejects.toBeInstanceOf(NotFoundError);
    expect(carnetRepository.obtenerPorToken).not.toHaveBeenCalled();
  });
});
