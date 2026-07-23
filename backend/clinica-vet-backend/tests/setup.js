// Variables de entorno para la suite de tests.
// Se ejecuta ANTES de cargar cualquier módulo (jest setupFiles), de modo que
// authMiddleware encuentre JWT_SECRET y connection.js omita el ping a MySQL.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-solo-para-tests';
