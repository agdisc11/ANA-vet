#!/usr/bin/env node
/**
 * Aplica un archivo de migración SQL a la base de datos del .env.
 *
 *   Uso: node scripts/run-migration.js src/db/migrations/2026-07-20_create_cita.sql
 *
 * Ejecuta el archivo completo (multipleStatements) y termina.
 * Las migraciones deben ser idempotentes (CREATE TABLE IF NOT EXISTS, etc.).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const archivo = process.argv[2];
  if (!archivo) {
    console.error('Uso: node scripts/run-migration.js <ruta-al-archivo.sql>');
    process.exit(1);
  }
  const ruta = path.resolve(process.cwd(), archivo);
  const sql = fs.readFileSync(ruta, 'utf8');

  const conexion = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });

  try {
    await conexion.query(sql);
    console.log(`✔ Migración aplicada: ${path.basename(ruta)}`);
  } finally {
    await conexion.end();
  }
})().catch((err) => {
  console.error('✖ Error en migración:', err.message);
  process.exit(1);
});
