#!/usr/bin/env node
/**
 * Puebla una clínica con datos realistas **a través de la API HTTP**.
 *
 * A diferencia de un INSERT directo, esto ejerce el sistema completo
 * (validación Zod → servicios → reglas de negocio → BD), así que además
 * de dejar datos para la demo sirve de prueba de humo de punta a punta.
 *
 * Uso (local):
 *   node scripts/seed-demo.js
 *
 * Uso (contra el despliegue de AWS):
 *   API_BASE=http://LA-IP/api \
 *   CLINICA_EMAIL=correo@dominio.com CLINICA_PASSWORD=... \
 *   node scripts/seed-demo.js
 *
 * Variables:
 *   API_BASE          base de la API           (def. http://localhost:4000/api)
 *   CLINICA_NOMBRE    nombre de la clínica      (def. Clínica Veterinaria Patas & Bigotes)
 *   CLINICA_EMAIL     correo admin              (def. demo@anavet.local)
 *   CLINICA_PASSWORD  contraseña admin          (def. DemoAnaVet2026!)
 *   EMP_PASSWORD      contraseña de los empleados demo (def. Demo2026!)
 *   FORCE=1           siembra aunque ya haya datos (por defecto se aborta)
 *
 * Idempotencia: si la clínica ya tiene tutores, se aborta para no duplicar
 * (salvo FORCE=1). Registrar una clínica que ya existe no es un error: se
 * continúa e inicia sesión.
 */

const API_BASE = process.env.API_BASE || 'http://localhost:4000/api';
const CLINICA_NOMBRE = process.env.CLINICA_NOMBRE || 'Clínica Veterinaria Patas & Bigotes';
const CLINICA_EMAIL = process.env.CLINICA_EMAIL || 'demo@anavet.local';
const CLINICA_PASSWORD = process.env.CLINICA_PASSWORD || 'DemoAnaVet2026!';
const EMP_PASSWORD = process.env.EMP_PASSWORD || 'Demo2026!';
const FORCE = process.env.FORCE === '1';

let token = null;

async function api(method, path, body) {
  const res = await fetch(API_BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const texto = await res.text();
  let datos;
  try { datos = texto ? JSON.parse(texto) : null; } catch { datos = texto; }
  if (!res.ok) {
    const err = new Error(`${method} ${path} → ${res.status}: ${datos?.error ?? texto}`);
    err.status = res.status;
    err.datos = datos;
    throw err;
  }
  return datos;
}

const log = (msg) => console.log(msg);
const paso = (msg) => console.log(`\n▶ ${msg}`);

// ── Datos de referencia (contexto: veterinaria en México) ─────

const EMPLEADOS = [
  { nombre: 'Ana Sofía',       apellidos: 'Torres Delgado',  rol: 'Administrador', tel: '5544101020' },
  { nombre: 'María Fernanda',  apellidos: 'Gómez Ríos',      rol: 'Veterinario',   tel: '5544101021' },
  { nombre: 'Roberto Carlos',  apellidos: 'Núñez Vega',      rol: 'Veterinario',   tel: '5544101022' },
  { nombre: 'Laura Patricia',  apellidos: 'Méndez Soto',     rol: 'Recepcionista', tel: '5544101023' },
  { nombre: 'Jorge Alberto',   apellidos: 'Ramírez Luna',    rol: 'Auxiliar',      tel: '5544101024' },
];

const TUTORES = [
  { nombre: 'Carlos',   apellidos: 'Mendoza Herrera', telefono: '5512345678', whatsapp: '5512345678', correo: 'carlos.mendoza@gmail.com',   direccion: 'Av. Insurgentes Sur 1234, Del Valle, CDMX' },
  { nombre: 'Gabriela', apellidos: 'Ruiz Fuentes',    telefono: '5523456789', whatsapp: '5523456789', correo: 'gaby.ruiz@hotmail.com',       direccion: 'Calle Durango 55, Roma Norte, CDMX' },
  { nombre: 'Fernando', apellidos: 'Castillo Ramos',  telefono: '5534567890', whatsapp: '5534567890', correo: 'fer.castillo@outlook.com',    direccion: 'Av. Universidad 890, Coyoacán, CDMX' },
  { nombre: 'Diana',    apellidos: 'Vázquez León',    telefono: '5545678901', whatsapp: '5545678901', correo: 'diana.vazquez@gmail.com',     direccion: 'Blvd. Adolfo López Mateos 300, Álvaro Obregón, CDMX' },
  { nombre: 'Miguel',   apellidos: 'Herrera Ponce',   telefono: '5556789012', whatsapp: '5556789012', correo: 'miguel.herrera@gmail.com',    direccion: 'Calle Ámsterdam 210, Condesa, CDMX' },
  { nombre: 'Patricia', apellidos: 'Solís Márquez',   telefono: '5567890123', whatsapp: '5567890123', correo: 'paty.solis@yahoo.com',        direccion: 'Av. Río Churubusco 45, Iztacalco, CDMX' },
];

// idxTutor referencia la posición en TUTORES (se traduce a id tras crearlos)
const PACIENTES = [
  { idxTutor: 0, nombre: 'Firulais', especie: 'Perro', raza: 'Labrador',        sexo: 'Macho',  fecha_nacimiento: '2021-03-15', esquemas_preventivos: 'Completo', microchip: '900008000123456' },
  { idxTutor: 0, nombre: 'Luna',     especie: 'Gato',  raza: 'Siamés',          sexo: 'Hembra', fecha_nacimiento: '2022-07-01', esquemas_preventivos: 'Completo' },
  { idxTutor: 1, nombre: 'Max',      especie: 'Perro', raza: 'Pastor Alemán',   sexo: 'Macho',  fecha_nacimiento: '2019-11-20', esquemas_preventivos: 'Completo', microchip: '900008000654321' },
  { idxTutor: 1, nombre: 'Michi',    especie: 'Gato',  raza: 'Persa',           sexo: 'Hembra', fecha_nacimiento: '2023-01-10', esquemas_preventivos: 'Incompleto' },
  { idxTutor: 2, nombre: 'Rocky',    especie: 'Perro', raza: 'Bulldog Francés', sexo: 'Macho',  fecha_nacimiento: '2020-05-30', esquemas_preventivos: 'Completo' },
  { idxTutor: 2, nombre: 'Nina',     especie: 'Perro', raza: 'Chihuahua',       sexo: 'Hembra', fecha_nacimiento: '2021-09-12', esquemas_preventivos: 'Completo' },
  { idxTutor: 3, nombre: 'Simba',    especie: 'Gato',  raza: 'Maine Coon',      sexo: 'Macho',  fecha_nacimiento: '2020-12-05', esquemas_preventivos: 'Completo', microchip: '900008000777888' },
  { idxTutor: 4, nombre: 'Toby',     especie: 'Perro', raza: 'Beagle',          sexo: 'Macho',  fecha_nacimiento: '2022-02-18', esquemas_preventivos: 'Incompleto' },
  { idxTutor: 4, nombre: 'Pelusa',   especie: 'Gato',  raza: 'Angora',          sexo: 'Hembra', fecha_nacimiento: '2023-06-25', esquemas_preventivos: 'Incompleto' },
  { idxTutor: 5, nombre: 'Coco',     especie: 'Ave',   raza: 'Perico',          sexo: 'Hembra', fecha_nacimiento: '2024-01-08', esquemas_preventivos: 'No aplica' },
];

// idxPaciente referencia PACIENTES; idxVet referencia los empleados con rol Veterinario
const CONSULTAS = [
  { idxPaciente: 0, idxVet: 0, fecha: '2026-06-10', motivo: 'Chequeo general y desparasitación',
    anamnesis: 'Paciente activo, apetito normal. Tutor reporta última desparasitación hace 4 meses.',
    examen_fisico: 'FC 90 lpm, FR 24 rpm, T° 38.5 °C, mucosas rosadas, TLLC < 2s. Peso 28.4 kg. Condición corporal 3/5.',
    dx_presuntivo: 'Paciente clínicamente sano.',
    tratamiento: 'Desparasitante de amplio espectro VO dosis única. Se recomienda repetir en 3 meses.',
    indicaciones: 'Continuar dieta actual. Próximo control en 6 meses.' },
  { idxPaciente: 2, idxVet: 1, fecha: '2026-06-22', motivo: 'Cojera de miembro posterior derecho',
    anamnesis: 'Cojera de 3 días de evolución tras juego intenso. Sin heridas visibles.',
    examen_fisico: 'Dolor a la palpación de rodilla derecha, prueba de cajón negativa. Resto sin alteraciones.',
    dx_presuntivo: 'Esguince de rodilla derecha. Descartar lesión de ligamento cruzado.',
    tratamiento: 'Antiinflamatorio (meloxicam) 5 días. Reposo estricto 10 días.',
    indicaciones: 'Restringir actividad. Revaloración en 10 días; si persiste, radiografía.' },
  { idxPaciente: 4, idxVet: 0, fecha: '2026-07-02', motivo: 'Problemas dermatológicos (prurito facial)',
    anamnesis: 'Rascado facial frecuente desde hace 2 semanas. Sin cambio de alimento reciente.',
    examen_fisico: 'Eritema en pliegues faciales, sin ectoparásitos visibles. Otoscopia normal.',
    dx_presuntivo: 'Dermatitis de pliegues (intertrigo). Descartar componente alérgico.',
    tratamiento: 'Limpieza de pliegues con clorhexidina 2 veces/día. Corticoide tópico 7 días.',
    indicaciones: 'Mantener pliegues secos. Revaloración en 2 semanas.' },
  { idxPaciente: 1, idxVet: 1, fecha: '2026-07-08', motivo: 'Vómito ocasional y decaimiento',
    anamnesis: 'Dos episodios de vómito en 24 h. Come menos de lo habitual. Gato de interior.',
    examen_fisico: 'Ligera deshidratación (~5%), abdomen no doloroso. T° 38.9 °C.',
    dx_presuntivo: 'Gastritis leve, probable por bola de pelo.',
    tratamiento: 'Fluidoterapia SC. Dieta blanda 3 días. Pasta malta como preventivo.',
    indicaciones: 'Vigilar hidratación y apetito. Si continúa, análisis de sangre.' },
  { idxPaciente: 6, idxVet: 0, fecha: '2026-07-15', motivo: 'Control de peso y nutrición',
    anamnesis: 'Tutor preocupado por sobrepeso. Alimentación libre todo el día.',
    examen_fisico: 'Peso 8.1 kg, condición corporal 4/5. Resto del examen normal.',
    dx_presuntivo: 'Sobrepeso leve.',
    tratamiento: 'Plan de alimentación controlada (RER calculado). Alimento light.',
    indicaciones: 'Raciones medidas 2 veces/día. Pesar cada mes. Aumentar juego.' },
  { idxPaciente: 7, idxVet: 1, fecha: '2026-07-20', motivo: 'Primera consulta / esquema de vacunación',
    anamnesis: 'Cachorro recién adoptado. Sin antecedentes de vacunación conocidos.',
    examen_fisico: 'Peso 9.2 kg, mucosas rosadas, sin alteraciones. Dentición acorde a la edad.',
    dx_presuntivo: 'Paciente sano; inicia esquema preventivo.',
    tratamiento: 'Primera dosis de vacuna múltiple. Desparasitación.',
    indicaciones: 'Refuerzo en 21 días. Evitar contacto con perros sin vacunar.' },
];

// idxPaciente → PACIENTES; fechas coherentes con hoy (2026-07-23)
const VACUNAS = [
  { idxPaciente: 0, nombre: 'Antirrábica',           fecha_aplicacion: '2026-01-15', proxima_dosis: '2027-01-15', fabricante: 'Zoetis',        via_administracion: 'Subcutánea', dosis: '1 ml', lote: 'RAB-2026-A' },
  { idxPaciente: 0, nombre: 'Séxtuple canina',       fecha_aplicacion: '2026-01-15', proxima_dosis: '2027-01-15', fabricante: 'MSD',           via_administracion: 'Subcutánea', dosis: '1 ml', lote: 'SEX-2026-B' },
  { idxPaciente: 2, nombre: 'Antirrábica',           fecha_aplicacion: '2025-12-01', proxima_dosis: '2026-12-01', fabricante: 'Zoetis',        via_administracion: 'Subcutánea', dosis: '1 ml', lote: 'RAB-2025-K' },
  { idxPaciente: 1, nombre: 'Triple felina',         fecha_aplicacion: '2026-03-10', proxima_dosis: '2027-03-10', fabricante: 'Virbac',        via_administracion: 'Subcutánea', dosis: '1 ml', lote: 'FEL-2026-C' },
  { idxPaciente: 4, nombre: 'Séxtuple canina',       fecha_aplicacion: '2026-02-20', proxima_dosis: '2027-02-20', fabricante: 'MSD',           via_administracion: 'Subcutánea', dosis: '1 ml', lote: 'SEX-2026-D' },
  { idxPaciente: 6, nombre: 'Triple felina',         fecha_aplicacion: '2025-11-05', proxima_dosis: '2026-11-05', fabricante: 'Virbac',        via_administracion: 'Subcutánea', dosis: '1 ml', lote: 'FEL-2025-M' },
  { idxPaciente: 5, nombre: 'Antirrábica',           fecha_aplicacion: '2026-08-01', proxima_dosis: '2027-08-01', fabricante: 'Boehringer',    via_administracion: 'Subcutánea', dosis: '0.5 ml', lote: 'RAB-2026-N' },
  { idxPaciente: 7, nombre: 'Múltiple canina (1ª)',  fecha_aplicacion: '2026-07-20', proxima_dosis: '2026-08-10', fabricante: 'MSD',           via_administracion: 'Subcutánea', dosis: '1 ml', lote: 'SEX-2026-P' },
];

const sinAcentos = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Dominio de correo derivado del nombre real de la cl\u00ednica, para que los
// correos de los empleados cuadren con ella ("UP CHIAPAS" \u2192 upchiapas.mx)
// en vez de un dominio inventado.
function dominioDeClinica(nombre) {
  const slug = sinAcentos(nombre).replace(/[^a-z0-9]/g, '').slice(0, 24);
  return `${slug || 'clinica'}.mx`;
}

// correo corporativo a partir del nombre (sin acentos)
function correoEmpleado(nombre, apellidos, dominio) {
  const n = sinAcentos(nombre).split(' ')[0];
  const a = sinAcentos(apellidos).split(' ')[0];
  return `${n}.${a}@${dominio}`;
}

async function main() {
  log(`ANA-vet · seed de datos demo`);
  log(`  API:     ${API_BASE}`);
  log(`  Clínica: ${CLINICA_NOMBRE} <${CLINICA_EMAIL}>`);

  // 1 · Registrar la clínica (si ya existe, seguir)
  paso('Registrando la clínica');
  try {
    await api('POST', '/clinicas/registro', {
      nombre: CLINICA_NOMBRE,
      email: CLINICA_EMAIL,
      password: CLINICA_PASSWORD,
      telefono: '5555010101',
      direccion: 'Av. de los Insurgentes 2000, Benito Juárez, CDMX',
    });
    log('  Clínica registrada.');
  } catch (err) {
    if (err.status === 409) log('  Ya existía; se continúa.');
    else throw err;
  }

  // 2 · Login como administrador
  paso('Iniciando sesión');
  const sesion = await api('POST', '/clinicas/login', { email: CLINICA_EMAIL, password: CLINICA_PASSWORD });
  token = sesion.token;
  log(`  OK · clínica id ${sesion.clinica.id}`);

  // 3 · Guarda de idempotencia
  const tutoresPrevios = await api('GET', '/tutores');
  if (Array.isArray(tutoresPrevios) && tutoresPrevios.length > 0 && !FORCE) {
    log(`\n⚠ La clínica ya tiene ${tutoresPrevios.length} tutores. Para no duplicar, no se siembra de nuevo.`);
    log('  (Si de verdad quieres añadir otra tanda, corre con FORCE=1.)');
    return;
  }

  // 4 · Roles → mapa nombre→id
  paso('Leyendo roles');
  const roles = await api('GET', '/roles');
  const rolId = Object.fromEntries(roles.map((r) => [r.nombre, r.id]));
  log(`  ${roles.map((r) => `${r.nombre}(${r.id})`).join(', ')}`);

  // 5 · Empleados (uno por rol; contraseña conocida para la demo)
  paso('Creando empleados');
  const dominio = dominioDeClinica(sesion.clinica.nombre);
  const empleadosCreados = [];
  const vets = [];
  for (const e of EMPLEADOS) {
    const email = correoEmpleado(e.nombre, e.apellidos, dominio);
    const r = await api('POST', '/empleados', {
      nombre: e.nombre, apellidos: e.apellidos, rol_id: rolId[e.rol],
      telefono: e.tel, generar_correo: false, email, password: EMP_PASSWORD,
    });
    empleadosCreados.push({ ...e, id: r.empleado_id, email });
    if (e.rol === 'Veterinario') vets.push(r.empleado_id);
    log(`  · ${e.nombre} ${e.apellidos} — ${e.rol} <${email}>`);
  }

  // 6 · Tutores
  paso('Creando tutores');
  const tutorId = [];
  for (const t of TUTORES) {
    const r = await api('POST', '/tutores', t);
    tutorId.push(r.id);
    log(`  · ${t.nombre} ${t.apellidos}`);
  }

  // 7 · Pacientes
  paso('Creando pacientes');
  const pacienteId = [];
  for (const p of PACIENTES) {
    const { idxTutor, ...datos } = p;
    const r = await api('POST', '/pacientes', { tutor_id: tutorId[idxTutor], ...datos });
    pacienteId.push(r.id);
    log(`  · ${p.nombre} (${p.especie}/${p.raza})`);
  }

  // 8 · Expedientes + consultas
  paso('Creando expedientes y consultas');
  const expedientePorPaciente = {};
  async function expedienteDe(idxPaciente) {
    if (expedientePorPaciente[idxPaciente]) return expedientePorPaciente[idxPaciente];
    const r = await api('POST', '/expedientes', { paciente_id: pacienteId[idxPaciente] });
    expedientePorPaciente[idxPaciente] = r.id;
    return r.id;
  }
  for (const c of CONSULTAS) {
    const expediente_id = await expedienteDe(c.idxPaciente);
    const empleado_id = vets[c.idxVet] ?? vets[0];
    const { idxPaciente, idxVet, ...campos } = c;
    await api('POST', '/consultas', { expediente_id, empleado_id, ...campos });
    log(`  · ${PACIENTES[c.idxPaciente].nombre}: ${c.motivo}`);
  }

  // 9 · Vacunas
  paso('Registrando vacunas');
  for (const v of VACUNAS) {
    const { idxPaciente, ...campos } = v;
    await api('POST', '/vacunas', { paciente_id: pacienteId[idxPaciente], ...campos });
    log(`  · ${PACIENTES[v.idxPaciente].nombre}: ${v.nombre} (${v.fecha_aplicacion})`);
  }

  // 10 · Resumen
  log('\n═══════════════════════════════════════════════');
  log('  Siembra completada');
  log(`  Empleados: ${empleadosCreados.length}  ·  Tutores: ${tutorId.length}  ·  Pacientes: ${pacienteId.length}`);
  log(`  Consultas: ${CONSULTAS.length}  ·  Vacunas: ${VACUNAS.length}`);
  log('');
  log('  Accesos de la demo:');
  log(`    Admin (clínica):  ${CLINICA_EMAIL} / ${CLINICA_PASSWORD}`);
  log(`    Empleados:        <correo mostrado arriba> / ${EMP_PASSWORD}`);
  log('═══════════════════════════════════════════════');
}

main().catch((err) => {
  console.error('\n✗ ERROR:', err.message);
  if (err.datos) console.error('  detalle:', JSON.stringify(err.datos));
  process.exit(1);
});
