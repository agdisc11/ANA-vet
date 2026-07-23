const { NotFoundError } = require('../errors/ApiError');

/**
 * Servicio de hospitalizaciones.
 * El personal asignado se filtra por clínica en el repositorio
 * (INSERT…SELECT): los ids ajenos simplemente se descartan.
 */
class HospitalizacionService {
  #hospitalizaciones;
  #expedientes;

  constructor({ hospitalizacionRepository, expedienteRepository }) {
    this.#hospitalizaciones = hospitalizacionRepository;
    this.#expedientes = expedienteRepository;
  }

  listarTodas(clinicaId) {
    return this.#hospitalizaciones.listarPorClinica(clinicaId);
  }

  listarPorExpediente(expedienteId, clinicaId) {
    return this.#hospitalizaciones.listarPorExpediente(expedienteId, clinicaId);
  }

  /** @returns {Promise<number>} id de la hospitalización registrada */
  async registrar(dto, clinicaId) {
    const expedienteValido = await this.#expedientes.existeEnClinica(dto.expediente_id, clinicaId);
    if (!expedienteValido) {
      throw new NotFoundError('Expediente no encontrado o no pertenece a esta clínica');
    }
    const { empleados_ids: empleadosIds, ...datos } = dto;
    return this.#hospitalizaciones.crearConEmpleados(clinicaId, datos, empleadosIds);
  }
}

module.exports = HospitalizacionService;
