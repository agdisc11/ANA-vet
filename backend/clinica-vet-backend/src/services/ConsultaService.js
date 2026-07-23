const { NotFoundError, ValidationError } = require('../errors/ApiError');

/**
 * Servicio de consultas clínicas.
 * Blindaje nuevo: si viene empleado_id se verifica que pertenezca a la
 * clínica (antes se aceptaba cualquier id).
 */
class ConsultaService {
  #consultas;
  #expedientes;
  #empleados;

  constructor({ consultaRepository, expedienteRepository, empleadoRepository }) {
    this.#consultas = consultaRepository;
    this.#expedientes = expedienteRepository;
    this.#empleados = empleadoRepository;
  }

  listarTodas(clinicaId) {
    return this.#consultas.listarPorClinica(clinicaId);
  }

  listarPorExpediente(expedienteId, clinicaId) {
    return this.#consultas.listarPorExpediente(expedienteId, clinicaId);
  }

  /** @returns {Promise<number>} id de la consulta registrada */
  async registrar(dto, clinicaId) {
    const expedienteValido = await this.#expedientes.existeEnClinica(dto.expediente_id, clinicaId);
    if (!expedienteValido) {
      throw new NotFoundError('Expediente no encontrado o no pertenece a esta clínica');
    }
    if (dto.empleado_id) {
      const empleadoValido = await this.#empleados.existeEnClinica(dto.empleado_id, clinicaId);
      if (!empleadoValido) throw new ValidationError('El empleado indicado no existe en esta clínica');
    }
    return this.#consultas.crear(dto);
  }
}

module.exports = ConsultaService;
