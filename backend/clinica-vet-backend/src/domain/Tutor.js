const { ValidationError } = require('../errors/ApiError');

/**
 * Entidad de dominio Tutor (propietario).
 *
 * Estados del tutor en la clínica:
 *   activo → inactivo (baja lógica; conserva historial)
 *   activo → vetado   (no se le brinda servicio)
 */
const ESTATUS = Object.freeze({
  ACTIVO: 'activo',
  INACTIVO: 'inactivo',
  VETADO: 'vetado',
});

class Tutor {
  #datos;

  constructor(datos) {
    this.#datos = { ...datos };
  }

  /** @throws {ValidationError} */
  static crear(dto) {
    const tutor = new Tutor({
      nombre: typeof dto.nombre === 'string' ? dto.nombre.trim() : dto.nombre,
      apellidos: typeof dto.apellidos === 'string' ? dto.apellidos.trim() : dto.apellidos,
      telefono: dto.telefono ?? null,
      whatsapp: dto.whatsapp ?? null,
      correo: dto.correo ?? null,
      direccion: dto.direccion ?? null,
    });
    tutor.#validarInvariantes();
    return tutor;
  }

  #validarInvariantes() {
    if (!this.#datos.nombre || !this.#datos.apellidos) {
      throw new ValidationError('nombre y apellidos son requeridos');
    }
  }

  get nombreCompleto() {
    return `${this.#datos.nombre} ${this.#datos.apellidos}`;
  }

  /** Teléfono utilizable para recordatorios por WhatsApp (whatsapp, o telefono como respaldo). */
  get telefonoWhatsApp() {
    return this.#datos.whatsapp || this.#datos.telefono || null;
  }

  aDatosPersistencia() {
    return { ...this.#datos };
  }
}

Tutor.ESTATUS = ESTATUS;

module.exports = Tutor;
