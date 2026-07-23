const Recordatorio = require('../domain/Recordatorio');
const { ValidationError } = require('../errors/ApiError');

/**
 * Servicio de recordatorios (Fase 3.2).
 *
 * Toma los eventos pendientes del repositorio y los enriquece con el
 * mensaje y el enlace de WhatsApp que arma el dominio. El envío en sí lo
 * hace el tutor→clínica desde su propio WhatsApp (deep-link), así que
 * aquí solo se registra que el recordatorio ya fue contactado.
 */
class RecordatorioService {
  #recordatorios;

  constructor({ recordatorioRepository }) {
    this.#recordatorios = recordatorioRepository;
  }

  /**
   * Lista los recordatorios pendientes ordenados por urgencia (los más
   * atrasados primero) con su mensaje y enlace listos para usar.
   */
  async listar(clinicaId, opciones = {}) {
    const [filas, clinicaNombre] = await Promise.all([
      this.#recordatorios.listarPendientes(clinicaId, opciones),
      this.#recordatorios.nombreClinica(clinicaId),
    ]);

    const enriquecidos = filas.map((fila) => {
      const datos = { ...fila, clinica_nombre: clinicaNombre };
      return {
        id: `${fila.tipo}-${fila.referencia_id}`,
        tipo: fila.tipo,
        referencia_id: fila.referencia_id,
        fecha: fila.fecha,
        hora: fila.hora,
        detalle: fila.detalle,
        paciente_id: fila.paciente_id,
        paciente_nombre: fila.paciente_nombre,
        tutor_nombre: fila.tutor_nombre,
        telefono: fila.telefono,
        whatsapp: fila.whatsapp,
        enviado_en: fila.enviado_en ?? null,
        dias_restantes: Recordatorio.diasRestantes(fila.fecha),
        urgencia: Recordatorio.urgencia(fila.fecha),
        mensaje: Recordatorio.construirMensaje(datos),
        enlace_whatsapp: Recordatorio.construirEnlaceWhatsApp(datos),
      };
    });

    // Los más urgentes primero (vencidos → hoy → próximos)
    return enriquecidos.sort((a, b) => (a.dias_restantes ?? 9999) - (b.dias_restantes ?? 9999));
  }

  /** Marca un recordatorio como contactado. */
  async marcarEnviado(clinicaId, dto, usuarioId) {
    if (!Object.values(Recordatorio.TIPOS).includes(dto.tipo)) {
      throw new ValidationError(`tipo debe ser uno de: ${Object.values(Recordatorio.TIPOS).join(', ')}`);
    }
    await this.#recordatorios.registrarEnvio(clinicaId, {
      tipo: dto.tipo,
      referencia_id: dto.referencia_id,
      paciente_id: dto.paciente_id,
      canal: dto.canal || 'whatsapp',
      enviado_por: usuarioId ?? null,
    });
  }

  /** Deshace la marca de enviado (permite reenviar el recordatorio). */
  async desmarcarEnviado(clinicaId, tipo, referenciaId) {
    await this.#recordatorios.borrarEnvio(clinicaId, tipo, referenciaId);
  }
}

module.exports = RecordatorioService;
