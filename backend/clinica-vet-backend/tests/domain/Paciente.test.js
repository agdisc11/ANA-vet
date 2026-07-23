const Paciente = require('../../src/domain/Paciente');
const { ValidationError } = require('../../src/errors/ApiError');

// Fecha ISO (YYYY-MM-DD) hace `dias` días — evita bordes de años bisiestos
const haceDias = (dias) =>
  new Date(Date.now() - dias * 86_400_000).toISOString().slice(0, 10);

describe('Entidad Paciente', () => {
  const base = { nombre: 'Firulais', especie: 'Perro', sexo: 'Macho' };

  test('calcula la edad en años cumplidos', () => {
    const p = Paciente.crear({ ...base, fecha_nacimiento: haceDias(3 * 365 + 10) });
    expect(p.edad).toBe(3);
  });

  test('edad es null sin fecha de nacimiento', () => {
    const p = Paciente.crear(base);
    expect(p.edad).toBeNull();
    expect(p.esCachorro()).toBe(false);
  });

  test('esCachorro: menor de 1 año', () => {
    expect(Paciente.crear({ ...base, fecha_nacimiento: haceDias(100) }).esCachorro()).toBe(true);
    expect(Paciente.crear({ ...base, fecha_nacimiento: haceDias(2 * 365 + 10) }).esCachorro()).toBe(false);
  });

  test('rechaza fecha de nacimiento futura', () => {
    const futura = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);
    expect(() => Paciente.crear({ ...base, fecha_nacimiento: futura })).toThrow(ValidationError);
  });

  test('acepta la fecha de hoy como nacimiento (recién nacido)', () => {
    const hoy = new Date();
    const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    const p = Paciente.crear({ ...base, fecha_nacimiento: hoyISO });
    expect(p.edad).toBe(0);
    expect(p.esCachorro()).toBe(true);
  });

  test('rechaza fecha inválida', () => {
    expect(() => Paciente.crear({ ...base, fecha_nacimiento: 'no-es-fecha' })).toThrow(ValidationError);
  });

  test('rechaza paciente sin nombre', () => {
    expect(() => Paciente.crear({ especie: 'Gato', sexo: 'Hembra' })).toThrow(ValidationError);
  });

  test('normaliza espacios y completa opcionales con null', () => {
    const p = Paciente.crear({ ...base, nombre: '  Luna  ' });
    const datos = p.aDatosPersistencia();
    expect(datos.nombre).toBe('Luna');
    expect(datos.raza).toBeNull();
    expect(datos.microchip).toBeNull();
    // la asociación con el tutor es responsabilidad del servicio, no de la entidad
    expect(datos).not.toHaveProperty('tutor_id');
  });
});
