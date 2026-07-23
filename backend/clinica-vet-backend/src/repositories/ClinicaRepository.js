/**
 * Repositorio de clínicas (el TENANT del sistema).
 *
 * No extiende BaseRepository a propósito: aquella clase impone el filtro
 * multi-tenant `clinica_id`, y la tabla `clinicas` ES el tenant — sus
 * consultas van por `id` propio o por email global.
 */
class ClinicaRepository {
  #query;
  #withTransaction;

  constructor({ query, withTransaction }) {
    this.#query = query;
    this.#withTransaction = withTransaction;
  }

  /** Fila completa (incluye password_hash) para autenticación, o null. */
  async buscarPorEmail(email) {
    const rows = await this.#query('SELECT * FROM clinicas WHERE email = ?', [email]);
    return rows[0] ?? null;
  }

  async existeEmail(email) {
    const rows = await this.#query('SELECT id FROM clinicas WHERE email = ? LIMIT 1', [email]);
    return rows.length > 0;
  }

  /**
   * Alta transaccional del tenant: clínica + sus roles por defecto.
   * @returns {Promise<number>} id de la clínica creada
   */
  async crearConRoles(datosClinica, passwordHash, rolesDefault) {
    return this.#withTransaction(async (tx) => {
      const resultado = await tx.query(
        'INSERT INTO clinicas (nombre, email, password_hash, telefono, direccion) VALUES (?, ?, ?, ?, ?)',
        [
          datosClinica.nombre,
          datosClinica.email,
          passwordHash,
          datosClinica.telefono,
          datosClinica.direccion,
        ]
      );
      const clinicaId = resultado.insertId;

      const filasRoles = rolesDefault.map((rol) => [clinicaId, rol.nombre, rol.descripcion]);
      await tx.query('INSERT INTO roles (clinica_id, nombre, descripcion) VALUES ?', [filasRoles]);

      return clinicaId;
    });
  }

  /** Perfil público (sin password_hash), o null. */
  async obtenerPerfil(id) {
    const rows = await this.#query(
      'SELECT id, nombre, email, telefono, direccion, logo_url, activa, created_at FROM clinicas WHERE id = ?',
      [id]
    );
    return rows[0] ?? null;
  }

  /** Actualización parcial estilo COALESCE (null conserva el valor actual). */
  async actualizarPerfil(id, campos) {
    await this.#query(
      `UPDATE clinicas SET
         nombre    = COALESCE(?, nombre),
         telefono  = COALESCE(?, telefono),
         direccion = COALESCE(?, direccion),
         logo_url  = COALESCE(?, logo_url)
       WHERE id = ?`,
      [campos.nombre ?? null, campos.telefono ?? null, campos.direccion ?? null, campos.logo_url ?? null, id]
    );
  }

  async obtenerPasswordHash(id) {
    const rows = await this.#query('SELECT password_hash FROM clinicas WHERE id = ?', [id]);
    return rows[0]?.password_hash ?? null;
  }

  async actualizarPassword(id, passwordHash) {
    await this.#query('UPDATE clinicas SET password_hash = ? WHERE id = ?', [passwordHash, id]);
  }
}

module.exports = ClinicaRepository;
