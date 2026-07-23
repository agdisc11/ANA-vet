const { NotFoundError, ConflictError } = require('../errors/ApiError');

/**
 * Servicio de roles de la clínica.
 * Nota: el RBAC (auth/permisos.js) autoriza por NOMBRE de rol; los roles
 * con nombres personalizados no obtienen permisos hasta agregarse al mapa.
 */
class RolService {
  #roles;

  constructor({ rolRepository }) {
    this.#roles = rolRepository;
  }

  listar(clinicaId) {
    return this.#roles.listarPorClinica(clinicaId);
  }

  async obtener(id, clinicaId) {
    const rol = await this.#roles.obtenerPorId(id, clinicaId);
    if (!rol) throw new NotFoundError('Rol no encontrado');
    return rol;
  }

  /** @returns {Promise<number>} id del rol creado */
  crear(dto, clinicaId) {
    return this.#roles.insert(clinicaId, { nombre: dto.nombre, descripcion: dto.descripcion });
  }

  /** Actualización parcial (los campos ausentes conservan su valor). */
  async actualizar(id, dto, clinicaId) {
    const existe = await this.#roles.existeEnClinica(id, clinicaId);
    if (!existe) throw new NotFoundError('Rol no encontrado');

    const campos = {};
    if (dto.nombre) campos.nombre = dto.nombre;
    if (dto.descripcion) campos.descripcion = dto.descripcion;
    if (Object.keys(campos).length > 0) {
      await this.#roles.updateById(id, clinicaId, campos);
    }
  }

  async eliminar(id, clinicaId) {
    let afectadas;
    try {
      afectadas = await this.#roles.deleteById(id, clinicaId);
    } catch (err) {
      if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        throw new ConflictError(
          'No se puede eliminar el rol porque hay empleados asignados a él. Reasigna o elimina esos empleados primero.'
        );
      }
      throw err;
    }
    if (afectadas === 0) throw new NotFoundError('Rol no encontrado');
  }
}

module.exports = RolService;
