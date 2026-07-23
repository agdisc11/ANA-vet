const Cita = require('../../src/domain/Cita');
const { ValidationError } = require('../../src/errors/ApiError');

const base = { paciente_id: 1, fecha: '2026-08-01', hora_inicio: '10:00', duracion_min: 30 };

describe('Cita — creación e invariantes', () => {
  test('se crea en estado programada y calcula horaFin', () => {
    const cita = Cita.crear(base);
    expect(cita.estado).toBe('programada');
    expect(cita.horaFin).toBe('10:30');
  });

  test('usa 30 minutos por defecto', () => {
    const cita = Cita.crear({ ...base, duracion_min: undefined });
    expect(cita.duracionMin).toBe(30);
  });

  test('rechaza hora inválida', () => {
    expect(() => Cita.crear({ ...base, hora_inicio: '25:00' })).toThrow(ValidationError);
    expect(() => Cita.crear({ ...base, hora_inicio: 'pronto' })).toThrow(ValidationError);
  });

  test('rechaza duración fuera de rango', () => {
    expect(() => Cita.crear({ ...base, duracion_min: 2 })).toThrow(ValidationError);
    expect(() => Cita.crear({ ...base, duracion_min: 900 })).toThrow(ValidationError);
  });

  test('rechaza citas que cruzan la medianoche', () => {
    expect(() => Cita.crear({ ...base, hora_inicio: '23:45', duracion_min: 30 })).toThrow(
      ValidationError
    );
  });

  test('desdeFila normaliza el TIME de MySQL (HH:MM:SS → HH:MM)', () => {
    const cita = Cita.desdeFila({ ...base, hora_inicio: '09:15:00', estado: 'confirmada' });
    expect(cita.horaInicio).toBe('09:15');
    expect(cita.estado).toBe('confirmada');
  });
});

describe('Cita — máquina de estados', () => {
  test('programada → confirmada → en_sala → atendida', () => {
    let cita = Cita.crear(base);
    cita = cita.transicionarA('confirmada');
    cita = cita.transicionarA('en_sala');
    cita = cita.transicionarA('atendida');
    expect(cita.estado).toBe('atendida');
    expect(cita.esFinal()).toBe(true);
  });

  test('atendida es final: no admite ninguna transición', () => {
    const atendida = Cita.desdeFila({ ...base, hora_inicio: '10:00', estado: 'atendida' });
    for (const destino of Object.values(Cita.ESTADOS)) {
      expect(atendida.puedeTransicionarA(destino)).toBe(false);
    }
    expect(() => atendida.transicionarA('confirmada')).toThrow(ValidationError);
  });

  test('cancelada puede reactivarse a programada, y solo a programada', () => {
    const cancelada = Cita.desdeFila({ ...base, hora_inicio: '10:00', estado: 'cancelada' });
    expect(cancelada.puedeTransicionarA('programada')).toBe(true);
    expect(cancelada.puedeTransicionarA('atendida')).toBe(false);
  });

  test('en_sala no puede marcarse como no_asistio (el paciente ya está ahí)', () => {
    const enSala = Cita.desdeFila({ ...base, hora_inicio: '10:00', estado: 'en_sala' });
    expect(enSala.puedeTransicionarA('no_asistio')).toBe(false);
  });

  test('transicionarA es inmutable: devuelve una cita nueva', () => {
    const original = Cita.crear(base);
    const confirmada = original.transicionarA('confirmada');
    expect(original.estado).toBe('programada');
    expect(confirmada.estado).toBe('confirmada');
  });

  test('puedeEditarse solo en estados no finales previos a la atención', () => {
    expect(Cita.crear(base).puedeEditarse()).toBe(true);
    expect(Cita.desdeFila({ ...base, hora_inicio: '10:00', estado: 'atendida' }).puedeEditarse()).toBe(false);
    expect(Cita.desdeFila({ ...base, hora_inicio: '10:00', estado: 'cancelada' }).puedeEditarse()).toBe(false);
  });
});

describe('Cita — traslapes', () => {
  const a = Cita.crear({ ...base, hora_inicio: '10:00', duracion_min: 60 });

  test('detecta cruce parcial', () => {
    const b = Cita.crear({ ...base, hora_inicio: '10:30', duracion_min: 60 });
    expect(a.seTraslapaCon(b)).toBe(true);
    expect(b.seTraslapaCon(a)).toBe(true);
  });

  test('citas contiguas NO se traslapan (10:00–11:00 y 11:00–11:30)', () => {
    const b = Cita.crear({ ...base, hora_inicio: '11:00', duracion_min: 30 });
    expect(a.seTraslapaCon(b)).toBe(false);
  });

  test('una cita contenida dentro de otra se traslapa', () => {
    const b = Cita.crear({ ...base, hora_inicio: '10:15', duracion_min: 15 });
    expect(a.seTraslapaCon(b)).toBe(true);
  });
});
