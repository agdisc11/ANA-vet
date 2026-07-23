const EmpleadoService = require('../../src/services/EmpleadoService');
const { NotFoundError, ValidationError, ForbiddenError, ConflictError } = require('../../src/errors/ApiError');

const CLINICA = 4;

const passwordsFake = {
  hashPassword: jest.fn(async (p) => `hash(${p})`),
  verificarPassword: jest.fn(async (p, h) => h === `hash(${p})`),
  generarPasswordTemporal: jest.fn(() => 'Temp1234!'),
};
const tokensFake = {
  firmarTokenClinica: jest.fn((c) => `token-clinica-${c.id}`),
  firmarTokenEmpleado: jest.fn((e) => `token-empleado-${e.id}`),
};

const empleadoFila = {
  id: 10,
  clinica_id: CLINICA,
  rol_id: 800,
  rol_nombre: 'Veterinario',
  nombre: 'Sofía',
  apellidos: 'Ramírez',
  email: 'sofia.ramirez@anavet-4.com',
  telefono: null,
  activo: 1,
  password_hash: 'hash(secreto)',
  clinica_nombre: 'Clínica Demo',
  clinica_activa: 1,
};

function crearFakes({
  empleado = empleadoFila,
  rolValido = true,
  emailExiste = false,
  emailsExistentes = [],
  existeEnClinica = true,
  afectadas = 1,
} = {}) {
  const empleadoRepository = {
    listarActivos: jest.fn(async () => []),
    listarPorClinica: jest.fn(async () => []),
    obtenerPorId: jest.fn(async () => empleado),
    buscarPorEmailConRelaciones: jest.fn(async () => empleado),
    existeEmail: jest.fn(async () => emailExiste),
    emailsConPatron: jest.fn(async () => emailsExistentes),
    existeEnClinica: jest.fn(async () => existeEnClinica),
    insert: jest.fn(async () => 21),
    updateById: jest.fn(async () => afectadas),
    deleteById: jest.fn(async () => afectadas),
  };
  const rolRepository = { existeEnClinica: jest.fn(async () => rolValido) };
  const service = new EmpleadoService({
    empleadoRepository, rolRepository, passwords: passwordsFake, tokens: tokensFake,
  });
  return { service, empleadoRepository, rolRepository };
}

beforeEach(() => jest.clearAllMocks());

describe('EmpleadoService.login', () => {
  test('devuelve el contrato de sesión de empleado', async () => {
    const { service } = crearFakes();
    const sesion = await service.login({ email: 'sofia.ramirez@anavet-4.com', password: 'secreto' });

    expect(sesion.token).toBe('token-empleado-10');
    expect(sesion.tipo).toBe('empleado');
    expect(sesion.empleado).toMatchObject({
      id: 10, rol_nombre: 'Veterinario', clinica_id: CLINICA, clinica_nombre: 'Clínica Demo',
    });
    expect(sesion.empleado.password_hash).toBeUndefined();
  });

  test('403 cuenta desactivada / clínica suspendida', async () => {
    const desactivado = crearFakes({ empleado: { ...empleadoFila, activo: 0 } });
    await expect(desactivado.service.login({ email: 'x', password: 'secreto' }))
      .rejects.toBeInstanceOf(ForbiddenError);

    const suspendida = crearFakes({ empleado: { ...empleadoFila, clinica_activa: 0 } });
    await expect(suspendida.service.login({ email: 'x', password: 'secreto' }))
      .rejects.toBeInstanceOf(ForbiddenError);
  });

  test('401 con credenciales incorrectas', async () => {
    const { service } = crearFakes();
    await expect(service.login({ email: 'x', password: 'mala' }))
      .rejects.toMatchObject({ status: 401 });
  });
});

describe('EmpleadoService.crear', () => {
  const dtoManual = {
    nombre: 'Ana', apellidos: 'Pérez', rol_id: 800,
    email: 'ana@x.com', password: 'abc', generar_correo: false,
  };

  test('generar_correo: correo corporativo único + password temporal', async () => {
    const { service, empleadoRepository } = crearFakes({
      emailsExistentes: ['ana.perez@anavet-4.com'],
    });
    const resultado = await service.crear(
      { nombre: 'Ana', apellidos: 'Pérez', rol_id: 800, generar_correo: true },
      CLINICA
    );

    expect(resultado).toEqual({
      empleado_id: 21,
      correo_generado: 'ana.perez1@anavet-4.com',
      email: 'ana.perez1@anavet-4.com',
      password_temporal: 'Temp1234!',
    });
    const [clinicaId, datos] = empleadoRepository.insert.mock.calls[0];
    expect(clinicaId).toBe(CLINICA);
    expect(datos.password_hash).toBe('hash(Temp1234!)');
  });

  test('manual: 409 si el email ya existe', async () => {
    const { service } = crearFakes({ emailExiste: true });
    await expect(service.crear(dtoManual, CLINICA)).rejects.toBeInstanceOf(ConflictError);
  });

  test('rechaza rol de otra clínica (los rol_id son globales)', async () => {
    const { service, empleadoRepository } = crearFakes({ rolValido: false });
    await expect(service.crear(dtoManual, CLINICA)).rejects.toBeInstanceOf(ValidationError);
    expect(empleadoRepository.insert).not.toHaveBeenCalled();
  });
});

describe('EmpleadoService.actualizar / cambiarPassword / eliminar', () => {
  test('actualiza solo los campos provistos (semántica COALESCE)', async () => {
    const { service, empleadoRepository } = crearFakes();
    await service.actualizar(10, { telefono: '555', activo: 0 }, CLINICA);
    expect(empleadoRepository.updateById).toHaveBeenCalledWith(10, CLINICA, {
      telefono: '555',
      activo: 0,
    });
  });

  test('al cambiar rol verifica que pertenezca a la clínica', async () => {
    const { service, empleadoRepository } = crearFakes({ rolValido: false });
    await expect(service.actualizar(10, { rol_id: 999 }, CLINICA)).rejects.toBeInstanceOf(ValidationError);
    expect(empleadoRepository.updateById).not.toHaveBeenCalled();
  });

  test('cambiarPassword guarda el hash nuevo', async () => {
    const { service, empleadoRepository } = crearFakes();
    await service.cambiarPassword(10, CLINICA, 'nueva');
    expect(empleadoRepository.updateById).toHaveBeenCalledWith(10, CLINICA, {
      password_hash: 'hash(nueva)',
    });
  });

  test('404 en operaciones sobre empleados de otra clínica', async () => {
    const { service } = crearFakes({ existeEnClinica: false, afectadas: 0 });
    await expect(service.actualizar(10, { telefono: '1' }, CLINICA)).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.cambiarPassword(10, CLINICA, 'x')).rejects.toBeInstanceOf(NotFoundError);
    await expect(service.eliminar(10, CLINICA)).rejects.toBeInstanceOf(NotFoundError);
  });
});
