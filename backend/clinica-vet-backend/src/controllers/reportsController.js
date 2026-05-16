const PDFDocument = require('pdfkit');
const db = require('../db/connection');
const path = require('path');
const fs = require('fs');

// Crear directorio de reportes si no existe
const reportsDir = path.join(__dirname, '../../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Función auxiliar para crear encabezado PDF
const addHeader = (doc, title) => {
  doc.fontSize(20).font('Helvetica-Bold').text('CLÍNICA VETERINARIA', { align: 'center' });
  doc.fontSize(12).font('Helvetica').text('Ana Veterinaria', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(14).font('Helvetica-Bold').text(title, { align: 'center' });
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(1);
};

// Función auxiliar para agregar tabla
const addTable = (doc, columns, rows, options = {}) => {
  const startX = options.startX || 50;
  const startY = options.startY || doc.y;
  const rowHeight = options.rowHeight || 25;
  const columnWidths = options.columnWidths || Array(columns.length).fill(480 / columns.length);

  let y = startY;

  // Encabezados
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
  let x = startX;
  columns.forEach((col, i) => {
    doc.text(col, x, y, { width: columnWidths[i], align: 'left' });
    x += columnWidths[i];
  });

  doc.moveTo(startX, y + rowHeight - 5).lineTo(startX + 480, y + rowHeight - 5).stroke();
  y += rowHeight;

  // Filas
  doc.font('Helvetica').fontSize(9);
  rows.forEach((row) => {
    x = startX;
    row.forEach((cell, i) => {
      doc.text(String(cell || ''), x, y, { width: columnWidths[i], align: 'left' });
      x += columnWidths[i];
    });
    y += rowHeight;
  });

  return y;
};

// Reporte de Pacientes
exports.reportePacientes = (req, res) => {
  const query = `
    SELECT p.id, p.nombre, p.especie, p.raza, p.edad, p.peso, t.nombre as tutor_nombre, t.telefono
    FROM paciente p
    LEFT JOIN tutor t ON p.tutor_id = t.id
    ORDER BY p.nombre
  `;

  db.query(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const doc = new PDFDocument();
    const filename = `reporte_pacientes_${Date.now()}.pdf`;
    const filepath = path.join(reportsDir, filename);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    addHeader(doc, 'REPORTE DE PACIENTES');

    doc.fontSize(11).text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 50, doc.y);
    doc.moveDown(1);

    const columns = ['Nombre', 'Especie', 'Raza', 'Edad', 'Peso', 'Tutor', 'Teléfono'];
    const dataRows = rows.map(row => [
      row.nombre,
      row.especie || '-',
      row.raza || '-',
      row.edad || '-',
      `${row.peso || '-'} kg`,
      row.tutor_nombre || '-',
      row.telefono || '-'
    ]);

    addTable(doc, columns, dataRows, {
      columnWidths: [80, 60, 60, 40, 50, 90, 80]
    });

    doc.fontSize(10).text(`\nTotal de pacientes: ${rows.length}`, 50);
    doc.end();
  });
};

// Reporte de Hospitalizaciones
exports.reporteHospitalizaciones = (req, res) => {
  const query = `
    SELECT h.id, h.fecha_ingreso, h.fecha_salida, h.diagnostico, h.observaciones,
           p.nombre as paciente_nombre, t.nombre as tutor_nombre
    FROM hospitalizacion h
    LEFT JOIN paciente p ON h.paciente_id = p.id
    LEFT JOIN tutor t ON p.tutor_id = t.id
    ORDER BY h.fecha_ingreso DESC
    LIMIT 50
  `;

  db.query(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const doc = new PDFDocument();
    const filename = `reporte_hospitalizaciones_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    addHeader(doc, 'REPORTE DE HOSPITALIZACIONES');

    doc.fontSize(11).text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, 50, doc.y);
    doc.moveDown(1);

    const columns = ['Paciente', 'Tutor', 'Fecha Ingreso', 'Fecha Salida', 'Diagnóstico'];
    const dataRows = rows.map(row => [
      row.paciente_nombre,
      row.tutor_nombre || '-',
      row.fecha_ingreso ? row.fecha_ingreso.split('T')[0] : '-',
      row.fecha_salida ? row.fecha_salida.split('T')[0] : '-',
      row.diagnostico || '-'
    ]);

    addTable(doc, columns, dataRows, {
      columnWidths: [100, 100, 90, 90, 100]
    });

    // Detalles
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold').text('OBSERVACIONES:');
    doc.font('Helvetica').fontSize(9);
    rows.forEach(row => {
      if (row.observaciones) {
        doc.text(`• ${row.paciente_nombre}: ${row.observaciones}`);
      }
    });

    doc.fontSize(10).text(`\nTotal de hospitalizaciones registradas: ${rows.length}`, 50);
    doc.end();
  });
};

// Reporte de Cirugías
exports.reporteCirugias = (req, res) => {
  const query = `
    SELECT c.id, c.fecha, c.tipo_cirugia, c.duracion, c.observaciones,
           p.nombre as paciente_nombre, t.nombre as tutor_nombre
    FROM cirugia c
    LEFT JOIN paciente p ON c.paciente_id = p.id
    LEFT JOIN tutor t ON p.tutor_id = t.id
    ORDER BY c.fecha DESC
    LIMIT 50
  `;

  db.query(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const doc = new PDFDocument();
    const filename = `reporte_cirugias_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    addHeader(doc, 'REPORTE DE CIRUGÍAS');

    doc.fontSize(11).text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, 50, doc.y);
    doc.moveDown(1);

    const columns = ['Paciente', 'Tutor', 'Fecha', 'Tipo de Cirugía', 'Duración'];
    const dataRows = rows.map(row => [
      row.paciente_nombre,
      row.tutor_nombre || '-',
      row.fecha ? row.fecha.split('T')[0] : '-',
      row.tipo_cirugia || '-',
      `${row.duracion || '-'} min`
    ]);

    addTable(doc, columns, dataRows, {
      columnWidths: [100, 100, 80, 100, 80]
    });

    // Observaciones
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold').text('OBSERVACIONES Y DETALLES:');
    doc.font('Helvetica').fontSize(9);
    rows.forEach(row => {
      if (row.observaciones) {
        doc.text(`• ${row.paciente_nombre}: ${row.observaciones}`);
      }
    });

    doc.fontSize(10).text(`\nTotal de cirugías registradas: ${rows.length}`, 50);
    doc.end();
  });
};

// Reporte de Consultas
exports.reporteConsultas = (req, res) => {
  const query = `
    SELECT c.id, c.fecha, c.motivo, c.diagnostico, c.tratamiento,
           p.nombre as paciente_nombre, t.nombre as tutor_nombre
    FROM consulta c
    LEFT JOIN paciente p ON c.paciente_id = p.id
    LEFT JOIN tutor t ON p.tutor_id = t.id
    ORDER BY c.fecha DESC
    LIMIT 50
  `;

  db.query(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const doc = new PDFDocument();
    const filename = `reporte_consultas_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    addHeader(doc, 'REPORTE DE CONSULTAS');

    doc.fontSize(11).text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, 50, doc.y);
    doc.moveDown(1);

    const columns = ['Paciente', 'Tutor', 'Fecha', 'Motivo', 'Diagnóstico'];
    const dataRows = rows.map(row => [
      row.paciente_nombre,
      row.tutor_nombre || '-',
      row.fecha ? row.fecha.split('T')[0] : '-',
      row.motivo || '-',
      row.diagnostico || '-'
    ]);

    addTable(doc, columns, dataRows, {
      columnWidths: [80, 90, 70, 90, 100]
    });

    doc.fontSize(10).text(`\nTotal de consultas registradas: ${rows.length}`, 50);
    doc.end();
  });
};

// Reporte de Vacunas
exports.reporteVacunas = (req, res) => {
  const query = `
    SELECT v.id, v.fecha, v.nombre_vacuna, v.proxima_dosis,
           p.nombre as paciente_nombre, t.nombre as tutor_nombre
    FROM vacuna v
    LEFT JOIN paciente p ON v.paciente_id = p.id
    LEFT JOIN tutor t ON p.tutor_id = t.id
    ORDER BY v.fecha DESC
    LIMIT 50
  `;

  db.query(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const doc = new PDFDocument();
    const filename = `reporte_vacunas_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    addHeader(doc, 'REPORTE DE VACUNAS');

    doc.fontSize(11).text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, 50, doc.y);
    doc.moveDown(1);

    const columns = ['Paciente', 'Tutor', 'Fecha', 'Vacuna', 'Próxima Dosis'];
    const dataRows = rows.map(row => [
      row.paciente_nombre,
      row.tutor_nombre || '-',
      row.fecha ? row.fecha.split('T')[0] : '-',
      row.nombre_vacuna || '-',
      row.proxima_dosis ? row.proxima_dosis.split('T')[0] : '-'
    ]);

    addTable(doc, columns, dataRows, {
      columnWidths: [100, 100, 80, 90, 90]
    });

    doc.fontSize(10).text(`\nTotal de vacunas registradas: ${rows.length}`, 50);
    doc.end();
  });
};

// Reporte General Responsivo (Resumen Ejecutivo)
exports.reporteGeneral = (req, res) => {
  const queries = {
    pacientes: 'SELECT COUNT(*) as total FROM paciente',
    hospitalizaciones: 'SELECT COUNT(*) as total FROM hospitalizacion',
    cirugias: 'SELECT COUNT(*) as total FROM cirugia',
    consultas: 'SELECT COUNT(*) as total FROM consulta',
    vacunas: 'SELECT COUNT(*) as total FROM vacuna',
    tutores: 'SELECT COUNT(*) as total FROM tutor'
  };

  const stats = {};
  let pending = Object.keys(queries).length;

  for (const [key, sql] of Object.entries(queries)) {
    db.query(sql, (err, rows) => {
      stats[key] = err ? 0 : rows[0].total;
      if (--pending === 0) {
        generateGeneralReport(res, stats);
      }
    });
  }
};

const generateGeneralReport = (res, stats) => {
  const doc = new PDFDocument({ size: 'A4' });
  const filename = `reporte_general_${Date.now()}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);

  addHeader(doc, 'REPORTE GENERAL - RESUMEN EJECUTIVO');

  doc.fontSize(11).text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 50, doc.y);
  doc.moveDown(1.5);

  // Tabla de estadísticas
  const statsColumns = ['Concepto', 'Total'];
  const statsRows = [
    ['Pacientes', stats.pacientes.toString()],
    ['Tutores', stats.tutores.toString()],
    ['Consultas', stats.consultas.toString()],
    ['Hospitalizaciones', stats.hospitalizaciones.toString()],
    ['Cirugías', stats.cirugias.toString()],
    ['Vacunas', stats.vacunas.toString()]
  ];

  addTable(doc, statsColumns, statsRows, {
    columnWidths: [300, 180]
  });

  doc.moveDown(2);
  doc.fontSize(12).font('Helvetica-Bold').text('NOTAS:');
  doc.fontSize(10).font('Helvetica').text('Este reporte contiene un resumen ejecutivo de todas las operaciones registradas en el sistema.');
  doc.text('Para más detalles específicos, consultar los reportes individuales de cada módulo.');

  doc.moveDown(2);
  doc.fontSize(9).text('Clínica Veterinaria ANA - Sistema de Gestión', { align: 'center' });
  doc.text('© 2026 - Todos los derechos reservados', { align: 'center' });

  doc.end();
};

// Reporte de Expedientes Médicos (Responsivo - por paciente)
exports.reporteExpediente = (req, res) => {
  const { paciente_id } = req.params;

  const query = `
    SELECT p.id, p.nombre, p.especie, p.raza, p.edad, p.peso, p.sexo,
           t.nombre as tutor_nombre, t.telefono, t.direccion,
           e.fecha_registro, e.historial_medico, e.alergias
    FROM expediente e
    LEFT JOIN paciente p ON e.paciente_id = p.id
    LEFT JOIN tutor t ON p.tutor_id = t.id
    WHERE p.id = ?
  `;

  db.query(query, [paciente_id], (err, rows) => {
    if (err || rows.length === 0) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    const data = rows[0];
    const doc = new PDFDocument();
    const filename = `expediente_${data.nombre}_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    addHeader(doc, 'EXPEDIENTE MÉDICO DEL PACIENTE');

    doc.fontSize(11).font('Helvetica-Bold').text('INFORMACIÓN DEL PACIENTE:');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Nombre: ${data.nombre}`);
    doc.text(`Especie: ${data.especie || '-'}`);
    doc.text(`Raza: ${data.raza || '-'}`);
    doc.text(`Edad: ${data.edad || '-'}`);
    doc.text(`Peso: ${data.peso ? data.peso + ' kg' : '-'}`);
    doc.text(`Sexo: ${data.sexo || '-'}`);

    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica-Bold').text('INFORMACIÓN DEL TUTOR:');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Nombre: ${data.tutor_nombre || '-'}`);
    doc.text(`Teléfono: ${data.telefono || '-'}`);
    doc.text(`Dirección: ${data.direccion || '-'}`);

    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica-Bold').text('HISTORIAL MÉDICO:');
    doc.fontSize(10).font('Helvetica');
    doc.text(data.historial_medico || 'Sin información registrada', { align: 'left' });

    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica-Bold').text('ALERGIAS:');
    doc.fontSize(10).font('Helvetica');
    doc.text(data.alergias || 'Sin alergias registradas');

    doc.moveDown(2);
    doc.fontSize(9).text(`Expediente generado: ${new Date().toLocaleDateString('es-ES')}`, { align: 'right' });

    doc.end();
  });
};
