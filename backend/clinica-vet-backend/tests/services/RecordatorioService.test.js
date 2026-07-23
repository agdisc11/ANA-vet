const RecordatorioService = require('../../src/services/RecordatorioService');
const { ValidationError } = require('../../src/errors/ApiError');

const CLINICA = 42;

function crearFakes(filas = []) {
  const recordatorioRepository = {
    listarPendientes: jest.fn(async () => filas),
    nombreClinica: jest.fn(async () => 'Clínica Demo'),
    registrarEnvio: jest.fn(async () => undefined),
    borrarEnvio: jest.fn(async () => 1),
  };
  return { service: new RecordatorioService({ recordatorioRepository }), recordatorioRepository };
}

const filaVacuna = {
  referencia_id: 5, tipo: 'vacuna', fecha: '2026-07-25', hora: null, detalle: 'Rabia',
  paciente_id: 1, paciente_nombre: 'Firulais', tutor_nombre: 'Carlos Mendoza',
  telefono: '5512345678', whatsapp: null, enviado_en: null,
};

describe('RecordatorioService.listar', () => {
  test('enriquece cada recordatorio con mensaje, enlace y urgencia', async () => {
    const { service } = crearFakes([filaVacuna]);
    const [r] = await service.listar(CLINICA);

    expect(r.id).toBe('vacuna-5');
    expect(r.mensaje).toContain('Firulais');
    expect(r.mensaje).toContain('Clínica Demo');
    expect(r.enlace_whatsapp).toMatch(/^https:\/\/wa\.me\/525512345678/);
    expect(r.urgencia).toBeDefined();
    expect(r.enviado_en).toBeNull();
  });

  test('ordena por urgencia: lo vencido primero', async () => {
    const hoyISO = new Date().toISOString().slice(0, 10);
    const futuro = new Date(Date.now() + 20 * 86_400_000).toISOString().slice(0, 10);
    const pasado = new Date(Date.now() - 10 * 86_400_000).toISOString().slice(0, 10);

    const { service } = crearFakes([
      { ...filaVacuna, referencia_id: 1, fecha: futuro },
      { ...filaVacuna, referencia_id: 2, fecha: pasado },
      { ...filaVacuna, referencia_id: 3, fecha: hoyISO },
    ]);
    const orden = (await service.listar(CLINICA)).map((r) => r.referencia_id);
    expect(orden).toEqual([2, 3, 1]);
  });

  test('sin teléfono, el enlace es null pero el recordatorio se lista igual', async () => {
    const { service } = crearFakes([{ ...filaVacuna, telefono: null, whatsapp: null }]);
    const [r] = await service.listar(CLINICA);
    expect(r.enlace_whatsapp).toBeNull();
    expect(r.mensaje).toContain('Firulais');
  });

  test('conserva la marca de enviado', async () => {
    const { service } = crearFakes([{ ...filaVacuna, enviado_en: '2026-07-20 10:00:00' }]);
    const [r] = await service.listar(CLINICA);
    expect(r.enviado_en).toBe('2026-07-20 10:00:00');
  });
});

describe('RecordatorioService.marcarEnviado', () => {
  test('registra el envío con el usuario que lo hizo', async () => {
    const { service, recordatorioRepository } = crearFakes();
    await service.marcarEnviado(CLINICA, { tipo: 'vacuna', referencia_id: 5, paciente_id: 1 }, 99);

    expect(recordatorioRepository.registrarEnvio).toHaveBeenCalledWith(CLINICA, {
      tipo: 'vacuna', referencia_id: 5, paciente_id: 1, canal: 'whatsapp', enviado_por: 99,
    });
  });

  test('rechaza un tipo desconocido', async () => {
    const { service, recordatorioRepository } = crearFakes();
    await expect(service.marcarEnviado(CLINICA, { tipo: 'sms', referencia_id: 1 }, 1))
      .rejects.toBeInstanceOf(ValidationError);
    expect(recordatorioRepository.registrarEnvio).not.toHaveBeenCalled();
  });
});

describe('RecordatorioService.desmarcarEnviado', () => {
  test('borra el registro para permitir reenvío', async () => {
    const { service, recordatorioRepository } = crearFakes();
    await service.desmarcarEnviado(CLINICA, 'cita', 7);
    expect(recordatorioRepository.borrarEnvio).toHaveBeenCalledWith(CLINICA, 'cita', 7);
  });
});
