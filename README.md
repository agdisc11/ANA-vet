# 🐾 ANA-vet — Sistema de Gestión Veterinaria SaaS

> **v3.0 — Arquitectura Multi-tenant Enterprise**  
> Proyecto Integrador · Desarrollo de Aplicaciones Web · Base de Datos · Calidad de Software

Sistema clínico veterinario **full-stack** construido con **React + Node.js + MySQL**. Incluye gestión de pacientes, expedientes clínicos, hospitalizaciones, cirugías, vacunas, reportes PDF, un módulo premium de **10 Calculadoras Clínicas** y una capa **Enterprise SaaS** con arquitectura multi-tenant, doble dashboard analítico, módulo financiero, CRM de tutores, inventario dinámico y sistema de roles dual.

---

## 🚀 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | React + React Router v6 | 18.x |
| **Estilos** | Tailwind CSS (modo oscuro nativo) | 3.x |
| **HTTP Client** | Axios | ^1.x |
| **Backend** | Node.js + Express.js | Express ^5.2.1 |
| **Base de datos** | MySQL / MariaDB | 8.x / 10.4 |
| **Autenticación** | JWT + bcryptjs | jwt ^9.0.3 / bcrypt ^3.0.3 |
| **Reportes PDF** | PDFKit (backend) + jsPDF/html2canvas (frontend) | pdfkit ^0.18.0 |
| **Seguridad** | Multi-tenant por `clinica_id` + RBAC | — |

---

## 🏢 Arquitectura SaaS Multi-tenant

ANA-vet opera como plataforma **multi-tenant**: cada clínica tiene sus datos completamente aislados mediante `clinica_id` propagado en cada consulta SQL y validado en cada request a través del **JWT**. No existe fuga de datos entre organizaciones.

```
Request → authMiddleware (verifica JWT, extrae clinica_id)
        → Route Handler (lógica de negocio)
        → SQL Query (WHERE clinica_id = ?)
        → Response
```

### 🔐 Sistema de Roles Dual

| Rol | Tipo en JWT | Acceso | Capacidades |
|-----|------------|--------|-------------|
| 👑 **Admin / Clínica** | `tipo: 'clinica'` | Dashboard analítico completo | KPIs financieros, scorecard de personal, inventario, gestión de empleados y roles |
| 🩺 **Empleado / Médico** | `tipo: 'empleado'` | Panel operativo médico | Agenda del día, tareas asignadas, solicitudes de insumos, acceso a expedientes |

**Middlewares de autorización:**
- `authMiddleware` — Verifica token JWT (cualquier usuario autenticado)
- `soloClinica` — Solo tipo `'clinica'` (administrador)
- `soloEmpleado` — Solo tipo `'empleado'`
- `clinicaOVeterinario` — Admin o Veterinario (rol_id = 2)

---

## 📦 Módulos del Sistema

### 🗂️ Gestión Clínica
- **Tutores** — Registro, CRM, soft-delete (inactivo/vetado), código único `TUT-{timestamp}`
- **Pacientes** — Fichas clínicas con especie, raza, microchip, tatuaje
- **Expedientes** — Historial médico completo con diagnóstico presuntivo y definitivo
- **Consultas** — Registro de citas con anamnesis, examen físico, tratamiento
- **Hospitalizaciones** — Control de internados con seguimiento diario y alta
- **Cirugías** — Procedimientos quirúrgicos con protocolo anestésico y equipo médico (N:M)
- **Vacunas** — Plan de vacunación con próxima dosis y recordatorios automáticos

### 📊 Reportes y Finanzas
- Generación de PDFs con encabezado corporativo (logo + nombre + línea separadora)
- Reportes individuales: Pacientes, Tutores, Consultas, Hospitalizaciones, Cirugías, Vacunas
- **Reporte General** — Resumen ejecutivo con estadísticas globales
- **Expediente PDF** — Ficha completa del paciente con datos del tutor
- **Recibos** — Flujo borrador → finalizado con ítems detallados y total calculado

### 📦 Inventario Dinámico
- Control de stock en tiempo real con alertas críticas (stock ≤ 5 unidades)
- Sistema de **solicitudes de reabastecimiento** para empleados
- Al completar una solicitud, el stock se actualiza automáticamente en inventario
- Alertas integradas en el dashboard del administrador

### 👥 Gestión de Personal
- **Onboarding automatizado**: correos institucionales generados automáticamente con resolución de conflictos
- Contraseñas temporales generadas con entropía (8 alfanuméricos + 1 especial)
- Scorecard de rendimiento visible para el administrador (consultas + cirugías + hospitalizaciones)
- Gestión de roles personalizados por clínica

### 🔔 Notificaciones y Alertas
- Vacunas con próxima dosis en los próximos **7 días**
- Consultas programadas para **hoy o mañana**
- Clasificación automática: cirugías (requiere ayuno), laboratorio, consulta general
- Campana de notificaciones con polling cada **5 minutos**

### 🧮 Calculadoras Clínicas (Módulo Avanzado)

Módulo de soporte para decisiones médicas en tiempo real con **10 categorías diagnósticas**, peso global del paciente compartido entre todos los módulos y catálogos dinámicos desde base de datos.

| Categoría | Herramientas |
|-----------|-------------|
| 💉 **Anestesia** | Flow rates O₂ (Mapleson/Círculo), Clasificación ASA I–V, Consumo de agente volátil |
| 🩸 **Blood Gas** | Interpretador ácido-base (pH/pCO₂/HCO₃), Anion Gap, Déficit de bicarbonato |
| ❤️ **Cardiac** | MAP `(PAS + 2×PAD) ÷ 3`, Presión de pulso con interpretación clínica |
| 🔄 **Conversiones** | Peso kg↔lb, Temperatura °C↔°F, Presiones, Suturas USP↔Métrico, 20 factores SI |
| 💧 **Fluidos** | Fluidoterapia con déficit, CRI, Osmolalidad sérica, Tabla K⁺ (5 rangos), Modal de emergencia |
| 🔬 **Hematología** | Transfusión sanguínea, Volumen sanguíneo, Sub-pantalla Flebotomía |
| 🥩 **Nutrición** | RER `70×(kg)^0.75`, DER con 23 factores de vida, Cantidad a alimentar en g/día |
| 💊 **Farmacia** | Dosis desde catálogo BD, volumen a administrar, matriz de compatibilidad de unidades |
| ☠️ **Toxicología** | Evaluación de exposición desde catálogo BD, alertas semáforo (leve/moderado/letal) |
| 📊 **Scores** | Pain Score Colorado, Glasgow Coma Score, SIRS, CMPS-SF con umbral dinámico |

---

## 🗄️ Estructura del Proyecto

```
ANA-vet/
├── backend/
│   └── clinica-vet-backend/
│       ├── index.js                         # Servidor Express, rutas, middlewares globales
│       ├── package.json
│       └── src/
│           ├── db/
│           │   └── connection.js            # Pool MySQL + Promise wrapper
│           ├── middleware/
│           │   ├── authMiddleware.js        # JWT + RBAC (soloClinica, soloEmpleado, etc.)
│           │   └── errorHandler.js          # Middleware global de errores
│           ├── controllers/
│           │   └── reportsController.js     # Generación de PDFs con PDFKit
│           └── routes/
│               ├── clinicas.js              # Registro, login, perfil de clínica
│               ├── empleados.js             # CRUD + onboarding automatizado
│               ├── roles.js                 # CRUD de roles por clínica
│               ├── tutores.js               # CRM + soft-delete + veto
│               ├── pacientes.js             # Fichas clínicas de animales
│               ├── expedientes.js           # Historial médico
│               ├── consultas.js             # Citas veterinarias
│               ├── hospitalizaciones.js     # Pacientes internados
│               ├── cirugias.js              # Procedimientos quirúrgicos
│               ├── vacunas.js               # Plan de vacunación
│               ├── recibos.js               # Módulo financiero (borrador → finalizado)
│               ├── inventario.js            # Stock + solicitudes de reabastecimiento
│               ├── dashboard.js             # KPIs Admin y Empleado
│               ├── notificaciones.js        # Alertas de vacunas y consultas próximas
│               ├── calculadora.js           # Catálogos de medicamentos y toxinas
│               └── reports.js               # Endpoints de generación de PDFs
└── frontend/
    └── clinica-vet-frontend/
        └── src/
            ├── api.js                       # Instancia axios con baseURL configurable
            ├── App.js                       # Router + ProtectedRoute + PublicRoute + AppShell
            ├── ThemeContext.js              # Modo oscuro/claro con localStorage
            ├── SelectedAnimalContext.js     # Animal activo + colores por especie/raza
            ├── context/
            │   └── AuthContext.js           # Sesión JWT, loginClinica, loginEmpleado, logout
            ├── components/
            │   ├── Sidebar.js               # Navegación con roles diferenciados
            │   ├── NotificacionesBell.js    # Campana con dropdown y polling 5min
            │   └── calculadoras/
            │       ├── Anestesia.js
            │       ├── BloodGas.js
            │       ├── Cardiac.js
            │       ├── Conversiones.js
            │       ├── Farmacia.js
            │       ├── Fluidos.js
            │       ├── Hematologia.js
            │       ├── Nutricion.js
            │       ├── Scores.js
            │       └── Toxicologia.js
            ├── pages/
            │   ├── Login.js                 # Login dual (Clínica / Empleado)
            │   ├── RegistroClinica.js       # Registro de nueva clínica
            │   ├── Dashboard.js             # Dashboard polimórfico (Admin vs Empleado)
            │   ├── Tutores.js
            │   ├── Pacientes.js
            │   ├── Expediente.js
            │   ├── Consulta.js
            │   ├── Hospitalizacion.js
            │   ├── Cirugia.js
            │   ├── Vacunas.js
            │   ├── ConsultasRegistro.js
            │   ├── HospitalizacionesRegistro.js
            │   ├── CirugiasRegistro.js
            │   ├── VacunasRegistro.js
            │   ├── Empleados.js
            │   ├── Recibo.js
            │   ├── Inventario.js
            │   ├── Reportes.js
            │   └── Calculadora.js           # Shell maestro de calculadoras
            └── utils/
                └── pdfGenerator.js          # Utilidades PDF en cliente (html2canvas + jsPDF)
```

---

## ⚙️ Instalación y Configuración

### Requisitos previos
- Node.js ≥ 18
- MySQL ≥ 8 o MariaDB ≥ 10.4
- npm ≥ 9

### 1. Base de Datos

```bash
# Crear la base de datos e importar el esquema completo
mysql -u root -p -e "CREATE DATABASE clinica_veterinaria CHARACTER SET utf8mb4;"
mysql -u root -p clinica_veterinaria < "clinica_veterinaria (4).sql"
```

### 2. Backend

```bash
cd backend/clinica-vet-backend
npm install
```

Crea el archivo `.env` en `backend/clinica-vet-backend/`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASS=tu_password
DB_NAME=clinica_veterinaria
PORT=4000
JWT_SECRET=tu_clave_secreta_jwt_muy_larga_y_segura
NODE_ENV=development
```

Inicia el servidor:

```bash
npm run dev      # Con nodemon (desarrollo)
node index.js    # Producción
```

El backend estará disponible en `http://localhost:4000`.

### 3. Frontend

```bash
cd frontend/clinica-vet-frontend
npm install
```

Crea el archivo `.env` en `frontend/clinica-vet-frontend/`:

```env
REACT_APP_API_URL=http://localhost:4000/api
```

Inicia la aplicación:

```bash
npm start
```

La app estará disponible en `http://localhost:3000`.

---

## 🔌 API Endpoints

### 🔐 Autenticación

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/clinicas/registro` | Registrar nueva clínica | ❌ |
| POST | `/api/clinicas/login` | Login de clínica (Admin) | ❌ |
| POST | `/api/empleados/login` | Login de empleado | ❌ |
| GET | `/api/clinicas/perfil` | Perfil de la clínica autenticada | ✅ |
| PUT | `/api/clinicas/perfil` | Actualizar perfil | ✅ Admin |
| PUT | `/api/clinicas/cambiar-password` | Cambiar contraseña | ✅ Admin |

### 🗂️ Gestión Clínica

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET/POST | `/api/tutores` | Listar / crear tutores | ✅ |
| PUT | `/api/tutores/:id` | Actualizar tutor | ✅ |
| DELETE | `/api/tutores/:id` | Dar de baja (soft delete) | ✅ Admin/Vet |
| PUT | `/api/tutores/:id/vetar` | Vetar tutor | ✅ Admin/Vet |
| GET/POST | `/api/pacientes` | Listar / crear pacientes | ✅ |
| PUT/DELETE | `/api/pacientes/:id` | Actualizar / eliminar paciente | ✅ |
| GET/POST | `/api/expedientes` | Listar / crear expedientes | ✅ |
| GET/POST | `/api/consultas` | Listar / crear consultas | ✅ |
| GET/POST | `/api/hospitalizaciones` | Listar / crear hospitalizaciones | ✅ |
| GET/POST | `/api/cirugias` | Listar / crear cirugías | ✅ |
| GET/POST | `/api/vacunas` | Listar / crear vacunas | ✅ |
| GET | `/api/vacunas/all` | Todas las vacunas de la clínica | ✅ |

### 📊 Dashboards

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/dashboard/clinica` | KPIs financieros, scorecard, alertas inventario | ✅ Admin |
| GET | `/api/dashboard/empleado` | Tareas del día (consultas + cirugías) | ✅ Empleado |

### 👥 Personal y Roles

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET/POST | `/api/empleados` | Listar / crear empleados (onboarding auto) | ✅ Admin |
| GET/PUT/DELETE | `/api/empleados/:id` | Gestión individual | ✅ Admin |
| PUT | `/api/empleados/:id/cambiar-password` | Cambiar contraseña | ✅ Admin |
| GET/POST | `/api/roles` | Listar / crear roles | ✅ Admin |
| GET/PUT/DELETE | `/api/roles/:id` | Gestión individual de rol | ✅ Admin |

### 💰 Recibos

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/recibos/:paciente_id` | Recibos de un paciente | ✅ |
| POST | `/api/recibos` | Crear recibo (status: borrador) | ✅ |
| PUT | `/api/recibos/:id` | Actualizar recibo / finalizar | ✅ |
| GET | `/api/recibos/:id/detalle` | Detalle completo con ítems | ✅ |
| DELETE | `/api/recibos/:id` | Eliminar (solo si es borrador) | ✅ |

### 📦 Inventario

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/inventario` | Listar productos | ✅ |
| POST | `/api/inventario` | Agregar producto | ✅ Admin |
| PUT | `/api/inventario/:id` | Actualizar producto | ✅ Admin |
| POST | `/api/inventario/reabastecer` | Solicitar reabastecimiento | ✅ |
| GET | `/api/inventario/solicitudes` | Listar solicitudes | ✅ Admin |
| PUT | `/api/inventario/solicitudes/:id` | Aprobar/completar solicitud | ✅ Admin |

### 📄 Reportes PDF

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/reports/pacientes` | PDF de pacientes | ✅ |
| GET | `/api/reports/tutores` | PDF de tutores | ✅ |
| GET | `/api/reports/consultas` | PDF de consultas | ✅ |
| GET | `/api/reports/hospitalizaciones` | PDF de hospitalizaciones | ✅ |
| GET | `/api/reports/cirugias` | PDF de cirugías | ✅ |
| GET | `/api/reports/vacunas` | PDF de vacunas | ✅ |
| GET | `/api/reports/general` | PDF resumen ejecutivo | ✅ |
| GET | `/api/reports/expediente/:paciente_id` | PDF de expediente individual | ✅ |

### 🔔 Notificaciones y Calculadoras

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/notificaciones` | Vacunas (7 días) + consultas (hoy/mañana) | ✅ |
| GET | `/api/calculadora/medicamentos` | Catálogo de medicamentos | ❌ |
| GET | `/api/calculadora/toxicologia` | Catálogo de toxinas | ❌ |

---

## 🗃️ Modelo de Datos (Resumen)

La base de datos contiene **22 tablas** organizadas en torno a la tabla maestra `clinicas`:

```
clinicas → roles → empleados
clinicas → tutor → paciente → expediente → consulta → diagnostico
                                                     → tratamiento
                                         → hospitalizacion → hospitalizacion_empleados
                                                           → seguimiento_hospitalizacion
                                                           → alta
                                         → cirugia → cirugia_empleados
                                                   → anestesia
                             → vacuna
clinicas → recibo → recibo_item → servicio_catalogo
clinicas → inventario
clinicas → solicitud_reabastecimiento
-- Globales (sin clinica_id):
catalogo_medicamentos
catalogo_toxicologia
```

> 📖 Ver documentación completa en [`DOC_BASE_DATOS.md`](./DOC_BASE_DATOS.md)

---

## 📚 Documentación del Proyecto

| Documento | Contenido |
|-----------|-----------|
| [`DOC_BASE_DATOS.md`](./DOC_BASE_DATOS.md) | Modelo de datos, tablas, relaciones, FK, índices, normalización (3FN), queries principales |
| [`DOC_POO.md`](./DOC_POO.md) | Principios de POO aplicados, patrones de diseño (Singleton, Observer, Factory, Strategy, Template Method, etc.), principios SOLID |
| [`DOC_CALIDAD.md`](./DOC_CALIDAD.md) | Seguridad (JWT, bcrypt, RBAC, multi-tenant), manejo de errores, refactorizaciones realizadas, buenas prácticas, métricas de calidad |

---

## 🎨 Características de UI/UX

- **Modo oscuro** nativo con Tailwind CSS (`dark:` classes) persistido en localStorage
- **Diseño responsivo** con grid adaptativo (1 → 2 → 3 → 6 columnas)
- **Animaciones suaves** en transiciones, hover y estados de carga (skeleton loaders)
- **Sidebar de navegación** con íconos SVG, estado activo y sección exclusiva para Admin
- **Dashboard polimórfico** — misma ruta `/`, vista diferente según el tipo de usuario
- **Semáforo de inventario** 🔴🟠 integrado en el dashboard Admin con alertas en tiempo real
- **Campana de notificaciones** con badge de conteo y dropdown flotante
- **Contexto de animal activo** — color dinámico en sidebar según especie/raza del paciente seleccionado
- **Calculadoras**: peso global compartido entre módulos, resultados destacados, fórmulas de referencia, alertas de riesgo con colores semáforo

---

## 🔒 Seguridad

| Medida | Implementación |
|--------|---------------|
| Autenticación | JWT con expiración de 8 horas |
| Contraseñas | bcrypt con 10 rounds de salt |
| Autorización | RBAC con 4 niveles de middleware |
| Multi-tenant | `clinica_id` en cada query SQL |
| Anti-IDOR | Verificación de pertenencia antes de cada operación |
| SQL Injection | Prepared statements (mysql2) en el 100% de queries |
| Sesión frontend | localStorage + header `Authorization: Bearer` |
| Cuentas suspendidas | Verificación de `activa`/`activo` en cada login |
| Variables sensibles | dotenv (`.env` no incluido en el repositorio) |

---

## 📋 Changelog

### v3.0.0 — Arquitectura SaaS Multi-tenant *(Mayo 2026)*
- ✅ Multi-tenant con aislamiento total por `clinica_id` + JWT
- ✅ Sistema de Roles Dual: Admin/Clínica y Empleado/Médico
- ✅ Doble Dashboard: Torre de Control analítica vs. Panel Operativo médico
- ✅ Onboarding automatizado de empleados (correo institucional + contraseña temporal bcrypt)
- ✅ Módulo Financiero: recibos con flujo borrador → finalizado + exportación PDF
- ✅ CRM de Tutores: soft-delete, veto, código único
- ✅ Inventario Dinámico: stock, alertas críticas, solicitudes de reabastecimiento
- ✅ Notificaciones: vacunas próximas (7 días) + consultas (hoy/mañana)
- ✅ Campana de notificaciones con polling automático cada 5 minutos
- ✅ Contexto de animal activo con colores dinámicos por especie/raza

### v2.0.0 — Módulo de Calculadoras Clínicas *(Mayo 2026)*
- ✅ 10 categorías de calculadoras clínicas veterinarias
- ✅ Catálogos de medicamentos y toxinas en base de datos MySQL
- ✅ Peso global del paciente compartido entre todos los módulos
- ✅ Alertas visuales de toxicidad (leve/moderado/letal)
- ✅ Interpretador automático de gases arteriales
- ✅ Scores clínicos interactivos (Pain Score Colorado, Glasgow, SIRS, CMPS-SF)

### v1.0.0 — Sistema Base *(2025)*
- ✅ Gestión completa de tutores, pacientes, expedientes
- ✅ Módulos de consultas, hospitalizaciones, cirugías, vacunas
- ✅ Generación de reportes PDF
- ✅ Modo oscuro y diseño responsivo

---

## 📄 Licencia

MIT — Uso libre para clínicas veterinarias.

---

*Desarrollado con ❤️ para la medicina veterinaria · ANA-vet © 2026*
