const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const errorHandler = require('../../src/middleware/errorHandler');
const { crearPacientesController } = require('../../src/controllers/pacientesController');
const { crearRouterPacientes } = require('../../src/routes/pacientes');
const { NotFoundError } = require('../../src/errors/ApiError');

/**
 * Integración HTTP SIN base de datos: router real + authMiddleware real +
 * validación Zod real + errorHandler real, con el servicio reemplazado
 * por un fake (posible gracias a las factories con DI).
 */
function crearServicioFake() {
  return {
    listar: jest.fn(async () => [{ id: 1, nombre: 'Firulais' }]),
    obtener: jest.fn(async (id) => {
      if (Number(id) === 999) throw new NotFoundError('Paciente no encontrado');
      return { id: Number(id), nombre: 'Firulais' };
    }),
    crear: jest.fn(async () => 7),
    actualizar: jest.fn(async () => undefined),
    reasignarTutor: jest.fn(async () => undefined),
    eliminar: jest.fn(async () => undefined),
  };
}

function crearApp(servicio) {
  const app = express();
  app.use(express.json());
  const pacientesController = crearPacientesController({ pacienteService: servicio });
  app.use('/api/pacientes', crearRouterPacientes({ pacientesController }));
  app.use(errorHandler);
  return app;
}

const CLINICA = 42;
const token = jwt.sign(
  { id: 1, tipo: 'clinica', clinica_id: CLINICA, nombre: 'Clínica Test' },
  process.env.JWT_SECRET
);
const auth = { Authorization: `Bearer ${token}` };

beforeAll(() => {
  // errorHandler loguea cada error manejado; silenciarlo en la suite
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => console.error.mockRestore());

describe('Autenticación', () => {
  test('401 sin token', async () => {
    const res = await request(crearApp(crearServicioFake())).get('/api/pacientes');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  test('401 con token inválido', async () => {
    const res = await request(crearApp(crearServicioFake()))
      .get('/api/pacientes')
      .set('Authorization', 'Bearer no-es-un-jwt');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/pacientes', () => {
  test('contrato legacy: responde el arreglo completo y filtra por la clínica del token', async () => {
    const servicio = crearServicioFake();
    const res = await request(crearApp(servicio)).get('/api/pacientes').set(auth);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(servicio.listar).toHaveBeenCalledWith(CLINICA, { q: null, page: null, limit: 20 });
  });

  test('con ?page responde paginado { data, pagination }', async () => {
    const servicio = crearServicioFake();
    servicio.listar.mockResolvedValue({ datos: [{ id: 1 }], total: 12 });

    const res = await request(crearApp(servicio))
      .get('/api/pacientes?page=1&limit=5&q=fir')
      .set(auth);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toEqual({ page: 1, limit: 5, total: 12, totalPages: 3 });
    expect(servicio.listar).toHaveBeenCalledWith(CLINICA, { q: 'fir', page: 1, limit: 5 });
  });
});

describe('POST /api/pacientes', () => {
  test('400 con body vacío y mensaje en español', async () => {
    const res = await request(crearApp(crearServicioFake()))
      .post('/api/pacientes')
      .set(auth)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Falta el campo requerido: tutor_id');
  });

  test('201 con body válido; el validador coerciona tipos antes del servicio', async () => {
    const servicio = crearServicioFake();
    const res = await request(crearApp(servicio))
      .post('/api/pacientes')
      .set(auth)
      .send({ tutor_id: '3', nombre: 'Firulais', especie: 'Perro', sexo: 'Macho', raza: '' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 7, mensaje: 'Paciente creado' });
    const [dto, clinicaId] = servicio.crear.mock.calls[0];
    expect(dto.tutor_id).toBe(3);
    expect(dto.raza).toBeNull();
    expect(clinicaId).toBe(CLINICA);
  });
});

describe('GET /api/pacientes/:id', () => {
  test('404 tipado cuando el servicio lanza NotFoundError', async () => {
    const res = await request(crearApp(crearServicioFake())).get('/api/pacientes/999').set(auth);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Paciente no encontrado');
  });
});

describe('PUT /api/pacientes/:id/reasignar', () => {
  test('400 sin nuevo_tutor_id', async () => {
    const res = await request(crearApp(crearServicioFake()))
      .put('/api/pacientes/5/reasignar')
      .set(auth)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('nuevo_tutor_id');
  });

  test('200 reasigna con éxito', async () => {
    const servicio = crearServicioFake();
    const res = await request(crearApp(servicio))
      .put('/api/pacientes/5/reasignar')
      .set(auth)
      .send({ nuevo_tutor_id: 8 });
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBe('Tutor reasignado correctamente');
    expect(servicio.reasignarTutor).toHaveBeenCalledWith('5', 8, CLINICA);
  });
});

describe('DELETE /api/pacientes/:id', () => {
  test('200 elimina con éxito', async () => {
    const res = await request(crearApp(crearServicioFake())).delete('/api/pacientes/5').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.mensaje).toBe('Paciente eliminado');
  });
});
