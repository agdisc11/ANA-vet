const { NotFoundError } = require('../errors/ApiError');

/**
 * Servicio del catálogo de servicios (precios de la clínica).
 */
class ServicioCatalogoService {
  #catalogo;

  constructor({ servicioCatalogoRepository }) {
    this.#catalogo = servicioCatalogoRepository;
  }

  listar(clinicaId, { incluirInactivos = false } = {}) {
    return this.#catalogo.listarPorClinica(clinicaId, { incluirInactivos });
  }

  /** @returns {Promise<number>} id del servicio creado */
  crear(dto, clinicaId) {
    return this.#catalogo.insert(clinicaId, {
      categoria: dto.categoria,
      nombre: dto.nombre,
      precio: dto.precio,
      activo: dto.activo,
    });
  }

  /** Actualización parcial (los campos ausentes conservan su valor). */
  async actualizar(id, dto, clinicaId) {
    const existe = await this.#catalogo.existeEnClinica(id, clinicaId);
    if (!existe) throw new NotFoundError('Servicio no encontrado');

    const campos = {};
    if (dto.nombre) campos.nombre = dto.nombre;
    if (dto.precio !== undefined && dto.precio !== null) campos.precio = dto.precio;
    if (dto.activo !== undefined && dto.activo !== null) campos.activo = dto.activo;
    if (dto.categoria) campos.categoria = dto.categoria;

    if (Object.keys(campos).length > 0) {
      await this.#catalogo.updateById(id, clinicaId, campos);
    }
  }
}

module.exports = ServicioCatalogoService;
