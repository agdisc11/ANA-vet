const Cita = require('../domain/Cita');
const { NotFoundError, ValidationError, ConflictError } = require('../errors/ApiError');

/**
 * Servicio de la Agenda de citas.
 *
 * Reglas que garantiza:
 *   - Multi-tenant: paciente y veterinario deben pertenecer a la clínica.
 *   - Sin traslapes: un veterinario no puede tener dos citas activas
 *     que se crucen en horario (409 con el detalle del choque).
 *   - Ciclo de vida: las transiciones de estado las valida la entidad
 *     Cita (máquina de estados); aquí solo se orquesta.
 */
class CitaService {
  #citas;
  #pacientes;
  #empleados;

  constructor({ citaRepository, pacienteRepository, empleadoRepository }) {
    this.#citas = citaRepository;
    this.#pacientes = pacienteRepository;
    this.#empleados = empleadoRepository;
  }

  listar(clinicaId, filtros) {
    return this.#citas.listarPorRango(clinicaId, filtros);
  }

  async obtener(id, clinicaId) {
    const fila = await this.#citas.obtenerPorId(id, clinicaId);
    if (!fila) throw new NotFoundError('Cita no encontrada');
    return fila;
  }

  /** @returns {Promise<number>} id de la cita agendada */
  async agendar(dto, clinicaId) {
    await this.#verificarPaciente(dto.paciente_id, clinicaId);
    await this.#verificarEmpleado(dto.empleado_id, clinicaId);

    const cita = Cita.crear(dto);
    await this.#verificarSinTraslape(cita, clinicaId, null);

    return this.#citas.insert(clinicaId, cita.aDatosPersistencia());
  }

  async reagendar(id, dto, clinicaId) {
    const existente = Cita.desdeFila(await this.obtener(id, clinicaId));
    if (!existente.puedeEditarse()) {
      throw new ValidationError(
        `No se puede modificar una cita en estado "${existente.estado}"; reactívala o agenda una nueva`
      );
    }

    await this.#verificarPaciente(dto.paciente_id, clinicaId);
    await this.#verificarEmpleado(dto.empleado_id, clinicaId);

    // La entidad valida los nuevos datos (Cita.crear); se conserva el estado actual
    const nuevosDatos = Cita.crear(dto).aDatosPersistencia();
    const actualizada = new Cita({ ...nuevosDatos, estado: existente.estado });
    await this.#verificarSinTraslape(actualizada, clinicaId, id);

    await this.#citas.updateById(id, clinicaId, actualizada.aDatosPersistencia());
  }

  async cambiarEstado(id, nuevoEstado, clinicaId) {
    const existente = Cita.desdeFila(await this.obtener(id, clinicaId));
    const transicionada = existente.transicionarA(nuevoEstado); // lanza si es inválida
    await this.#citas.updateById(id, clinicaId, { estado: transicionada.estado });
    return transicionada.estado;
  }

  async eliminar(id, clinicaId) {
    const existente = Cita.desdeFila(await this.obtener(id, clinicaId));
    if (existente.estado === Cita.ESTADOS.ATENDIDA) {
      throw new ConflictError('No se puede eliminar una cita atendida: forma parte del historial. Puedes filtrarla en la vista.');
    }
    await this.#citas.deleteById(id, clinicaId);
  }

  async #verificarPaciente(pacienteId, clinicaId) {
    const existe = await this.#pacientes.existeEnClinica(pacienteId, clinicaId);
    if (!existe) throw new ValidationError('El paciente indicado no existe en esta clínica');
  }

  async #verificarEmpleado(empleadoId, clinicaId) {
    if (empleadoId === null || empleadoId === undefined) return;
    const existe = await this.#empleados.existeEnClinica(empleadoId, clinicaId);
    if (!existe) throw new ValidationError('El veterinario indicado no existe en esta clínica');
  }

  async #verificarSinTraslape(cita, clinicaId, excluirId) {
    if (!cita.empleadoId) return; // sin veterinario asignado no hay agenda que chocar
    const choque = await this.#citas.buscarTraslape(clinicaId, {
      empleadoId: cita.empleadoId,
      fecha: cita.fecha,
      horaInicio: cita.horaInicio,
      horaFin: cita.horaFin,
      excluirId,
    });
    if (choque) {
      const hora = String(choque.hora_inicio).slice(0, 5);
      throw new ConflictError(
        `El veterinario ya tiene una cita a las ${hora} con ${choque.paciente_nombre}. Elige otro horario.`
      );
    }
  }
}

module.exports = CitaService;
