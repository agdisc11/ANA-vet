const Clinica = require('../domain/Clinica');
const { NotFoundError, UnauthorizedError, ForbiddenError, ConflictError } = require('../errors/ApiError');

/**
 * Servicio del tenant (clínica): registro, autenticación y perfil.
 *
 * `passwords` y `tokens` llegan inyectados (DIP): los tests usan fakes
 * y no ejecutan bcrypt ni firman JWT reales.
 */
class ClinicaService {
  #clinicas;
  #passwords;
  #tokens;

  constructor({ clinicaRepository, passwords, tokens }) {
    this.#clinicas = clinicaRepository;
    this.#passwords = passwords;
    this.#tokens = tokens;
  }

  /**
   * Alta del tenant: clínica + roles por defecto en una transacción.
   * @returns {Promise<number>} id de la clínica creada
   */
  async registrar(dto) {
    const clinica = Clinica.crear(dto);
    if (await this.#clinicas.existeEmail(clinica.email)) {
      throw new ConflictError('Ya existe una clínica registrada con ese email');
    }
    const hash = await this.#passwords.hashPassword(dto.password);
    return this.#clinicas.crearConRoles(clinica.aDatosPersistencia(), hash, Clinica.ROLES_DEFAULT);
  }

  async login({ email, password }) {
    const clinica = await this.#clinicas.buscarPorEmail(email);
    if (!clinica) throw new UnauthorizedError('Credenciales incorrectas');
    if (!clinica.activa) {
      throw new ForbiddenError('Esta clínica está suspendida. Contacte al administrador del sistema.');
    }
    const passwordOk = await this.#passwords.verificarPassword(password, clinica.password_hash);
    if (!passwordOk) throw new UnauthorizedError('Credenciales incorrectas');

    return {
      token: this.#tokens.firmarTokenClinica(clinica),
      tipo: 'clinica',
      clinica: {
        id: clinica.id,
        nombre: clinica.nombre,
        email: clinica.email,
        telefono: clinica.telefono,
        direccion: clinica.direccion,
        logo_url: clinica.logo_url,
      },
    };
  }

  async perfil(id) {
    const clinica = await this.#clinicas.obtenerPerfil(id);
    if (!clinica) throw new NotFoundError('Clínica no encontrada');
    return clinica;
  }

  actualizarPerfil(id, dto) {
    return this.#clinicas.actualizarPerfil(id, dto);
  }

  async cambiarPassword(id, { password_actual, password_nueva }) {
    const hashActual = await this.#clinicas.obtenerPasswordHash(id);
    if (!hashActual) throw new NotFoundError('Clínica no encontrada');

    const passwordOk = await this.#passwords.verificarPassword(password_actual, hashActual);
    if (!passwordOk) throw new UnauthorizedError('La contraseña actual es incorrecta');

    const nuevoHash = await this.#passwords.hashPassword(password_nueva);
    await this.#clinicas.actualizarPassword(id, nuevoHash);
  }
}

module.exports = ClinicaService;
