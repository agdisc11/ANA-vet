const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const errorHandler = require('../../src/middleware/errorHandler');
const { crearCitasController } = require('../../src/controllers/citasController');
const { crearRouterCitas } = require('../../src/routes/citas');

function crearServicioFake() {
  return {
    listar: jest.fn(async () => []),
    obtener: jest.fn(async () => ({ id: 1 })),
    agendar: jest.fn(async () => 9),
    reagendar: jest.fn(async () => undefined),
    cambiarEstado: jest.fn(async (id, estado) => estado),
    eliminar: jest.fn(async () => undefined),
  };
}

function crearApp(citaService) {
  const app = express();
  app.use(express.json());
  const citasController = crearCitasController({
    citaService,
    empleadoService: { listarActivos: jest.fn(async () => [{ id: 9, nombre: 'Ana' }]) },
  });
  app.use('/api/citas', crearRouterCitas({ citasController }));
  app.use(errorHandler);
  return app;
}

const CLINICA = 42;
const token = jwt.sign({ id: 1, tipo: 'clinica', clinica_id: CLINICA }, process.env.JWT_SECRET);
const auth = { Authorization: `Bearer ${token}` };

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterAll(() => console.error.mockRestore());

describe('GET /api/citas', () => {
  test('401 sin token', async () => {
    const res = await request(crearApp(crearServicioFake())).get('/api/citas');
    expect(res.status).toBe(401);
  });

  test('sin parámetros usa el rango por defecto (hoy → +13 días)', async () => {
    const servicio = crearServicioFake();
    const res = await request(crearApp(servicio)).get('/api/citas').set(auth);

    expect(res.status).toBe(200);
    const [clinicaId, filtros] = servicio.listar.mock.calls[0];
    expect(clinicaId).toBe(CLINICA);
    expect(filtros.desde).toBe(hoyISO());
    expect(filtros.hasta > filtros.desde).toBe(true);
    expect(filtros.empleadoId).toBeNull();
  });

  test('acepta filtros de rango, veterinario y estado', async () => {
    const servicio = crearServicioFake();
    await request(crearApp(servicio))
      .get('/api/citas?desde=2026-08-01&hasta=2026-08-07&empleado_id=9&estado=confirmada')
      .set(auth);
    expect(servicio.listar).toHaveBeenCalledWith(CLINICA, {
      desde: '2026-08-01',
      hasta: '2026-08-07',
      empleadoId: 9,
      estado: 'confirmada',
    });
  });
});

describe('GET /api/citas/veterinarios', () => {
  test('lista los empleados activos (no colisiona con /:id)', async () => {
    const res = await request(crearApp(crearServicioFake())).get('/api/citas/veterinarios').set(auth);
    expect(res.status).toBe(200);
    expect(res.body[0].nombre).toBe('Ana');
  });
});

describe('POST /api/citas', () => {
  test('400 con body incompleto y mensajes en español', async () => {
    const res = await request(crearApp(crearServicioFake()))
      .post('/api/citas')
      .set(auth)
      .send({ motivo: 'Vacuna' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Falta el campo requerido: paciente_id');
    expect(res.body.error).toContain('Falta el campo requerido: fecha');
    expect(res.body.error).toContain('Falta el campo requerido: hora_inicio');
  });

  test('201 con body válido; normaliza hora HH:MM:SS → HH:MM y aplica duración default', async () => {
    const servicio = crearServicioFake();
    const res = await request(crearApp(servicio))
      .post('/api/citas')
      .set(auth)
      .send({ paciente_id: '4', fecha: '2026-08-01', hora_inicio: '10:30:00' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: 9, mensaje: 'Cita agendada' });
    const [dto] = servicio.agendar.mock.calls[0];
    expect(dto).toMatchObject({ paciente_id: 4, hora_inicio: '10:30', duracion_min: 30, empleado_id: null });
  });
});

describe('PUT /api/citas/:id/estado', () => {
  test('400 con estado desconocido', async () => {
    const res = await request(crearApp(crearServicioFake()))
      .put('/api/citas/5/estado')
      .set(auth)
      .send({ estado: 'volando' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('estado debe ser uno de');
  });

  test('200 con transición válida', async () => {
    const servicio = crearServicioFake();
    const res = await request(crearApp(servicio))
      .put('/api/citas/5/estado')
      .set(auth)
      .send({ estado: 'confirmada' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ mensaje: 'Estado actualizado', estado: 'confirmada' });
    expect(servicio.cambiarEstado).toHaveBeenCalledWith('5', 'confirmada', CLINICA);
  });
});
