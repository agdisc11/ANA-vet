import React, { useState } from 'react';
import API from '../api';
import { downloadFile, openPDFInNewWindow, printPDF } from '../utils/pdfGenerator';

/**
 * Componente para generar y descargar reportes PDF
 * @param {string} reportType - Tipo de reporte (pacientes, cirugias, etc)
 * @param {boolean} showPreview - Mostrar opción de vista previa
 */
export default function PDFReportButton({ 
  reportType, 
  label = 'Descargar Reporte', 
  showPreview = true,
  showPrint = true,
  variant = 'primary',
  size = 'md'
}) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const generateReport = async (action = 'download') => {
    try {
      setLoading(true);
      const response = await API.get(`/reports/${reportType}`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const filename = `reporte_${reportType}_${Date.now()}.pdf`;

      if (action === 'download') {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentElement.removeChild(link);
      } else if (action === 'preview') {
        openPDFInNewWindow(blob);
      } else if (action === 'print') {
        printPDF(blob);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar el reporte');
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700',
    success: 'bg-green-600 hover:bg-green-700',
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-cyan-600 hover:bg-cyan-700'
  };

  const sizes = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg'
  };

  return (
    <div className="relative inline-block">
      {showMenu ? (
        <div className="absolute z-10 right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => generateReport('download')}
            disabled={loading}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14 1a1 1 0 11-2 0 1 1 0 012 0z"></path>
            </svg>
            Descargar
          </button>
          {showPreview && (
            <button
              onClick={() => generateReport('preview')}
              disabled={loading}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white flex items-center border-t border-gray-200 dark:border-gray-700"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
              </svg>
              Vista Previa
            </button>
          )}
          {showPrint && (
            <button
              onClick={() => generateReport('print')}
              disabled={loading}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white flex items-center border-t border-gray-200 dark:border-gray-700"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path>
              </svg>
              Imprimir
            </button>
          )}
          <button
            onClick={() => setShowMenu(false)}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700"
          >
            Cerrar
          </button>
        </div>
      ) : null}

      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className={`${variants[variant]} disabled:bg-gray-400 text-white font-bold ${sizes[size]} rounded-lg transition duration-200 flex items-center`}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"></path>
            </svg>
            {label}
            <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </>
        )}
      </button>
    </div>
  );
}
