# 🐾 ANA-vet — Sistema de Gestión Veterinaria

Sistema clínico veterinario completo construido con **React + Node.js + MySQL**. Incluye gestión de pacientes, expedientes clínicos, hospitalizaciones, cirugías, vacunas, reportes PDF y un módulo premium de **Calculadoras Clínicas** con 10 categorías de herramientas matemáticas veterinarias.

---

## 🚀 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 18, React Router v6, Tailwind CSS, Axios |
| Backend | Node.js, Express.js |
| Base de datos | MySQL |
| Reportes | jsPDF, html2canvas |
| Estilos | Tailwind CSS (modo oscuro nativo) |

---

## 📦 Módulos del Sistema

### 🗂️ Gestión Clínica
- **Tutores** — Registro y gestión de propietarios
- **Pacientes** — Fichas clínicas de animales
- **Expedientes** — Historial médico completo
- **Consultas** — Registro de citas veterinarias
- **Hospitalizaciones** — Control de pacientes internados
- **Cirugías** — Registro de procedimientos quirúrgicos con anestesia
- **Vacunas** — Plan de vacunación y seguimiento

### 📊 Reportes
- Generación de PDFs clínicos (consultas, cirugías, hospitalizaciones)
- Reportes de expediente completo

### 🧮 Calculadoras Clínicas *(Módulo Avanzado — v3.0)*

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

| Categoría | Herramientas | Novedades v3.0 |
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

## 🗄️ Estructura del Proyecto

```
ANA-vet/
├── backend/
│   └── clinica-vet-backend/
│       ├── index.js                    # Servidor Express + rutas
│       └── src/
│           ├── db/connection.js
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
│               └── calculadora.js      # ← Endpoints de catálogos clínicos
└── frontend/
    └── clinica-vet-frontend/
        └── src/
            ├── pages/
            │   ├── Dashboard.js        # ← Banner de Calculadoras integrado
            │   ├── Calculadora.js      # ← Shell maestro del módulo
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
```

Importa el esquema:
```bash
mysql -u root -p clinica_vet < schema.sql
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

### Gestión Clínica
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

### Calculadoras Clínicas
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/calculadora/medicamentos` | Catálogo de medicamentos veterinarios |
| GET | `/api/calculadora/toxicologia` | Catálogo de toxinas con umbrales |

---

## 🎨 Características de UI/UX

- **Modo oscuro** nativo con Tailwind CSS (`dark:` classes)
- **Diseño responsivo** con grid adaptativo
- **Animaciones suaves** en transiciones y hover
- **Sidebar de navegación** con íconos y estado activo
- **Dashboard** con banner destacado de Calculadoras Clínicas
- **Calculadoras**: peso global del paciente compartido entre todos los módulos, resultados en número grande, fórmulas de referencia, notas clínicas en amarillo, alertas de riesgo con colores semáforo

---

## 📋 Changelog

### v2.0.0 — Módulo de Calculadoras Clínicas (2026-05)
- ✅ 10 categorías de calculadoras clínicas veterinarias completamente funcionales
- ✅ Catálogos de medicamentos y toxinas en base de datos MySQL
- ✅ Endpoints REST para catálogos clínicos (`/api/calculadora/*`)
- ✅ Dashboard actualizado con banner de acceso rápido a Calculadoras
- ✅ Peso global del paciente (kg ↔ lb) compartido entre todos los módulos
- ✅ Alertas visuales de toxicidad (leve/moderado/letal)
- ✅ Interpretador automático de gases arteriales (ácido-base)
- ✅ Scores clínicos interactivos (Pain Score Colorado, Glasgow, SIRS)

### v1.0.0 — Sistema Base (2025)
- ✅ Gestión completa de tutores, pacientes, expedientes
- ✅ Módulos de consultas, hospitalizaciones, cirugías, vacunas
- ✅ Generación de reportes PDF
- ✅ Modo oscuro y diseño responsivo

---

## � Licencia

MIT — Uso libre para clínicas veterinarias.

---

*Desarrollado con ❤️ para la medicina veterinaria.*
