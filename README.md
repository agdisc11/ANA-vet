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

### 🧮 Calculadoras Clínicas *(Módulo Premium — v2.0)*

Módulo de herramientas matemáticas clínicas con **10 categorías activas**, peso global del paciente compartido (kg ↔ lb) y diseño oscuro con Tailwind CSS.

| Categoría | Herramientas |
|---|---|
| 💉 **Anestesia** | Flow rates O₂ (Mapleson/Círculo), Clasificación ASA I–V, Consumo de agente volátil (Isoflurano/Sevoflurano) |
| 🩸 **Blood Gas** | Interpretador ácido-base (pH/pCO₂/HCO₃), Anion Gap, Déficit de bicarbonato |
| ❤️ **Cardiac** | MAP `(PAS + 2×PAD) ÷ 3`, Presión de pulso con interpretación clínica |
| 🔄 **Conversiones** | Peso kg↔lb, Temperatura °C↔°F, Líquidos mL/L/oz, Presiones mmHg/kPa/cmH₂O, Tabla de suturas USP↔Métrico |
| 💧 **Fluidos** | Fluidoterapia con déficit (mL/24h + gtt/min), CRI básico, Osmolalidad sérica, Déficit de agua libre |
| 🔬 **Hematología** | Cálculo de transfusión (perro/gato), Volumen sanguíneo estimado con umbrales de pérdida |
| 🥩 **Nutrición** | RER `70×(kg)^0.75`, DER con 23 factores de vida, Cantidad a alimentar en g/día + porciones |
| 💊 **Farmacia** | Calculadora de dosis con catálogo de medicamentos desde BD, volumen a administrar |
| ☠️ **Toxicología** | Evaluación de exposición con catálogo de toxinas desde BD, alertas de nivel de riesgo (leve/moderado/letal) |
| 📊 **Scores** | Pain Score Colorado (0–4), Glasgow Coma Score modificado (veterinario), SIRS (4 criterios) |

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
