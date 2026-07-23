const Tutor = require('../domain/Tutor');
const { NotFoundError } = require('../errors/ApiError');

/**
 * Servicio de tutores: reglas de negocio y orquestación.
 *
 * La baja es LÓGICA (estatus 'inactivo') para conservar el historial
 * clínico de sus pacientes; 'vetado' marca tutores a los que la clínica
 * decidió no dar servicio.
 */
class TutorService {
  #tutores;

  constructor({ tutorRepository }) {
    this.#tutores = tutorRepository;
  }

  listar(clinicaId) {
    return this.#tutores.listarPorClinica(clinicaId);
  }

  /** @returns {Promise<{id: number, codigo: string}>} */
  async crear(dto, clinicaId) {
    const tutor = Tutor.crear(dto);
    const codigo = TutorService.generarCodigo();
    const id = await this.#tutores.insert(clinicaId, {
      ...tutor.aDatosPersistencia(),
      codigo,
    });
    return { id, codigo };
  }

  async actualizar(id, dto, clinicaId) {
    const tutor = Tutor.crear(dto);
    const afectadas = await this.#tutores.updateById(id, clinicaId, tutor.aDatosPersistencia());
    if (afectadas === 0) throw new NotFoundError('Tutor no encontrado');
  }

  async darDeBaja(id, clinicaId) {
    const afectadas = await this.#tutores.updateById(id, clinicaId, {
      estatus: Tutor.ESTATUS.INACTIVO,
    });
    if (afectadas === 0) throw new NotFoundError('Tutor no encontrado.');
  }

  async vetar(id, clinicaId) {
    const afectadas = await this.#tutores.updateById(id, clinicaId, {
      estatus: Tutor.ESTATUS.VETADO,
      vetado: 1,
    });
    if (afectadas === 0) throw new NotFoundError('Tutor no encontrado.');
  }

  /** Código legible único por marca de tiempo: TUT-<epoch>-<aleatorio 4 dígitos>. */
  static generarCodigo() {
    return `TUT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
  }
}

module.exports = TutorService;
