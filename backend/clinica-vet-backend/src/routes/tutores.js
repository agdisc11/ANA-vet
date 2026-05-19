const express = require('express');
const router = express.Router();
const db = require('../db/connection');

router.get('/', (req, res) => {
  db.query('SELECT id, nombre, apellidos, telefono, whatsapp, correo, direccion, codigo FROM tutor ORDER BY nombre', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.post('/', (req, res) => {
  const { nombre, apellidos, telefono, whatsapp, correo, direccion } = req.body;
  if (!nombre || !apellidos) {
    return res.status(400).json({ error: 'nombre y apellidos son requeridos' });
  }

  const codigo = `TUT-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
  db.query(
    'INSERT INTO tutor (nombre, apellidos, telefono, whatsapp, correo, direccion, codigo) VALUES (?,?,?,?,?,?,?)',
    [nombre, apellidos, telefono || null, whatsapp || null, correo || null, direccion || null, codigo],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: result.insertId, codigo, mensaje: 'Tutor creado' });
    }
  );
});

router.put('/:id', (req, res) => {
  const { nombre, apellidos, telefono, whatsapp, correo, direccion } = req.body;
  if (!nombre || !apellidos) {
    return res.status(400).json({ error: 'nombre y apellidos son requeridos' });
  }
  db.query(
    'UPDATE tutor SET nombre=?, apellidos=?, telefono=?, whatsapp=?, correo=?, direccion=? WHERE id=?',
    [nombre, apellidos, telefono || null, whatsapp || null, correo || null, direccion || null, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Tutor no encontrado' });
      res.json({ mensaje: 'Tutor actualizado' });
    }
  );
});

router.delete('/:id', (req, res) => {
  // Exclusivo para el rol de clinica (Admin)
  if (!req.user || req.user.rol !== 'clinica') {
    return res.status(403).json({ error: 'Acceso denegado. Solo el administrador de la clínica puede eliminar tutores.' });
  }

  const tutorId = req.params.id;
  const clinicaId = req.user.clinica_id;

  // Iniciamos una transacción para garantizar la eliminación en cascada de forma segura
  db.getConnection((connErr, connection) => {
    if (connErr) return res.status(500).json({ error: connErr.message });

    connection.beginTransaction((txErr) => {
      if (txErr) {
        connection.release();
        return res.status(500).json({ error: txErr.message });
      }

      // Paso 1: Obtener los IDs de los pacientes del tutor en esta clínica
      connection.query(
        'SELECT id FROM paciente WHERE tutor_id = ? AND clinica_id = ?',
        [tutorId, clinicaId],
        (err, pacientes) => {
          if (err) {
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ error: err.message });
            });
          }

          const pacienteIds = pacientes.map(p => p.id);

          // Función auxiliar para borrar pacientes y tutor
          const deletePacientesYTutor = () => {
            // Paso 2: Eliminar todos los pacientes asociados al tutor en esta clínica
            connection.query(
              'DELETE FROM paciente WHERE tutor_id = ? AND clinica_id = ?',
              [tutorId, clinicaId],
              (err2) => {
                if (err2) {
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ error: err2.message });
                  });
                }

                // Paso 3: Eliminar el tutor en esta clínica
                connection.query(
                  'DELETE FROM tutor WHERE id = ? AND clinica_id = ?',
                  [tutorId, clinicaId],
                  (err3, result) => {
                    if (err3) {
                      return connection.rollback(() => {
                        connection.release();
                        res.status(500).json({ error: err3.message });
                      });
                    }

                    if (result.affectedRows === 0) {
                      return connection.rollback(() => {
                        connection.release();
                        res.status(404).json({ error: 'Tutor no encontrado o no pertenece a esta clínica.' });
                      });
                    }

                    // Confirmar la transacción
                    connection.commit((commitErr) => {
                      connection.release();
                      if (commitErr) {
                        return res.status(500).json({ error: commitErr.message });
                      }
                      res.json({ message: 'Tutor y sus mascotas asociadas eliminados correctamente en cascada' });
                    });
                  }
                );
              }
            );
          };

          // Paso 1b: Si hay pacientes, primero borrar sus expedientes/consultas asociados
          if (pacienteIds.length > 0) {
            connection.query(
              'DELETE FROM expediente WHERE paciente_id IN (?)',
              [pacienteIds],
              (err1b) => {
                if (err1b) {
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ error: err1b.message });
                  });
                }
                deletePacientesYTutor();
              }
            );
          } else {
            // No hay pacientes, ir directo a borrar el tutor
            deletePacientesYTutor();
          }
        }
      );
    });
  });
});

module.exports = router;
