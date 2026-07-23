const BusquedaService = require('../../src/services/BusquedaService');
const Busqueda = require('../../src/domain/Busqueda');
const { ValidationError } = require('../../src/errors/ApiError');

const CLINICA = 42;

function crearFakes({ pacientes = [], tutores = [] } = {}) {
  const pacienteRepository = { buscarGlobal: jest.fn(async () => pacientes) };
  const tutorRepository = { buscarGlobal: jest.fn(async () => tutores) };
  return {
    service: new BusquedaService({ pacienteRepository, tutorRepository }),
    pacienteRepository,
    tutorRepository,
  };
}

const firulais = {
  id: 1, nombre: 'Firulais', especie: 'Perro', raza: 'Labrador',
  microchip: '900123456789', tutor_id: 7, tutor: 'Carlos Mendoza',
};
const carlos = {
  id: 7, nombre: 'Carlos', apellidos: 'Mendoza', telefono: '5551234567',
  whatsapp: null, correo: 'carlos@mail.com', codigo: 'T-007',
  estatus: 'activo', pacientes: 2,
};

describe('BusquedaService.buscar — contrato', () => {
  test('consulta ambos repositorios con el mismo patrón escapado y el tope', async () => {
    const { service, pacienteRepository, tutorRepository } = crearFakes();
    await service.buscar(CLINICA, { q: 'fir', limite: 3 });

    expect(pacienteRepository.buscarGlobal).toHaveBeenCalledWith(CLINICA, '%fir%', 3);
    expect(tutorRepository.buscarGlobal).toHaveBeenCalledWith(CLINICA, '%fir%', 3);
  });

  test('devuelve q normalizada y el total', async () => {
    const { service } = crearFakes({ pacientes: [firulais], tutores: [carlos] });
    const res = await service.buscar(CLINICA, { q: '  fir  ' });

    expect(res.q).toBe('fir');
    expect(res.total).toBe(2);
    expect(res.resultados).toHaveLength(2);
  });

  test('acota el límite pedido al rango del dominio', async () => {
    const { service, pacienteRepository } = crearFakes();
    await service.buscar(CLINICA, { q: 'fir', limite: 999 });
    expect(pacienteRepository.buscarGlobal).toHaveBeenCalledWith(CLINICA, '%fir%', Busqueda.LIMITE_MAX);

    await service.buscar(CLINICA, { q: 'fir' });
    expect(pacienteRepository.buscarGlobal).toHaveBeenLastCalledWith(
      CLINICA, '%fir%', Busqueda.LIMITE_DEFAULT
    );
  });

  test('una consulta demasiado corta no llega a tocar la BD', async () => {
    const { service, pacienteRepository, tutorRepository } = crearFakes();
    await expect(service.buscar(CLINICA, { q: 'a' })).rejects.toBeInstanceOf(ValidationError);
    expect(pacienteRepository.buscarGlobal).not.toHaveBeenCalled();
    expect(tutorRepository.buscarGlobal).not.toHaveBeenCalled();
  });

  test('multi-tenant: la clínica autenticada viaja a cada repositorio', async () => {
    const { service, pacienteRepository, tutorRepository } = crearFakes();
    await service.buscar(99, { q: 'luna' });
    expect(pacienteRepository.buscarGlobal.mock.calls[0][0]).toBe(99);
    expect(tutorRepository.buscarGlobal.mock.calls[0][0]).toBe(99);
  });
});

describe('BusquedaService.buscar — forma de los resultados', () => {
  test('el paciente trae títulos listos para pintar y meta para acciones', async () => {
    const { service } = crearFakes({ pacientes: [firulais] });
    const [r] = (await service.buscar(CLINICA, { q: 'fir' })).resultados;

    expect(r).toMatchObject({
      tipo: 'paciente',
      id: 1,
      titulo: 'Firulais',
      subtitulo: 'Perro · Labrador',
      detalle: 'Tutor: Carlos Mendoza',
      relevancia: Busqueda.RELEVANCIA.PREFIJO,
    });
    expect(r.meta.tutor_id).toBe(7);
    expect(r.meta.microchip).toBe('900123456789');
  });

  test('el tutor muestra contacto y cuántos pacientes tiene', async () => {
    const { service } = crearFakes({ tutores: [carlos] });
    const [r] = (await service.buscar(CLINICA, { q: 'carlos' })).resultados;

    expect(r).toMatchObject({
      tipo: 'tutor',
      id: 7,
      titulo: 'Carlos Mendoza',
      subtitulo: '5551234567',
      detalle: '2 pacientes',
    });
    expect(r.meta.pacientes).toBe(2);
  });

  test('pluraliza el detalle del tutor en singular', async () => {
    const { service } = crearFakes({ tutores: [{ ...carlos, pacientes: 1 }] });
    const [r] = (await service.buscar(CLINICA, { q: 'carlos' })).resultados;
    expect(r.detalle).toBe('1 paciente');
  });

  test('un tutor sin apellidos no deja espacios colgando en el título', async () => {
    const { service } = crearFakes({ tutores: [{ ...carlos, apellidos: null }] });
    const [r] = (await service.buscar(CLINICA, { q: 'carlos' })).resultados;
    expect(r.titulo).toBe('Carlos');
  });

  test('un paciente sin raza ni tutor no genera separadores huérfanos', async () => {
    const { service } = crearFakes({
      pacientes: [{ ...firulais, raza: null, tutor: ' ' }],
    });
    const [r] = (await service.buscar(CLINICA, { q: 'fir' })).resultados;
    expect(r.subtitulo).toBe('Perro');
    expect(r.detalle).toBeNull();
  });

  test('encuentra al paciente por microchip', async () => {
    const { service } = crearFakes({ pacientes: [firulais] });
    const [r] = (await service.buscar(CLINICA, { q: '900123' })).resultados;
    expect(r.titulo).toBe('Firulais');
    expect(r.relevancia).toBe(Busqueda.RELEVANCIA.PREFIJO);
  });
});

describe('BusquedaService.buscar — orden', () => {
  test('lo más relevante primero', async () => {
    const { service } = crearFakes({
      pacientes: [
        { ...firulais, id: 2, nombre: 'Alfirio' },   // contiene
        { ...firulais, id: 1, nombre: 'Firulais' },  // prefijo
      ],
    });
    const orden = (await service.buscar(CLINICA, { q: 'fir' })).resultados.map((r) => r.id);
    expect(orden).toEqual([1, 2]);
  });

  test('a igual relevancia, el paciente va antes que el tutor', async () => {
    const { service } = crearFakes({
      pacientes: [{ ...firulais, nombre: 'Carlos' }],
      tutores: [carlos],
    });
    const tipos = (await service.buscar(CLINICA, { q: 'carlos' })).resultados.map((r) => r.tipo);
    expect(tipos).toEqual(['paciente', 'tutor']);
  });

  test('el paciente que solo casa por el nombre del tutor pesa la mitad', async () => {
    const { service } = crearFakes({
      pacientes: [{ ...firulais, nombre: 'Luna', tutor: 'Carlos Mendoza' }],
    });
    const [r] = (await service.buscar(CLINICA, { q: 'carlos' })).resultados;
    // Sigue siendo un resultado válido, pero por debajo de un acierto directo
    expect(r.relevancia).toBe(Math.round(Busqueda.RELEVANCIA.PREFIJO / 2));
    expect(r.relevancia).toBeGreaterThan(0);
  });

  test('empate de relevancia y tipo: orden alfabético', async () => {
    const { service } = crearFakes({
      // Ambos son PREFIJO para "lu": el desempate solo puede ser el nombre
      pacientes: [
        { ...firulais, id: 2, nombre: 'Luna' },
        { ...firulais, id: 1, nombre: 'Lucas' },
      ],
    });
    const resultados = (await service.buscar(CLINICA, { q: 'lu' })).resultados;
    expect(resultados.map((r) => r.relevancia)).toEqual([
      Busqueda.RELEVANCIA.PREFIJO, Busqueda.RELEVANCIA.PREFIJO,
    ]);
    expect(resultados.map((r) => r.titulo)).toEqual(['Lucas', 'Luna']);
  });
});
