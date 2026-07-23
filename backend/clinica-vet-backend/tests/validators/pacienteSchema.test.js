const {
  crearPacienteSchema,
  actualizarPacienteSchema,
  listarPacientesQuerySchema,
} = require('../../src/validators/pacienteSchema');

describe('crearPacienteSchema', () => {
  test('rechaza body vacío listando los campos faltantes en español', () => {
    const r = crearPacienteSchema.safeParse({});
    expect(r.success).toBe(false);
    const mensajes = r.error.issues.map((i) => i.message).join('; ');
    expect(mensajes).toContain('Falta el campo requerido: tutor_id');
    expect(mensajes).toContain('Falta el campo requerido: nombre');
    expect(mensajes).toContain('Falta el campo requerido: especie');
    expect(mensajes).toContain('Falta el campo requerido: sexo');
  });

  test('coerciona tutor_id numérico enviado como string', () => {
    const r = crearPacienteSchema.safeParse({
      tutor_id: '5', nombre: 'Firulais', especie: 'Perro', sexo: 'Macho',
    });
    expect(r.success).toBe(true);
    expect(r.data.tutor_id).toBe(5);
  });

  test('normaliza: trim, vacíos a null y fecha ISO con hora a YYYY-MM-DD', () => {
    const r = crearPacienteSchema.safeParse({
      tutor_id: 1,
      nombre: '  Luna ',
      especie: 'Gato',
      sexo: 'Hembra',
      raza: '   ',
      microchip: ' 985112 ',
      fecha_nacimiento: '2020-05-01T00:00:00.000Z',
    });
    expect(r.success).toBe(true);
    expect(r.data.nombre).toBe('Luna');
    expect(r.data.raza).toBeNull();
    expect(r.data.microchip).toBe('985112');
    expect(r.data.fecha_nacimiento).toBe('2020-05-01');
  });

  test('descarta claves desconocidas (campos calculados que reenvía el frontend)', () => {
    const r = crearPacienteSchema.safeParse({
      tutor_id: 1, nombre: 'Max', especie: 'Perro', sexo: 'Macho',
      edad: 4, tutor: 'Ana Pérez', id: 99,
    });
    expect(r.success).toBe(true);
    expect(r.data).not.toHaveProperty('edad');
    expect(r.data).not.toHaveProperty('tutor');
    expect(r.data).not.toHaveProperty('id');
  });

  test('rechaza fecha con formato desconocido', () => {
    const r = crearPacienteSchema.safeParse({
      tutor_id: 1, nombre: 'Max', especie: 'Perro', sexo: 'Macho',
      fecha_nacimiento: '01/05/2020',
    });
    expect(r.success).toBe(false);
    expect(r.error.issues[0].message).toContain('YYYY-MM-DD');
  });
});

describe('actualizarPacienteSchema', () => {
  test('no exige tutor_id (la reasignación tiene su propio endpoint)', () => {
    const r = actualizarPacienteSchema.safeParse({ nombre: 'Max', especie: 'Perro', sexo: 'Macho' });
    expect(r.success).toBe(true);
  });
});

describe('listarPacientesQuerySchema', () => {
  test('sin parámetros: contrato legacy (page null, limit 20)', () => {
    const r = listarPacientesQuerySchema.safeParse({});
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ q: null, page: null, limit: 20 });
  });

  test('coerciona page y limit desde strings de la query', () => {
    const r = listarPacientesQuerySchema.safeParse({ q: 'fir', page: '2', limit: '50' });
    expect(r.success).toBe(true);
    expect(r.data).toEqual({ q: 'fir', page: 2, limit: 50 });
  });

  test('rechaza limit fuera de rango', () => {
    const r = listarPacientesQuerySchema.safeParse({ page: '1', limit: '500' });
    expect(r.success).toBe(false);
  });
});
