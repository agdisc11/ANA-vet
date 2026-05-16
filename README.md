# 🐾 ANA-vet — Sistema de Gestión para Clínica Veterinaria

> Aplicación web full-stack para la administración integral de una clínica veterinaria: pacientes, tutores, expedientes clínicos, consultas, hospitalizaciones, cirugías, vacunas y generación de reportes en PDF.

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Base de Datos](#-base-de-datos)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Módulos del Sistema](#-módulos-del-sistema)
- [Generación de PDFs](#-generación-de-pdfs)

---

## 📖 Descripción

**ANA-vet** es un sistema de gestión veterinaria diseñado para facilitar el trabajo clínico diario. Permite registrar y consultar toda la información médica de los pacientes (animales), sus tutores (dueños), y llevar un historial completo de consultas, hospitalizaciones, cirugías y vacunas. Además, cuenta con un módulo de reportes que genera documentos PDF de forma automática.

---

## ✨ Características

- 🐾 **Gestión de Pacientes** — Registro completo con especie, raza, sexo, microchip, tatuaje y esquemas preventivos
- 👤 **Gestión de Tutores** — Datos de contacto, WhatsApp, correo y dirección
- 📁 **Expedientes Clínicos** — Historial médico completo por paciente
- 📋 **Consultas** — Registro de motivo, anamnesis, examen físico, diagnóstico y tratamiento
- 🏥 **Hospitalizaciones** — Control de ingresos, seguimiento y altas médicas
- 🔪 **Cirugías** — Registro de procedimientos quirúrgicos con protocolo de anestesia
- 💉 **Vacunas** — Control de vacunación con fechas de próxima dosis
- 📈 **Reportes en PDF** — Generación automática de 7 tipos de reportes
- 🌙 **Modo Oscuro** — Interfaz adaptable a preferencias del usuario
- 📱 **Diseño Responsive** — Compatible con desktop, tablet y móvil

---

## 🛠️ Tecnologías

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | ^19.2.6 | Framework de UI |
| React Router DOM | ^7.15.0 | Navegación SPA |
| Axios | ^1.16.0 | Cliente HTTP |
| Tailwind CSS | ^3.4.19 | Estilos y diseño |
| jsPDF | ^4.2.1 | Generación de PDFs en cliente |
| html2canvas | ^1.4.1 | Captura de HTML para PDF |

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | — | Entorno de ejecución |
| Express | ^5.2.1 | Framework web / API REST |
| MySQL2 | ^3.22.3 | Conexión a base de datos |
| PDFKit | ^0.18.0 | Generación de PDFs en servidor |
| html-pdf | ^3.0.1 | Conversión HTML a PDF |
| dotenv | ^17.4.2 | Variables de entorno |
| cors | ^2.8.6 | Manejo de CORS |
| nodemon | ^3.1.14 | Recarga automática en desarrollo |

### Base de Datos
| Tecnología | Versión |
|---|---|
| MySQL / MariaDB | 10.4.32+ |

---

## 📁 Estructura del Proyecto

```
ANA-vet/
├── backend/
│   └── clinica-vet-backend/
│       ├── index.js                  # Punto de entrada del servidor
│       ├── package.json
│       ├── .gitignore
│       └── src/
│           ├── db/
│           │   └── connection.js     # Pool de conexión a MySQL
│           ├── controllers/
│           │   └── reportsController.js  # Lógica de generación de PDFs
│           └── routes/
│               ├── tutores.js
│               ├── pacientes.js
│               ├── expedientes.js
│               ├── consultas.js
│               ├── hospitalizaciones.js
│               ├── cirugias.js
│               ├── anestesia.js
│               ├── vacunas.js
│               └── reports.js
│
├── frontend/
│   └── clinica-vet-frontend/
│       ├── package.json
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── public/
│       └── src/
│           ├── App.js                # Rutas principales
│           ├── api.js                # Cliente Axios centralizado
│           ├── ThemeContext.js       # Contexto de tema (dark/light)
│           ├── SelectedAnimalContext.js  # Contexto de animal seleccionado
│           ├── components/
│           │   ├── Sidebar.js        # Navegación lateral
│           │   ├── PDFReportButton.js    # Botón genérico de reportes PDF
│           │   ├── ExpedientePDFButton.js # Botón PDF de expediente
│           │   └── Toast.js          # Notificaciones
│           ├── pages/
│           │   ├── Dashboard.js
│           │   ├── Tutores.js
│           │   ├── Pacientes.js
│           │   ├── Expediente.js
│           │   ├── Consulta.js
│           │   ├── ConsultasRegistro.js
│           │   ├── Hospitalizacion.js
│           │   ├── HospitalizacionesRegistro.js
│           │   ├── Cirugia.js
│           │   ├── CirugiasRegistro.js
│           │   ├── Vacunas.js
│           │   ├── VacunasRegistro.js
│           │   └── Reportes.js
│           └── utils/
│               └── pdfGenerator.js   # Funciones auxiliares para PDF
│
├── schema.sql                        # Esquema completo de la base de datos
├── ARQUITECTURA_Y_CALIDAD.md
├── IMPLEMENTACION_COMPLETA.md
└── README.md
```

---

## 🗄️ Base de Datos

La base de datos se llama `clinica_veterinaria` y utiliza **MySQL / MariaDB**. El esquema completo se encuentra en [`schema.sql`](./schema.sql).

### Diagrama de Entidades

```
TUTOR ──────< PACIENTE >──────< EXPEDIENTE
                  │                  │
                  │            ┌─────┼──────┐
                  │            │     │      │
               VACUNA      CONSULTA CIRUGIA HOSPITALIZACION
                               │       │           │
                          DIAGNOSTICO ANESTESIA  SEGUIMIENTO
                          TRATAMIENTO             ALTA
```

### Tablas Principales

| Tabla | Descripción |
|---|---|
| `tutor` | Dueños / responsables de los animales |
| `paciente` | Animales registrados en la clínica |
| `expediente` | Historial clínico por paciente |
| `consulta` | Consultas médicas |
| `diagnostico` | Diagnósticos asociados a consultas |
| `tratamiento` | Tratamientos prescritos en consultas |
| `hospitalizacion` | Registros de hospitalización |
| `seguimiento_hospitalizacion` | Seguimiento diario de hospitalizados |
| `alta` | Registro de altas hospitalarias |
| `cirugia` | Procedimientos quirúrgicos |
| `anestesia` | Protocolos anestésicos por cirugía |
| `vacuna` | Historial de vacunación |

---

## ⚙️ Instalación y Configuración

### Requisitos Previos

- [Node.js](https://nodejs.org/) v18 o superior
- [MySQL](https://www.mysql.com/) o [MariaDB](https://mariadb.org/) v10.4+
- [npm](https://www.npmjs.com/)

### 1. Clonar el repositorio

```bash
git clone https://github.com/agdisc11/vetapp.git
cd ANA-vet
```

### 2. Configurar la Base de Datos

1. Crear la base de datos en MySQL:
   ```sql
   CREATE DATABASE clinica_veterinaria;
   ```
2. Importar el esquema:
   ```bash
   mysql -u root -p clinica_veterinaria < schema.sql
   ```

### 3. Configurar el Backend

```bash
cd backend/clinica-vet-backend
npm install
```

Crear el archivo `.env` en `backend/clinica-vet-backend/`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=tu_contraseña
DB_NAME=clinica_veterinaria
PORT=4000
```

### 4. Configurar el Frontend

```bash
cd frontend/clinica-vet-frontend
npm install
```

> El frontend apunta por defecto a `http://localhost:4000/api`. Si cambias el puerto del backend, crea un archivo `.env` en `frontend/clinica-vet-frontend/` con:
> ```env
> REACT_APP_API_URL=http://localhost:4000/api
> ```

---

## 🚀 Uso

### Iniciar el Backend

```bash
cd backend/clinica-vet-backend
npm run dev
```

El servidor se iniciará en `http://localhost:4000`

### Iniciar el Frontend

```bash
cd frontend/clinica-vet-frontend
npm start
```

La aplicación se abrirá en `http://localhost:3000`

---

## 🔌 API Endpoints

### Tutores
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/tutores` | Listar todos los tutores |
| POST | `/api/tutores` | Crear tutor |
| PUT | `/api/tutores/:id` | Actualizar tutor |
| DELETE | `/api/tutores/:id` | Eliminar tutor |

### Pacientes
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/pacientes` | Listar todos los pacientes |
| POST | `/api/pacientes` | Crear paciente |
| PUT | `/api/pacientes/:id` | Actualizar paciente |
| DELETE | `/api/pacientes/:id` | Eliminar paciente |

### Expedientes
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/expedientes` | Listar expedientes |
| POST | `/api/expedientes` | Crear expediente |
| PUT | `/api/expedientes/:id` | Actualizar expediente |

### Consultas
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/consultas` | Listar consultas |
| POST | `/api/consultas` | Registrar consulta |
| PUT | `/api/consultas/:id` | Actualizar consulta |

### Hospitalizaciones
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/hospitalizaciones` | Listar hospitalizaciones |
| POST | `/api/hospitalizaciones` | Registrar hospitalización |
| PUT | `/api/hospitalizaciones/:id` | Actualizar hospitalización |

### Cirugías
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/cirugias` | Listar cirugías |
| POST | `/api/cirugias` | Registrar cirugía |
| PUT | `/api/cirugias/:id` | Actualizar cirugía |

### Anestesia
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/anestesia` | Listar protocolos |
| POST | `/api/anestesia` | Registrar protocolo |

### Vacunas
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/vacunas` | Listar vacunas |
| POST | `/api/vacunas` | Registrar vacuna |
| PUT | `/api/vacunas/:id` | Actualizar vacuna |

### Reportes PDF
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/reports/general` | Reporte general del sistema |
| GET | `/api/reports/pacientes` | Listado de pacientes |
| GET | `/api/reports/hospitalizaciones` | Historial de hospitalizaciones |
| GET | `/api/reports/cirugias` | Historial de cirugías |
| GET | `/api/reports/consultas` | Historial de consultas |
| GET | `/api/reports/vacunas` | Historial de vacunación |
| GET | `/api/reports/expediente/:paciente_id` | Expediente completo de un paciente |

### Estadísticas
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/stats` | Contadores globales del sistema |

---

## 📦 Módulos del Sistema

### 🏠 Dashboard
Vista general con estadísticas del sistema: total de tutores, pacientes, consultas, hospitalizaciones, cirugías y vacunas. Incluye accesos rápidos a todos los módulos.

### 👤 Tutores
Registro y gestión de los dueños o responsables de los animales. Campos: nombre, apellidos, teléfono, WhatsApp, correo, dirección y código único.

### 🐾 Pacientes
Registro de animales con información completa: especie, raza, sexo, fecha de nacimiento, función zootécnica, tatuaje, microchip y esquemas preventivos. Cada paciente está vinculado a un tutor.

### 📁 Expedientes
Historial clínico completo de cada paciente. Incluye anamnesis, examen físico, exámenes sistémicos, lista de problemas, diagnóstico presuntivo y definitivo.

### 📋 Consultas
Registro detallado de cada visita médica: motivo, anamnesis, examen físico, diagnóstico, tratamiento, seguimiento y resumen.

### 🏥 Hospitalizaciones
Control de pacientes internados con historia clínica, abordaje hospitalario, tratamiento intrahospitalario, seguimientos diarios y registro de alta.

### 🔪 Cirugías
Registro de procedimientos quirúrgicos con plan quirúrgico, notas, consentimiento informado y protocolo de anestesia (fármacos, dosis, observaciones).

### 💉 Vacunas
Control del esquema de vacunación: nombre de la vacuna, fecha de aplicación, próxima dosis, lote, fabricante, vía de administración y dosis.

### 📈 Reportes
Generación automática de reportes en PDF con 3 opciones por reporte: **Descargar**, **Vista Previa** e **Imprimir**.

---

## 📄 Generación de PDFs

El sistema incluye un módulo completo de generación de reportes en PDF disponible en la sección **Reportes** de la aplicación.

### Tipos de Reportes

| Reporte | Descripción |
|---|---|
| 📊 General | Resumen ejecutivo con estadísticas globales |
| 🐾 Pacientes | Listado completo de todos los pacientes |
| 🏥 Hospitalizaciones | Últimas 50 hospitalizaciones |
| 🔪 Cirugías | Últimas 50 cirugías |
| 📋 Consultas | Últimas 50 consultas médicas |
| 💉 Vacunas | Últimas 50 vacunas aplicadas |
| 📄 Expediente | Expediente médico completo de un paciente |

### Uso del Componente PDFReportButton

```jsx
import PDFReportButton from '../components/PDFReportButton';

export default function MiPagina() {
  return (
    <PDFReportButton 
      reportType="pacientes" 
      label="Descargar Pacientes"
      variant="success"
    />
  );
}
```

---

## 🎨 Características de la Interfaz

- **Dark Mode** — Alternancia entre modo claro y oscuro desde el sidebar
- **Color dinámico del sidebar** — El sidebar cambia de color según el animal seleccionado
- **Diseño responsive** — Adaptado para cualquier tamaño de pantalla
- **Notificaciones Toast** — Feedback visual para acciones del usuario
- **Navegación SPA** — Sin recargas de página gracias a React Router

---

## 🔒 Seguridad y Buenas Prácticas

- Variables de entorno para credenciales de base de datos (`.env`)
- CORS habilitado en el backend
- Pool de conexiones MySQL para mejor rendimiento
- PDFs generados bajo demanda (no se almacenan en el servidor)
- Integridad referencial con claves foráneas y `ON DELETE CASCADE`
- Base de datos normalizada en 3FN

---

## 📝 Licencia

Este proyecto es de uso privado para la clínica veterinaria **ANA-vet**.

---

<div align="center">
  <strong>🐾 ANA-vet — Sistema Veterinario</strong><br/>
  Desarrollado con ❤️ para el cuidado animal
</div>
