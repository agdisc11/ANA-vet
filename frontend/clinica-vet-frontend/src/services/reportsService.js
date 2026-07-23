import API from '../api';

/**
 * Descargas de reportes PDF. Único lugar del frontend que sabe cómo pedir
 * un blob al backend y disparar la descarga en el navegador.
 */
async function descargarPdf(ruta, filename) {
  const res = await API.get(ruta, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const reportsService = {
  descargarExpediente: (pacienteId, nombre = 'paciente') =>
    descargarPdf(`/reports/expediente/${pacienteId}`, `expediente_${String(nombre).replace(/\s+/g, '_')}.pdf`),
  descargarReporte: (tipo) => descargarPdf(`/reports/${tipo}`, `reporte_${tipo}_${Date.now()}.pdf`),
};
