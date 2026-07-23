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

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones sin origin (ej. Postman, curl) o desde orígenes permitidos
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origen no permitido → ${origin}`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
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
