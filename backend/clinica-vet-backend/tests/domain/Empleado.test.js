const Empleado = require('../../src/domain/Empleado');
const { ValidationError } = require('../../src/errors/ApiError');

describe('Empleado — correo corporativo (lógica pura)', () => {
  test('limpia acentos, espacios y símbolos', () => {
    expect(Empleado.limpiarTexto('José Ángel')).toBe('joseangel');
    expect(Empleado.limpiarTexto("O'Connor-Ruiz")).toBe('oconnorruiz');
  });

  test('genera primer-nombre.primer-apellido@anavet-<clinica>.com', () => {
    expect(Empleado.generarCorreoBase('Sofía María', 'Ramírez López', 4)).toBe(
      'sofia.ramirez@anavet-4.com'
    );
  });

  test('sin colisiones devuelve el correo base', () => {
    expect(Empleado.resolverCorreoUnico('ana.perez@anavet-1.com', [])).toBe(
      'ana.perez@anavet-1.com'
    );
  });

  test('con colisiones agrega el primer sufijo numérico libre', () => {
    const existentes = ['ana.perez@anavet-1.com', 'ana.perez1@anavet-1.com'];
    expect(Empleado.resolverCorreoUnico('ana.perez@anavet-1.com', existentes)).toBe(
      'ana.perez2@anavet-1.com'
    );
  });
});

describe('Empleado — invariantes', () => {
  test('requiere nombre, apellidos y rol_id', () => {
    expect(() => Empleado.crear({ nombre: 'Ana', apellidos: 'Pérez' })).toThrow(ValidationError);
    expect(() => Empleado.crear({ nombre: 'Ana', rol_id: 2 })).toThrow(ValidationError);
  });

  test('normaliza y expone datos persistibles', () => {
    const e = Empleado.crear({
      nombre: '  Ana ', apellidos: ' Pérez ', rol_id: 2, email: ' ANA@X.COM ',
    });
    const datos = e.aDatosPersistencia();
    expect(datos.nombre).toBe('Ana');
    expect(datos.email).toBe('ana@x.com');
    expect(e.nombreCompleto).toBe('Ana Pérez');
  });
});
