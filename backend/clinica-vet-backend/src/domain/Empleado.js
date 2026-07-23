const { ValidationError } = require('../errors/ApiError');

/**
 * Entidad de dominio Empleado.
 *
 * Incluye la lógica PURA de generación de correo corporativo
 * (nombre.apellido@anavet-<clinica>.com) que antes vivía enredada con
 * callbacks de MySQL en la ruta: aquí es una función determinista y
 * testeable; el repositorio solo aporta la lista de correos existentes.
 */
class Empleado {
  #datos;

  constructor(datos) {
    this.#datos = { ...datos };
  }

  /** @throws {ValidationError} */
  static crear(dto) {
    const empleado = new Empleado({
      nombre: typeof dto.nombre === 'string' ? dto.nombre.trim() : dto.nombre,
      apellidos: typeof dto.apellidos === 'string' ? dto.apellidos.trim() : dto.apellidos,
      rol_id: dto.rol_id,
      email: typeof dto.email === 'string' ? dto.email.trim().toLowerCase() : (dto.email ?? null),
      telefono: dto.telefono ?? null,
    });
    empleado.#validarInvariantes();
    return empleado;
  }

  #validarInvariantes() {
    const { nombre, apellidos, rol_id } = this.#datos;
    if (!nombre || !apellidos || !rol_id) {
      throw new ValidationError('Campos requeridos: nombre, apellidos, rol_id');
    }
  }

  get nombreCompleto() { return `${this.#datos.nombre} ${this.#datos.apellidos}`; }
  get email() { return this.#datos.email; }

  asignarEmail(email) {
    this.#datos.email = email;
  }

  aDatosPersistencia() {
    return { ...this.#datos };
  }

  // ── Correo corporativo (lógica pura) ─────────────────────────

  /** Quita acentos y todo lo no alfanumérico; minúsculas. */
  static limpiarTexto(texto) {
    const RANGO_DIACRITICOS = new RegExp('[\\u0300-\\u036f]', 'g');
    return String(texto)
      .normalize('NFD')
      .replace(RANGO_DIACRITICOS, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
  }

  static dominioCorreo(clinicaId) {
    return `@anavet-${clinicaId}.com`;
  }

  /** primer-nombre.primer-apellido@anavet-<clinica>.com */
  static generarCorreoBase(nombre, apellidos, clinicaId) {
    const n = Empleado.limpiarTexto(String(nombre).split(' ')[0]);
    const a = Empleado.limpiarTexto(String(apellidos).split(' ')[0]);
    return `${n}.${a}${Empleado.dominioCorreo(clinicaId)}`;
  }

  /**
   * Resuelve colisiones agregando sufijo numérico incremental.
   * PURA: recibe los correos ya existentes; no toca la BD.
   * @param {string} correoBase p.ej. 'ana.lopez@anavet-4.com'
   * @param {string[]} existentes correos que comparten prefijo y dominio
   */
  static resolverCorreoUnico(correoBase, existentes) {
    if (!existentes.includes(correoBase)) return correoBase;
    const [local, dominio] = [
      correoBase.slice(0, correoBase.indexOf('@')),
      correoBase.slice(correoBase.indexOf('@')),
    ];
    let contador = 1;
    let candidato = `${local}${contador}${dominio}`;
    while (existentes.includes(candidato)) {
      contador++;
      candidato = `${local}${contador}${dominio}`;
    }
    return candidato;
  }
}

module.exports = Empleado;
