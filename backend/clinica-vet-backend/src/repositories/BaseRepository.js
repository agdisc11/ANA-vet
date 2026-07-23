/**
 * Repositorio base con CRUD multi-tenant.
 *
 * TODOS los métodos exigen `clinicaId` como parámetro: es estructuralmente
 * imposible consultar o modificar datos de otra clínica por olvido
 * (antes el filtro `clinica_id = ?` se copiaba a mano en cada query).
 *
 * SOLID aplicado:
 *   - SRP: esta clase solo sabe de persistencia genérica.
 *   - OCP/Liskov: los repositorios concretos extienden sin modificar la base.
 *   - DIP: recibe `query` inyectado (los tests usan una función fake, sin MySQL).
 *
 * Seguridad: los nombres de tabla y columnas provienen EXCLUSIVAMENTE de la
 * lista blanca definida en código por cada repositorio concreto — nunca de la
 * entrada del usuario — por lo que interpolarlos en el SQL es seguro.
 * Los VALORES siempre viajan como placeholders (?).
 */
class BaseRepository {
  #query;
  #tabla;
  #columnas;

  /**
   * @param {object} deps
   * @param {(sql: string, params?: any[]) => Promise<any>} deps.query
   * @param {string} deps.tabla — nombre de la tabla (definido en código)
   * @param {string[]} deps.columnas — columnas escribibles permitidas
   */
  constructor({ query, tabla, columnas = [] }) {
    if (typeof query !== 'function') throw new Error('BaseRepository requiere una función query');
    if (!tabla) throw new Error('BaseRepository requiere un nombre de tabla');
    this.#query = query;
    this.#tabla = tabla;
    this.#columnas = new Set(columnas);
  }

  /** Acceso para subclases (lectura solamente). */
  get query() { return this.#query; }
  get tabla() { return this.#tabla; }

  /** Descarta cualquier clave que no esté en la lista blanca de columnas. */
  #filtrarColumnas(data) {
    const filtrado = {};
    for (const [columna, valor] of Object.entries(data)) {
      if (this.#columnas.has(columna)) filtrado[columna] = valor;
    }
    return filtrado;
  }

  async findById(id, clinicaId) {
    const rows = await this.#query(
      `SELECT * FROM ${this.#tabla} WHERE id = ? AND clinica_id = ?`,
      [id, clinicaId]
    );
    return rows[0] ?? null;
  }

  async existeEnClinica(id, clinicaId) {
    const rows = await this.#query(
      `SELECT id FROM ${this.#tabla} WHERE id = ? AND clinica_id = ? LIMIT 1`,
      [id, clinicaId]
    );
    return rows.length > 0;
  }

  /** @returns {Promise<number>} id insertado */
  async insert(clinicaId, data) {
    const filtrado = this.#filtrarColumnas(data);
    const columnas = Object.keys(filtrado);
    const sql = `INSERT INTO ${this.#tabla} (clinica_id${columnas.length ? ', ' + columnas.join(', ') : ''})
                 VALUES (?${', ?'.repeat(columnas.length)})`;
    const result = await this.#query(sql, [clinicaId, ...columnas.map((c) => filtrado[c])]);
    return result.insertId;
  }

  /** @returns {Promise<number>} filas afectadas (0 si no existe en esa clínica) */
  async updateById(id, clinicaId, data) {
    const filtrado = this.#filtrarColumnas(data);
    const columnas = Object.keys(filtrado);
    if (columnas.length === 0) return 0;
    const sql = `UPDATE ${this.#tabla}
                 SET ${columnas.map((c) => `${c} = ?`).join(', ')}
                 WHERE id = ? AND clinica_id = ?`;
    const result = await this.#query(sql, [...columnas.map((c) => filtrado[c]), id, clinicaId]);
    return result.affectedRows;
  }

  /** @returns {Promise<number>} filas afectadas (0 si no existe en esa clínica) */
  async deleteById(id, clinicaId) {
    const result = await this.#query(
      `DELETE FROM ${this.#tabla} WHERE id = ? AND clinica_id = ?`,
      [id, clinicaId]
    );
    return result.affectedRows;
  }
}

module.exports = BaseRepository;
