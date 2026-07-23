const ClinicaService = require('../../src/services/ClinicaService');
const Clinica = require('../../src/domain/Clinica');
const { NotFoundError, UnauthorizedError, ForbiddenError, ConflictError } = require('../../src/errors/ApiError');

const passwordsFake = {
  hashPassword: jest.fn(async (p) => `hash(${p})`),
  verificarPassword: jest.fn(async (p, h) => h === `hash(${p})`),
  generarPasswordTemporal: jest.fn(() => 'Temp1234!'),
};
const tokensFake = {
  firmarTokenClinica: jest.fn((c) => `token-clinica-${c.id}`),
  firmarTokenEmpleado: jest.fn((e) => `token-empleado-${e.id}`),
};

const clinicaFila = {
  id: 4,
  nombre: 'Clínica Demo',
  email: 'demo@x.com',
  password_hash: 'hash(secreto)',
  telefono: '555',
  direccion: 'Calle 1',
  logo_url: null,
  activa: 1,
};

function crearFakes({ emailExiste = false, clinica = clinicaFila, hash = 'hash(secreto)' } = {}) {
  const clinicaRepository = {
    existeEmail: jest.fn(async () => emailExiste),
    buscarPorEmail: jest.fn(async () => clinica),
    crearConRoles: jest.fn(async () => 4),
    obtenerPerfil: jest.fn(async () => clinica),
    actualizarPerfil: jest.fn(async () => undefined),
    obtenerPasswordHash: jest.fn(async () => hash),
    actualizarPassword: jest.fn(async () => undefined),
  };
  const service = new ClinicaService({ clinicaRepository, passwords: passwordsFake, tokens: tokensFake });
  return { service, clinicaRepository };
}

beforeEach(() => jest.clearAllMocks());

describe('ClinicaService.registrar', () => {
  test('crea el tenant con hash y los 4 roles por defecto', async () => {
    const { service, clinicaRepository } = crearFakes();
    const id = await service.registrar({ nombre: 'Vet X', email: 'X@Y.COM', password: 'abc' });

    expect(id).toBe(4);
    const [datos, hash, roles] = clinicaRepository.crearConRoles.mock.calls[0];
    expect(datos.email).toBe('x@y.com'); // normalizado por la entidad
    expect(hash).toBe('hash(abc)');
    expect(roles).toBe(Clinica.ROLES_DEFAULT);
    expect(roles.map((r) => r.nombre)).toEqual(['Administrador', 'Veterinario', 'Recepcionista', 'Auxiliar']);
  });

  test('409 si el email ya está registrado (sin llegar a hashear)', async () => {
    const { service } = crearFakes({ emailExiste: true });
    await expect(
      service.registrar({ nombre: 'Vet X', email: 'x@y.com', password: 'abc' })
    ).rejects.toBeInstanceOf(ConflictError);
    expect(passwordsFake.hashPassword).not.toHaveBeenCalled();
  });
});

describe('ClinicaService.login', () => {
  test('devuelve el contrato de sesión que consume AuthContext', async () => {
    const { service } = crearFakes();
    const sesion = await service.login({ email: 'demo@x.com', password: 'secreto' });

    expect(sesion).toEqual({
      token: 'token-clinica-4',
      tipo: 'clinica',
      clinica: {
        id: 4, nombre: 'Clínica Demo', email: 'demo@x.com',
        telefono: '555', direccion: 'Calle 1', logo_url: null,
      },
    });
  });

  test('401 con email inexistente o contraseña incorrecta (mismo mensaje: no filtra cuál falló)', async () => {
    const sinEmail = crearFakes({ clinica: null });
    await expect(sinEmail.service.login({ email: 'no@x.com', password: 'a' }))
      .rejects.toMatchObject({ status: 401, message: 'Credenciales incorrectas' });

    const malPassword = crearFakes();
    await expect(malPassword.service.login({ email: 'demo@x.com', password: 'mala' }))
      .rejects.toMatchObject({ status: 401, message: 'Credenciales incorrectas' });
  });

  test('403 si la clínica está suspendida', async () => {
    const { service } = crearFakes({ clinica: { ...clinicaFila, activa: 0 } });
    await expect(service.login({ email: 'demo@x.com', password: 'secreto' }))
      .rejects.toBeInstanceOf(ForbiddenError);
  });
});

describe('ClinicaService.cambiarPassword', () => {
  test('cambia el hash cuando la contraseña actual es correcta', async () => {
    const { service, clinicaRepository } = crearFakes();
    await service.cambiarPassword(4, { password_actual: 'secreto', password_nueva: 'nueva' });
    expect(clinicaRepository.actualizarPassword).toHaveBeenCalledWith(4, 'hash(nueva)');
  });

  test('401 si la contraseña actual no coincide', async () => {
    const { service, clinicaRepository } = crearFakes();
    await expect(
      service.cambiarPassword(4, { password_actual: 'mala', password_nueva: 'nueva' })
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(clinicaRepository.actualizarPassword).not.toHaveBeenCalled();
  });

  test('404 si la clínica no existe', async () => {
    const { service } = crearFakes({ hash: null });
    await expect(
      service.cambiarPassword(99, { password_actual: 'a', password_nueva: 'b' })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
