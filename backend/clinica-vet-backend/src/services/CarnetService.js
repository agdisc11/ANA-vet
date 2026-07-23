const crypto = require('crypto');
const { NotFoundError } = require('../errors/ApiError');

/**
 * Servicio del carnet de vacunación público (Fase 3.5).
 *
 * El token es aleatorio de 128 bits (32 hex): no es adivinable ni
 * derivable del id del paciente. Regenerarlo revoca el enlace anterior.
 */
class CarnetService {
  #carnets;
  #pacientes;

  constructor({ carnetRepository, pacienteRepository }) {
    this.#carnets = carnetRepository;
    this.#pacientes = pacienteRepository;
  }

  static generarToken() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Devuelve el token del paciente, creándolo la primera vez.
   * @returns {Promise<{token: string, nuevo: boolean}>}
   */
  async obtenerOCrearToken(pacienteId, clinicaId) {
    const existe = await this.#pacientes.existeEnClinica(pacienteId, clinicaId);
    if (!existe) throw new NotFoundError('Paciente no encontrado');

    const actual = await this.#carnets.obtenerToken(pacienteId, clinicaId);
    if (actual) return { token: actual, nuevo: false };

    const token = CarnetService.generarToken();
    await this.#carnets.guardarToken(pacienteId, clinicaId, token);
    return { token, nuevo: true };
  }

  /** Genera un token nuevo, invalidando el enlace anterior. */
  async regenerarToken(pacienteId, clinicaId) {
    const existe = await this.#pacientes.existeEnClinica(pacienteId, clinicaId);
    if (!existe) throw new NotFoundError('Paciente no encontrado');

    const token = CarnetService.generarToken();
    await this.#carnets.guardarToken(pacienteId, clinicaId, token);
    return { token, nuevo: true };
  }

  /** Carnet público a partir del token (sin sesión). */
  async carnetPorToken(token) {
    if (!token || !/^[a-f0-9]{32}$/i.test(String(token))) {
      throw new NotFoundError('Carnet no encontrado');
    }
    const paciente = await this.#carnets.obtenerPorToken(token);
    if (!paciente) throw new NotFoundError('Carnet no encontrado');

    const vacunas = await this.#carnets.vacunasDePaciente(paciente.id);

    return {
      paciente: {
        nombre: paciente.nombre,
        especie: paciente.especie,
        raza: paciente.raza,
        sexo: paciente.sexo,
        edad: paciente.edad,
        microchip: paciente.microchip,
      },
      clinica: {
        nombre: paciente.clinica_nombre,
        telefono: paciente.clinica_telefono,
        direccion: paciente.clinica_direccion,
      },
      vacunas,
      generado_en: new Date().toISOString(),
    };
  }
}

module.exports = CarnetService;
