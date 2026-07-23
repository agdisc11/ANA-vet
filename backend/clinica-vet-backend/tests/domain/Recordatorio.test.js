const Recordatorio = require('../../src/domain/Recordatorio');

describe('normalizarTelefono', () => {
  const n = Recordatorio.normalizarTelefono;

  test('agrega el código de país a un número local de 10 dígitos', () => {
    expect(n('5512345678')).toBe('525512345678');
    expect(n('55 1234-5678')).toBe('525512345678');
  });

  test('respeta un número que ya trae código de país', () => {
    expect(n('+52 55 1234 5678')).toBe('525512345678');
    expect(n('525512345678')).toBe('525512345678');
  });

  test('quita el prefijo internacional 00', () => {
    expect(n('0052 5512345678')).toBe('525512345678');
  });

  test('devuelve null si no hay número utilizable', () => {
    expect(n(null)).toBeNull();
    expect(n('')).toBeNull();
    expect(n('sin teléfono')).toBeNull();
    expect(n('12345')).toBeNull(); // demasiado corto
  });

  test('acepta otro código de país', () => {
    expect(n('612345678', '34')).toBeNull(); // 9 dígitos: no es local MX de 10
    expect(n('6123456789', '34')).toBe('346123456789');
  });
});

describe('construirMensaje', () => {
  const base = {
    paciente_nombre: 'Firulais',
    tutor_nombre: 'Carlos Mendoza Ruiz',
    clinica_nombre: 'Clínica Demo',
    fecha: '2026-08-01',
  };

  test('vacuna: saluda por el primer nombre e incluye vacuna y fecha', () => {
    const msg = Recordatorio.construirMensaje({ ...base, tipo: 'vacuna', detalle: 'Rabia' });
    expect(msg).toContain('Hola Carlos');
    expect(msg).not.toContain('Mendoza');
    expect(msg).toContain('Firulais');
    expect(msg).toContain('Rabia');
    expect(msg).toContain('1 de agosto de 2026');
    expect(msg).toContain('Clínica Demo');
  });

  test('cita: incluye hora y motivo cuando existen', () => {
    const msg = Recordatorio.construirMensaje({ ...base, tipo: 'cita', hora: '10:30', detalle: 'Chequeo' });
    expect(msg).toContain('10:30');
    expect(msg).toContain('Chequeo');
  });

  test('cita sin hora ni motivo no deja huecos raros', () => {
    const msg = Recordatorio.construirMensaje({ ...base, tipo: 'cita' });
    expect(msg).toContain('Firulais');
    expect(msg).not.toContain('undefined');
    expect(msg).not.toContain('null');
  });

  test('tipo desconocido cae a un mensaje genérico', () => {
    const msg = Recordatorio.construirMensaje({ ...base, tipo: 'otro' });
    expect(msg).toContain('Firulais');
    expect(msg).not.toContain('undefined');
  });
});

describe('construirEnlaceWhatsApp', () => {
  const datos = {
    tipo: 'vacuna', detalle: 'Rabia', fecha: '2026-08-01',
    paciente_nombre: 'Firulais', tutor_nombre: 'Carlos', clinica_nombre: 'Demo',
  };

  test('usa whatsapp si existe; si no, el teléfono', () => {
    expect(Recordatorio.construirEnlaceWhatsApp({ ...datos, whatsapp: '5512345678', telefono: '5599999999' }))
      .toMatch(/^https:\/\/wa\.me\/525512345678\?text=/);
    expect(Recordatorio.construirEnlaceWhatsApp({ ...datos, telefono: '5599999999' }))
      .toMatch(/^https:\/\/wa\.me\/525599999999\?text=/);
  });

  test('el mensaje va URL-encoded', () => {
    const enlace = Recordatorio.construirEnlaceWhatsApp({ ...datos, whatsapp: '5512345678' });
    expect(enlace).not.toContain(' ');
    expect(decodeURIComponent(enlace.split('?text=')[1])).toContain('Firulais');
  });

  test('null si el tutor no tiene teléfono utilizable', () => {
    expect(Recordatorio.construirEnlaceWhatsApp(datos)).toBeNull();
    expect(Recordatorio.construirEnlaceWhatsApp({ ...datos, telefono: 'n/d' })).toBeNull();
  });
});

describe('diasRestantes y urgencia', () => {
  const hoy = new Date('2026-07-21T12:00:00');

  test('calcula días con signo', () => {
    expect(Recordatorio.diasRestantes('2026-07-21', hoy)).toBe(0);
    expect(Recordatorio.diasRestantes('2026-07-24', hoy)).toBe(3);
    expect(Recordatorio.diasRestantes('2026-07-18', hoy)).toBe(-3);
  });

  test('clasifica la urgencia', () => {
    expect(Recordatorio.urgencia('2026-07-18', hoy)).toBe('vencido');
    expect(Recordatorio.urgencia('2026-07-21', hoy)).toBe('hoy');
    expect(Recordatorio.urgencia('2026-07-23', hoy)).toBe('pronto');
    expect(Recordatorio.urgencia('2026-08-15', hoy)).toBe('proximo');
  });

  test('sin fecha no rompe', () => {
    expect(Recordatorio.diasRestantes(null)).toBeNull();
    expect(Recordatorio.urgencia(null)).toBe('proximo');
  });
});
