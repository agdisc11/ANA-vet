const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const errorHandler = require('../../src/middleware/errorHandler');
const { crearTutoresController } = require('../../src/controllers/tutoresController');
const { crearRouterTutores } = require('../../src/routes/tutores');

/**
 * Además del CRUD, esta suite prueba el RBAC por NOMBRE de rol:
 * dar de baja y vetar exigen Administrador (tipo clinica) o Veterinario.
 */
function crearServicioFake() {
  return {
    listar: jest.fn(async () => []),
    crear: jest.fn(async () => ({ id: 21, codigo: 'TUT-1-1234' })),
    actualizar: jest.fn(async () => undefined),
    darDeBaja: jest.fn(async () => undefined),
    vetar: jest.fn(async () => undefined),
  };
}

function crearApp(servicio) {
  const app = express();
  app.use(express.json());
  const tutoresController = crearTutoresController({ tutorService: servicio });
  app.use('/api/tutores', crearRouterTutores({ tutoresController }));
  app.use(errorHandler);
  return app;
}

const CLINICA = 42;
const firmar = (payload) => jwt.sign({ clinica_id: CLINICA, ...payload }, process.env.JWT_SECRET);

const tokenAdmin = firmar({ id: 1, tipo: 'clinica' });
const tokenVeterinario = firmar({ id: 2, tipo: 'empleado', rol_id: 800, rol_nombre: 'Veterinario' });
const tokenRecepcionista = firmar({ id: 3, tipo: 'empleado', rol_id: 801, rol_nombre: 'Recepcionista' });

beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterAll(() => console.error.mockRestore());

describe('POST /api/tutores', () => {
  test('201 con contrato legacy { id, codigo, mensaje }', async () => {
    const res = await request(crearApp(crearServicioFake()))
      .post('/api/tutores')
      .set('Authorization', `Bearer ${tokenRecepcionista}`)
      .send({ nombre: 'Ana', apellidos: 'Pérez' });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 21, codigo: 'TUT-1-1234', mensaje: 'Tutor creado' });
  });

  test('400 sin nombre/apellidos', async () => {
    const res = await request(crearApp(crearServicioFake()))
      .post('/api/tutores')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('nombre');
    expect(res.body.error).toContain('apellidos');
  });
});

describe('RBAC en baja y veto (por nombre de rol, no por id)', () => {
  test('Recepcionista NO puede dar de baja (403)', async () => {
    const servicio = crearServicioFake();
    const res = await request(crearApp(servicio))
      .delete('/api/tutores/7')
      .set('Authorization', `Bearer ${tokenRecepcionista}`);
    expect(res.status).toBe(403);
    expect(servicio.darDeBaja).not.toHaveBeenCalled();
  });

  test('Veterinario SÍ puede dar de baja (cualquiera que sea su rol_id)', async () => {
    const servicio = crearServicioFake();
    const res = await request(crearApp(servicio))
      .delete('/api/tutores/7')
      .set('Authorization', `Bearer ${tokenVeterinario}`);
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBe('Tutor dado de baja correctamente.');
    expect(servicio.darDeBaja).toHaveBeenCalledWith('7', CLINICA);
  });

  test('Administrador (tipo clinica) puede vetar', async () => {
    const servicio = crearServicioFake();
    const res = await request(crearApp(servicio))
      .put('/api/tutores/7/vetar')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBe('Tutor vetado correctamente.');
  });

  test('Recepcionista NO puede vetar (403)', async () => {
    const servicio = crearServicioFake();
    const res = await request(crearApp(servicio))
      .put('/api/tutores/7/vetar')
      .set('Authorization', `Bearer ${tokenRecepcionista}`);
    expect(res.status).toBe(403);
    expect(servicio.vetar).not.toHaveBeenCalled();
  });
});
