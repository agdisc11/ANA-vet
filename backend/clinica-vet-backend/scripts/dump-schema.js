#!/usr/bin/env node
/**
 * Genera `src/db/schema.sql` y `src/db/seed-catalogos.sql` a partir de la
 * base de datos VIVA (la que apunta el .env).
 *
 * Por qué existe: el archivo "Base de datos/253582.sql" es el documento de
 * DISEÑO y no coincide con el esquema real (tablas en singular, tablas
 * satélite que hoy son columnas de `paciente`). Sin este script no hay
 * forma de recrear la base en otro servidor.
 *
 * Uso:
 *   node scripts/dump-schema.js
 *
 * El seed incluye solo los catálogos GLOBALES (medicamentos y
 * toxicología). Los datos de cada clínica NO se exportan: son de negocio
 * y contienen hashes de contraseñas.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { query } = require('../src/db/connection');

const DESTINO = path.join(__dirname, '..', 'src', 'db');
const CATALOGOS_GLOBALES = ['catalogo_medicamentos', 'catalogo_toxicologia'];

/** Convierte un valor de MySQL en un literal SQL seguro. */
function literal(valor) {
  if (valor === null || valor === undefined) return 'NULL';
  if (typeof valor === 'number') return String(valor);
  if (typeof valor === 'boolean') return valor ? '1' : '0';
  if (valor instanceof Date) return `'${valor.toISOString().slice(0, 19).replace('T', ' ')}'`;

  const texto = Buffer.isBuffer(valor) ? valor.toString('utf8') : String(valor);
  const escapes = {
    '\0': '\\0',
    '\n': '\\n',
    '\r': '\\r',
    '\b': '\\b',
    '\t': '\\t',
    '\x1a': '\\Z',
    "'": "\\'",
    '"': '\\"',
    '\\': '\\\\',
  };
  return `'${texto.replace(/[\0\n\r\b\t\x1a'"\\]/g, (c) => escapes[c])}'`;
}

const regla = (etiqueta, ancho = 56) =>
  `-- ── ${etiqueta} ${'─'.repeat(Math.max(1, ancho - etiqueta.length))}`;

async function generarEsquema(tablas) {
  const lineas = [
    '-- Esquema de ANA-vet — GENERADO desde la base de datos viva.',
    '-- No editar a mano: regenerar con `node scripts/dump-schema.js`.',
    '--',
    '-- OJO: "Base de datos/253582.sql" es el documento de DISEÑO y NO',
    '-- coincide con este esquema. Para desplegar usa SIEMPRE este archivo.',
    '--',
    '--   mysql -u USUARIO -p clinica_veterinaria < src/db/schema.sql',
    '',
    'SET NAMES utf8mb4;',
    '-- Las FK se desactivan durante la carga para no depender del orden',
    '-- alfabético de las tablas.',
    'SET FOREIGN_KEY_CHECKS = 0;',
    '',
  ];

  for (const tabla of tablas) {
    const [fila] = await query(`SHOW CREATE TABLE \`${tabla}\``);
    const ddl = fila['Create Table']
      .replace(/^CREATE TABLE /, 'CREATE TABLE IF NOT EXISTS ')
      .replace(/ AUTO_INCREMENT=\d+/, '');
    lineas.push(regla(tabla), `${ddl};`, '');
  }

  lineas.push('SET FOREIGN_KEY_CHECKS = 1;', '');
  fs.writeFileSync(path.join(DESTINO, 'schema.sql'), lineas.join('\n'), 'utf8');
  return tablas.length;
}

async function generarSeed() {
  const lineas = [
    '-- Datos de referencia GLOBALES de ANA-vet (no son de ninguna clínica).',
    '-- Los consumen las calculadoras de Farmacia y Toxicología: sin esto',
    '-- esas pantallas salen vacías.',
    '--',
    '-- Cargar DESPUÉS de schema.sql:',
    '--   mysql -u USUARIO -p clinica_veterinaria < src/db/seed-catalogos.sql',
    '',
    'SET NAMES utf8mb4;',
    '',
  ];

  let total = 0;
  for (const tabla of CATALOGOS_GLOBALES) {
    const filas = await query(`SELECT * FROM \`${tabla}\` ORDER BY id`);
    if (filas.length === 0) {
      lineas.push(`-- ${tabla}: sin filas en el origen`, '');
      continue;
    }
    total += filas.length;
    const columnas = Object.keys(filas[0]);
    const valores = filas.map(
      (fila) => `  (${columnas.map((c) => literal(fila[c])).join(', ')})`
    );
    lineas.push(
      regla(`${tabla} (${filas.length} filas)`),
      // Idempotente: recargar el seed no duplica ni rompe por PK repetida.
      `INSERT IGNORE INTO \`${tabla}\` (${columnas.map((c) => `\`${c}\``).join(', ')}) VALUES`,
      `${valores.join(',\n')};`,
      ''
    );
  }

  fs.writeFileSync(path.join(DESTINO, 'seed-catalogos.sql'), lineas.join('\n'), 'utf8');
  return total;
}

(async () => {
  const filas = await query('SHOW TABLES');
  const tablas = filas.map((f) => Object.values(f)[0]).sort();

  const nTablas = await generarEsquema(tablas);
  const nFilas = await generarSeed();

  console.log(`✓ src/db/schema.sql          → ${nTablas} tablas`);
  console.log(`✓ src/db/seed-catalogos.sql  → ${nFilas} filas de catálogo`);
  process.exit(0);
})().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
