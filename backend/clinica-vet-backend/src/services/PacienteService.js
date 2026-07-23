const Paciente = require('../domain/Paciente');
const { NotFoundError, ValidationError } = require('../errors/ApiError');

/**
 * Servicio de pacientes: reglas de negocio y orquestación.
 *
 * SOLID aplicado:
 *   - SRP: no sabe de HTTP (eso es del controlador) ni de SQL (repositorios).
 *   - DIP: depende de abstracciones inyectadas; en tests se pasan fakes.
 *
 * Mejora de seguridad sobre la versión anterior: `crear` y `reasignarTutor`
 * verifican que el tutor pertenezca a la clínica autenticada (antes se
 * aceptaba cualquier tutor_id, incluso de otra clínica).
 */
class PacienteService {
  #pacientes;
  #tutores;

  constructor({ pacienteRepository, tutorRepository }) {
    this.#pacientes = pacienteRepository;
    this.#tutores = tutorRepository;
  }

  listar(clinicaId, opciones = {}) {
    return this.#pacientes.listarPorClinica(clinicaId, opciones);
  }

  async obtener(id, clinicaId) {
    const paciente = await this.#pacientes.obtenerPorId(id, clinicaId);
    if (!paciente) throw new NotFoundError('Paciente no encontrado');
    return paciente;
  }

  /** @returns {Promise<number>} id del paciente creado */
  async crear(dto, clinicaId) {
    await this.#verificarTutor(dto.tutor_id, clinicaId);
    const paciente = Paciente.crear(dto);
    return this.#pacientes.insert(clinicaId, {
      tutor_id: dto.tutor_id,
      ...paciente.aDatosPersistencia(),
    });
  }

  async actualizar(id, dto, clinicaId) {
    const paciente = Paciente.crear(dto);
    const afectadas = await this.#pacientes.updateById(id, clinicaId, paciente.aDatosPersistencia());
    if (afectadas === 0) throw new NotFoundError('Paciente no encontrado');
  }

  async reasignarTutor(id, nuevoTutorId, clinicaId) {
    await this.#verificarTutor(nuevoTutorId, clinicaId);
    const afectadas = await this.#pacientes.updateById(id, clinicaId, { tutor_id: nuevoTutorId });
    if (afectadas === 0) throw new NotFoundError('Paciente no encontrado');
  }

  async eliminar(id, clinicaId) {
    const afectadas = await this.#pacientes.deleteById(id, clinicaId);
    if (afectadas === 0) throw new NotFoundError('Paciente no encontrado');
  }

  async #verificarTutor(tutorId, clinicaId) {
    const existe = await this.#tutores.existeEnClinica(tutorId, clinicaId);
    if (!existe) throw new ValidationError('El tutor indicado no existe en esta clínica');
  }
}

module.exports = PacienteService;
