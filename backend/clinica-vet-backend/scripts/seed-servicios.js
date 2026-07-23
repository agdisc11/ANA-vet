#!/usr/bin/env node
/**
 * Carga el catálogo de servicios estándar en una clínica ya registrada.
 *
 * Registrar una clínica siembra sus roles, pero NO su `servicio_catalogo`
 * (ver ClinicaRepository.registrar). Como no hay pantalla para darlos de
 * alta, una clínica recién creada no puede facturar nada: este script
 * llena ese hueco para las demos.
 *
 * Uso:
 *   node scripts/seed-servicios.js demo@anavet.local
 *
 * Es idempotente: no duplica un servicio que ya exista con el mismo
 * nombre en esa clínica.
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { query } = require('../src/db/connection');

const SERVICIOS = path.join(__dirname, '..', 'src', 'db', 'servicios-estandar.json');

(async () => {
  const email = process.argv[2];
  if (!email) {
    console.error('Falta el email de la clínica.\n  node scripts/seed-servicios.js demo@anavet.local');
    process.exit(1);
  }

  const clinicas = await query('SELECT id, nombre FROM clinicas WHERE email = ?', [email]);
  if (clinicas.length === 0) {
    console.error(`No existe ninguna clínica con el email "${email}".`);
    console.error('Regístrala primero en la app (/registro) y vuelve a ejecutar esto.');
    process.exit(1);
  }
  const { id: clinicaId, nombre } = clinicas[0];

  const servicios = JSON.parse(fs.readFileSync(SERVICIOS, 'utf8'));
  const existentes = await query(
    'SELECT nombre FROM servicio_catalogo WHERE clinica_id = ?',
    [clinicaId]
  );
  const yaEstan = new Set(existentes.map((s) => s.nombre));
  const nuevos = servicios.filter((s) => !yaEstan.has(s.nombre));

  if (nuevos.length === 0) {
    console.log(`"${nombre}" ya tiene los ${servicios.length} servicios. Nada que hacer.`);
    process.exit(0);
  }

  await query(
    'INSERT INTO servicio_catalogo (clinica_id, categoria, nombre, precio, activo) VALUES ?',
    [nuevos.map((s) => [clinicaId, s.categoria, s.nombre, s.precio, s.activo])]
  );

  console.log(`✓ ${nuevos.length} servicios añadidos a "${nombre}" (clinica_id ${clinicaId})`);
  if (nuevos.length < servicios.length) {
    console.log(`  (${servicios.length - nuevos.length} ya existían)`);
  }
  process.exit(0);
})().catch((err) => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
