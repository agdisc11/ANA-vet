const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const errorHandler = require('../../src/middleware/errorHandler');
const { crearClinicasController } = require('../../src/controllers/clinicasController');
const { crearEmpleadosController } = require('../../src/controllers/empleadosController');
const { crearRouterClinicas } = require('../../src/routes/clinicas');
const { crearRouterEmpleados } = require('../../src/routes/empleados');
const { UnauthorizedError } = require('../../src/errors/ApiError');

function crearClinicaServiceFake() {
  return {
    registrar: jest.fn(async () => 4),
    login: jest.fn(async () => ({ token: 't', tipo: 'clinica', clinica: { id: 4 } })),
    perfil: jest.fn(async () => ({ id: 4, nombre: 'Demo' })),
    actualizarPerfil: jest.fn(async () => undefined),
    cambiarPassword: jest.fn(async () => undefined),
  };
}

function crearEmpleadoServiceFake() {
  return {
    login: jest.fn(async () => ({ token: 't', tipo: 'empleado', empleado: { id: 10 } })),
    listar: jest.fn(async () => [{ id: 10, nombre: 'Sofía' }]),
    obtener: jest.fn(async () => ({ id: 10 })),
    crear: jest.fn(async () => ({ empleado_id: 21, correo_generado: 'a.b@anavet-4.com', email: 'a.b@anavet-4.com', password_temporal: 'Temp1234!' })),
    actualizar: jest.fn(async () => undefined),
    cambiarPassword: jest.fn(async () => undefined),
    eliminar: jest.fn(async () => undefined),
  };
}

function crearApp({ clinicaService, empleadoService }) {
  const app = express();
  app.use(express.json());
  app.use('/api/clinicas', crearRouterClinicas({
    clinicasController: crearClinicasController({ clinicaService }),
  }));
  app.use('/api/empleados', crearRouterEmpleados({
    empleadosController: crearEmpleadosController({ empleadoService }),
  }));
  app.use(errorHandler);
  return app;
}

const CLINICA = 4;
const tokenAdmin = jwt.sign({ id: 1, tipo: 'clinica', clinica_id: CLINICA }, process.env.JWT_SECRET);
const tokenEmpleado = jwt.sign(
  { id: 10, tipo: 'empleado', clinica_id: CLINICA, rol_id: 800, rol_nombre: 'Veterinario' },
  process.env.JWT_SECRET
);

beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterAll(() => console.error.mockRestore());

describe('POST /api/clinicas/registro', () => {
  test('201 con el contrato original', async () => {
    const clinicaService = crearClinicaServiceFake();
    const res = await request(crearApp({ clinicaService, empleadoService: crearEmpleadoServiceFake() }))
      .post('/api/clinicas/registro')
      .send({ nombre: 'Vet X', email: 'x@y.com', password: 'abc' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ mensaje: 'Clínica registrada exitosamente', clinica_id: 4 });
  });

  test('400 con campos faltantes', async () => {
    const res = await request(crearApp({ clinicaService: crearClinicaServiceFake(), empleadoService: crearEmpleadoServiceFake() }))
      .post('/api/clinicas/registro')
      .send({ nombre: 'Vet X' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('email');
    expect(res.body.error).toContain('password');
  });
});

describe('Logins', () => {
  test('login clinica: 401 tipado desde el servicio llega como { error }', async () => {
    const clinicaService = crearClinicaServiceFake();
    clinicaService.login.mockRejectedValue(new UnauthorizedError('Credenciales incorrectas'));
    const res = await request(crearApp({ clinicaService, empleadoService: crearEmpleadoServiceFake() }))
      .post('/api/clinicas/login')
      .send({ email: 'x@y.com', password: 'mala' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales incorrectas');
  });

  test('login empleado: responde el contrato del servicio tal cual', async () => {
    const empleadoService = crearEmpleadoServiceFake();
    const res = await request(crearApp({ clinicaService: crearClinicaServiceFake(), empleadoService }))
      .post('/api/empleados/login')
      .send({ email: 'a@b.com', password: 'x' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ token: 't', tipo: 'empleado', empleado: { id: 10 } });
  });
});

describe('Autorización de gestión de empleados', () => {
  test('GET /api/empleados: cualquier usuario autenticado de la clínica', async () => {
    const empleadoService = crearEmpleadoServiceFake();
    const res = await request(crearApp({ clinicaService: crearClinicaServiceFake(), empleadoService }))
      .get('/api/empleados')
      .set('Authorization', `Bearer ${tokenEmpleado}`);
    expect(res.status).toBe(200);
    expect(empleadoService.listar).toHaveBeenCalledWith(CLINICA);
  });

  test('POST /api/empleados: un empleado NO puede dar de alta (403 soloClinica)', async () => {
    const empleadoService = crearEmpleadoServiceFake();
    const res = await request(crearApp({ clinicaService: crearClinicaServiceFake(), empleadoService }))
      .post('/api/empleados')
      .set('Authorization', `Bearer ${tokenEmpleado}`)
      .send({ nombre: 'Ana', apellidos: 'Pérez', rol_id: 800, generar_correo: true });
    expect(res.status).toBe(403);
    expect(empleadoService.crear).not.toHaveBeenCalled();
  });

  test('POST /api/empleados (admin, generar_correo): 201 con correo y password temporal', async () => {
    const empleadoService = crearEmpleadoServiceFake();
    const res = await request(crearApp({ clinicaService: crearClinicaServiceFake(), empleadoService }))
      .post('/api/empleados')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Ana', apellidos: 'Pérez', rol_id: '800', generar_correo: true });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      mensaje: 'Empleado registrado exitosamente',
      empleado_id: 21,
      correo_generado: 'a.b@anavet-4.com',
      email: 'a.b@anavet-4.com',
      password_temporal: 'Temp1234!',
    });
    const [dto] = empleadoService.crear.mock.calls[0];
    expect(dto.rol_id).toBe(800);
    expect(dto.generar_correo).toBe(true);
  });

  test('POST sin generar_correo y sin email/password → 400 con el mensaje original', async () => {
    const res = await request(crearApp({ clinicaService: crearClinicaServiceFake(), empleadoService: crearEmpleadoServiceFake() }))
      .post('/api/empleados')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Ana', apellidos: 'Pérez', rol_id: 800 });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Debes proporcionar un email y contraseña, o activar generar_correo=true');
  });

  test('PUT /:id/cambiar-password exige password_nueva', async () => {
    const res = await request(crearApp({ clinicaService: crearClinicaServiceFake(), empleadoService: crearEmpleadoServiceFake() }))
      .put('/api/empleados/10/cambiar-password')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('password_nueva');
  });
});
