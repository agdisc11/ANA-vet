# 🎯 GUÍA RÁPIDA - Generador de PDFs

## 📱 Ubicación en la Interfaz

### Página Principal: **Reportes**
- Menú: `Reportes` en el sidebar
- Contiene 6 botones principales de generación de PDFs
- Cada botón tiene un color distintivo
- Estadísticas en tiempo real en tarjetas

## 🎨 Botones Disponibles

### 1. 📊 Reporte General
- **Color:** Azul
- **Función:** Resumen ejecutivo del sistema
- **Contenido:** Estadísticas totales de todas las categorías
- **Uso:** Vista rápida del estado general

### 2. 🐾 Pacientes
- **Color:** Verde
- **Función:** Listado completo de pacientes
- **Contenido:** Nombre, especie, raza, edad, peso, tutor, teléfono
- **Uso:** Consulta rápida de todos los pacientes

### 3. 🏥 Hospitalizaciones
- **Color:** Rojo
- **Función:** Historial de internaciones
- **Contenido:** Paciente, tutor, fechas, diagnóstico, observaciones
- **Uso:** Seguimiento de pacientes hospitalizados

### 4. ⚕️ Cirugías
- **Color:** Púrpura
- **Función:** Historial de operaciones quirúrgicas
- **Contenido:** Paciente, tipo de cirugía, fecha, duración, observaciones
- **Uso:** Registro de procedimientos quirúrgicos

### 5. 📋 Consultas
- **Color:** Amarillo
- **Función:** Historial de consultas médicas
- **Contenido:** Paciente, fecha, motivo, diagnóstico, tratamiento
- **Uso:** Seguimiento de atenciones veterinarias

### 6. 💉 Vacunas
- **Color:** Índigo
- **Función:** Historial de vacunaciones
- **Contenido:** Paciente, fecha, vacuna, próxima dosis
- **Uso:** Control de protecciones vacunales

## 🎛️ Opciones por Botón

Hacer clic en cualquier botón abre un menú con 3 opciones:

```
┌─────────────────────┐
│ 📥 Descargar       │ ← Guarda el PDF en la computadora
├─────────────────────┤
│ 👁️ Vista Previa    │ ← Abre en nueva ventana/pestaña
├─────────────────────┤
│ 🖨️ Imprimir        │ ← Abre diálogo de impresión
├─────────────────────┤
│ ✖️ Cerrar           │ ← Cierra el menú
└─────────────────────┘
```

## 🔄 Flujo de Uso

```
1. Ir a página "Reportes"
   ↓
2. Seleccionar tipo de reporte
   ↓
3. Hacer clic en el botón
   ↓
4. Elegir acción: Descargar / Vista previa / Imprimir
   ↓
5. Se abre el menú desplegable
   ↓
6. Hacer clic en la opción deseada
   ↓
7. El PDF se genera automáticamente
   ↓
8. Acción completada ✓
```

## 💾 Descarga Automática

Cuando descarcas un reporte, el archivo se guarda con un nombre como:
```
reporte_pacientes_1715848932451.pdf
reporte_cirugias_1715848932451.pdf
expediente_Fluffy_1715848932451.pdf
```

El número es un timestamp (fecha y hora en milisegundos)

## 👁️ Vista Previa

Abre el PDF en una nueva pestaña del navegador.
Desde allí puedes:
- Leer el documento completo
- Usar los controles del visor PDF
- Hacer zoom
- Descargar si lo deseas

## 🖨️ Impresión

Abre el diálogo nativo de impresión del navegador.
Puedes:
- Elegir impresora
- Configurar papel (A4, Carta, etc)
- Márgenes
- Orientación (portrait/landscape)
- Vista previa de impresión

## 📄 Estructura de los PDFs

### Encabezado (igual en todos)
```
═════════════════════════════════════════
     CLÍNICA VETERINARIA
     Ana Veterinaria
     [TÍTULO DEL REPORTE]
═════════════════════════════════════════
```

### Cuerpo Principal
Tabla con datos formateados:
- Encabezados en negrita
- Filas alternadas
- Bordes claros
- Información legible

### Pie de Página
```
Fecha del reporte: DD/MM/YYYY
Total de registros: XX
```

## ⚡ Datos en Tiempo Real

- Cada reporte se genera **en el momento** que lo solicitas
- Los datos son **los más actuales** de la base de datos
- Los cambios recientes se reflejan inmediatamente
- No hay cachés ni datos anticuados

## 🔒 Información Incluida

### Por Tipo de Reporte:

**Reporte General:**
- Total de pacientes
- Total de tutores
- Total de consultas
- Total de hospitalizaciones
- Total de cirugías
- Total de vacunas

**Reporte de Pacientes:**
- Nombre del paciente
- Especie (gato, perro, etc)
- Raza
- Edad
- Peso
- Nombre del tutor
- Teléfono del tutor

**Reporte de Hospitalizaciones:**
- Paciente
- Tutor
- Fecha de ingreso
- Fecha de salida
- Diagnóstico
- Observaciones

**Reporte de Cirugías:**
- Paciente
- Tutor
- Fecha de la cirugía
- Tipo de cirugía
- Duración
- Observaciones

**Reporte de Consultas:**
- Paciente
- Tutor
- Fecha
- Motivo de la consulta
- Diagnóstico
- Tratamiento

**Reporte de Vacunas:**
- Paciente
- Tutor
- Fecha de vacunación
- Nombre de la vacuna
- Próxima dosis programada

## 🎯 Casos de Uso

### 1. Administración
"Necesito un resumen del estado del sistema"
→ **Usar: Reporte General**

### 2. Facturación
"Debo enviar listado de pacientes atendidos"
→ **Usar: Reporte de Consultas**

### 3. Seguimiento Médico
"El paciente se hospitalizó hace 3 días"
→ **Usar: Reporte de Hospitalizaciones**

### 4. Archivo del Paciente
"Necesito el expediente de Luna"
→ **Usar: Botón "Expediente PDF" en ficha de paciente**

### 5. Registros Quirúrgicos
"Documentar cirugías del mes"
→ **Usar: Reporte de Cirugías**

### 6. Control Sanitario
"Verificar vacunaciones actualizadas"
→ **Usar: Reporte de Vacunas**

## ⚠️ Notas Importantes

### Límites de Datos
- Reportes generales: Sin límite
- Listado de pacientes: Todos los registros
- Hospitalizaciones/Cirugías/Consultas/Vacunas: Últimas 50 registiones

### Requisitos
- Los datos deben estar registrados en el sistema
- La base de datos debe estar conectada
- Se necesita una conexión a internet

### Navegadores Compatibles
- Chrome ✅
- Firefox ✅
- Edge ✅
- Safari ✅

## 🆘 Solución de Problemas

### "El PDF está vacío"
→ Verificar que hay datos registrados en el sistema

### "Error al generar el reporte"
→ Revisar que la base de datos está conectada

### "No puedo descargar"
→ Permitir descargas en la configuración del navegador

### "El PDF no se abre"
→ Instalar/actualizar un lector de PDF

## 📞 Soporte

Para problemas técnicos:
1. Revisar la documentación completa en `GENERADOR_PDFS_DOCUMENTACION.md`
2. Ver ejemplos en `EJEMPLOS_INTEGRACION_PDF.js`
3. Consultar resumen técnico en `RESUMEN_IMPLEMENTACION_PDF.md`

---

**Última actualización:** Mayo 2026
**Versión:** 1.0
