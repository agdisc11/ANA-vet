import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Genera un PDF desde un elemento HTML
 * @param {HTMLElement} element - El elemento a convertir a PDF
 * @param {string} filename - Nombre del archivo PDF
 * @param {object} options - Opciones adicionales
 */
export const generatePDFFromElement = async (element, filename, options = {}) => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      logging: false,
      useCORS: true,
      ...options
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    const doc = new jsPDF('p', 'mm');
    let position = 0;

    const imgData = canvas.toDataURL('image/png');

    // Agregar imagen(es) al PDF
    doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Descarga un archivo desde una URL
 * @param {string} url - URL del archivo
 * @param {string} filename - Nombre del archivo a descargar
 */
export const downloadFile = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const urlBlob = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = urlBlob;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.parentElement.removeChild(link);
    window.URL.revokeObjectURL(urlBlob);
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

/**
 * Abre un PDF en una nueva ventana
 * @param {Blob} pdfBlob - El blob del PDF
 */
export const openPDFInNewWindow = (pdfBlob) => {
  try {
    const url = window.URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error opening PDF:', error);
    throw error;
  }
};

/**
 * Imprime un PDF
 * @param {Blob} pdfBlob - El blob del PDF
 */
export const printPDF = (pdfBlob) => {
  try {
    const url = window.URL.createObjectURL(pdfBlob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow.print();
    };
  } catch (error) {
    console.error('Error printing PDF:', error);
    throw error;
  }
};
