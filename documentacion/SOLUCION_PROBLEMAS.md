# 🔧 SOLUCIÓN DE PROBLEMAS - Sistema de Generador de PDFs

## 🚨 Errores Comunes y Soluciones

### 1. Error: "GET /api/reports/pacientes 404 Not Found"

**Causa:** Las rutas no están registradas en el servidor.

**Solución:**
1. Verificar que `index.js` tiene esta línea:
```javascript
app.use('/api/reports', require('./src/routes/reports'));
```

2. Verificar que el archivo `src/routes/reports.js` existe y tiene el contenido correcto.

3. Reiniciar el servidor:
```bash
npm run dev
```

---

### 2. Error: "Module not found: 'pdfkit'"

**Causa:** La dependencia no está instalada.

**Solución:**
```bash
cd backend/clinica-vet-backend
npm install pdfkit
npm install html-pdf
```

Verificar instalación:
```bash
npm list pdfkit
npm list html-pdf
```

---

### 3. Error: "Cannot find module '../db/connection'"

**Causa:** Ruta incorrecta a la base de datos.

**Solución:**
1. Verificar que existe `src/db/connection.js`
2. Verificar las rutas relativas en `reportsController.js`
3. Las rutas son correctas si están en `src/controllers/reportsController.js`

---

### 4. PDF Vacío o Sin Datos

**Causa:** No hay datos en la base de datos.

**Solución:**
1. Verificar que existen registros en las tablas:
```sql
SELECT COUNT(*) FROM paciente;
SELECT COUNT(*) FROM consulta;
-- etc.
```

2. Si no hay datos, agregar registros primero.

3. Verificar que las queries en `reportsController.js` son correctas para tu estructura de BD.

---

### 5. Error en Frontend: "API is not defined"

**Causa:** El import de API no está correcto.

**Solución en PDFReportButton.js:**
```javascript
// Verificar que está al inicio del archivo:
import API from '../api';
```

Verificar que el archivo `src/api.js` existe y exporta la instancia de axios.

---

### 6. Error: "CORS policy: No 'Access-Control-Allow-Origin' header"

**Causa:** CORS no está habilitado en el backend.

**Solución en index.js:**
```javascript
const cors = require('cors');
app.use(cors()); // Debe estar ANTES de las rutas
```

El orden correcto es:
```javascript
const cors = require('cors');
const express = require('express');
const app = express();

app.use(cors());
app.use(express.json());

// Luego las rutas
app.use('/api/reports', require('./src/routes/reports'));
```

---

### 7. Botón "PDFReportButton" No Se Muestra

**Causa:** El componente no está importado correctamente.

**Solución en Reportes.js:**
```javascript
// Verificar que está al inicio:
import PDFReportButton from '../components/PDFReportButton';

// Y en el JSX:
<PDFReportButton 
  reportType="pacientes" 
  label="Descargar"
/>
```

---

### 8. Error: "Cannot read property 'get' of undefined"

**Causa:** API no está importada o la instancia no es correcta.

**Solución:**
```javascript
// En el componente:
import API from '../api';

// Verificar que API.get() existe
// En api.js debe estar exportado:
export default axios.create({
  baseURL: 'http://localhost:3001/api'
});
```

---

### 9. PDF Se Descarga pero No Se Abre

**Causa:** No hay lector de PDF instalado, o el navegador está bloqueando.

**Solución:**
1. Instalar lector de PDF (Adobe Reader, Foxit, etc)
2. Permitir descargas en configuración del navegador:
   - Chrome: Configuración → Privacidad y seguridad → Configuración de contenido → Descargas
   - Firefox: Preferencias → Privacidad y seguridad → Archivos y aplicaciones

---

### 10. PDF Se Ve Mal o Datos Desordenados

**Causa:** La tabla es muy ancha o datos muy largos.

**Solución en reportsController.js:**
Ajustar los anchos de columnas en la función `addTable()`:
```javascript
columnWidths: [80, 80, 80, 80, 80] // Aumentar o disminuir según necesario
```

Total debe ser ≈ 480 para A4

---

## 📊 Verificación de Conectividad

### Verificar Conexión con Base de Datos

```bash
# En terminal, conectarse a MySQL:
mysql -u usuario -p nombre_base_datos

# Ver si existen las tablas:
SHOW TABLES;

# Verificar si hay datos:
SELECT COUNT(*) FROM paciente;
SELECT COUNT(*) FROM consulta;
SELECT COUNT(*) FROM cirugia;
```

### Verificar Conexión con Backend

```bash
# En terminal, probar endpoint:
curl http://localhost:3001/api/reports/general

# O en navegador:
http://localhost:3001/api/reports/general

# Debe retornar un PDF (blob)
```

### Verificar Conexión con Frontend

```bash
# En consola del navegador (F12):
fetch('http://localhost:3001/api/reports/general')
  .then(r => r.blob())
  .then(blob => console.log(blob))
```

---

## 🐛 Debugging

### Habilitar Logs en Backend

En `reportsController.js`, agregar:
```javascript
exports.reportePacientes = (req, res) => {
  console.log('Generando reporte de pacientes...');
  
  const query = `...`;
  
  console.log('Query:', query);
  
  db.query(query, (err, rows) => {
    if (err) {
      console.error('Error de BD:', err);
      return res.status(500).json({ error: err.message });
    }
    
    console.log('Registros encontrados:', rows.length);
    
    // Resto del código...
  });
};
```

### Ver Logs en Navegador

En componente React, agregar en consola:
```javascript
const generarPDF = async (tipo) => {
  try {
    console.log('Generando', tipo);
    const response = await API.get(`/reports/${tipo}`, {
      responseType: 'blob'
    });
    console.log('Respuesta recibida:', response);
    // Resto del código...
  } catch (error) {
    console.error('Error completo:', error);
  }
};
```

---

## 🔄 Reiniciar Servicios

### Reiniciar Backend
```bash
# Presionar Ctrl+C en la terminal del backend
# Luego ejecutar:
npm run dev
```

### Reiniciar Frontend
```bash
# Presionar Ctrl+C en la terminal del frontend
# Luego ejecutar:
npm start
```

### Limpiar Cache

**Frontend (navegador):**
- Chrome: Ctrl+Shift+Delete → Vaciar caché
- Firefox: Ctrl+Shift+Delete → Vaciar ahora

**Node modules (si hay problemas de dependencias):**
```bash
# Backend
cd backend/clinica-vet-backend
rm -rf node_modules
npm install

# Frontend
cd frontend/clinica-vet-frontend
rm -rf node_modules
npm install
```

---

## ⚡ Optimización

### Si los PDFs se generan muy lentamente

1. **Reducir datos en consulta:**
```javascript
// Agregar LIMIT:
const query = 'SELECT * FROM paciente LIMIT 100';
```

2. **Crear índices en BD:**
```sql
CREATE INDEX idx_paciente_tutor ON paciente(tutor_id);
CREATE INDEX idx_consulta_paciente ON consulta(paciente_id);
```

3. **Usar SELECT específico:**
```javascript
// Mejor:
SELECT p.id, p.nombre, p.especie FROM paciente p

// Que:
SELECT * FROM paciente
```

### Si el tamaño del PDF es muy grande

1. Reducir número de registros
2. Incluir menos columnas
3. Usar compresión en imágenes (si las hay)

---

## 💾 Respaldo y Recuperación

### Hacer respaldo de archivos
```bash
# Backup de todo el sistema
zip -r backup_pdf_system.zip backend/clinica-vet-backend/src/controllers/reportsController.js backend/clinica-vet-backend/src/routes/reports.js frontend/clinica-vet-frontend/src/components/PDFReportButton.js frontend/clinica-vet-frontend/src/utils/pdfGenerator.js
```

### Restaurar después de error
1. Copiar archivos originales de backup
2. Reiniciar servicios
3. Limpiar cache del navegador

---

## 📞 Checklist de Verificación Rápida

Cuando algo no funciona:

- [ ] ¿Está corriendo el servidor backend? (`npm run dev`)
- [ ] ¿Está corriendo el frontend? (`npm start`)
- [ ] ¿Está conectada la base de datos?
- [ ] ¿Hay datos en la base de datos?
- [ ] ¿Las rutas están registradas en index.js?
- [ ] ¿Los archivos existen en las rutas correctas?
- [ ] ¿Los imports son correctos?
- [ ] ¿El puerto correcto es 3001 (backend) y 3000 (frontend)?
- [ ] ¿CORS está habilitado?
- [ ] ¿El navegador permite descargas?

---

## 📚 Referencias Útiles

### Documentación de Librerías
- PDFKit: https://pdfkit.org/
- html2canvas: https://html2canvas.hertzen.com/
- jsPDF: https://github.com/parallax/jsPDF
- Axios: https://axios-http.com/

### Archivos de Documentación del Proyecto
- `GENERADOR_PDFS_DOCUMENTACION.md` - Guía completa
- `EJEMPLOS_INTEGRACION_PDF.js` - Ejemplos de código
- `GUIA_RAPIDA_REPORTES.md` - Guía de usuario
- `RESUMEN_IMPLEMENTACION_PDF.md` - Detalles técnicos

---

**Último actualizado:** Mayo 2026
**Versión:** 1.0
**Contacto:** Sistema ANA Veterinaria
