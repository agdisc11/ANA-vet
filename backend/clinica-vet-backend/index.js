require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./src/db/connection');

app.use(cors());
app.use(express.json());

app.use('/api/tutores', require('./src/routes/tutores'));
app.use('/api/pacientes', require('./src/routes/pacientes'));
app.use('/api/expedientes', require('./src/routes/expedientes'));
app.use('/api/consultas', require('./src/routes/consultas'));
app.use('/api/hospitalizaciones', require('./src/routes/hospitalizaciones'));
app.use('/api/cirugias', require('./src/routes/cirugias'));
app.use('/api/anestesia', require('./src/routes/anestesia'));
app.use('/api/vacunas', require('./src/routes/vacunas'));
app.use('/api/reports', require('./src/routes/reports'));

app.get('/api/stats', (req, res) => {
  const queries = {
    tutores: 'SELECT COUNT(*) as total FROM tutor',
    pacientes: 'SELECT COUNT(*) as total FROM paciente',
    consultas: 'SELECT COUNT(*) as total FROM consulta',
    hospitalizaciones: 'SELECT COUNT(*) as total FROM hospitalizacion',
    cirugias: 'SELECT COUNT(*) as total FROM cirugia',
    vacunas: 'SELECT COUNT(*) as total FROM vacuna',
  };
  const results = {};
  let pending = Object.keys(queries).length;
  for (const [key, sql] of Object.entries(queries)) {
    db.query(sql, (err, rows) => {
      results[key] = err ? 0 : rows[0].total;
      if (--pending === 0) res.json(results);
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));