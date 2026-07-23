const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const errorHandler = require('../../src/middleware/errorHandler');
const { crearRecibosController } = require('../../src/controllers/recibosController');
const { crearRouterRecibos } = require('../../src/routes/recibos');
const { ConflictError } = require('../../src/errors/ApiError');

function crearServicioFake() {
  return {
    listarPorPaciente: jest.fn(async () => [{ id: 1, total: '350.00' }]),
    detalle: jest.fn(async () => ({ id: 1, items: [] })),
    crear: jest.fn(async () => ({ recibo_id: 33, total: 591, status: 'borrador' })),
    actualizar: jest.fn(async () => undefined),
    eliminar: jest.fn(async () => undefined),
  };
}

function crearApp(servicio) {
  const app = express();
  app.use(express.json());
  const recibosController = crearRecibosController({ reciboService: servicio });
  app.use('/api/recibos', crearRouterRecibos({ recibosController }));
  app.use(errorHandler);
  return app;
}

const CLINICA = 42;
const token = jwt.sign({ id: 1, tipo: 'clinica', clinica_id: CLINICA }, process.env.JWT_SECRET);
const auth = { Authorization: `Bearer ${token}` };

beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterAll(() => console.error.mockRestore());

describe('POST /api/recibos', () => {
  test('401 sin token', async () => {
    const res = await request(crearApp(crearServicioFake())).post('/api/recibos').send({});
    expect(res.status).toBe(401);
  });

  test('400 sin paciente_id/fecha/items', async () => {
    const res = await request(crearApp(crearServicioFake())).post('/api/recibos').set(auth).send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Falta el campo requerido: paciente_id');
    expect(res.body.error).toContain('Falta el campo requerido: fecha');
    expect(res.body.error).toContain('Se requiere al menos un item en el recibo');
  });

  test('400 con items vacíos', async () => {
    const res = await request(crearApp(crearServicioFake()))
      .post('/api/recibos')
      .set(auth)
      .send({ paciente_id: 3, fecha: '2026-07-21', items: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Se requiere al menos un item en el recibo');
  });

  test('201 con contrato exacto; normaliza fecha DD/MM/YYYY del frontend', async () => {
    const servicio = crearServicioFake();
    const res = await request(crearApp(servicio))
      .post('/api/recibos')
      .set(auth)
      .send({
        paciente_id: '3',
        fecha: '21/07/2026',
        items: [{ nombre_servicio: 'Consulta', precio_unitario: '350', cantidad: '1' }],
      });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      mensaje: 'Recibo creado exitosamente',
      recibo_id: 33,
      total: 591,
      status: 'borrador',
    });
    const [dto, clinicaId] = servicio.crear.mock.calls[0];
    expect(dto.fecha).toBe('2026-07-21');
    expect(dto.paciente_id).toBe(3);
    expect(dto.items[0].precio_unitario).toBe(350);
    expect(clinicaId).toBe(CLINICA);
  });
});

describe('PUT /api/recibos/:id', () => {
  test('400 con status desconocido', async () => {
    const res = await request(crearApp(crearServicioFake()))
      .put('/api/recibos/9')
      .set(auth)
      .send({ status: 'pagado' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('status debe ser: borrador o finalizado');
  });

  test('200 al finalizar (flujo del frontend actual)', async () => {
    const servicio = crearServicioFake();
    const res = await request(crearApp(servicio))
      .put('/api/recibos/9')
      .set(auth)
      .send({ status: 'finalizado' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ mensaje: 'Recibo actualizado correctamente' });
    const [id, dto] = servicio.actualizar.mock.calls[0];
    expect(id).toBe('9');
    expect(dto.status).toBe('finalizado');
  });

  test('items [] se ignora (semántica de la versión anterior)', async () => {
    const servicio = crearServicioFake();
    await request(crearApp(servicio))
      .put('/api/recibos/9')
      .set(auth)
      .send({ motivo_consulta: 'Ajuste', items: [] });
    const [, dto] = servicio.actualizar.mock.calls[0];
    expect(dto.items).toBeUndefined();
  });
});

describe('GET y DELETE', () => {
  test('GET /:paciente_id responde el historial', async () => {
    const servicio = crearServicioFake();
    const res = await request(crearApp(servicio)).get('/api/recibos/5').set(auth);
    expect(res.status).toBe(200);
    expect(servicio.listarPorPaciente).toHaveBeenCalledWith('5', CLINICA);
  });

  test('GET /:id/detalle enruta al detalle, no al historial', async () => {
    const servicio = crearServicioFake();
    const res = await request(crearApp(servicio)).get('/api/recibos/5/detalle').set(auth);
    expect(res.status).toBe(200);
    expect(servicio.detalle).toHaveBeenCalledWith('5', CLINICA);
    expect(servicio.listarPorPaciente).not.toHaveBeenCalled();
  });

  test('DELETE responde 409 con el mensaje original cuando no es borrador', async () => {
    const servicio = crearServicioFake();
    servicio.eliminar.mockRejectedValue(
      new ConflictError('Solo se pueden eliminar recibos en estado borrador')
    );
    const res = await request(crearApp(servicio)).delete('/api/recibos/9').set(auth);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Solo se pueden eliminar recibos en estado borrador');
  });
});
