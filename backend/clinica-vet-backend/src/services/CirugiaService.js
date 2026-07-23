const { NotFoundError } = require('../errors/ApiError');

/**
 * Servicio de cirugías y su anestesia asociada.
 *
 * Blindaje nuevo en anestesia: la versión anterior insertaba contra
 * cualquier cirugia_id sin verificar la clínica — cualquier tenant podía
 * adjuntar registros de anestesia a cirugías ajenas. Ahora se verifica
 * la pertenencia vía expediente.
 */
class CirugiaService {
  #cirugias;
  #expedientes;

  constructor({ cirugiaRepository, expedienteRepository }) {
    this.#cirugias = cirugiaRepository;
    this.#expedientes = expedienteRepository;
  }

  listarTodas(clinicaId) {
    return this.#cirugias.listarPorClinica(clinicaId);
  }

  listarPorExpediente(expedienteId, clinicaId) {
    return this.#cirugias.listarPorExpediente(expedienteId, clinicaId);
  }

  /** @returns {Promise<number>} id de la cirugía registrada */
  async registrar(dto, clinicaId) {
    const expedienteValido = await this.#expedientes.existeEnClinica(dto.expediente_id, clinicaId);
    if (!expedienteValido) {
      throw new NotFoundError('Expediente no encontrado o no pertenece a esta clínica');
    }
    const { empleados_ids: empleadosIds, ...datos } = dto;
    return this.#cirugias.crearConEmpleados(clinicaId, datos, empleadosIds);
  }

  /** @returns {Promise<number>} id de la anestesia registrada */
  async registrarAnestesia(dto, clinicaId) {
    const cirugiaValida = await this.#cirugias.existeEnClinica(dto.cirugia_id, clinicaId);
    if (!cirugiaValida) {
      throw new NotFoundError(`La cirugía con id ${dto.cirugia_id} no existe`);
    }
    return this.#cirugias.crearAnestesia(dto);
  }
}

module.exports = CirugiaService;
