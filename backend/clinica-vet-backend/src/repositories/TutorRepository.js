const BaseRepository = require('./BaseRepository');

/**
 * Repositorio de tutores (propietarios).
 * Único lugar del sistema con SQL de la tabla `tutor`.
 */
class TutorRepository extends BaseRepository {
  constructor({ query }) {
    super({
      query,
      tabla: 'tutor',
      columnas: [
        'nombre', 'apellidos', 'telefono', 'whatsapp',
        'correo', 'direccion', 'codigo', 'estatus', 'vetado',
      ],
    });
  }

  /** Listado con las columnas que consume el frontend (contrato legacy). */
  async listarPorClinica(clinicaId) {
    return this.query(
      `SELECT id, nombre, apellidos, telefono, whatsapp, correo, direccion, codigo, estatus
       FROM tutor WHERE clinica_id = ? ORDER BY nombre`,
      [clinicaId]
    );
  }

  /**
   * Búsqueda para el command palette (Ctrl+K): pocas columnas, pocas filas.
   *
   * Busca por nombre completo, teléfono/WhatsApp, correo y código: en
   * recepción es habitual identificar al tutor por su número antes que
   * por su nombre. El conteo de pacientes va en la misma consulta para
   * poder mostrar "3 pacientes" sin un viaje extra a la BD.
   *
   * @param {number} clinicaId
   * @param {string} patron — patrón LIKE ya escapado (Busqueda#patronLike)
   * @param {number} limite
   */
  async buscarGlobal(clinicaId, patron, limite) {
    return this.query(
      `SELECT t.id, t.nombre, t.apellidos, t.telefono, t.whatsapp, t.correo,
              t.codigo, t.estatus,
              (SELECT COUNT(*) FROM paciente p
                WHERE p.tutor_id = t.id AND p.clinica_id = t.clinica_id) AS pacientes
       FROM tutor t
       WHERE t.clinica_id = ?
         AND (CONCAT(t.nombre, ' ', COALESCE(t.apellidos, '')) LIKE ?
              OR t.telefono LIKE ?
              OR t.whatsapp LIKE ?
              OR t.correo LIKE ?
              OR t.codigo LIKE ?)
       ORDER BY t.nombre
       LIMIT ?`,
      [clinicaId, patron, patron, patron, patron, patron, limite]
    );
  }
}

module.exports = TutorRepository;
