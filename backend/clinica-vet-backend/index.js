require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/tutores', require('./src/routes/tutores'));
app.use('/api/pacientes', require('./src/routes/pacientes'));
app.use('/api/expedientes', require('./src/routes/expedientes'));
app.use('/api/consultas', require('./src/routes/consultas'));
app.use('/api/hospitalizaciones', require('./src/routes/hospitalizaciones'));
app.use('/api/cirugias', require('./src/routes/cirugias'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));