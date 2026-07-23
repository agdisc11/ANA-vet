const { ValidationError } = require('../errors/ApiError');

/**
 * Entidad de dominio Cita (módulo Agenda).
 *
 * Modela el ciclo de vida de una cita como MÁQUINA DE ESTADOS:
 * ninguna capa puede llevar una cita a un estado inválido porque la
 * transición se valida aquí (POO: la regla vive con los datos).
 *
 * OCP: agregar un estado nuevo = agregar una entrada a TRANSICIONES;
 * el servicio, el controlador y las rutas no cambian.
 */

const ESTADOS = Object.freeze({
  PROGRAMADA: 'programada',
  CONFIRMADA: 'confirmada',
  EN_SALA: 'en_sala',
  ATENDIDA: 'atendida',
  CANCELADA: 'cancelada',
  NO_ASISTIO: 'no_asistio',
});

const TRANSICIONES = Object.freeze({
  [ESTADOS.PROGRAMADA]: [ESTADOS.CONFIRMADA, ESTADOS.EN_SALA, ESTADOS.ATENDIDA, ESTADOS.CANCELADA, ESTADOS.NO_ASISTIO],
  [ESTADOS.CONFIRMADA]: [ESTADOS.EN_SALA, ESTADOS.ATENDIDA, ESTADOS.CANCELADA, ESTADOS.NO_ASISTIO],
  [ESTADOS.EN_SALA]: [ESTADOS.ATENDIDA, ESTADOS.CANCELADA],
  [ESTADOS.ATENDIDA]: [],
  // Reactivar una cancelada la regresa al inicio del ciclo
  [ESTADOS.CANCELADA]: [ESTADOS.PROGRAMADA],
  [ESTADOS.NO_ASISTIO]: [],
});

// Estados en los que la cita sigue ocupando su horario (para traslapes)
const ESTADOS_ACTIVOS = Object.freeze([
  ESTADOS.PROGRAMADA, ESTADOS.CONFIRMADA, ESTADOS.EN_SALA, ESTADOS.ATENDIDA,
]);

const DURACION_MINIMA = 5;
const DURACION_MAXIMA = 480;
const MINUTOS_POR_DIA = 24 * 60;

class Cita {
  #datos;

  constructor(datos) {
    this.#datos = { ...datos };
  }

  /**
   * Crea una cita nueva validando invariantes (estado inicial: programada).
   * @throws {ValidationError}
   */
  static crear(dto) {
    const cita = new Cita({
      paciente_id: dto.paciente_id,
      empleado_id: dto.empleado_id ?? null,
      fecha: dto.fecha,
      hora_inicio: dto.hora_inicio,
      duracion_min: dto.duracion_min ?? 30,
      motivo: dto.motivo ?? null,
      notas: dto.notas ?? null,
      estado: ESTADOS.PROGRAMADA,
    });
    cita.#validarInvariantes();
    return cita;
  }

  /** Reconstruye la entidad desde una fila de la base de datos. */
  static desdeFila(fila) {
    return new Cita({
      ...fila,
      // MySQL TIME regresa 'HH:MM:SS'; internamente trabajamos con 'HH:MM'
      hora_inicio: String(fila.hora_inicio).slice(0, 5),
      duracion_min: Number(fila.duracion_min),
    });
  }

  #validarInvariantes() {
    const { fecha, hora_inicio, duracion_min } = this.#datos;

    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(String(fecha).slice(0, 10))) {
      throw new ValidationError('La cita requiere una fecha válida (YYYY-MM-DD)');
    }
    if (!hora_inicio || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora_inicio)) {
      throw new ValidationError('La cita requiere hora_inicio válida (HH:MM, 00:00–23:59)');
    }
    if (!Number.isInteger(duracion_min) || duracion_min < DURACION_MINIMA || duracion_min > DURACION_MAXIMA) {
      throw new ValidationError(`La duración debe estar entre ${DURACION_MINIMA} y ${DURACION_MAXIMA} minutos`);
    }
    if (Cita.aMinutos(hora_inicio) + duracion_min > MINUTOS_POR_DIA) {
      throw new ValidationError('La cita no puede cruzar la medianoche');
    }
  }

  static aMinutos(horaHHMM) {
    const [h, m] = String(horaHHMM).split(':').map(Number);
    return h * 60 + m;
  }

  static aHHMM(minutos) {
    const h = String(Math.floor(minutos / 60)).padStart(2, '0');
    const m = String(minutos % 60).padStart(2, '0');
    return `${h}:${m}`;
  }

  get estado() { return this.#datos.estado; }
  get fecha() { return this.#datos.fecha; }
  get horaInicio() { return this.#datos.hora_inicio; }
  get duracionMin() { return this.#datos.duracion_min; }
  get empleadoId() { return this.#datos.empleado_id; }

  /** Hora de término 'HH:MM' calculada desde inicio + duración. */
  get horaFin() {
    return Cita.aHHMM(Cita.aMinutos(this.#datos.hora_inicio) + this.#datos.duracion_min);
  }

  esFinal() {
    return (TRANSICIONES[this.estado] ?? []).length === 0;
  }

  /** Solo se reagenda/edita una cita que aún no se atiende ni se canceló. */
  puedeEditarse() {
    return [ESTADOS.PROGRAMADA, ESTADOS.CONFIRMADA, ESTADOS.EN_SALA].includes(this.estado);
  }

  puedeTransicionarA(nuevoEstado) {
    return (TRANSICIONES[this.estado] ?? []).includes(nuevoEstado);
  }

  /**
   * Devuelve una NUEVA Cita en el estado destino (inmutabilidad).
   * @throws {ValidationError} si la transición no está permitida
   */
  transicionarA(nuevoEstado) {
    if (!this.puedeTransicionarA(nuevoEstado)) {
      throw new ValidationError(
        `Transición inválida: una cita "${this.estado}" no puede pasar a "${nuevoEstado}"`
      );
    }
    return new Cita({ ...this.#datos, estado: nuevoEstado });
  }

  /** ¿Se traslapa en horario con otra cita (misma fecha ya garantizada)? */
  seTraslapaCon(otra) {
    const inicioA = Cita.aMinutos(this.horaInicio);
    const finA = inicioA + this.duracionMin;
    const inicioB = Cita.aMinutos(otra.horaInicio);
    const finB = inicioB + otra.duracionMin;
    return inicioA < finB && inicioB < finA;
  }

  aDatosPersistencia() {
    return { ...this.#datos };
  }
}

Cita.ESTADOS = ESTADOS;
Cita.TRANSICIONES = TRANSICIONES;
Cita.ESTADOS_ACTIVOS = ESTADOS_ACTIVOS;

module.exports = Cita;
