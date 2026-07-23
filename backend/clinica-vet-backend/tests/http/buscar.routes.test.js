const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const errorHandler = require('../../src/middleware/errorHandler');
const BusquedaService = require('../../src/services/BusquedaService');
const { crearBuscarController } = require('../../src/controllers/buscarController');
const { crearRouterBuscar } = require('../../src/routes/buscar');
const Busqueda = require('../../src/domain/Busqueda');

const CLINICA = 42;
const token = jwt.sign({ id: 1, tipo: 'clinica', clinica_id: CLINICA }, process.env.JWT_SECRET);
const tokenOtraClinica = jwt.sign({ id: 2, tipo: 'clinica', clinica_id: 7 }, process.env.JWT_SECRET);

/**
 * Monta la ruta con el servicio REAL sobre repositorios fake: así el test
 * cubre la cadena completa (Zod → controlador → servicio → dominio) y no
 * solo el cableado HTTP.
 */
function crearApp({ pacientes = [], tutores = [] } = {}) {
  const app = express();
  app.use(express.json());

  const pacienteRepository = { buscarGlobal: jest.fn(async () => pacientes) };
  const tutorRepository = { buscarGlobal: jest.fn(async () => tutores) };
  const busquedaService = new BusquedaService({ pacienteRepository, tutorRepository });
  const buscarController = crearBuscarController({ busquedaService });

  app.use('/api/buscar', crearRouterBuscar({ buscarController }));
  app.use(errorHandler);
  return { app, pacienteRepository, tutorRepository };
}

const firulais = {
  id: 1, nombre: 'Firulais', especie: 'Perro', raza: 'Labrador',
  microchip: null, tutor_id: 7, tutor: 'Carlos Mendoza',
};

beforeAll(() => jest.spyOn(console, 'error').mockImplementation(() => {}));
afterAll(() => console.error.mockRestore());

describe('GET /api/buscar — acceso', () => {
  test('401 sin token', async () => {
    const { app } = crearApp();
    const res = await request(app).get('/api/buscar?q=fir');
    expect(res.status).toBe(401);
  });

  test('401 con token inválido', async () => {
    const { app } = crearApp();
    const res = await request(app).get('/api/buscar?q=fir').set('Authorization', 'Bearer basura');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/buscar — validación', () => {
  test('400 sin q', async () => {
    const { app, pacienteRepository } = crearApp();
    const res = await request(app).get('/api/buscar').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('q');
    expect(pacienteRepository.buscarGlobal).not.toHaveBeenCalled();
  });

  test('400 con q de un solo carácter (regla del dominio)', async () => {
    const { app, pacienteRepository } = crearApp();
    const res = await request(app).get('/api/buscar?q=a').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('2 caracteres');
    expect(pacienteRepository.buscarGlobal).not.toHaveBeenCalled();
  });

  test('400 con limite fuera de rango', async () => {
    const { app } = crearApp();
    const res = await request(app)
      .get('/api/buscar?q=fir&limite=500')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('limite');
  });

  test('sin limite usa el default del dominio', async () => {
    const { app, pacienteRepository } = crearApp();
    await request(app).get('/api/buscar?q=fir').set('Authorization', `Bearer ${token}`);
    expect(pacienteRepository.buscarGlobal).toHaveBeenCalledWith(
      CLINICA, '%fir%', Busqueda.LIMITE_DEFAULT
    );
  });
});

describe('GET /api/buscar — resultados', () => {
  test('200 con los resultados unificados de la clínica del token', async () => {
    const { app, pacienteRepository, tutorRepository } = crearApp({ pacientes: [firulais] });
    const res = await request(app).get('/api/buscar?q=fir').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.q).toBe('fir');
    expect(res.body.total).toBe(1);
    expect(res.body.resultados[0]).toMatchObject({ tipo: 'paciente', id: 1, titulo: 'Firulais' });
    expect(pacienteRepository.buscarGlobal.mock.calls[0][0]).toBe(CLINICA);
    expect(tutorRepository.buscarGlobal.mock.calls[0][0]).toBe(CLINICA);
  });

  test('multi-tenant: otro token busca en SU clínica, nunca en la 42', async () => {
    const { app, pacienteRepository, tutorRepository } = crearApp();
    await request(app).get('/api/buscar?q=fir').set('Authorization', `Bearer ${tokenOtraClinica}`);
    expect(pacienteRepository.buscarGlobal).toHaveBeenCalledWith(7, '%fir%', Busqueda.LIMITE_DEFAULT);
    expect(tutorRepository.buscarGlobal).toHaveBeenCalledWith(7, '%fir%', Busqueda.LIMITE_DEFAULT);
  });

  test('los comodines del usuario llegan escapados al repositorio', async () => {
    const { app, pacienteRepository } = crearApp();
    await request(app).get('/api/buscar?q=%25').set('Authorization', `Bearer ${token}`);
    // '%' solo mide 1 carácter → lo rechaza el dominio antes de la BD
    expect(pacienteRepository.buscarGlobal).not.toHaveBeenCalled();

    await request(app).get('/api/buscar?q=%25%25').set('Authorization', `Bearer ${token}`);
    expect(pacienteRepository.buscarGlobal).toHaveBeenCalledWith(
      CLINICA, '%\\%\\%%', Busqueda.LIMITE_DEFAULT
    );
  });

  test('sin coincidencias devuelve una lista vacía, no un 404', async () => {
    const { app } = crearApp();
    const res = await request(app).get('/api/buscar?q=zzz').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ q: 'zzz', total: 0, resultados: [] });
  });
});
