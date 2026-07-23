# Sistema de Generador de PDFs - Documentación

## 📋 Descripción General

Sistema completo de generación de reportes en PDF para la clínica veterinaria ANA. Incluye reportes detallados de pacientes, hospitalizaciones, cirugías, consultas, vacunas y reportes generales.

## 🚀 Características

- ✅ Generación de PDFs en backend con **pdfkit**
- ✅ Descarga, vista previa e impresión desde frontend
- ✅ Reportes responsivos y profesionales
- ✅ Incluye datos de pacientes, tutores y procedimientos
- ✅ Generación automática de timestamps
- ✅ Diseño limpio con encabezados y tablas formateadas

## 📦 Dependencias Instaladas

### Backend
```
pdfkit - Generador de PDFs
html-pdf - Convertidor HTML a PDF (alternativa)
```

### Frontend
```
html2canvas - Convertidor HTML a Canvas
jspdf - Librería de generación de PDF desde JavaScript
```

## 🔌 Endpoints API

### Reportes disponibles

```
GET /api/reports/general          - Reporte general (resumen ejecutivo)
GET /api/reports/pacientes        - Listado completo de pacientes
GET /api/reports/hospitalizaciones - Historial de hospitalizaciones
GET /api/reports/cirugias         - Historial de cirugías
GET /api/reports/consultas        - Historial de consultas
GET /api/reports/vacunas          - Historial de vacunas
GET /api/reports/expediente/:id   - Expediente médico individual
```

## 💻 Uso en Frontend

### 1. Botón Simple (Descarga)

```jsx
import PDFReportButton from '../components/PDFReportButton';

export default function MiComponente() {
  return (
    <PDFReportButton 
      reportType="pacientes" 
      label="Descargar Pacientes"
    />
  );
}
```

### 2. Botón con Opciones (Menú)

```jsx
<PDFReportButton 
  reportType="cirugias" 
  label="Generar Reporte"
  showPreview={true}
  showPrint={true}
  variant="danger"
  size="lg"
/>
```

### 3. Uso de Utilidades Directas

```jsx
import { generatePDFFromElement, downloadFile, printPDF } from '../utils/pdfGenerator';

// Generar PDF desde un elemento HTML
const handleGeneratePDF = async () => {
  const element = document.getElementById('contenido-a-exportar');
  await generatePDFFromElement(element, 'mi-reporte.pdf');
};

// Descargar archivo desde URL
const handleDownload = async () => {
  await downloadFile('/api/reports/pacientes', 'pacientes.pdf');
};
```

## 🎨 Variantes de Botón

### Colors (variant)
- `primary` - Azul
- `success` - Verde
- `danger` - Rojo
- `warning` - Amarillo
- `info` - Cyan

### Tamaños (size)
- `sm` - Pequeño
- `md` - Medio (default)
- `lg` - Grande

## 📋 Estructura de Reportes

### Reporte de Pacientes
- Nombre, Especie, Raza, Edad
- Peso, Tutor, Teléfono
- Tabla ordenada alfabéticamente

### Reporte de Hospitalizaciones
- Nombre del paciente, Tutor
- Fechas de ingreso y salida
- Diagnóstico y observaciones
- Últimas 50 hospitalizaciones

### Reporte de Cirugías
- Paciente, Tutor, Fecha
- Tipo de cirugía, Duración
- Observaciones detalladas

### Reporte de Consultas
- Paciente, Tutor, Fecha
- Motivo y Diagnóstico
- Tratamiento recomendado

### Reporte de Vacunas
- Paciente, Tutor, Fecha
- Nombre de la vacuna
- Próxima dosis programada

### Reporte General (Resumen Ejecutivo)
- Estadísticas totales de todas las categorías
- Vista rápida del estado del sistema
- Fecha y hora de generación

### Expediente Médico Individual
- Información completa del paciente
- Datos del tutor
- Historial médico y alergias
- Timestamp del expediente

## 🔧 Configuración

### Backend
Los reportes se generan automáticamente con:
- Encabezados con logo/nombre de clínica
- Tablas formateadas con bordes
- Información de fecha y hora
- Contador total de registros

### Frontend
Los botones incluyen:
- Indicador de carga (spinner)
- Menú desplegable con opciones
- Estados deshabilitados durante carga
- Iconos descriptivos

## 📱 Uso en Páginas Específicas

### En Pacientes.js
```jsx
import PDFReportButton from '../components/PDFReportButton';

// Agregar en el JSX
<PDFReportButton 
  reportType="pacientes" 
  label="Descargar Lista de Pacientes"
  variant="success"
/>
```

### En Cirugias.js
```jsx
<PDFReportButton 
  reportType="cirugias" 
  label="Generar Reporte de Cirugías"
  variant="danger"
/>
```

### En Hospitalizacion.js
```jsx
<PDFReportButton 
  reportType="hospitalizaciones" 
  label="Reporte de Hospitalizaciones"
  variant="warning"
/>
```

## 🐛 Solución de Problemas

### Error: "CORS"
- Verificar que los headers CORS están configurados en el backend
- Asegurar que el endpoint es accesible desde el frontend

### PDF vacío o incompleto
- Verificar que los datos existen en la base de datos
- Revisar la consulta SQL en el controller

### Problemas de fuentes en PDF
- Los PDFs usan fuentes estándar de pdfkit
- Para fuentes personalizadas, registrar con: `doc.registerFont()`

## 📊 Estadísticas de Uso

El sistema registra automáticamente:
- Fecha y hora de generación
- Número total de registros
- Información completa de pacientes y tutores
- Procedimientos realizados

## 🔐 Seguridad

- Los reportes se generan bajo demanda
- No se almacenan en el servidor (descarga directa)
- Incluyen solo información necesaria
- Pueden ser implementados con validaciones de usuario en el futuro

## 🎯 Próximas Mejoras

- [ ] Filtros por fecha en reportes
- [ ] Reportes personalizados por usuario
- [ ] Exportación a Excel
- [ ] Gráficos en los reportes
- [ ] Envío de reportes por email
- [ ] Programación automática de reportes
- [ ] Historial de reportes generados

---

**Última actualización:** Mayo 2026
**Versión:** 1.0
