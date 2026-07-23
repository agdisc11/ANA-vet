const TratamientoTarea = require('../../src/domain/TratamientoTarea');
const TratamientoService = require('../../src/services/TratamientoService');
const { ValidationError } = require('../../src/errors/ApiError');

describe('TratamientoTarea — invariantes', () => {
  const base = { hospitalizacion_id: 1, fecha: '2026-07-21', hora: '08:00', descripcion: 'Enrofloxacina' };

  test('crea una tarea válida y normaliza la hora a HH:MM', () => {
    const t = TratamientoTarea.crear({ ...base, hora: '08:00:00', categoria: 'medicacion' });
    expect(t.aDatosPersistencia().hora).toBe('08:00');
  });

  test('categoría por defecto: otro', () => {
    expect(TratamientoTarea.crear(base).aDatosPersistencia().categoria).toBe('otro');
  });

  test('rechaza descripción vacía, fecha u hora inválidas y categoría desconocida', () => {
    expect(() => TratamientoTarea.crear({ ...base, descripcion: '  ' })).toThrow(ValidationError);
    expect(() => TratamientoTarea.crear({ ...base, fecha: '21/07/2026' })).toThrow(ValidationError);
    expect(() => TratamientoTarea.crear({ ...base, hora: '8am' })).toThrow(ValidationError);
    expect(() => TratamientoTarea.crear({ ...base, categoria: 'masaje' })).toThrow(ValidationError);
  });
});

describe('TratamientoTarea.estado', () => {
  const ahora = new Date('2026-07-21T10:00:00');
  const tarea = (extra) => ({ fecha: '2026-07-21', hora: '10:00', completada: 0, ...extra });

  test('completada siempre gana', () => {
    expect(TratamientoTarea.estado(tarea({ completada: 1, hora: '06:00' }), ahora)).toBe('completada');
  });

  test('dentro de la tolerancia → ahora', () => {
    expect(TratamientoTarea.estado(tarea({ hora: '10:00' }), ahora)).toBe('ahora');
    expect(TratamientoTarea.estado(tarea({ hora: '10:10' }), ahora)).toBe('ahora');
    expect(TratamientoTarea.estado(tarea({ hora: '09:50' }), ahora)).toBe('ahora');
  });

  test('pasada la tolerancia → atrasada', () => {
    expect(TratamientoTarea.estado(tarea({ hora: '09:00' }), ahora)).toBe('atrasada');
  });

  test('más tarde hoy → pendiente', () => {
    expect(TratamientoTarea.estado(tarea({ hora: '14:00' }), ahora)).toBe('pendiente');
  });

  test('días anteriores sin aplicar → atrasada; días futuros → pendiente', () => {
    expect(TratamientoTarea.estado(tarea({ fecha: '2026-07-20', hora: '23:00' }), ahora)).toBe('atrasada');
    expect(TratamientoTarea.estado(tarea({ fecha: '2026-07-22', hora: '06:00' }), ahora)).toBe('pendiente');
  });
});

describe('TratamientoTarea.resumen y agruparPorHora', () => {
  const ahora = new Date('2026-07-21T12:00:00');
  const tareas = [
    { fecha: '2026-07-21', hora: '08:00', completada: 1 },
    { fecha: '2026-07-21', hora: '10:00', completada: 0 }, // atrasada
    { fecha: '2026-07-21', hora: '16:00', completada: 0 }, // pendiente
    { fecha: '2026-07-21', hora: '08:00', completada: 1 },
  ];

  test('cuenta completadas, pendientes, atrasadas y progreso', () => {
    expect(TratamientoTarea.resumen(tareas, ahora)).toEqual({
      total: 4, completadas: 2, pendientes: 2, atrasadas: 1, progreso: 50,
    });
  });

  test('hoja vacía no divide entre cero', () => {
    expect(TratamientoTarea.resumen([], ahora).progreso).toBe(0);
  });

  test('agrupa por hora en orden cronológico', () => {
    const bloques = TratamientoTarea.agruparPorHora(tareas);
    expect(bloques.map((b) => b.hora)).toEqual(['08:00', '10:00', '16:00']);
    expect(bloques[0].tareas).toHaveLength(2);
  });
});

describe('TratamientoService.calcularHorasPauta', () => {
  const calc = TratamientoService.calcularHorasPauta;

  test('cada 8 h desde las 08:00, 3 tomas', () => {
    expect(calc('08:00', 8, 3)).toEqual(['08:00', '16:00']);
  });

  test('cada 6 h desde las 00:00, 4 tomas (día completo)', () => {
    expect(calc('00:00', 6, 4)).toEqual(['00:00', '06:00', '12:00', '18:00']);
  });

  test('no cruza la medianoche', () => {
    expect(calc('22:00', 4, 5)).toEqual(['22:00']);
  });

  test('cada 12 h desde las 09:30', () => {
    expect(calc('09:30', 12, 2)).toEqual(['09:30', '21:30']);
  });

  test('una sola toma si no hay intervalo', () => {
    expect(calc('07:00', 0, 5)).toEqual(['07:00']);
    expect(calc('07:00', 8, 1)).toEqual(['07:00']);
  });
});
