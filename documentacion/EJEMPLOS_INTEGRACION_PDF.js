// EJEMPLOS DE INTEGRACIÓN DEL GENERADOR DE PDFs

// ===================================
// 1. INTEGRACIÓN EN PÁGINA DE REPORTES (Reportes.js)
// ===================================
// Ya está implementado en Reportes.js
// Incluye 6 botones principales con colores diferentes

import { useEffect, useState } from 'react';
import API from '../api';

export function ReportesPage() {
  const [stats, setStats] = useState(null);
  const [generando, setGenerando] = useState(null);

  const generarPDF = async (tipo) => {
    try {
      setGenerando(tipo);
      const response = await API.get(`/reports/${tipo}`, {
        responseType: 'blob'
      });
      // Descarga automática
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_${tipo}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
    } finally {
      setGenerando(null);
    }
  };

  return (
    <div>
      <button onClick={() => generarPDF('general')}>Reporte General</button>
      <button onClick={() => generarPDF('pacientes')}>Reporte Pacientes</button>
    </div>
  );
}

// ===================================
// 2. INTEGRACIÓN EN PÁGINA DE PACIENTES (Pacientes.js)
// ===================================

import PDFReportButton from '../components/PDFReportButton';

export function PacientesPage() {
  return (
    <div>
      <h1>Gestión de Pacientes</h1>
      
      {/* Botón para descargar lista completa */}
      <div className="mb-4">
        <PDFReportButton 
          reportType="pacientes" 
          label="Descargar Lista de Pacientes"
          variant="success"
          showPreview={true}
          showPrint={true}
        />
      </div>

      {/* Lista de pacientes */}
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Especie</th>
            <th>Tutor</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {/* Filas de pacientes */}
        </tbody>
      </table>
    </div>
  );
}

// ===================================
// 3. INTEGRACIÓN EN PÁGINA DE CIRUGÍAS (Cirugias.js)
// ===================================

export function CirugiasPage() {
  return (
    <div>
      <h1>Registro de Cirugías</h1>
      
      {/* Botón para reporte de cirugías */}
      <div className="mb-4">
        <PDFReportButton 
          reportType="cirugias" 
          label="Generar Reporte de Cirugías"
          variant="danger"
          showPreview={true}
          showPrint={true}
        />
      </div>

      {/* Tabla de cirugías */}
    </div>
  );
}

// ===================================
// 4. INTEGRACIÓN EN PÁGINA DE CONSULTAS (Consulta.js)
// ===================================

export function ConsultasPage() {
  return (
    <div>
      <h1>Consultas</h1>
      
      <div className="mb-4">
        <PDFReportButton 
          reportType="consultas" 
          label="Descargar Reporte de Consultas"
          variant="warning"
        />
      </div>

      {/* Contenido de consultas */}
    </div>
  );
}

// ===================================
// 5. INTEGRACIÓN EN PÁGINA DE HOSPITALIZACIONES (Hospitalizacion.js)
// ===================================

export function HospitalizacionPage() {
  return (
    <div>
      <h1>Hospitalizaciones</h1>
      
      <div className="mb-4">
        <PDFReportButton 
          reportType="hospitalizaciones" 
          label="Reporte de Hospitalizaciones"
          variant="danger"
          showPreview={true}
        />
      </div>

      {/* Contenido de hospitalizaciones */}
    </div>
  );
}

// ===================================
// 6. INTEGRACIÓN EN PÁGINA DE VACUNAS (Vacunas.js)
// ===================================

export function VacunasPage() {
  return (
    <div>
      <h1>Vacunas</h1>
      
      <div className="mb-4">
        <PDFReportButton 
          reportType="vacunas" 
          label="Descargar Reporte de Vacunas"
          variant="indigo"
          showPrint={true}
        />
      </div>

      {/* Contenido de vacunas */}
    </div>
  );
}

// ===================================
// 7. INTEGRACIÓN EN FICHA DE PACIENTE (con Expediente)
// ===================================

import ExpedientePDFButton from '../components/ExpedientePDFButton';

export function FichaPaciente({ pacienteId, pacienteNombre }) {
  return (
    <div>
      <h1>{pacienteNombre}</h1>
      
      {/* Botón para descargar expediente médico del paciente */}
      <div className="mb-4">
        <ExpedientePDFButton 
          pacienteId={pacienteId}
          pacienteNombre={pacienteNombre}
          variant="info"
        />
      </div>

      {/* Información del paciente */}
    </div>
  );
}

// ===================================
// 8. INTEGRACIÓN PERSONALIZADA (Uso avanzado)
// ===================================

import { generatePDFFromElement, downloadFile, printPDF, openPDFInNewWindow } from '../utils/pdfGenerator';

export function ReportePersonalizado() {
  const handleGenerarReporte = async () => {
    // Obtener elemento a exportar
    const elemento = document.getElementById('contenido-reporte');
    
    // Generar PDF desde HTML
    await generatePDFFromElement(elemento, 'reporte-personalizado.pdf', {
      scale: 2,
      useCORS: true
    });
  };

  const handleVistaPrevia = async () => {
    try {
      const response = await fetch('/api/reports/general', {
        responseType: 'blob'
      });
      const blob = await response.blob();
      openPDFInNewWindow(blob);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleImprimir = async () => {
    try {
      const response = await fetch('/api/reports/general');
      const blob = await response.blob();
      printPDF(blob);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <button onClick={handleGenerarReporte}>Generar PDF del HTML</button>
      <button onClick={handleVistaPrevia}>Vista Previa</button>
      <button onClick={handleImprimir}>Imprimir</button>
      
      <div id="contenido-reporte">
        {/* Contenido a exportar */}
      </div>
    </div>
  );
}

// ===================================
// 9. INTEGRACIÓN CON MENÚ/NAVBAR
// ===================================

export function BarraHerramientas() {
  return (
    <div className="flex gap-2">
      <PDFReportButton 
        reportType="general"
        label="Exportar"
        size="sm"
        variant="primary"
      />
      
      <PDFReportButton 
        reportType="pacientes"
        label="Pacientes"
        size="sm"
        variant="success"
      />
      
      <PDFReportButton 
        reportType="cirugias"
        label="Cirugías"
        size="sm"
        variant="danger"
      />
    </div>
  );
}

// ===================================
// 10. INTEGRACIÓN CONDICIONAL
// ===================================

export function ReporteCondicional({ mostrarBoton = true, tipoReporte = 'general' }) {
  if (!mostrarBoton) return null;

  return (
    <PDFReportButton 
      reportType={tipoReporte}
      label={`Descargar ${tipoReporte}`}
      variant="primary"
    />
  );
}

// ===================================
// PROPIEDADES DISPONIBLES
// ===================================

/*
PDFReportButton Props:
  - reportType (string) - Tipo de reporte (requerido)
  - label (string) - Texto del botón
  - showPreview (boolean) - Mostrar opción vista previa
  - showPrint (boolean) - Mostrar opción imprimir
  - variant (string) - Color: primary, success, danger, warning, info
  - size (string) - Tamaño: sm, md, lg

ExpedientePDFButton Props:
  - pacienteId (number) - ID del paciente (requerido)
  - pacienteNombre (string) - Nombre del paciente para el archivo
  - variant (string) - Color del botón

generatePDFFromElement(element, filename, options)
  - element: HTMLElement a convertir
  - filename: nombre del archivo PDF
  - options: { scale, logging, useCORS }

downloadFile(url, filename)
  - Descargar archivo desde URL

openPDFInNewWindow(blob)
  - Abre PDF en nueva ventana

printPDF(blob)
  - Abre el diálogo de impresión
*/

// ===================================
// ENDPOINTS DISPONIBLES
// ===================================

/*
GET /api/reports/general
  - Reporte general con estadísticas
  - Retorna: PDF

GET /api/reports/pacientes
  - Listado de todos los pacientes
  - Retorna: PDF

GET /api/reports/hospitalizaciones
  - Historial de hospitalizaciones (últimas 50)
  - Retorna: PDF

GET /api/reports/cirugias
  - Historial de cirugías (últimas 50)
  - Retorna: PDF

GET /api/reports/consultas
  - Historial de consultas (últimas 50)
  - Retorna: PDF

GET /api/reports/vacunas
  - Historial de vacunas (últimas 50)
  - Retorna: PDF

GET /api/reports/expediente/:paciente_id
  - Expediente médico específico del paciente
  - Parámetros: paciente_id (integer)
  - Retorna: PDF
*/
