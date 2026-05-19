# 🐾 ANA-vet — Sistema de Gestión Veterinaria SaaS

> **v3.0 — Arquitectura Multi-tenant Enterprise**

Sistema clínico veterinario **full-stack** construido con **React + Node.js + MySQL**. Incluye gestión de pacientes, expedientes clínicos, hospitalizaciones, cirugías, vacunas, reportes PDF, un módulo premium de **10 Calculadoras Clínicas** y una nueva capa **Enterprise SaaS** con arquitectura multi-tenant, doble dashboard analítico, módulo financiero oficial, CRM de tutores, inventario dinámico y sistema de roles dual.

---

## 🚀 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18, React Router v6, Tailwind CSS, Axios |
| Backend | Node.js, Express.js |
| Base de datos | MySQL 8 |
| Autenticación | JWT (JSON Web Tokens) + bcrypt |
| Reportes | jsPDF, html2canvas — Formato oficial PDF (FORM-030) |
| Estilos | Tailwind CSS (modo oscuro nativo) |
| Seguridad | Aislamiento multi-tenant por `clinica_id` en cada query |

---

## 🏢 Arquitectura SaaS Multi-tenant *(v3.0)*

ANA-vet opera como plataforma **multi-tenant**: cada clínica tiene sus datos completamente aislados mediante `clinica_id` propagado en cada consulta SQL y validado en cada request a través del **JWT**. No existe fuga de datos entre organizaciones.

```
Request → JWT Middleware (extrae clinica_id) → Route Handler → Query WHERE clinica_id = ? → Response
```

### 🔐 Sistema de Roles Dual

| Rol | Acceso | Capacidades |
|---|---|---|
| 👑 **Admin / Clínica** | Dashboard analítico completo | Métricas financieras, inventario total, gestión de personal, scorecard de rendimiento, notas de cobro |
| 🩺 **Empleado / Médico** | Panel operativo médico | Agenda del día, KPIs de tareas, solicitudes de insumos, acceso rápido a expedientes |

---

## 📦 Módulos del Sistema

### 🗂️ Gestión Clínica
- **Tutores** — Registro, gestión y CRM de propietarios (tags de comportamiento, vetos, purga en cascada)
- **Pacientes** — Fichas clínicas de animales
- **Expedientes** — Historial médico completo
- **Consultas** — Registro de citas veterinarias
- **Hospitalizaciones** — Control de pacientes internados
- **Cirugías** — Registro de procedimientos quirúrgicos con anestesia
- **Vacunas** — Plan de vacunación y seguimiento

### 📊 Reportes y Finanzas *(v3.0)*
- Generación de PDFs clínicos (consultas, cirugías, hospitalizaciones)
- Reportes de expediente completo
- **Notas de cobro** generadas automáticamente
- **Exportación de recibos** en formato oficial PDF (**FORM-030**)

### 📦 Inventario Dinámico *(v3.0)*
- Control de stock en tiempo real
- **Alertas críticas de semáforo** (🟢 normal / 🟡 bajo / 🔴 crítico) integradas en el dashboard
- Sistema de **solicitudes de reabastecimiento** para empleados
- Historial de movimientos por clínica

### 👥 Gestión de Personal *(v3.0)*
- **Onboarding automatizado**: creación de empleados con autogeneración de correos institucionales y contraseñas temporales encriptadas con **bcrypt**
- Scorecard de rendimiento del personal visible para Admin
- Asignación de roles y permisos por clínica

### 🔔 Servicio de Alertas — Worker *(v3.0)*
- Clasificación automática de eventos médicos
- Alertas de ayuno pre-quirúrgico para cirugías programadas
- Notificaciones de vencimiento de vacunas y seguimientos pendientes

### 🧮 Calculadoras Clínicas *(Módulo Avanzado — v2.0)*

Módulo de soporte para decisiones médicas en tiempo real con **10 categorías diagnósticas activas**, sincronización alométrica centralizada (peso global `pesoKg` compartido entre todos los módulos) y diseño oscuro premium con Tailwind CSS.

#### Arquitectura del módulo

| Capa | Implementación |
|---|---|
| **Base de datos** | MySQL — tablas `catalogo_medicamentos` y `catalogo_toxicologia` para catálogos dinámicos extensibles sin cambios de código |
| **API REST** | Node.js/Express — endpoints dedicados en `/api/calculadora/medicamentos` y `/api/calculadora/toxicologia` |
| **Frontend** | React funcional con Hooks (`useState`, `useEffect`) — consumo asíncrono con `axios` desde puerto 4000 |
| **Estado global** | Variable `pesoKg` propagada como prop desde el shell maestro `Calculadora.js` a todos los sub-módulos |
| **Constantes clínicas** | Objetos inmutables `const CLINICAL_CONSTANTS = Object.freeze({...})` al inicio de cada componente |

#### Categorías clínicas

| Categoría | Herramientas | Novedades v2.0 |
|---|---|---|
| 💉 **Anestesia** | Flow rates O₂ (Mapleson/Círculo), Clasificación ASA I–V, Consumo de agente volátil (Isoflurano/Sevoflurano) | — |
| 🩸 **Blood Gas** | Interpretador ácido-base (pH/pCO₂/HCO₃), Anion Gap, Déficit de bicarbonato | — |
| ❤️ **Cardiac** | MAP `(PAS + 2×PAD) ÷ 3`, Presión de pulso con interpretación clínica | — |
| 🔄 **Conversiones** | Peso kg↔lb, Temperatura °C↔°F, Líquidos, Presiones, Suturas USP↔Métrico | **Sub-pantalla Convencional ↔ SI** con 20 factores exactos (Hematología, Bioquímica, Endocrino & Fármacos) |
| 💧 **Fluidos** | Fluidoterapia con déficit, CRI, Osmolalidad sérica, Déficit de agua libre | **Tasa por especie** (Perro 60 mL/kg/día, Gato 45 mL/kg/día) · **Tabla K⁺** (5 rangos séricos) · **Modal de emergencia** con `animate-pulse` si tasa K⁺ > 0.5 mEq/kg/h |
| 🔬 **Hematología** | Transfusión sanguínea, Volumen sanguíneo estimado | **Sub-pantalla Flebotomía** con K=90 (perro)/70 (gato): `Peso × K × ((PCV actual − PCV deseado) / PCV actual)` · Validación en tiempo real PCV deseado < PCV actual |
| 🥩 **Nutrición** | RER `70×(kg)^0.75`, DER con 23 factores de vida, Cantidad a alimentar en g/día + porciones | — |
| 💊 **Farmacia** | Calculadora de dosis con catálogo desde BD, volumen a administrar | **Matriz de compatibilidad de unidades** — bloquea el botón calcular y muestra badge de error si unidad de dosis (ej. `U`) es incompatible con formulación (ej. `mg/mL`) |
| ☠️ **Toxicología** | Evaluación de exposición con catálogo desde BD, alertas semáforo (leve/moderado/letal) | — |
| 📊 **Scores** | Pain Score Colorado (0–4), Glasgow Coma Score modificado, SIRS (4 criterios) | **CMPS-SF** (6 secciones con radio buttons: Vocalización, Atención herida, Locomoción, Palpación, Ánimo, Postura) · Umbral dinámico: sin fractura ≥5/23, con fractura ≥6/24 · Alerta roja de rescate analgésico |

---

## 📊 Doble Dashboard Avanzado *(v3.0)*

### 👑 Torre de Control — Admin / Clínica
Panel analítico completo con visión 360° del negocio:
- 💰 **Métricas financieras**: ingresos del período, notas de cobro pendientes y pagadas
- 🏆 **Scorecard de rendimiento del personal**: consultas atendidas, puntualidad, satisfacción
- 🔴 **Alertas críticas de inventario** con semáforo en tiempo real
- 📈 Estadísticas globales de la clínica

### 🩺 Panel Operativo — Empleado / Médico
Panel de acción rápida orientado al flujo de trabajo médico:
- 📅 **Agenda médica del día**: citas, cirugías y hospitalizaciones activas
- ✅ **KPIs de tareas de hoy**: pendientes, en progreso, completadas
- 🔔 **Estatus dinámico**: alertas de ayuno, vacunas próximas, seguimientos
- 📦 **Solicitudes de insumos**: reabastecimiento directo desde el panel

---

## 🗄️ Estructura del Proyecto

```
ANA-vet/
├── backend/
│   └── clinica-vet-backend/
│       ├── index.js                    # Servidor Express + rutas + JWT middleware
│       └── src/
│           ├── db/connection.js
│           ├── middleware/
│           │   └── auth.js             # ← Validación JWT + extracción clinica_id
│           └── routes/
│               ├── tutores.js
│               ├── pacientes.js
│               ├── expedientes.js
│               ├── consultas.js
│               ├── hospitalizaciones.js
│               ├── cirugias.js
│               ├── anestesia.js
│               ├── vacunas.js
│               ├── reports.js
│               ├── calculadora.js      # ← Endpoints de catálogos clínicos
│               ├── dashboard.js        # ← Dashboards Admin y Empleado (v3.0)
│               ├── empleados.js        # ← Gestión de personal + onboarding (v3.0)
│               ├── inventario.js       # ← Stock, alertas y reabastecimiento (v3.0)
│               ├── finanzas.js         # ← Notas de cobro y recibos FORM-030 (v3.0)
│               └── alertas.js          # ← Worker de clasificación de eventos (v3.0)
└── frontend/
    └── clinica-vet-frontend/
        └── src/
            ├── pages/
            │   ├── DashboardAdmin.js   # ← Torre de control analítica (v3.0)
            │   ├── DashboardEmpleado.js# ← Panel operativo médico (v3.0)
            │   ├── Calculadora.js      # ← Shell maestro del módulo
            │   ├── Empleados.js        # ← Gestión de personal (v3.0)
            │   ├── Inventario.js       # ← Control de stock (v3.0)
            │   └── ...
            └── components/
                └── calculadoras/
                    ├── Anestesia.js
                    ├── BloodGas.js
                    ├── Cardiac.js
                    ├── Conversiones.js
                    ├── Farmacia.js
                    ├── Fluidos.js
                    ├── Hematologia.js
                    ├── Nutricion.js
                    ├── Scores.js
                    └── Toxicologia.js
```

---

## ⚙️ Instalación y Configuración

### Requisitos
- Node.js ≥ 18
- MySQL ≥ 8
- npm ≥ 9

### Backend

```bash
cd backend/clinica-vet-backend
npm install
```

Crea un archivo `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=clinica_vet
PORT=4000
JWT_SECRET=tu_clave_secreta_jwt
BCRYPT_ROUNDS=12
```

Importa el esquema base y las migraciones SaaS:
```bash
mysql -u root -p clinica_vet < schema.sql
mysql -u root -p clinica_vet < migration_saas.sql
mysql -u root -p clinica_vet < migration_empleados_medicos.sql
mysql -u root -p clinica_vet < migration_recibos.sql
```

Inicia el servidor:
```bash
node index.js
```

### Frontend

```bash
cd frontend/clinica-vet-frontend
npm install
npm start
```

La app estará disponible en `http://localhost:3000`.

---

## 🔌 API Endpoints

### 🔐 Autenticación
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Login — devuelve JWT con `clinica_id` y `rol` |
| POST | `/api/auth/refresh` | Renovación de token |

### 🗂️ Gestión Clínica
| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/api/tutores` | Tutores |
| GET/POST | `/api/pacientes` | Pacientes |
| GET/POST | `/api/expedientes` | Expedientes |
| GET/POST | `/api/consultas` | Consultas |
| GET/POST | `/api/hospitalizaciones` | Hospitalizaciones |
| GET/POST | `/api/cirugias` | Cirugías |
| GET/POST | `/api/vacunas` | Vacunas |
| GET | `/api/stats` | Estadísticas globales |

### 📊 Dashboards *(v3.0)*
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/dashboard/clinica` | Torre de control Admin — métricas financieras, scorecard de personal, alertas de inventario |
| GET | `/api/dashboard/empleado` | Panel operativo Médico — agenda del día, KPIs de tareas, estatus dinámico |

### 👥 Personal *(v3.0)*
| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/api/empleados` | Listado y creación de empleados con onboarding automatizado (correo institucional + contraseña bcrypt) |
| GET/PUT/DELETE | `/api/empleados/:id` | Gestión individual de empleado |

### 📦 Inventario *(v3.0)*
| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/api/inventario` | Listado de stock y registro de insumos |
| PUT | `/api/inventario/:id` | Actualización de stock |
| POST | `/api/inventario/reabastecer` | Solicitud de reabastecimiento (empleados) |

### 💰 Finanzas *(v3.0)*
| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/api/finanzas/notas-cobro` | Generación y listado de notas de cobro |
| GET | `/api/finanzas/recibos/:id/pdf` | Exportación de recibo en formato oficial PDF (FORM-030) |

### 👤 CRM de Tutores *(v3.0)*
| Método | Ruta | Descripción |
|---|---|---|
| GET/PUT | `/api/tutores/:id/crm` | Tags de comportamiento, bloqueos/vetos y notas CRM del tutor |
| DELETE | `/api/tutores/:id` | Purga estricta en cascada (tutor + todos sus pacientes) |

### 🧮 Calculadoras Clínicas
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/calculadora/medicamentos` | Catálogo de medicamentos veterinarios |
| GET | `/api/calculadora/toxicologia` | Catálogo de toxinas con umbrales |

---

## 🎨 Características de UI/UX

- **Modo oscuro** nativo con Tailwind CSS (`dark:` classes)
- **Diseño responsivo** con grid adaptativo
- **Animaciones suaves** en transiciones y hover
- **Sidebar de navegación** con íconos, estado activo y menú diferenciado por rol
- **Doble dashboard** — Torre de control analítica (Admin) vs. Panel operativo médico (Empleado)
- **Semáforo de inventario** 🟢🟡🔴 integrado en el dashboard Admin
- **Calculadoras**: peso global del paciente compartido entre todos los módulos, resultados en número grande, fórmulas de referencia, notas clínicas en amarillo, alertas de riesgo con colores semáforo

---

## 📋 Changelog

### v3.0.0 — Arquitectura SaaS Multi-tenant *(2026-05)*
- ✅ **Multi-tenant**: aislamiento total de datos por clínica usando `clinica_id` + JWT en cada request
- ✅ **Sistema de Roles Dual**: Admin/Clínica (métricas financieras, inventario, personal) y Empleado/Médico (agenda, KPIs, solicitudes)
- ✅ **Doble Dashboard Avanzado**: Torre de control analítica con scorecard de rendimiento vs. Panel operativo con estatus dinámico
- ✅ **Onboarding Automatizado**: autogeneración de correos institucionales y contraseñas temporales encriptadas con bcrypt
- ✅ **Módulo Financiero Oficial**: notas de cobro automáticas y exportación de recibos en PDF formato FORM-030
- ✅ **CRM de Tutores**: etiquetas de comportamiento (tags), bloqueos/vetos y purga estricta en cascada
- ✅ **Inventario Dinámico**: control de stock, alertas críticas semáforo en dashboard y sistema de solicitudes de reabastecimiento
- ✅ **Servicio de Alertas (Worker)**: clasificación automática de eventos médicos (ayuno pre-quirúrgico, vacunas, seguimientos)
- ✅ Nuevos endpoints: `/api/dashboard/clinica`, `/api/dashboard/empleado`, `/api/empleados`, `/api/inventario`, `/api/inventario/reabastecer`, `/api/tutores/:id/crm`, `/api/finanzas/*`

### v2.0.0 — Módulo de Calculadoras Clínicas *(2026-05)*
- ✅ 10 categorías de calculadoras clínicas veterinarias completamente funcionales
- ✅ Catálogos de medicamentos y toxinas en base de datos MySQL
- ✅ Endpoints REST para catálogos clínicos (`/api/calculadora/*`)
- ✅ Dashboard actualizado con banner de acceso rápido a Calculadoras
- ✅ Peso global del paciente (kg ↔ lb) compartido entre todos los módulos
- ✅ Alertas visuales de toxicidad (leve/moderado/letal)
- ✅ Interpretador automático de gases arteriales (ácido-base)
- ✅ Scores clínicos interactivos (Pain Score Colorado, Glasgow, SIRS)

### v1.0.0 — Sistema Base *(2025)*
- ✅ Gestión completa de tutores, pacientes, expedientes
- ✅ Módulos de consultas, hospitalizaciones, cirugías, vacunas
- ✅ Generación de reportes PDF
- ✅ Modo oscuro y diseño responsivo

---

## 📄 Licencia

MIT — Uso libre para clínicas veterinarias.

---

*Desarrollado con ❤️ para la medicina veterinaria.*
