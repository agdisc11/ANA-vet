import React, { useState } from 'react';
import API from '../api';

/**
 * Componente para generar reportes de expedientes médicos específicos
 */
export default function ExpedientePDFButton({ pacienteId, pacienteNombre, variant = 'info' }) {
  const [loading, setLoading] = useState(false);

  const handleGenerarExpediente = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/reports/expediente/${pacienteId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `expediente_${pacienteNombre}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generando expediente:', error);
      alert('Error al generar el expediente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerarExpediente}
      disabled={loading}
      className={`
        ${variant === 'info' ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-blue-600 hover:bg-blue-700'}
        disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg 
        transition duration-200 flex items-center
      `}
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
          Expediente PDF
        </>
      )}
    </button>
  );
}
