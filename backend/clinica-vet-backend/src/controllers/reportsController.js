const PDFDocument = require('pdfkit');
const path = require('path');
const { db } = require('../db/connection');

const LOGO_PATH = path.join(__dirname, '../assets/logo_clinica.png');

// Función auxiliar para crear encabezado PDF corporativo
const addHeader = (doc, title) => {
  // Logo en esquina superior izquierda
  try {
    doc.image(LOGO_PATH, 50, 45, { width: 60 });
  } catch (e) {
    // Si el logo no carga, continuar sin él
  }

  // Nombre corporativo al lado del logo
  doc
    .font('Helvetica-Bold')
    .fontSize(26)
    .fillColor('#1e293b')
    .text('ANA-vet', 120, 48, { lineBreak: false });

  doc
    .font('Helvetica')
    .fontSize(12)
    .fillColor('#64748b')
    .text('Clínica Veterinaria', 120, 80, { lineBreak: false });

  // Título del reporte
  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .fillColor('#1e293b')
    .text(title, 50, 115, { align: 'center', width: 500 });

  // Línea separadora
  doc
    .moveTo(50, 138)
    .lineTo(550, 138)
    .strokeColor('#cbd5e1')
    .lineWidth(1)
    .stroke();

  // Reset color y mover hacia abajo
  doc.fillColor('#000000').strokeColor('#000000').lineWidth(1);
  doc.y = 155;
  doc.moveDown(0.5);
};

// Función auxiliar para agregar tabla
const addTable = (doc, columns, rows, options = {}) => {
  const startX = options.startX || 50;
  const startY = options.startY || doc.y;
  const rowHeight = options.rowHeight || 25;
  const columnWidths = options.columnWidths || Array(columns.length).fill(480 / columns.length);

  let y = startY;

  // Encabezados
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b');
  let x = startX;
  columns.forEach((col, i) => {
    doc.text(col, x, y, { width: columnWidths[i], align: 'left' });
    x += columnWidths[i];
  });

  doc.moveTo(startX, y + rowHeight - 5).lineTo(startX + 480, y + rowHeight - 5).strokeColor('#cbd5e1').stroke();
  doc.strokeColor('#000000');
  y += rowHeight;

  // Filas
  doc.font('Helvetica').fontSize(9).fillColor('#334155');
  rows.forEach((row, rowIndex) => {
    // Fondo alternado
    if (rowIndex % 2 === 0) {
      doc.rect(startX, y - 3, 480, rowHeight).fillColor('#f8fafc').fill();
    }
    doc.fillColor('#334155');
    x = startX;
    row.forEach((cell, i) => {
      doc.text(String(cell != null ? cell : 'N/A'), x, y, { width: columnWidths[i], align: 'left' });
      x += columnWidths[i];
    });
    y += rowHeight;
  });

  doc.fillColor('#000000');
  return y;
};

// Reporte de Pacientes
exports.reportePacientes = (req, res) => {
  const clinicaId = req.user.clinica_id;
  const query = `
    SELECT p.id, p.nombre, p.especie, p.raza,
           TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) AS edad,
           t.nombre as tutor_nombre, t.telefono
    FROM paciente p
    LEFT JOIN tutor t ON p.tutor_id = t.id
    WHERE p.clinica_id = ?
    ORDER BY p.nombre
  `;

  db.query(query, [clinicaId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const filename = `reporte_pacientes_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    addHeader(doc, 'REPORTE DE PACIENTES');

    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 50, doc.y);
    doc.moveDown(1);

    const columns = ['Nombre', 'Especie', 'Raza', 'Edad', 'Tutor', 'Teléfono'];
    const dataRows = rows.map(row => [
      row.nombre || 'N/A',
      row.especie || 'N/A',
      row.raza || 'N/A',
      row.edad != null ? `${row.edad} años` : 'N/A',
      row.tutor_nombre || 'N/A',
      row.telefono || 'N/A'
    ]);

    addTable(doc, columns, dataRows, {
      columnWidths: [90, 70, 70, 50, 110, 90]
    });

    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text(`Total de pacientes: ${rows.length}`, 50);

    doc.moveDown(3);
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('Clínica Veterinaria ANA-vet · Sistema de Gestión', { align: 'center' });
    doc.text('© 2026 - Todos los derechos reservados', { align: 'center' });

    doc.end();
  });
};

// Reporte de Tutores
exports.reporteTutores = (req, res) => {
  const clinicaId = req.user.clinica_id;
  const query = `
    SELECT t.id, t.nombre, t.apellidos, t.telefono, t.correo, t.direccion,
           COUNT(p.id) as total_pacientes
    FROM tutor t
    LEFT JOIN paciente p ON p.tutor_id = t.id
    WHERE t.clinica_id = ?
    GROUP BY t.id
    ORDER BY t.nombre
  `;

  db.query(query, [clinicaId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const filename = `reporte_tutores_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    addHeader(doc, 'REPORTE DE TUTORES');

    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 50, doc.y);
    doc.moveDown(1);

    const columns = ['Nombre', 'Apellidos', 'Teléfono', 'Correo', 'Pacientes'];
    const dataRows = rows.map(row => [
      row.nombre || 'N/A',
      row.apellidos || 'N/A',
      row.telefono || 'N/A',
      row.correo || 'N/A',
      row.total_pacientes != null ? String(row.total_pacientes) : '0'
    ]);

    addTable(doc, columns, dataRows, {
      columnWidths: [100, 110, 80, 130, 60]
    });

    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text(`Total de tutores: ${rows.length}`, 50);

    doc.moveDown(3);
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('Clínica Veterinaria ANA-vet · Sistema de Gestión', { align: 'center' });
    doc.text('© 2026 - Todos los derechos reservados', { align: 'center' });

    doc.end();
  });
};

// Reporte de Hospitalizaciones
exports.reporteHospitalizaciones = (req, res) => {
  const clinicaId = req.user.clinica_id;
  const query = `
    SELECT h.id, h.fecha_ingreso, h.tipo_alta, h.historia_clinica,
           p.nombre as paciente_nombre, t.nombre as tutor_nombre
    FROM hospitalizacion h
    LEFT JOIN expediente e ON h.expediente_id = e.id
    LEFT JOIN paciente p ON e.paciente_id = p.id
    LEFT JOIN tutor t ON p.tutor_id = t.id
    WHERE e.clinica_id = ?
    ORDER BY h.fecha_ingreso DESC
    LIMIT 50
  `;

  db.query(query, [clinicaId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const filename = `reporte_hospitalizaciones_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    addHeader(doc, 'REPORTE DE HOSPITALIZACIONES');

    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, 50, doc.y);
    doc.moveDown(1);

    const columns = ['Paciente', 'Tutor', 'Fecha Ingreso', 'Tipo Alta'];
    const dataRows = rows.map(row => [
      row.paciente_nombre || 'N/A',
      row.tutor_nombre || 'N/A',
      row.fecha_ingreso instanceof Date ? row.fecha_ingreso.toISOString().split('T')[0] : (row.fecha_ingreso || 'N/A'),
      row.tipo_alta || 'Activo'
    ]);

    addTable(doc, columns, dataRows, {
      columnWidths: [130, 130, 110, 110]
    });

    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text(`Total de hospitalizaciones registradas: ${rows.length}`, 50);

    doc.moveDown(3);
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('Clínica Veterinaria ANA-vet · Sistema de Gestión', { align: 'center' });
    doc.text('© 2026 - Todos los derechos reservados', { align: 'center' });

    doc.end();
  });
};

// Reporte de Cirugías
exports.reporteCirugias = (req, res) => {
  const clinicaId = req.user.clinica_id;
  const query = `
    SELECT c.id, c.fecha, c.procedimiento, c.notas,
           p.nombre as paciente_nombre, t.nombre as tutor_nombre
    FROM cirugia c
    LEFT JOIN expediente e ON c.expediente_id = e.id
    LEFT JOIN paciente p ON e.paciente_id = p.id
    LEFT JOIN tutor t ON p.tutor_id = t.id
    WHERE e.clinica_id = ?
    ORDER BY c.fecha DESC
    LIMIT 50
  `;

  db.query(query, [clinicaId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const filename = `reporte_cirugias_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    addHeader(doc, 'REPORTE DE CIRUGÍAS');

    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, 50, doc.y);
    doc.moveDown(1);

    const columns = ['Paciente', 'Tutor', 'Fecha', 'Procedimiento'];
    const dataRows = rows.map(row => [
      row.paciente_nombre || 'N/A',
      row.tutor_nombre || 'N/A',
      row.fecha instanceof Date ? row.fecha.toISOString().split('T')[0] : (row.fecha || 'N/A'),
      row.procedimiento || 'N/A'
    ]);

    addTable(doc, columns, dataRows, {
      columnWidths: [120, 120, 90, 150]
    });

    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text(`Total de cirugías registradas: ${rows.length}`, 50);

    doc.moveDown(3);
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('Clínica Veterinaria ANA-vet · Sistema de Gestión', { align: 'center' });
    doc.text('© 2026 - Todos los derechos reservados', { align: 'center' });

    doc.end();
  });
};

// Reporte de Consultas — BUG FIXED
exports.reporteConsultas = (req, res) => {
  const clinicaId = req.user.clinica_id;
  // Bug fix: la tabla consulta NO tiene dx_definitivo; ese campo está en expediente.
  // Se usa dx_presuntivo de consulta y se hace JOIN con expediente para dx_definitivo.
  const query = `
    SELECT c.id, c.fecha, c.motivo, c.dx_presuntivo,
           e.dx_definitivo,
           p.nombre as paciente_nombre,
           t.nombre as tutor_nombre
    FROM consulta c
    LEFT JOIN expediente e ON c.expediente_id = e.id
    LEFT JOIN paciente p ON e.paciente_id = p.id
    LEFT JOIN tutor t ON p.tutor_id = t.id
    WHERE e.clinica_id = ?
    ORDER BY c.fecha DESC
    LIMIT 50
  `;

  db.query(query, [clinicaId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const filename = `reporte_consultas_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    addHeader(doc, 'REPORTE DE CONSULTAS');

    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, 50, doc.y);
    doc.moveDown(1);

    const columns = ['Paciente', 'Tutor', 'Fecha', 'Motivo', 'Diagnóstico'];
    const dataRows = rows.map(row => [
      row.paciente_nombre || 'N/A',
      row.tutor_nombre || 'N/A',
      row.fecha instanceof Date ? row.fecha.toISOString().split('T')[0] : (row.fecha || 'N/A'),
      row.motivo || 'N/A',
      row.dx_definitivo || row.dx_presuntivo || 'N/A'
    ]);

    addTable(doc, columns, dataRows, {
      columnWidths: [90, 100, 70, 100, 120]
    });

    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text(`Total de consultas registradas: ${rows.length}`, 50);

    doc.moveDown(3);
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('Clínica Veterinaria ANA-vet · Sistema de Gestión', { align: 'center' });
    doc.text('© 2026 - Todos los derechos reservados', { align: 'center' });

    doc.end();
  });
};

// Reporte de Vacunas
exports.reporteVacunas = (req, res) => {
  const clinicaId = req.user.clinica_id;
  const query = `
    SELECT v.id, v.fecha_aplicacion, v.nombre, v.proxima_dosis,
           p.nombre as paciente_nombre, t.nombre as tutor_nombre
    FROM vacuna v
    LEFT JOIN paciente p ON v.paciente_id = p.id
    LEFT JOIN tutor t ON p.tutor_id = t.id
    WHERE p.clinica_id = ?
    ORDER BY v.fecha_aplicacion DESC
    LIMIT 50
  `;

  db.query(query, [clinicaId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const filename = `reporte_vacunas_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    addHeader(doc, 'REPORTE DE VACUNAS');

    doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, 50, doc.y);
    doc.moveDown(1);

    const columns = ['Paciente', 'Tutor', 'Fecha Aplicación', 'Vacuna', 'Próxima Dosis'];
    const dataRows = rows.map(row => [
      row.paciente_nombre || 'N/A',
      row.tutor_nombre || 'N/A',
      row.fecha_aplicacion instanceof Date ? row.fecha_aplicacion.toISOString().split('T')[0] : (row.fecha_aplicacion || 'N/A'),
      row.nombre || 'N/A',
      row.proxima_dosis instanceof Date ? row.proxima_dosis.toISOString().split('T')[0] : (row.proxima_dosis || 'N/A')
    ]);

    addTable(doc, columns, dataRows, {
      columnWidths: [100, 100, 90, 100, 90]
    });

    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text(`Total de vacunas registradas: ${rows.length}`, 50);

    doc.moveDown(3);
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('Clínica Veterinaria ANA-vet · Sistema de Gestión', { align: 'center' });
    doc.text('© 2026 - Todos los derechos reservados', { align: 'center' });

    doc.end();
  });
};

// Reporte General Responsivo (Resumen Ejecutivo)
exports.reporteGeneral = (req, res) => {
  const clinicaId = req.user.clinica_id;
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM paciente WHERE clinica_id = ?) AS pacientes,
      (SELECT COUNT(*) FROM hospitalizacion h JOIN expediente e ON h.expediente_id = e.id WHERE e.clinica_id = ?) AS hospitalizaciones,
      (SELECT COUNT(*) FROM cirugia c JOIN expediente e ON c.expediente_id = e.id WHERE e.clinica_id = ?) AS cirugias,
      (SELECT COUNT(*) FROM consulta c JOIN expediente e ON c.expediente_id = e.id WHERE e.clinica_id = ?) AS consultas,
      (SELECT COUNT(*) FROM vacuna v JOIN paciente p ON v.paciente_id = p.id WHERE p.clinica_id = ?) AS vacunas,
      (SELECT COUNT(*) FROM tutor WHERE clinica_id = ?) AS tutores
  `;
  db.query(sql, [clinicaId, clinicaId, clinicaId, clinicaId, clinicaId, clinicaId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    generateGeneralReport(res, rows[0]);
  });
};

const generateGeneralReport = (res, stats) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const filename = `reporte_general_${Date.now()}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);

  addHeader(doc, 'REPORTE GENERAL — RESUMEN EJECUTIVO');

  doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(
    `Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`,
    50, doc.y
  );
  doc.moveDown(1.5);

  // Tabla de estadísticas
  const statsColumns = ['Concepto', 'Total'];
  const statsRows = [
    ['Pacientes', (stats.pacientes || 0).toString()],
    ['Tutores', (stats.tutores || 0).toString()],
    ['Consultas', (stats.consultas || 0).toString()],
    ['Hospitalizaciones', (stats.hospitalizaciones || 0).toString()],
    ['Cirugías', (stats.cirugias || 0).toString()],
    ['Vacunas', (stats.vacunas || 0).toString()]
  ];

  addTable(doc, statsColumns, statsRows, {
    columnWidths: [300, 180]
  });

  doc.moveDown(2);
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text('NOTAS:');
  doc.fontSize(10).font('Helvetica').fillColor('#334155').text('Este reporte contiene un resumen ejecutivo de todas las operaciones registradas en el sistema.');
  doc.text('Para más detalles específicos, consultar los reportes individuales de cada módulo.');

  doc.moveDown(3);
  doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('Clínica Veterinaria ANA-vet · Sistema de Gestión', { align: 'center' });
  doc.text('© 2026 - Todos los derechos reservados', { align: 'center' });

  doc.end();
};

// Reporte de Expedientes Médicos (por paciente)
exports.reporteExpediente = (req, res) => {
  const { paciente_id } = req.params;
  const clinicaId = req.user.clinica_id;

  const query = `
    SELECT p.id, p.nombre, p.especie, p.raza,
           TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) AS edad,
           p.sexo, p.tatuaje, p.microchip,
           t.nombre as tutor_nombre, t.telefono, t.direccion,
           e.fecha_apertura
    FROM expediente e
    LEFT JOIN paciente p ON e.paciente_id = p.id
    LEFT JOIN tutor t ON p.tutor_id = t.id
    WHERE p.id = ? AND e.clinica_id = ?
    LIMIT 1
  `;

  db.query(query, [paciente_id, clinicaId], (err, rows) => {
    if (err || rows.length === 0) {
      return res.status(404).json({ error: 'Expediente no encontrado' });
    }

    const data = rows[0];
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const filename = `expediente_${(data.nombre || 'paciente').replace(/\s+/g, '_')}_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    addHeader(doc, 'EXPEDIENTE MÉDICO DEL PACIENTE');

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text('INFORMACIÓN DEL PACIENTE:');
    doc.fontSize(10).font('Helvetica').fillColor('#334155');
    doc.text(`Nombre: ${data.nombre || 'N/A'}`);
    doc.text(`Especie: ${data.especie || 'N/A'}`);
    doc.text(`Raza: ${data.raza || 'N/A'}`);
    doc.text(`Edad: ${data.edad != null ? data.edad + ' años' : 'N/A'}`);
    doc.text(`Sexo: ${data.sexo || 'N/A'}`);
    if (data.tatuaje) doc.text(`Tatuaje: ${data.tatuaje}`);
    if (data.microchip) doc.text(`Microchip: ${data.microchip}`);

    doc.moveDown(1);
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text('INFORMACIÓN DEL TUTOR:');
    doc.fontSize(10).font('Helvetica').fillColor('#334155');
    doc.text(`Nombre: ${data.tutor_nombre || 'N/A'}`);
    doc.text(`Teléfono: ${data.telefono || 'N/A'}`);
    doc.text(`Dirección: ${data.direccion || 'N/A'}`);

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#94a3b8').text(`Expediente generado: ${new Date().toLocaleDateString('es-ES')}`, { align: 'right' });

    doc.moveDown(3);
    doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text('Clínica Veterinaria ANA-vet · Sistema de Gestión', { align: 'center' });
    doc.text('© 2026 - Todos los derechos reservados', { align: 'center' });

    doc.end();
  });
};
