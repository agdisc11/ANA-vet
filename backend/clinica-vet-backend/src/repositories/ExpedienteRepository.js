const BaseRepository = require('./BaseRepository');

/**
 * Repositorio de expedientes clínicos.
 * La tabla `expediente` sí tiene clinica_id en el esquema vivo,
 * así que hereda el CRUD multi-tenant de BaseRepository.
 */
class ExpedienteRepository extends BaseRepository {
  constructor({ query }) {
    super({
      query,
      tabla: 'expediente',
      columnas: ['paciente_id', 'fecha_apertura'],
    });
  }

  listarPorPaciente(pacienteId, clinicaId) {
    return this.query(
      'SELECT * FROM expediente WHERE paciente_id = ? AND clinica_id = ? ORDER BY fecha_apertura DESC',
      [pacienteId, clinicaId]
    );
  }

  /** Abre un expediente con fecha de hoy. @returns {Promise<number>} id */
  async abrirHoy(clinicaId, pacienteId) {
    const resultado = await this.query(
      'INSERT INTO expediente (paciente_id, clinica_id, fecha_apertura) VALUES (?, ?, CURDATE())',
      [pacienteId, clinicaId]
    );
    return resultado.insertId;
  }
}

module.exports = ExpedienteRepository;
