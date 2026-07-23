const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const errorHandler = require('../../src/middleware/errorHandler');
const { crearDashboardController } = require('../../src/controllers/dashboardController');
const { crearRouterStats } = require('../../src/routes/stats');
const { crearRouterDashboard } = require('../../src/routes/dashboard');
const { crearConsultasController } = require('../../src/controllers/consultasController');
const { crearRouterConsultas } = require('../../src/routes/consultas');

const CLINICA = 42;
const tokenAdmin = jwt.sign({ id: 1, tipo: 'clinica', clinica_id: CLINICA }, process.env.JWT_SECRET);
const tokenEmpleado = jwt.sign(
  { id: 10, tipo: 'empleado', clinica_id: CLINICA, rol_id: 800, rol_nombre: 'Veterinario' },
  process.env.JWT_SECRET
);

function crearApp() {
  const app = express();
  app.use(express.json());

  const statsRepository = { conteosPorClinica: jest.fn(async () => ({ pacientes: 5 })) };
  const dashboardService = {
    resumenClinica: jest.fn(async () => ({ kpis: {} })),
    resumenEmpleado: jest.fn(async () => ({ tareas_hoy: {} })),
  };
  const dashboardController = crearDashboardController({ dashboardService, statsRepository });

  const consultaService = {
    listarTodas: jest.fn(async () => []),
    listarPorExpediente: jest.fn(async () => []),
    registrar: jest.fn(async () => 3),
  };
  const consultasController = crearConsultasController({ consultaService });

  app.use('/api/stats', crearRouterStats({ dashboardController }));
  app.use('/api/dashboard', crearRouterDashboard({ dashboardController }));
  app.use('/api/consultas', crearRouterConsultas({ consultasController }));
  app.use(errorHandler);
  return { app, statsRepository, dashboardService, consultaService };
}

beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterAll(() => console.error.mockRestore());

describe('GET /api/stats (blindado)', () => {
  test('401 sin token (antes era público)', async () => {
    const { app } = crearApp();
    const res = await request(app).get('/api/stats');
    expect(res.status).toBe(401);
  });

  test('con token: conteos de LA clínica autenticada (antes eran globales)', async () => {
    const { app, statsRepository } = crearApp();
    const res = await request(app).get('/api/stats').set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(statsRepository.conteosPorClinica).toHaveBeenCalledWith(CLINICA);
  });
});

describe('GET /api/dashboard', () => {
  test('/clinica exige tipo clinica (empleado → 403)', async () => {
    const { app } = crearApp();
    const res = await request(app)
      .get('/api/dashboard/clinica')
      .set('Authorization', `Bearer ${tokenEmpleado}`);
    expect(res.status).toBe(403);
  });

  test('/empleado exige tipo empleado y usa su id + clínica', async () => {
    const { app, dashboardService } = crearApp();
    const res = await request(app)
      .get('/api/dashboard/empleado')
      .set('Authorization', `Bearer ${tokenEmpleado}`);
    expect(res.status).toBe(200);
    expect(dashboardService.resumenEmpleado).toHaveBeenCalledWith(10, CLINICA);
  });
});

describe('POST /api/consultas (contrato)', () => {
  test('400 sin expediente_id', async () => {
    const { app } = crearApp();
    const res = await request(app)
      .post('/api/consultas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ motivo: 'Chequeo' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('expediente_id');
  });

  test('200 con contrato legacy { id, mensaje }', async () => {
    const { app, consultaService } = crearApp();
    const res = await request(app)
      .post('/api/consultas')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ expediente_id: '4', motivo: 'Chequeo', fecha: '2026-07-21' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: 3, mensaje: 'Consulta registrada' });
    const [dto] = consultaService.registrar.mock.calls[0];
    expect(dto.expediente_id).toBe(4);
    expect(dto.fecha).toBe('2026-07-21');
  });
});
