require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./src/db/connection');

app.use(cors());
app.use(express.json());

// ── Rutas SaaS Multi-tenant (Fase 1) ──────────────────────────
app.use('/api/clinicas',  require('./src/routes/clinicas'));
app.use('/api/empleados', require('./src/routes/empleados'));
app.use('/api/roles',     require('./src/routes/roles'));

// ── Rutas existentes ──────────────────────────────────────────
app.use('/api/tutores', require('./src/routes/tutores'));
app.use('/api/pacientes', require('./src/routes/pacientes'));
app.use('/api/expedientes', require('./src/routes/expedientes'));
app.use('/api/consultas', require('./src/routes/consultas'));
app.use('/api/hospitalizaciones', require('./src/routes/hospitalizaciones'));
app.use('/api/cirugias', require('./src/routes/cirugias'));
app.use('/api/anestesia', require('./src/routes/anestesia'));
app.use('/api/vacunas', require('./src/routes/vacunas'));
app.use('/api/reports', require('./src/routes/reports'));
app.use('/api/calculadora', require('./src/routes/calculadora'));
app.use('/api/notificaciones', require('./src/routes/notificaciones'));
app.use('/api/recibos',            require('./src/routes/recibos'));
app.use('/api/servicios-catalogo', require('./src/routes/servicios-catalogo'));
app.use('/api/dashboard',          require('./src/routes/dashboard'));
app.use('/api/inventario',         require('./src/routes/inventario'));

app.get('/api/stats', (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM tutor) AS tutores,
      (SELECT COUNT(*) FROM paciente) AS pacientes,
      (SELECT COUNT(*) FROM consulta) AS consultas,
      (SELECT COUNT(*) FROM hospitalizacion) AS hospitalizaciones,
      (SELECT COUNT(*) FROM cirugia) AS cirugias,
      (SELECT COUNT(*) FROM vacuna) AS vacunas
  `;
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows[0]);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
