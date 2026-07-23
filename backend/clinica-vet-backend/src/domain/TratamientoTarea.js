const { ValidationError } = require('../errors/ApiError');

/**
 * Tarea de la hoja de tratamiento hospitalario (Fase 3.6).
 *
 * Reglas de negocio de una hoja real:
 *   · una tarea tiene hora programada y descripción;
 *   · al completarse queda firmada con QUIÉN y CUÁNDO (auditoría);
 *   · una tarea vencida y no aplicada es una alerta clínica.
 */

const CATEGORIAS = Object.freeze({
  MEDICACION: 'medicacion',
  FLUIDOS: 'fluidos',
  CONSTANTES: 'constantes',
  ALIMENTACION: 'alimentacion',
  OTRO: 'otro',
});

/** Minutos de gracia antes de considerar una tarea atrasada. */
const TOLERANCIA_MIN = 15;

const aMinutos = (hora) => {
  const m = String(hora || '').match(/^(\d{1,2}):(\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

class TratamientoTarea {
  #datos;

  constructor(datos) {
    this.#datos = { ...datos };
  }

  /** @throws {ValidationError} */
  static crear(dto) {
    const tarea = new TratamientoTarea({
      hospitalizacion_id: dto.hospitalizacion_id,
      fecha: dto.fecha,
      hora: dto.hora,
      descripcion: typeof dto.descripcion === 'string' ? dto.descripcion.trim() : dto.descripcion,
      categoria: dto.categoria ?? CATEGORIAS.OTRO,
      dosis: dto.dosis ?? null,
      via: dto.via ?? null,
      notas: dto.notas ?? null,
    });
    tarea.#validarInvariantes();
    return tarea;
  }

  #validarInvariantes() {
    const { fecha, hora, descripcion } = this.#datos;
    if (!descripcion) throw new ValidationError('La tarea requiere una descripción');
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(String(fecha).slice(0, 10))) {
      throw new ValidationError('fecha debe tener formato YYYY-MM-DD');
    }
    if (aMinutos(hora) === null) {
      throw new ValidationError('hora debe tener formato HH:MM');
    }
    if (!Object.values(CATEGORIAS).includes(this.#datos.categoria)) {
      throw new ValidationError(`categoria debe ser una de: ${Object.values(CATEGORIAS).join(', ')}`);
    }
  }

  aDatosPersistencia() {
    return { ...this.#datos, hora: String(this.#datos.hora).slice(0, 5) };
  }

  /**
   * Estado operativo de una tarea, para pintar la hoja:
   *   'completada' | 'atrasada' | 'ahora' | 'pendiente'
   * @param {{completada, fecha, hora}} tarea
   */
  static estado(tarea, ahora = new Date()) {
    if (tarea.completada) return 'completada';

    const minutosTarea = aMinutos(tarea.hora);
    if (minutosTarea === null) return 'pendiente';

    const fechaTarea = String(tarea.fecha).slice(0, 10);
    const hoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;

    if (fechaTarea < hoy) return 'atrasada';
    if (fechaTarea > hoy) return 'pendiente';

    // Mismo día: comparar contra la hora actual
    const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
    if (minutosAhora > minutosTarea + TOLERANCIA_MIN) return 'atrasada';
    if (minutosAhora >= minutosTarea - TOLERANCIA_MIN) return 'ahora';
    return 'pendiente';
  }

  /** Resumen de avance de la hoja: totales y % completado. */
  static resumen(tareas = [], ahora = new Date()) {
    const total = tareas.length;
    let completadas = 0;
    let atrasadas = 0;
    for (const t of tareas) {
      const estado = TratamientoTarea.estado(t, ahora);
      if (estado === 'completada') completadas++;
      else if (estado === 'atrasada') atrasadas++;
    }
    return {
      total,
      completadas,
      pendientes: total - completadas,
      atrasadas,
      progreso: total === 0 ? 0 : Math.round((completadas / total) * 100),
    };
  }

  /** Agrupa las tareas por hora, para renderizar la hoja como cronograma. */
  static agruparPorHora(tareas = []) {
    const mapa = new Map();
    for (const t of tareas) {
      const hora = String(t.hora).slice(0, 5);
      if (!mapa.has(hora)) mapa.set(hora, []);
      mapa.get(hora).push(t);
    }
    return [...mapa.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hora, items]) => ({ hora, tareas: items }));
  }
}

TratamientoTarea.CATEGORIAS = CATEGORIAS;
TratamientoTarea.TOLERANCIA_MIN = TOLERANCIA_MIN;

module.exports = TratamientoTarea;
