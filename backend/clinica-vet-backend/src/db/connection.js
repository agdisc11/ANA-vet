const mysql = require('mysql2');
require('dotenv').config();

/**
 * Pool de conexiones MySQL.
 *
 * Se exportan DOS interfaces sobre el MISMO pool:
 *   - `db`   → API de callbacks (legacy). La usan las rutas aún no migradas
 *              a la arquitectura en capas. NO usar en código nuevo.
 *   - `pool` → API de promesas (mysql2/promise). Úsala en código nuevo.
 *
 * Helpers:
 *   - `query(sql, params)`        → Promise<rows> (compatible con el helper anterior)
 *   - `withTransaction(trabajo)`  → ejecuta `trabajo({ query })` dentro de una
 *                                   transacción con commit/rollback/release automáticos.
 */
const db = mysql.createPool({
  host: process.env.DB_HOST,
  // Los MySQL gestionados (RDS, Railway, Aiven…) rara vez usan el 3306.
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const pool = db.promise();

async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/**
 * Ejecuta `trabajo` dentro de una transacción.
 * `trabajo` recibe { query } ligado a la conexión dedicada de la transacción.
 * Si `trabajo` lanza, se hace rollback y se re-lanza el error.
 *
 * @example
 * const reciboId = await withTransaction(async (tx) => {
 *   const r = await tx.query('INSERT INTO recibo ...', [...]);
 *   await tx.query('INSERT INTO recibo_item ...', [...]);
 *   return r.insertId;
 * });
 */
async function withTransaction(trabajo) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await trabajo({
      query: async (sql, params) => {
        const [rows] = await conexion.query(sql, params);
        return rows;
      },
    });
    await conexion.commit();
    return resultado;
  } catch (err) {
    await conexion.rollback();
    throw err;
  } finally {
    conexion.release();
  }
}

// Verificación de conectividad al arrancar (omitida en tests)
if (process.env.NODE_ENV !== 'test') {
  db.getConnection((err, connection) => {
    if (err) {
      console.error('Error conectando a MySQL:', err.message);
    } else {
      console.log('MySQL conectado');
      connection.release();
    }
  });
}

module.exports = { db, pool, query, withTransaction };
