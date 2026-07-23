const { ForbiddenError } = require('../errors/ApiError');

/**
 * Servicio de expedientes clínicos.
 */
class ExpedienteService {
  #expedientes;
  #pacientes;

  constructor({ expedienteRepository, pacienteRepository }) {
    this.#expedientes = expedienteRepository;
    this.#pacientes = pacienteRepository;
  }

  listarPorPaciente(pacienteId, clinicaId) {
    return this.#expedientes.listarPorPaciente(pacienteId, clinicaId);
  }

  /** @returns {Promise<number>} id del expediente abierto */
  async abrir(pacienteId, clinicaId) {
    const pacienteValido = await this.#pacientes.existeEnClinica(pacienteId, clinicaId);
    if (!pacienteValido) throw new ForbiddenError('El paciente no pertenece a esta clínica');
    return this.#expedientes.abrirHoy(clinicaId, pacienteId);
  }
}

module.exports = ExpedienteService;
