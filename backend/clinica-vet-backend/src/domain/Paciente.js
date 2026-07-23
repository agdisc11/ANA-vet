const { ValidationError } = require('../errors/ApiError');

/**
 * Entidad de dominio Paciente.
 *
 * Encapsula los datos propios del animal y sus reglas de negocio,
 * sin conocer HTTP ni base de datos (SRP: su única razón de cambio
 * son las reglas clínicas del paciente).
 *
 * POO aplicada:
 *   - Encapsulación: estado privado (#datos), acceso vía getters.
 *   - Constructor estático `crear` que garantiza invariantes:
 *     ningún Paciente puede existir con fecha de nacimiento futura.
 */
class Paciente {
  #datos;

  constructor(datos) {
    this.#datos = { ...datos };
  }

  /**
   * Crea un Paciente validando invariantes de negocio.
   * @param {object} dto — datos ya validados en forma por el esquema Zod
   *                       (la entidad re-valida las reglas de NEGOCIO).
   * @throws {ValidationError}
   */
  static crear(dto) {
    const paciente = new Paciente({
      nombre: typeof dto.nombre === 'string' ? dto.nombre.trim() : dto.nombre,
      especie: typeof dto.especie === 'string' ? dto.especie.trim() : dto.especie,
      raza: dto.raza ?? null,
      sexo: dto.sexo ?? null,
      fecha_nacimiento: dto.fecha_nacimiento ?? null,
      funcion_zootecnica: dto.funcion_zootecnica ?? null,
      tatuaje: dto.tatuaje ?? null,
      microchip: dto.microchip ?? null,
      esquemas_preventivos: dto.esquemas_preventivos ?? null,
    });
    paciente.#validarInvariantes();
    return paciente;
  }

  #validarInvariantes() {
    if (!this.#datos.nombre) {
      throw new ValidationError('El paciente requiere un nombre');
    }
    const fecha = this.#datos.fecha_nacimiento;
    if (fecha) {
      if (Number.isNaN(new Date(fecha).getTime())) {
        throw new ValidationError('fecha_nacimiento inválida');
      }
      // Comparación lexicográfica YYYY-MM-DD: evita problemas de zona horaria
      if (String(fecha).slice(0, 10) > Paciente.#hoyISO()) {
        throw new ValidationError('La fecha de nacimiento no puede ser futura');
      }
    }
  }

  static #hoyISO() {
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${hoy.getFullYear()}-${mes}-${dia}`;
  }

  get nombre() { return this.#datos.nombre; }
  get especie() { return this.#datos.especie; }
  get sexo() { return this.#datos.sexo; }
  get fechaNacimiento() { return this.#datos.fecha_nacimiento; }

  /** Edad en años cumplidos, o null si no se conoce la fecha de nacimiento. */
  get edad() {
    const fecha = this.#datos.fecha_nacimiento;
    if (!fecha) return null;
    const nacimiento = new Date(fecha);
    if (Number.isNaN(nacimiento.getTime())) return null;
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  }

  /** Menor de 1 año (útil para planes de vacunación y dosificación). */
  esCachorro() {
    return this.edad !== null && this.edad < 1;
  }

  /** Objeto plano con las columnas persistibles del paciente (sin tutor_id: esa asociación la gestiona el servicio). */
  aDatosPersistencia() {
    return { ...this.#datos };
  }
}

module.exports = Paciente;
