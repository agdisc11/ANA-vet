require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const app = express();
const errorHandler = require('./src/middleware/errorHandler');
const { loginLimiter, registroLimiter, busquedaLimiter } = require('./src/middleware/rateLimiters');

app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:3001', 'http://localhost:3000'];

/**
 * ¿La petición es del MISMO origen que la sirve?
 *
 * Detrás de un reverse-proxy (nginx sirviendo el front y /api en el mismo
 * dominio) el navegador incluye la cabecera `Origin` en los POST/PUT/DELETE
 * aunque NO sean cross-origin. Ese Origin coincide con el Host de la
 * petición, así que comparándolos se permite el mismo-origen sea cual sea
 * la IP o el dominio del despliegue — sin tener que enumerarlo en
 * CORS_ORIGIN (clave en el Learner Lab, donde la IP cambia por sesión).
 */
function esMismoOrigen(origin, host) {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Forma delegada de `cors`: recibe el req, así se puede comparar Origin
// con Host (la forma `origin: (origin, cb)` no da acceso a la petición).
const corsDelegate = (req, callback) => {
  const origin = req.header('Origin');
  const permitido =
    !origin ||                                   // curl, Postman, same-origin GET
    allowedOrigins.includes(origin) ||           // orígenes configurados
    esMismoOrigen(origin, req.header('Host'));    // same-origin tras el proxy
  if (permitido) {
    callback(null, {
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    });
  } else {
    callback(new Error(`CORS: origen no permitido → ${origin}`));
  }
};

app.use(cors(corsDelegate));
app.use(express.json({ limit: '1mb' }));

// ── Health check (monitoreo / readiness) ──────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ── Protección contra fuerza bruta en autenticación ──────────
app.use('/api/clinicas/login',    loginLimiter);
app.use('/api/empleados/login',   loginLimiter);
app.use('/api/clinicas/registro', registroLimiter);
app.use('/api/buscar',            busquedaLimiter);

// ── Rutas públicas (sin sesión): carnet de vacunación ────────
app.use('/api/publico', require('./src/routes/publico'));

// ── Rutas SaaS Multi-tenant (Fase 1) ──────────────────────────
app.use('/api/clinicas',  require('./src/routes/clinicas'));
app.use('/api/empleados', require('./src/routes/empleados'));
app.use('/api/roles',     require('./src/routes/roles'));

// ── Rutas existentes ──────────────────────────────────────────
app.use('/api/tutores', require('./src/routes/tutores'));
app.use('/api/pacientes', require('./src/routes/pacientes'));
app.use('/api/citas', require('./src/routes/citas'));
app.use('/api/expedientes', require('./src/routes/expedientes'));
app.use('/api/consultas', require('./src/routes/consultas'));
app.use('/api/hospitalizaciones', require('./src/routes/hospitalizaciones'));
app.use('/api/cirugias', require('./src/routes/cirugias'));
app.use('/api/anestesia', require('./src/routes/anestesia'));
app.use('/api/vacunas', require('./src/routes/vacunas'));
app.use('/api/reports', require('./src/routes/reports'));
app.use('/api/calculadora', require('./src/routes/calculadora'));
app.use('/api/notificaciones', require('./src/routes/notificaciones'));
app.use('/api/recordatorios',  require('./src/routes/recordatorios'));
app.use('/api/tratamiento',    require('./src/routes/tratamiento'));
app.use('/api/recibos',            require('./src/routes/recibos'));
app.use('/api/servicios-catalogo', require('./src/routes/servicios-catalogo'));
app.use('/api/dashboard',          require('./src/routes/dashboard'));
app.use('/api/inventario',         require('./src/routes/inventario'));
app.use('/api/stats',              require('./src/routes/stats'));

// ── Fase 4: innovación ────────────────────────────────────────
app.use('/api/buscar',             require('./src/routes/buscar'));

// ── 404 para rutas de API no encontradas ─────────────────────
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// ── Middleware global de errores (debe ir al final) ──────────
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
