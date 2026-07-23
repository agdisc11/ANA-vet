const { ValidationError } = require('../errors/ApiError');

/**
 * Entidad de dominio Clinica (el tenant del sistema).
 *
 * ROLES_DEFAULT es la única definición de los roles que se siembran al
 * registrar una clínica. El RBAC (src/auth/permisos.js) autoriza por estos
 * NOMBRES, por lo que cambiarlos aquí implica actualizar aquel mapa.
 */
const ROLES_DEFAULT = Object.freeze([
  Object.freeze({ nombre: 'Administrador', descripcion: 'Acceso total: gestión de empleados, reportes y configuración' }),
  Object.freeze({ nombre: 'Veterinario', descripcion: 'Acceso a expedientes, consultas, cirugías y hospitalizaciones' }),
  Object.freeze({ nombre: 'Recepcionista', descripcion: 'Registro de tutores, pacientes y citas' }),
  Object.freeze({ nombre: 'Auxiliar', descripcion: 'Apoyo en consultas y hospitalización, sin acceso a reportes' }),
]);

class Clinica {
  #datos;

  constructor(datos) {
    this.#datos = { ...datos };
  }

  /** @throws {ValidationError} */
  static crear(dto) {
    const clinica = new Clinica({
      nombre: typeof dto.nombre === 'string' ? dto.nombre.trim() : dto.nombre,
      email: typeof dto.email === 'string' ? dto.email.trim().toLowerCase() : dto.email,
      telefono: dto.telefono ?? null,
      direccion: dto.direccion ?? null,
    });
    clinica.#validarInvariantes();
    return clinica;
  }

  #validarInvariantes() {
    if (!this.#datos.nombre || !this.#datos.email) {
      throw new ValidationError('Campos requeridos: nombre, email, password');
    }
  }

  get nombre() { return this.#datos.nombre; }
  get email() { return this.#datos.email; }

  /** Datos persistibles (el password_hash lo agrega el servicio). */
  aDatosPersistencia() {
    return { ...this.#datos };
  }
}

Clinica.ROLES_DEFAULT = ROLES_DEFAULT;

module.exports = Clinica;
