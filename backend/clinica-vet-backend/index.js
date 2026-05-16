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
