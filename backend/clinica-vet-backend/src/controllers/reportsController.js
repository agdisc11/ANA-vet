const asyncHandler = require('../middleware/asyncHandler');
const { NotFoundError } = require('../errors/ApiError');
const {
  fmtDate, addHeader, addFooter, addTable, iniciarDocumento, streamTableReport,
  TABLE_X, TABLE_WIDTH,
} = require('../pdf/ReportePdf');

/**
 * Controlador de reportes PDF (factory con DI).
 * El SQL vive en ReporteRepository; el diseño visual en pdf/ReportePdf.
 * Aquí solo se mapean filas → columnas de cada reporte.
 */
function crearReportsController({ reporteRepository }) {
  return {
    reportePacientes: asyncHandler(async (req, res) => {
      const rows = await reporteRepository.pacientes(req.user.clinica_id);
      streamTableReport(res, {
        filename: `reporte_pacientes_${Date.now()}.pdf`,
        title: 'REPORTE DE PACIENTES',
        columns: ['Nombre', 'Especie', 'Raza', 'Edad', 'Tutor', 'Teléfono'],
        columnWidths: [90, 70, 70, 50, 110, 90],
        totalLabel: 'Total de pacientes',
        rows: rows.map((r) => [
          r.nombre, r.especie, r.raza,
          r.edad != null ? `${r.edad} años` : 'N/A',
          r.tutor_nombre, r.telefono,
        ]),
      });
    }),

    reporteTutores: asyncHandler(async (req, res) => {
      const rows = await reporteRepository.tutores(req.user.clinica_id);
      streamTableReport(res, {
        filename: `reporte_tutores_${Date.now()}.pdf`,
        title: 'REPORTE DE TUTORES',
        columns: ['Nombre', 'Apellidos', 'Teléfono', 'Correo', 'Pacientes'],
        columnWidths: [100, 110, 80, 130, 60],
        totalLabel: 'Total de tutores',
        rows: rows.map((r) => [
          r.nombre, r.apellidos, r.telefono, r.correo, String(r.total_pacientes ?? 0),
        ]),
      });
    }),

    reporteHospitalizaciones: asyncHandler(async (req, res) => {
      const rows = await reporteRepository.hospitalizaciones(req.user.clinica_id);
      streamTableReport(res, {
        filename: `reporte_hospitalizaciones_${Date.now()}.pdf`,
        title: 'REPORTE DE HOSPITALIZACIONES',
        columns: ['Paciente', 'Tutor', 'Fecha Ingreso', 'Tipo Alta'],
        columnWidths: [130, 130, 110, 110],
        totalLabel: 'Total de hospitalizaciones registradas',
        rows: rows.map((r) => [
          r.paciente_nombre, r.tutor_nombre, fmtDate(r.fecha_ingreso), r.tipo_alta || 'Activo',
        ]),
      });
    }),

    reporteCirugias: asyncHandler(async (req, res) => {
      const rows = await reporteRepository.cirugias(req.user.clinica_id);
      streamTableReport(res, {
        filename: `reporte_cirugias_${Date.now()}.pdf`,
        title: 'REPORTE DE CIRUGÍAS',
        columns: ['Paciente', 'Tutor', 'Fecha', 'Procedimiento'],
        columnWidths: [120, 120, 90, 150],
        totalLabel: 'Total de cirugías registradas',
        rows: rows.map((r) => [
          r.paciente_nombre, r.tutor_nombre, fmtDate(r.fecha), r.procedimiento,
        ]),
      });
    }),

    reporteConsultas: asyncHandler(async (req, res) => {
      const rows = await reporteRepository.consultas(req.user.clinica_id);
      streamTableReport(res, {
        filename: `reporte_consultas_${Date.now()}.pdf`,
        title: 'REPORTE DE CONSULTAS',
        columns: ['Paciente', 'Tutor', 'Fecha', 'Motivo', 'Diagnóstico'],
        columnWidths: [90, 100, 70, 100, 120],
        totalLabel: 'Total de consultas registradas',
        rows: rows.map((r) => [
          r.paciente_nombre, r.tutor_nombre, fmtDate(r.fecha),
          r.motivo, r.dx_definitivo || r.dx_presuntivo,
        ]),
      });
    }),

    reporteVacunas: asyncHandler(async (req, res) => {
      const rows = await reporteRepository.vacunas(req.user.clinica_id);
      streamTableReport(res, {
        filename: `reporte_vacunas_${Date.now()}.pdf`,
        title: 'REPORTE DE VACUNAS',
        columns: ['Paciente', 'Tutor', 'Fecha Aplicación', 'Vacuna', 'Próxima Dosis'],
        columnWidths: [100, 100, 90, 100, 90],
        totalLabel: 'Total de vacunas registradas',
        rows: rows.map((r) => [
          r.paciente_nombre, r.tutor_nombre, fmtDate(r.fecha_aplicacion), r.nombre, fmtDate(r.proxima_dosis),
        ]),
      });
    }),

    reporteGeneral: asyncHandler(async (req, res) => {
      const stats = await reporteRepository.resumenGeneral(req.user.clinica_id);
      const doc = iniciarDocumento(res, `reporte_general_${Date.now()}.pdf`);
      try {
        addHeader(doc, 'REPORTE GENERAL — RESUMEN EJECUTIVO');
        doc.fontSize(10).font('Helvetica').fillColor('#64748b').text(
          `Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`,
          TABLE_X, doc.y
        );
        doc.moveDown(1.5);

        addTable(doc, ['Concepto', 'Total'], [
          ['Pacientes', String(stats.pacientes || 0)],
          ['Tutores', String(stats.tutores || 0)],
          ['Consultas', String(stats.consultas || 0)],
          ['Hospitalizaciones', String(stats.hospitalizaciones || 0)],
          ['Cirugías', String(stats.cirugias || 0)],
          ['Vacunas', String(stats.vacunas || 0)],
        ], { columnWidths: [300, 180] });

        doc.moveDown(2);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text('NOTAS:', TABLE_X);
        doc.fontSize(10).font('Helvetica').fillColor('#334155')
          .text('Este reporte contiene un resumen ejecutivo de todas las operaciones registradas en el sistema.', TABLE_X, doc.y, { width: TABLE_WIDTH });
        doc.text('Para más detalles específicos, consultar los reportes individuales de cada módulo.', TABLE_X, doc.y, { width: TABLE_WIDTH });

        addFooter(doc);
      } catch (e) {
        console.error('[reports] Error generando PDF:', e.message);
      } finally {
        doc.end();
      }
    }),

    reporteExpediente: asyncHandler(async (req, res) => {
      const clinicaId = req.user.clinica_id;
      const { paciente_id: pacienteId } = req.params;

      const data = await reporteRepository.fichaPaciente(pacienteId, clinicaId);
      if (!data) throw new NotFoundError('Paciente no encontrado en esta clínica');

      const [consultas, vacunas] = await Promise.all([
        reporteRepository.historialConsultas(pacienteId, clinicaId),
        reporteRepository.historialVacunas(pacienteId, clinicaId),
      ]);

      const filename = `expediente_${String(data.nombre || 'paciente').replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`;
      const doc = iniciarDocumento(res, filename);

      try {
        addHeader(doc, 'EXPEDIENTE MÉDICO DEL PACIENTE');

        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text('INFORMACIÓN DEL PACIENTE', TABLE_X, doc.y);
        doc.moveDown(0.4);
        doc.fontSize(10).font('Helvetica').fillColor('#334155');
        doc.text(`Nombre: ${data.nombre || 'N/A'}        Especie: ${data.especie || 'N/A'}        Raza: ${data.raza || 'N/A'}`);
        doc.text(`Edad: ${data.edad != null ? data.edad + ' años' : 'N/A'}        Sexo: ${data.sexo || 'N/A'}`);
        if (data.tatuaje) doc.text(`Tatuaje: ${data.tatuaje}`);
        if (data.microchip) doc.text(`Microchip: ${data.microchip}`);
        if (data.esquemas_preventivos) doc.text(`Esquemas preventivos: ${data.esquemas_preventivos}`);

        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text('INFORMACIÓN DEL TUTOR', TABLE_X, doc.y);
        doc.moveDown(0.4);
        doc.fontSize(10).font('Helvetica').fillColor('#334155');
        doc.text(`Nombre: ${[data.tutor_nombre, data.tutor_apellidos].filter(Boolean).join(' ') || 'N/A'}`);
        doc.text(`Teléfono: ${data.telefono || 'N/A'}        Dirección: ${data.direccion || 'N/A'}`);

        doc.moveDown(1.2);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text('HISTORIAL DE CONSULTAS', TABLE_X, doc.y);
        doc.moveDown(0.5);
        if (consultas.length === 0) {
          doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Sin consultas registradas.', TABLE_X, doc.y);
        } else {
          addTable(doc, ['Fecha', 'Motivo', 'Dx Presuntivo'], consultas.map((c) => [
            fmtDate(c.fecha), c.motivo, c.dx_presuntivo,
          ]), { columnWidths: [90, 200, 190] });
        }

        doc.moveDown(1.2);
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e293b').text('HISTORIAL DE VACUNAS', TABLE_X, doc.y);
        doc.moveDown(0.5);
        if (vacunas.length === 0) {
          doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Sin vacunas registradas.', TABLE_X, doc.y);
        } else {
          addTable(doc, ['Vacuna', 'Fecha Aplicación', 'Próxima Dosis'], vacunas.map((v) => [
            v.nombre, fmtDate(v.fecha_aplicacion), fmtDate(v.proxima_dosis),
          ]), { columnWidths: [200, 140, 140] });
        }

        doc.moveDown(1.5);
        doc.fontSize(9).font('Helvetica').fillColor('#94a3b8')
          .text(`Expediente generado: ${new Date().toLocaleDateString('es-ES')}`, TABLE_X, doc.y, { align: 'right', width: TABLE_WIDTH });

        addFooter(doc);
      } catch (e) {
        console.error('[reports] Error generando PDF:', e.message);
      } finally {
        doc.end();
      }
    }),
  };
}

module.exports = { crearReportsController };
