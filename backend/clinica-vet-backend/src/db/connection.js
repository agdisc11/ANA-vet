const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.connect(err => {
  if (err) {
    console.error('Error conectando a MySQL:', err.message);
    setTimeout(() => db.connect(), 2000);
  } else {
    console.log('MySQL conectado');
  }
});

// Reconectar si la conexión se pierde
db.on('error', err => {
  console.error('Error en conexión MySQL:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') db.connect();
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') db.connect();
  if (err.code === 'PROTOCOL_ENQUEUE_AFTER_CLOSE') db.connect();
});

module.exports = db;