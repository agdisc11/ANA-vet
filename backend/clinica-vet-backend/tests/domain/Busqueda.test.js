const Busqueda = require('../../src/domain/Busqueda');
const { ValidationError } = require('../../src/errors/ApiError');

describe('Busqueda.crear', () => {
  test('normaliza espacios sobrantes', () => {
    expect(Busqueda.crear('   fir   ulais  ').texto).toBe('fir ulais');
  });

  test('rechaza consultas por debajo de la longitud mínima', () => {
    expect(() => Busqueda.crear('a')).toThrow(ValidationError);
    expect(() => Busqueda.crear('   ')).toThrow(ValidationError);
    expect(() => Busqueda.crear(null)).toThrow(ValidationError);
    expect(() => Busqueda.crear(undefined)).toThrow(ValidationError);
  });

  test('el error de consulta corta es un 400 con mensaje útil', () => {
    try {
      Busqueda.crear('a');
      throw new Error('debió lanzar');
    } catch (err) {
      expect(err.status).toBe(400);
      expect(err.message).toContain('2 caracteres');
    }
  });

  test('trunca consultas absurdamente largas (invariante propia del dominio)', () => {
    const largo = 'x'.repeat(500);
    expect(Busqueda.crear(largo).texto).toHaveLength(Busqueda.LONGITUD_MAXIMA);
  });
});

describe('Busqueda.plegar', () => {
  test('quita acentos y pasa a minúsculas', () => {
    expect(Busqueda.plegar('José Ramírez')).toBe('jose ramirez');
    expect(Busqueda.plegar('MUÑOZ')).toBe('munoz');
  });

  test('tolera null/undefined', () => {
    expect(Busqueda.plegar(null)).toBe('');
    expect(Busqueda.plegar(undefined)).toBe('');
  });
});

describe('Busqueda#patronLike', () => {
  test('envuelve el término en comodines', () => {
    expect(Busqueda.crear('fir').patronLike).toBe('%fir%');
  });

  test('escapa los comodines que escribe el usuario (no debe barrer la tabla)', () => {
    expect(Busqueda.crear('100%').patronLike).toBe('%100\\%%');
    expect(Busqueda.crear('a_b').patronLike).toBe('%a\\_b%');
    expect(Busqueda.crear('c\\d').patronLike).toBe('%c\\\\d%');
  });
});

describe('Busqueda#relevancia', () => {
  const { EXACTA, PREFIJO, PREFIJO_DE_PALABRA, CONTIENE, NULA } = Busqueda.RELEVANCIA;

  test('puntúa por tipo de coincidencia', () => {
    const b = Busqueda.crear('luna');
    expect(b.relevancia('Luna')).toBe(EXACTA);
    expect(b.relevancia('Lunatica')).toBe(PREFIJO);
    expect(b.relevancia('Bella Luna')).toBe(PREFIJO_DE_PALABRA);
    expect(b.relevancia('Malunado')).toBe(CONTIENE);
    expect(b.relevancia('Firulais')).toBe(NULA);
  });

  test('ordena "Firulais" por delante de "Alfirio" para la consulta "fir"', () => {
    const b = Busqueda.crear('fir');
    expect(b.relevancia('Firulais')).toBeGreaterThan(b.relevancia('Alfirio'));
  });

  test('ignora acentos y mayúsculas en ambos lados', () => {
    expect(Busqueda.crear('ramirez').relevancia('Ramírez')).toBe(EXACTA);
    expect(Busqueda.crear('MUÑ').relevancia('Muñoz')).toBe(PREFIJO);
  });

  test('texto vacío o nulo no puntúa', () => {
    const b = Busqueda.crear('luna');
    expect(b.relevancia(null)).toBe(NULA);
    expect(b.relevancia('')).toBe(NULA);
  });
});

describe('Busqueda#mejorRelevancia', () => {
  test('devuelve el máximo entre los campos candidatos', () => {
    const b = Busqueda.crear('555');
    expect(b.mejorRelevancia('Carlos Mendoza', '5551234567', null)).toBe(Busqueda.RELEVANCIA.PREFIJO);
  });

  test('sin candidatos devuelve 0', () => {
    expect(Busqueda.crear('luna').mejorRelevancia()).toBe(0);
  });
});

describe('Busqueda.limiteValido', () => {
  test('acota al rango permitido', () => {
    expect(Busqueda.limiteValido(3)).toBe(3);
    expect(Busqueda.limiteValido(0)).toBe(1);
    expect(Busqueda.limiteValido(999)).toBe(Busqueda.LIMITE_MAX);
    expect(Busqueda.limiteValido(4.7)).toBe(4);
  });

  test('sin valor usable cae al default', () => {
    expect(Busqueda.limiteValido(undefined)).toBe(Busqueda.LIMITE_DEFAULT);
    expect(Busqueda.limiteValido('abc')).toBe(Busqueda.LIMITE_DEFAULT);
  });
});
