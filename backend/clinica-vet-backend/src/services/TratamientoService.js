const TratamientoTarea = require('../domain/TratamientoTarea');
const { NotFoundError, ForbiddenError } = require('../errors/ApiError');

/**
 * Servicio de la hoja de tratamiento hospitalario (Fase 3.6).
 *
 * Toda operación verifica que la hospitalización (o la tarea) pertenezca
 * a la clínica del usuario: `tratamiento_tarea` no tiene clinica_id.
 */
class TratamientoService {
  #tratamientos;

  constructor({ tratamientoRepository }) {
    this.#tratamientos = tratamientoRepository;
  }

  /** Hoja del día: tareas agrupadas por hora + resumen de avance. */
  async hoja(hospitalizacionId, clinicaId, { fecha = null } = {}) {
    await this.#verificarHospitalizacion(hospitalizacionId, clinicaId);
    const tareas = await this.#tratamientos.listarPorHospitalizacion(hospitalizacionId, { fecha });

    const conEstado = tareas.map((t) => ({ ...t, estado: TratamientoTarea.estado(t) }));
    return {
      fecha: fecha ?? null,
      resumen: TratamientoTarea.resumen(tareas),
      bloques: TratamientoTarea.agruparPorHora(conEstado),
      tareas: conEstado,
    };
  }

  /** Tablero de enfermería: internados con el avance de su hoja de hoy. */
  async internados(clinicaId, fecha) {
    const filas = await this.#tratamientos.listarInternadosConAvance(clinicaId, fecha);
    return filas.map((f) => ({
      ...f,
      total_tareas: Number(f.total_tareas),
      tareas_completadas: Number(f.tareas_completadas),
      progreso: Number(f.total_tareas) === 0
        ? 0
        : Math.round((Number(f.tareas_completadas) / Number(f.total_tareas)) * 100),
    }));
  }

  /** @returns {Promise<number>} id de la tarea creada */
  async agregarTarea(hospitalizacionId, dto, clinicaId) {
    await this.#verificarHospitalizacion(hospitalizacionId, clinicaId);
    const tarea = TratamientoTarea.crear({ ...dto, hospitalizacion_id: hospitalizacionId });
    return this.#tratamientos.crear(tarea.aDatosPersistencia());
  }

  /**
   * Crea una pauta repetida: la misma tarea cada N horas desde una hora
   * inicial (p. ej. antibiótico cada 8 h → 08:00, 16:00, 00:00).
   * @returns {Promise<{creadas: number, horas: string[]}>}
   */
  async agregarPauta(hospitalizacionId, dto, clinicaId) {
    await this.#verificarHospitalizacion(hospitalizacionId, clinicaId);

    const horas = TratamientoService.calcularHorasPauta(dto.hora, dto.cada_horas, dto.repeticiones);
    // Valida la primera: si el DTO está mal, falla antes de insertar nada
    const base = TratamientoTarea.crear({ ...dto, hora: horas[0], hospitalizacion_id: hospitalizacionId });

    const creadas = await this.#tratamientos.crearSerie(base.aDatosPersistencia(), horas);
    return { creadas, horas };
  }

  /**
   * Horas de una pauta a partir de la hora inicial (lógica pura).
   * Se mantiene dentro del mismo día: las que pasarían de medianoche
   * se recortan (la hoja es por día).
   */
  static calcularHorasPauta(horaInicial, cadaHoras, repeticiones) {
    const m = String(horaInicial || '').match(/^(\d{1,2}):(\d{2})/);
    if (!m) return [horaInicial];
    const inicio = Number(m[1]) * 60 + Number(m[2]);
    const paso = Number(cadaHoras) > 0 ? Number(cadaHoras) * 60 : 0;
    const veces = Math.max(1, Number(repeticiones) || 1);

    const horas = [];
    for (let i = 0; i < veces; i++) {
      const minutos = inicio + paso * i;
      if (minutos >= 24 * 60) break; // no cruzar al día siguiente
      horas.push(`${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`);
      if (paso === 0) break;
    }
    return horas;
  }

  /** Firma la tarea con el empleado que la aplicó. */
  async marcarCompletada(tareaId, clinicaId, { completada, empleadoId }) {
    const tarea = await this.#tratamientos.obtenerConClinica(tareaId);
    if (!tarea) throw new NotFoundError('Tarea no encontrada');
    if (Number(tarea.clinica_id) !== Number(clinicaId)) {
      throw new ForbiddenError('La tarea no pertenece a esta clínica');
    }
    await this.#tratamientos.marcarCompletada(tareaId, { completada, empleadoId });
  }

  async eliminarTarea(tareaId, clinicaId) {
    const tarea = await this.#tratamientos.obtenerConClinica(tareaId);
    if (!tarea) throw new NotFoundError('Tarea no encontrada');
    if (Number(tarea.clinica_id) !== Number(clinicaId)) {
      throw new ForbiddenError('La tarea no pertenece a esta clínica');
    }
    await this.#tratamientos.eliminar(tareaId);
  }

  async #verificarHospitalizacion(hospitalizacionId, clinicaId) {
    const valida = await this.#tratamientos.hospitalizacionEsDeClinica(hospitalizacionId, clinicaId);
    if (!valida) throw new NotFoundError('Hospitalización no encontrada en esta clínica');
  }
}

module.exports = TratamientoService;
