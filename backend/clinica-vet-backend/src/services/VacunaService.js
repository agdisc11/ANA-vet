const { NotFoundError } = require('../errors/ApiError');

/**
 * Servicio de vacunas.
 */
class VacunaService {
  #vacunas;
  #pacientes;

  constructor({ vacunaRepository, pacienteRepository }) {
    this.#vacunas = vacunaRepository;
    this.#pacientes = pacienteRepository;
  }

  listarTodas(clinicaId) {
    return this.#vacunas.listarPorClinica(clinicaId);
  }

  listarPorPaciente(pacienteId, clinicaId) {
    return this.#vacunas.listarPorPaciente(pacienteId, clinicaId);
  }

  /** @returns {Promise<number>} id de la vacuna registrada */
  async registrar(dto, clinicaId) {
    const pacienteValido = await this.#pacientes.existeEnClinica(dto.paciente_id, clinicaId);
    if (!pacienteValido) {
      throw new NotFoundError('Paciente no encontrado o no pertenece a esta clínica');
    }
    return this.#vacunas.crear(dto);
  }
}

module.exports = VacunaService;
