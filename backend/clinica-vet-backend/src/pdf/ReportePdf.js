const PDFDocument = require('pdfkit');
const path = require('path');

/**
 * Utilidades de PRESENTACIÓN para reportes PDF (pdfkit).
 * Sin SQL ni HTTP de negocio: reciben datos ya consultados.
 * (SRP: la única razón de cambio de este archivo es el diseño visual.)
 */

// JPG (≈30 KB) en lugar del PNG (≈367 KB): pdfkit incrusta la imagen
// completa en cada PDF; el JPG reduce cada reporte ~90%.
const LOGO_PATH = path.join(__dirname, '../assets/logo_clinica.jpg');

const TABLE_X = 50;
const TABLE_WIDTH = 480;
const ROW_HEIGHT = 22;
const PAGE_BOTTOM_MARGIN = 60;

/** Fecha es-ES con componentes locales (evita el corrimiento de un día). */
const fmtDate = (v) => {
  if (v == null || v === '') return 'N/A';
  const d = v instanceof Date ? v : new Date(v);
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const addHeader = (doc, title) => {
  try {
    doc.image(LOGO_PATH, 50, 45, { width: 60 });
  } catch (e) {
    // Si el logo no carga, continuar sin él
  }

  doc.font('Helvetica-Bold').fontSize(26).fillColor('#1e293b')
    .text('ANA-vet', 120, 48, { lineBreak: false });
  doc.font('Helvetica').fontSize(12).fillColor('#64748b')
    .text('Clínica Veterinaria', 120, 80, { lineBreak: false });
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#1e293b')
    .text(title, 50, 115, { align: 'center', width: 500 });

  doc.moveTo(50, 138).lineTo(550, 138).strokeColor('#cbd5e1').lineWidth(1).stroke();

  doc.fillColor('#000000').strokeColor('#000000').lineWidth(1);
  doc.y = 155;
};

const addFooter = (doc) => {
  doc.moveDown(3);
  doc.font('Helvetica').fontSize(8).fillColor('#94a3b8')
    .text('Clínica Veterinaria ANA-vet · Sistema de Gestión', TABLE_X, doc.y, { align: 'center', width: TABLE_WIDTH });
  doc.text(`© ${new Date().getFullYear()} - Todos los derechos reservados`, TABLE_X, doc.y, { align: 'center', width: TABLE_WIDTH });
  doc.fillColor('#000000');
};

const drawTableHeaders = (doc, columns, columnWidths, startX, y) => {
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b');
  let x = startX;
  columns.forEach((col, i) => {
    doc.text(col, x + 2, y, { width: columnWidths[i] - 4, align: 'left', lineBreak: false, ellipsis: true });
    x += columnWidths[i];
  });
  doc.moveTo(startX, y + ROW_HEIGHT - 6).lineTo(startX + TABLE_WIDTH, y + ROW_HEIGHT - 6)
    .strokeColor('#cbd5e1').lineWidth(1).stroke();
  doc.strokeColor('#000000');
  return y + ROW_HEIGHT;
};

/** Tabla con salto de página automático y celdas de una línea (ellipsis). */
const addTable = (doc, columns, rows, options = {}) => {
  const startX = options.startX || TABLE_X;
  const startY = options.startY || doc.y;
  const columnWidths = options.columnWidths || Array(columns.length).fill(TABLE_WIDTH / columns.length);

  let y = drawTableHeaders(doc, columns, columnWidths, startX, startY);

  doc.font('Helvetica').fontSize(9).fillColor('#334155');
  rows.forEach((row, rowIndex) => {
    if (y + ROW_HEIGHT > doc.page.height - PAGE_BOTTOM_MARGIN) {
      doc.addPage();
      y = drawTableHeaders(doc, columns, columnWidths, startX, 50);
      doc.font('Helvetica').fontSize(9).fillColor('#334155');
    }

    if (rowIndex % 2 === 0) {
      doc.rect(startX, y - 3, TABLE_WIDTH, ROW_HEIGHT).fillColor('#f8fafc').fill();
    }

    doc.fillColor('#334155');
    let x = startX;
    row.forEach((cell, i) => {
      const value = cell != null && String(cell).trim() !== '' ? String(cell) : 'N/A';
      doc.text(value, x + 2, y, { width: columnWidths[i] - 4, align: 'left', lineBreak: false, ellipsis: true });
      x += columnWidths[i];
    });
    y += ROW_HEIGHT;
  });

  doc.fillColor('#000000');
  doc.y = y;
  return y;
};

/** Crea un PDFDocument ya conectado a la respuesta HTTP con headers de descarga. */
const iniciarDocumento = (res, filename) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.on('error', (err) => {
    console.error('[reports] Error de stream PDF:', err.message);
    if (!res.headersSent) res.status(500).json({ error: 'Error al generar el PDF' });
    else res.end();
  });
  doc.pipe(res);
  return doc;
};

/** Reporte tabular estándar: encabezado, fecha, tabla, total y pie. */
const streamTableReport = (res, { filename, title, columns, rows, columnWidths, totalLabel }) => {
  const doc = iniciarDocumento(res, filename);
  try {
    addHeader(doc, title);
    doc.fontSize(10).font('Helvetica').fillColor('#64748b')
      .text(`Fecha del reporte: ${new Date().toLocaleDateString('es-ES')}`, TABLE_X, doc.y);
    doc.moveDown(1);

    if (!rows || rows.length === 0) {
      doc.fontSize(11).font('Helvetica').fillColor('#64748b')
        .text('No hay registros para mostrar.', TABLE_X, doc.y);
    } else {
      addTable(doc, columns, rows, { columnWidths });
    }

    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b')
      .text(`${totalLabel}: ${rows ? rows.length : 0}`, TABLE_X);

    addFooter(doc);
  } catch (e) {
    console.error('[reports] Error generando PDF:', e.message);
  } finally {
    doc.end();
  }
};

module.exports = {
  fmtDate, addHeader, addFooter, addTable, iniciarDocumento, streamTableReport,
  TABLE_X, TABLE_WIDTH,
};
