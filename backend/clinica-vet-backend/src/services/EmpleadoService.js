const Empleado = require('../domain/Empleado');
const { NotFoundError, ValidationError, UnauthorizedError, ForbiddenError, ConflictError } = require('../errors/ApiError');

/**
 * Servicio de empleados: autenticación y gestión del personal.
 *
 * Reglas que garantiza:
 *   - El rol asignado debe pertenecer a la clínica (los IDs de roles son
 *     globales; asignar un rol ajeno sería una fuga entre tenants).
 *   - Con generar_correo, el correo corporativo y la contraseña temporal
 *     se generan en el dominio/infraestructura, nunca en la ruta.
 */
class EmpleadoService {
  #empleados;
  #roles;
  #passwords;
  #tokens;

  constructor({ empleadoRepository, rolRepository, passwords, tokens }) {
    this.#empleados = empleadoRepository;
    this.#roles = rolRepository;
    this.#passwords = passwords;
    this.#tokens = tokens;
  }

  /** Empleados activos (selector de la Agenda). */
  listarActivos(clinicaId) {
    return this.#empleados.listarActivos(clinicaId);
  }

  listar(clinicaId) {
    return this.#empleados.listarPorClinica(clinicaId);
  }

  async obtener(id, clinicaId) {
    const empleado = await this.#empleados.obtenerPorId(id, clinicaId);
    if (!empleado) throw new NotFoundError('Empleado no encontrado');
    return empleado;
  }

  async login({ email, password }) {
    const empleado = await this.#empleados.buscarPorEmailConRelaciones(email);
    if (!empleado) throw new UnauthorizedError('Credenciales incorrectas');
    if (!empleado.activo) {
      throw new ForbiddenError('Tu cuenta está desactivada. Contacta al administrador de tu clínica.');
    }
    if (!empleado.clinica_activa) {
      throw new ForbiddenError('La clínica está suspendida. Contacta al administrador del sistema.');
    }
    const passwordOk = await this.#passwords.verificarPassword(password, empleado.password_hash);
    if (!passwordOk) throw new UnauthorizedError('Credenciales incorrectas');

    return {
      token: this.#tokens.firmarTokenEmpleado(empleado),
      tipo: 'empleado',
      empleado: {
        id: empleado.id,
        nombre: empleado.nombre,
        apellidos: empleado.apellidos,
        email: empleado.email,
        telefono: empleado.telefono,
        rol_id: empleado.rol_id,
        rol_nombre: empleado.rol_nombre,
        clinica_id: empleado.clinica_id,
        clinica_nombre: empleado.clinica_nombre,
      },
    };
  }

  /**
   * Alta de empleado. Con `generar_correo` devuelve además el correo
   * corporativo generado y la contraseña temporal (para entregarla una vez).
   */
  async crear(dto, clinicaId) {
    await this.#verificarRol(dto.rol_id, clinicaId);

    let email = dto.email;
    let passwordPlano = dto.password;
    let correoGenerado = false;

    if (dto.generar_correo) {
      const base = Empleado.generarCorreoBase(dto.nombre, dto.apellidos, clinicaId);
      const local = base.slice(0, base.indexOf('@'));
      const existentes = await this.#empleados.emailsConPatron(
        `${local}%${Empleado.dominioCorreo(clinicaId)}`
      );
      email = Empleado.resolverCorreoUnico(base, existentes);
      passwordPlano = this.#passwords.generarPasswordTemporal();
      correoGenerado = true;
    } else if (await this.#empleados.existeEmail(email)) {
      throw new ConflictError('Ya existe un empleado registrado con ese email');
    }

    const entidad = Empleado.crear({ ...dto, email });
    const passwordHash = await this.#passwords.hashPassword(passwordPlano);
    const empleadoId = await this.#empleados.insert(clinicaId, {
      ...entidad.aDatosPersistencia(),
      password_hash: passwordHash,
    });

    return correoGenerado
      ? { empleado_id: empleadoId, correo_generado: email, email, password_temporal: passwordPlano }
      : { empleado_id: empleadoId };
  }

  /** Actualización parcial: los campos vacíos/ausentes conservan su valor. */
  async actualizar(id, dto, clinicaId) {
    const existe = await this.#empleados.existeEnClinica(id, clinicaId);
    if (!existe) throw new NotFoundError('Empleado no encontrado');
    if (dto.rol_id) await this.#verificarRol(dto.rol_id, clinicaId);

    const campos = {};
    for (const campo of ['nombre', 'apellidos', 'email', 'rol_id', 'telefono']) {
      if (dto[campo] !== undefined && dto[campo] !== null) campos[campo] = dto[campo];
    }
    if (dto.activo !== undefined) campos.activo = dto.activo;

    if (Object.keys(campos).length > 0) {
      await this.#empleados.updateById(id, clinicaId, campos);
    }
  }

  async cambiarPassword(id, clinicaId, passwordNueva) {
    const existe = await this.#empleados.existeEnClinica(id, clinicaId);
    if (!existe) throw new NotFoundError('Empleado no encontrado');
    const hash = await this.#passwords.hashPassword(passwordNueva);
    await this.#empleados.updateById(id, clinicaId, { password_hash: hash });
  }

  async eliminar(id, clinicaId) {
    const afectadas = await this.#empleados.deleteById(id, clinicaId);
    if (afectadas === 0) throw new NotFoundError('Empleado no encontrado');
  }

  async #verificarRol(rolId, clinicaId) {
    const valido = await this.#roles.existeEnClinica(rolId, clinicaId);
    if (!valido) throw new ValidationError('El rol_id no existe o no pertenece a tu clínica');
  }
}

module.exports = EmpleadoService;
