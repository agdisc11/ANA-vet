# DOCUMENTACION_CALCULADORAS.md

> **Sistema ANA-vet — Módulo Premium de Herramientas Clínicas**
> **Versión:** 2.0 — Fase 2 (Calculadoras Clínicas)
> **Fecha de generación:** 2026-05-16
> **Autores:** Equipo de Desarrollo ANA-vet
> **Stack tecnológico:** React 18 · Node.js/Express · MySQL (MariaDB 10.4) · Tailwind CSS

---

## Tabla de Contenidos

1. [Introducción al Módulo](#1-introducción-al-módulo)
2. [Arquitectura y Flujo de Datos](#2-arquitectura-y-flujo-de-datos)
   - 2.1 [Capa de Base de Datos](#21-capa-de-base-de-datos)
   - 2.2 [Capa de Backend (API REST)](#22-capa-de-backend-api-rest)
   - 2.3 [Capa de Frontend (React)](#23-capa-de-frontend-react)
3. [Desglose de las 10 Categorías Clínicas](#3-desglose-de-las-10-categorías-clínicas)
   - 3.1 [Anestesia](#31-anestesia)
   - 3.2 [Blood Gas](#32-blood-gas)
   - 3.3 [Cardiac](#33-cardiac)
   - 3.4 [Conversiones](#34-conversiones)
   - 3.5 [Fluidos](#35-fluidos)
   - 3.6 [Hematología](#36-hematología)
   - 3.7 [Nutrición](#37-nutrición)
   - 3.8 [Farmacia](#38-farmacia)
   - 3.9 [Toxicología](#39-toxicología)
   - 3.10 [Scores Clínicos](#310-scores-clínicos)
4. [Conclusión](#4-conclusión)

---

## 1. Introducción al Módulo

### 1.1 Contexto y Motivación

El sistema **ANA-vet** nació como una plataforma de gestión clínica veterinaria orientada a la administración de expedientes, consultas, hospitalizaciones y cirugías. En su primera fase, el sistema implementó un conjunto de módulos CRUD (*Create, Read, Update, Delete*) que permitían al personal clínico registrar y consultar información de pacientes, tutores, vacunas y procedimientos quirúrgicos.

Sin embargo, la práctica clínica veterinaria moderna exige algo más que el almacenamiento de datos: requiere **soporte activo en la toma de decisiones médicas en tiempo real**. Un médico veterinario que atiende una emergencia no puede detenerse a buscar tablas de referencia en libros de texto o realizar cálculos manuales propensos a error. Necesita una herramienta que, con los datos del paciente frente a él, le entregue resultados clínicamente validados en segundos.

### 1.2 Propósito del Módulo de Calculadoras

El **Módulo Premium de Herramientas Clínicas** (en adelante, *Módulo de Calculadoras*) representa la evolución del sistema ANA-vet de una plataforma de registro pasivo a un **sistema activo de soporte de decisiones médicas (CDSS, Clinical Decision Support System)** especializado en medicina veterinaria de pequeñas especies.

Sus objetivos específicos son:

- **Eliminar el error de cálculo manual** en procedimientos críticos como dosificación de fármacos, fluidoterapia y evaluación toxicológica.
- **Centralizar el conocimiento clínico** en una interfaz unificada, accesible desde cualquier dispositivo con navegador web.
- **Acelerar la respuesta clínica** en situaciones de emergencia mediante cálculos instantáneos y alertas visuales codificadas por color.
- **Estandarizar protocolos** de evaluación mediante scores clínicos validados internacionalmente (Glasgow, Colorado, SIRS).

### 1.3 Alcance de la Fase 2

El módulo implementa **10 categorías clínicas** con un total de **25+ herramientas de cálculo** individuales, organizadas en las siguientes áreas:

| # | Categoría | Herramientas incluidas |
|---|-----------|------------------------|
| 1 | **Anestesia** | Flow rates O₂, Clasificación ASA, Consumo de agente volátil |
| 2 | **Blood Gas** | Interpretador ácido-base, Anion Gap, Déficit de bicarbonato |
| 3 | **Cardiac** | MAP (Presión Arterial Media), Presión de Pulso |
| 4 | **Conversiones** | Peso, Temperatura, Líquidos, Presiones, Tallas de sutura |
| 5 | **Fluidos** | Fluidoterapia con déficit, CRI, Osmolalidad sérica, Déficit de agua libre |
| 6 | **Hematología** | Cálculo de transfusión, Volumen sanguíneo estimado |
| 7 | **Nutrición** | RER, DER, Cantidad diaria de alimento |
| 8 | **Farmacia** | Calculadora de dosis con catálogo de medicamentos |
| 9 | **Toxicología** | Evaluación de exposición con semáforo de riesgo |
| 10 | **Scores** | Pain Score Colorado, Glasgow Coma Score, SIRS |

---

## 2. Arquitectura y Flujo de Datos

El módulo sigue la arquitectura de tres capas característica del sistema ANA-vet: **Base de Datos → Backend REST → Frontend React**. A continuación se describe cada capa con detalle técnico.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Navegador)                       │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              React SPA — Módulo Calculadoras              │   │
│  │                                                            │   │
│  │  ┌─────────────┐   Estado Global   ┌──────────────────┐  │   │
│  │  │  Calculadora │◄─── pesoKg ─────►│  Componente      │  │   │
│  │  │  .js (page) │                   │  Calculadora     │  │   │
│  │  │             │   API.get()        │  (Farmacia /     │  │   │
│  │  │  Sidebar    │──────────────────►│  Toxicología)    │  │   │
│  │  │  Categorías │                   └──────────────────┘  │   │
│  │  └─────────────┘                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │ HTTP/REST                              │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                   BACKEND — Node.js / Express                    │
│                                                                   │
│   GET /api/calculadora/medicamentos                              │
│   GET /api/calculadora/toxicologia                               │
│                                                                   │
│   src/routes/calculadora.js                                      │
│   src/db/connection.js (pool MySQL)                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ mysql2 driver
┌──────────────────────────▼──────────────────────────────────────┐
│                  BASE DE DATOS — MySQL / MariaDB                 │
│                                                                   │
│   catalogo_medicamentos   (7+ registros)                        │
│   catalogo_toxicologia    (5+ registros)                        │
│                                                                   │
│   [Tablas CRUD existentes: paciente, expediente, consulta, ...]  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1 Capa de Base de Datos

La base de datos `clinica_veterinaria` (MariaDB 10.4) incorpora dos nuevas tablas de catálogo para soportar las calculadoras que requieren datos persistentes: **Farmacia** y **Toxicología**. Las demás calculadoras operan con lógica puramente computacional en el frontend, sin necesidad de consultas a la base de datos.

#### Tabla `catalogo_medicamentos`

Almacena el catálogo de medicamentos veterinarios con sus parámetros de dosificación.

```sql
CREATE TABLE `catalogo_medicamentos` (
  `id`                  int(11)        NOT NULL AUTO_INCREMENT,
  `nombre`              varchar(150)   NOT NULL,
  `categoria`           varchar(100)   NOT NULL,
  `especie_destino`     enum('canino','felino','general') NOT NULL DEFAULT 'general',
  `dosis_mg_por_kg`     decimal(10,4)  DEFAULT NULL,  -- dosis estándar de referencia
  `dosis_min_mg_kg`     decimal(10,4)  DEFAULT NULL,  -- límite inferior del rango
  `dosis_max_mg_kg`     decimal(10,4)  DEFAULT NULL,  -- límite superior del rango
  `concentracion_mg_ml` decimal(10,4)  DEFAULT NULL,  -- mg/mL presentación comercial
  `via_administracion`  varchar(50)    DEFAULT NULL,
  `notas_clinicas`      text           DEFAULT NULL,
  `created_at`          timestamp      NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_categoria` (`categoria`),
  KEY `idx_especie` (`especie_destino`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Medicamentos de prueba incluidos:**

| Nombre | Categoría | Especie | Dosis estándar | Concentración | Vía |
|--------|-----------|---------|----------------|---------------|-----|
| Meloxicam | AINE | General | 0.2 mg/kg | 5 mg/mL | SC, IV, PO |
| Propofol | Anestésico | General | 4.0 mg/kg | 10 mg/mL | IV |
| Amoxicilina-Ácido Clavulánico | Antibiótico | General | 12.5 mg/kg | 50 mg/mL | PO, SC, IV |
| Tramadol | Analgésico opioide | Canino | 4.0 mg/kg | 50 mg/mL | PO, IV, SC |
| Dexametasona | Corticosteroide | General | 0.1 mg/kg | 2 mg/mL | IV, IM, SC |
| Ketamina | Anestésico disociativo | General | 5.0 mg/kg | 100 mg/mL | IV, IM |
| Furosemida | Diurético | General | 2.0 mg/kg | 50 mg/mL | IV, IM, PO |

#### Tabla `catalogo_toxicologia`

Almacena el catálogo toxicológico con umbrales de dosis y protocolos de tratamiento.

```sql
CREATE TABLE `catalogo_toxicologia` (
  `id`                          int(11)       NOT NULL AUTO_INCREMENT,
  `toxina`                      varchar(150)  NOT NULL,
  `especie_afectada`            enum('canino','felino','general') NOT NULL DEFAULT 'general',
  `dosis_toxica_leve_mg_kg`     decimal(10,4) DEFAULT NULL,  -- inicio de signos leves
  `dosis_toxica_moderada_mg_kg` decimal(10,4) DEFAULT NULL,  -- signos moderados/sistémicos
  `dosis_toxica_letal_mg_kg`    decimal(10,4) DEFAULT NULL,  -- DL50 o dosis letal
  `mecanismo`                   varchar(255)  DEFAULT NULL,
  `signos_clinicos`             text          DEFAULT NULL,
  `tratamiento_base`            text          DEFAULT NULL,
  `notas`                       text          DEFAULT NULL,
  `created_at`                  timestamp     NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_toxina` (`toxina`),
  KEY `idx_especie_tox` (`especie_afectada`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**Toxinas de prueba incluidas:**

| Toxina | Especie | Umbral leve | Umbral moderado | DL50 |
|--------|---------|-------------|-----------------|------|
| Teobromina (Chocolate) | Canino | 20 mg/kg | 40 mg/kg | 100 mg/kg |
| Acetaminofén (Paracetamol) | Felino | 10 mg/kg | 40 mg/kg | 50 mg/kg |
| Uvas / Pasas | Canino | — (idiosincrático) | 11 g/kg | — |
| Xilitol | Canino | 0.1 g/kg | 0.5 g/kg | — |
| Permetrina (Piretroide) | Felino | — (tópico) | — | — |

### 2.2 Capa de Backend (API REST)

El backend está implementado en **Node.js con Express** y expone los endpoints del módulo de calculadoras bajo el prefijo de ruta `/api/calculadora`. El archivo de rutas es `src/routes/calculadora.js`.

#### Endpoints implementados

| Método | Ruta | Descripción | Tabla consultada |
|--------|------|-------------|-----------------|
| `GET` | `/api/calculadora/medicamentos` | Devuelve el catálogo completo de medicamentos ordenado por categoría y nombre | `catalogo_medicamentos` |
| `GET` | `/api/calculadora/toxicologia` | Devuelve el catálogo completo de toxinas ordenado alfabéticamente | `catalogo_toxicologia` |

#### Implementación del endpoint `/medicamentos`

```javascript
router.get('/medicamentos', (req, res) => {
  const sql = `
    SELECT
      id, nombre, categoria, especie_destino,
      dosis_mg_por_kg, dosis_min_mg_kg, dosis_max_mg_kg,
      concentracion_mg_ml, via_administracion, notas_clinicas
    FROM catalogo_medicamentos
    ORDER BY categoria, nombre
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al consultar el catálogo.' });
    res.json(results);
  });
});
```

#### Implementación del endpoint `/toxicologia`

```javascript
router.get('/toxicologia', (req, res) => {
  const sql = `
    SELECT
      id, toxina, especie_afectada,
      dosis_toxica_leve_mg_kg, dosis_toxica_moderada_mg_kg, dosis_toxica_letal_mg_kg,
      mecanismo, signos_clinicos, tratamiento_base, notas
    FROM catalogo_toxicologia
    ORDER BY toxina
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al consultar el catálogo.' });
    res.json(results);
  });
});
```

**Características de robustez del backend:**
- Manejo de errores en dos niveles: errores de consulta SQL y errores inesperados del servidor.
- Respuestas de error estructuradas con campos `error` y `detalle` para facilitar el debugging.
- Logging de errores en consola con prefijo de contexto (`[calculadora/medicamentos]`).

### 2.3 Capa de Frontend (React)

#### Estructura de archivos

```
src/
├── pages/
│   └── Calculadora.js          ← Página principal (router, estado global de peso)
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

#### Página principal: `Calculadora.js`

La página `Calculadora.js` actúa como **orquestador del módulo**. Sus responsabilidades son:

1. **Gestión del estado global de peso del paciente:** El peso se ingresa una sola vez en la barra superior y se propaga como prop `pesoKg` a todos los componentes hijos. Esto evita que el médico tenga que reingresar el peso en cada calculadora.

2. **Conversión de unidades en tiempo real:** El sistema acepta el peso en kilogramos (`kg`) o libras (`lb`) mediante un toggle. La conversión se realiza antes de pasar el valor a los componentes:

```javascript
const pesoEnKg =
  pesoInput === ''
    ? null
    : unidadPeso === 'kg'
    ? parseFloat(pesoInput)
    : parseFloat(pesoInput) / 2.20462;

const pesoKgFinal = pesoEnKg ? parseFloat(pesoEnKg.toFixed(3)) : null;
```

3. **Enrutamiento interno por categoría:** Un sidebar lateral de 224px de ancho contiene los 10 botones de categoría. Al hacer clic, se actualiza el estado `categoriaActiva` y se renderiza dinámicamente el componente correspondiente:

```javascript
function renderPanel() {
  if (!categoriaObj) return <PanelBienvenida />;
  if (!categoriaObj.disponible) return <PanelProximamente categoria={categoriaObj} />;
  const Comp = categoriaObj.componente;
  return <Comp pesoKg={pesoKgFinal} />;
}
```

#### Patrón de diseño de componentes

Cada calculadora sigue un patrón de diseño consistente:

- **Componente raíz exportado** (`export default function NombreCalculadora({ pesoKg })`): Recibe el peso global y renderiza las secciones.
- **Sub-componentes internos** (`function FlowRates`, `function ClasificacionASA`, etc.): Encapsulan la lógica de cada herramienta individual.
- **Componente `Seccion`**: Wrapper reutilizable que renderiza un encabezado con emoji y título, seguido del contenido.
- **Estado local con `useState`**: Cada sub-componente gestiona su propio estado de inputs y resultados.
- **Cálculo reactivo**: Los resultados se recalculan automáticamente al cambiar cualquier input, sin necesidad de botón "Calcular" en la mayoría de los casos.

#### Sistema de diseño visual

El módulo utiliza **Tailwind CSS** con un sistema de colores semántico consistente en todas las calculadoras:

| Color | Significado clínico | Uso |
|-------|---------------------|-----|
| 🟢 Verde (`green`) | Normal / Seguro | Valores dentro de rango, sin riesgo |
| 🟡 Ámbar (`amber`) | Precaución / Leve | Valores limítrofes, monitoreo recomendado |
| 🟠 Naranja (`orange`) | Alerta / Moderado | Valores alterados, intervención necesaria |
| 🔴 Rojo (`red`) | Crítico / Peligroso | Emergencia, riesgo vital |
| 🔵 Azul (`blue`) | Informativo / Neutro | Resultados numéricos principales |
| 🟣 Violeta (`violet`) | Secundario | Resultados derivados, CRI, consumo |

---

## 3. Desglose de las 10 Categorías Clínicas

---

### 3.1 Anestesia

#### Objetivo Clínico

La calculadora de Anestesia asiste al médico veterinario durante la planificación y ejecución de procedimientos anestésicos. Permite determinar el flujo de oxígeno adecuado según el sistema de respiración utilizado, clasificar el riesgo anestésico del paciente mediante la escala ASA, y estimar el consumo de agente volátil para gestionar el inventario de inhalantes.

#### Variables e Inputs

| Herramienta | Variable | Unidad | Descripción |
|-------------|----------|--------|-------------|
| Flow Rates | Peso del paciente | kg | Heredado del estado global |
| Flow Rates | Sistema de respiración | — | No reinhalación/Mapleson o Círculo/Reinhalación |
| Clasificación ASA | Nivel ASA | I–V | Selección interactiva |
| Agente Volátil | Agente | — | Isoflurano o Sevoflurano |
| Agente Volátil | % Dial vaporizador | % | Porcentaje de apertura del vaporizador |
| Agente Volátil | Flujo de gas | L/min | Flujo total de gas fresco |

#### Fórmulas y Lógica Matemática

**Flow Rates — Flujo de Oxígeno:**

```
Flujo mínimo (mL/min) = Factor_mín × Peso (kg)
Flujo máximo (mL/min) = Factor_máx × Peso (kg)
```

Donde los factores dependen del sistema seleccionado:

| Sistema | Factor mínimo | Factor máximo | Indicación |
|---------|---------------|---------------|------------|
| No reinhalación / Mapleson | 200 mL/kg/min | 300 mL/kg/min | Pacientes < 7 kg |
| Círculo / Reinhalación | 10 mL/kg/min | 50 mL/kg/min | Pacientes > 7 kg |

**Consumo de Agente Volátil:**

```javascript
// Consumo en mL de líquido por hora
consumoMlH = (dial/100 × flujo_mL_min × 1000 × 60 × PM_agente)
             / (densidad_agente × 1000 × 22400)
```

Donde:
- `dial` = porcentaje de apertura del vaporizador (%)
- `flujo_mL_min` = flujo de gas fresco en mL/min (L/min × 1000)
- `PM_agente` = peso molecular del agente (g/mol)
- `densidad_agente` = densidad del agente líquido (g/mL)
- `22400` = volumen molar de un gas ideal a CNTP (mL/mol)

**Constantes de los agentes volátiles:**

| Agente | MAC (%) | Densidad (g/mL) | Peso Molecular (g/mol) |
|--------|---------|-----------------|------------------------|
| Isoflurano | 1.28 | 1.496 | 184.5 |
| Sevoflurano | 2.36 | 1.520 | 200.1 |

#### Características de Interfaz (UX)

- **Clasificación ASA interactiva:** Cinco botones (I–V) con codificación de color progresiva (verde → rojo). Al seleccionar un nivel, se despliega una tarjeta con criterios clínicos, nivel de riesgo y recomendaciones anestésicas específicas. El botón activo adopta el color semántico del nivel seleccionado.
- **Resultado de Flow Rates en tiempo real:** El rango de flujo se actualiza instantáneamente al cambiar el sistema de respiración, sin necesidad de botón de cálculo.
- **Indicador de peso global:** Si el peso no ha sido ingresado en la barra superior, se muestra una advertencia en ámbar para guiar al usuario.

---

### 3.2 Blood Gas

#### Objetivo Clínico

La calculadora de Blood Gas permite al médico veterinario interpretar los resultados de una gasometría arterial de forma rápida y estructurada. Identifica el tipo de trastorno ácido-base, determina si existe compensación, calcula el Anion Gap para diferenciar tipos de acidosis metabólica, y cuantifica el déficit de bicarbonato para guiar la corrección con NaHCO₃.

#### Variables e Inputs

| Herramienta | Variable | Unidad | Rango normal veterinario |
|-------------|----------|--------|--------------------------|
| Interpretador Ácido-Base | pH | — | 7.35 – 7.45 |
| Interpretador Ácido-Base | pCO₂ | mmHg | 35 – 45 |
| Interpretador Ácido-Base | HCO₃⁻ | mEq/L | 18 – 24 |
| Anion Gap | Na⁺ | mEq/L | — |
| Anion Gap | Cl⁻ | mEq/L | — |
| Anion Gap | HCO₃⁻ | mEq/L | — |
| Déficit de Bicarbonato | HCO₃⁻ actual | mEq/L | — |
| Déficit de Bicarbonato | Peso | kg | Heredado del estado global |

#### Fórmulas y Lógica Matemática

**Interpretación Ácido-Base (árbol de decisión):**

```
SI pH < 7.35 → Acidosis
  SI pCO₂ > 45 Y HCO₃⁻ < 18 → Acidosis MIXTA (Resp. + Metab.)
  SI pCO₂ > 45              → Acidosis RESPIRATORIA
    SI HCO₃⁻ > 24           → con compensación metabólica
  SI HCO₃⁻ < 18             → Acidosis METABÓLICA
    SI pCO₂ < 35             → con compensación respiratoria

SI pH > 7.45 → Alcalosis
  SI pCO₂ < 35 Y HCO₃⁻ > 24 → Alcalosis MIXTA (Resp. + Metab.)
  SI pCO₂ < 35               → Alcalosis RESPIRATORIA
    SI HCO₃⁻ < 18            → con compensación metabólica
  SI HCO₃⁻ > 24              → Alcalosis METABÓLICA
    SI pCO₂ > 45             → con compensación respiratoria
```

**Anion Gap:**

```
AG (mEq/L) = Na⁺ − (Cl⁻ + HCO₃⁻)

Valor normal veterinario: 8 – 16 mEq/L
AG > 16 mEq/L → Acidosis metabólica con AG elevado
```

**Déficit de Bicarbonato:**

```
Déficit HCO₃⁻ (mEq) = 0.3 × Peso (kg) × (HCO₃⁻ normal − HCO₃⁻ actual)

Donde HCO₃⁻ normal de referencia = 22 mEq/L
```

> **Nota clínica:** Se recomienda corregir el 50% del déficit calculado en las primeras 4–6 horas, administrando NaHCO₃ IV lento.

#### Características de Interfaz (UX)

- **Botón de interpretación explícito:** A diferencia de otras calculadoras, el interpretador ácido-base requiere presionar "Interpretar gases" para mostrar el resultado, evitando interpretaciones parciales con datos incompletos.
- **Tarjeta de resultado codificada por color:** Verde para estado normal, rojo para acidosis, azul para alcalosis.
- **Indicadores de parámetros alterados:** Cada valor (pH, pCO₂, HCO₃⁻) se muestra con subrayado si está fuera del rango normal, y con ✓ si es normal.
- **Tabla de rangos de referencia:** Siempre visible debajo de los inputs para consulta rápida.

---

### 3.3 Cardiac

#### Objetivo Clínico

La calculadora Cardiac permite calcular la **Presión Arterial Media (MAP)** y la **Presión de Pulso (PP)** a partir de los valores de presión sistólica y diastólica. La MAP es el parámetro hemodinámico más importante durante la anestesia y el manejo de pacientes críticos, ya que refleja la presión de perfusión de los órganos vitales.

#### Variables e Inputs

| Variable | Unidad | Descripción |
|----------|--------|-------------|
| PAS — Presión Arterial Sistólica | mmHg | Valor pico de presión durante la sístole |
| PAD — Presión Arterial Diastólica | mmHg | Valor de presión durante la diástole |

#### Fórmulas y Lógica Matemática

**Presión Arterial Media (MAP):**

```
MAP (mmHg) = (PAS + 2 × PAD) / 3
```

Esta fórmula refleja que el corazón pasa aproximadamente 1/3 del ciclo cardíaco en sístole y 2/3 en diástole.

**Presión de Pulso (PP):**

```
PP (mmHg) = PAS − PAD
```

**Tabla de interpretación clínica de la MAP:**

| Rango MAP | Estado clínico | Acción recomendada |
|-----------|----------------|-------------------|
| < 60 mmHg | **Hipotensión crítica** | Intervención inmediata: fluidos, vasopresores |
| 60 – 80 mmHg | Hipotensión leve | Monitoreo estrecho, considerar fluidos |
| 80 – 100 mmHg | **Normal** | Continuar monitoreo de rutina |
| > 100 mmHg | Hipertensión | Evaluar causa, considerar antihipertensivos |

**Interpretación de la Presión de Pulso:**

| Rango PP | Interpretación |
|----------|----------------|
| < 25 mmHg | PP estrecha — posible bajo gasto cardíaco |
| 25 – 60 mmHg | Normal |
| > 60 mmHg | PP amplia — evaluar regurgitación aórtica |

#### Características de Interfaz (UX)

- **Resultado prominente en 6xl:** El valor de MAP se muestra en tipografía de 6xl (96px) con codificación de color inmediata (verde/ámbar/rojo) para lectura a distancia durante procedimientos.
- **Cálculo en tiempo real:** Los resultados se actualizan con cada pulsación de teclado, sin necesidad de botón de cálculo.
- **Tabla de referencia integrada:** Una tabla de rangos siempre visible debajo del resultado principal permite al médico contextualizar el valor sin salir de la pantalla.
- **Fórmula visible:** La ecuación con los valores reales sustituidos se muestra en tipografía monoespaciada para transparencia del cálculo.

---

### 3.4 Conversiones

#### Objetivo Clínico

La calculadora de Conversiones centraliza todas las conversiones de unidades de uso frecuente en la práctica clínica veterinaria. Elimina la necesidad de recordar factores de conversión o usar calculadoras externas durante la consulta.

#### Variables e Inputs

| Sección | Conversión | Unidades |
|---------|------------|---------|
| Peso | Bidireccional | kg ⇄ lb |
| Temperatura | Bidireccional | °C ⇄ °F |
| Líquidos | Multi-unidad desde base mL | mL → L, fl oz, oz |
| Presiones | Bidireccional | mmHg ⇄ kPa |
| Presiones | Bidireccional | mmHg ⇄ cmH₂O |
| Suturas | Tabla de referencia | USP ↔ Métrico |

#### Fórmulas y Lógica Matemática

**Conversiones de peso:**
```
kg → lb:  valor × 2.20462
lb → kg:  valor / 2.20462
```

**Conversiones de temperatura:**
```
°C → °F:  (valor × 9/5) + 32
°F → °C:  (valor − 32) × 5/9
```

**Conversiones de líquidos:**
```
mL → L:     valor / 1000
mL → fl oz: valor / 29.5735
```

**Conversiones de presión:**
```
mmHg → kPa:   valor × 0.133322
kPa → mmHg:   valor / 0.133322

mmHg → cmH₂O: valor × 1.35951
cmH₂O → mmHg: valor / 1.35951
```

**Tabla de tallas de sutura (USP ↔ Métrico):**

| USP | Métrico | Diámetro | Uso clínico |
|-----|---------|----------|-------------|
| 7 | 10 | 1.000 mm | Fascia, tendones grandes |
| 5 | 6 | 0.600 mm | Fascia, tejido subcutáneo |
| 2 | 3 | 0.300 mm | Tejido subcutáneo, músculo |
| 0 | 1.5 | 0.150 mm | Piel, tejido subcutáneo fino |
| 2-0 | 1 | 0.100 mm | Piel, mucosas, vasos pequeños |
| 3-0 | 0.7 | 0.070 mm | Piel fina, vasos, nervios |
| 4-0 | 0.5 | 0.050 mm | Vasos, nervios, oftalmología |
| 5-0 | 0.3 | 0.030 mm | Microcirugía, vasos finos |
| 6-0 | 0.2 | 0.020 mm | Microcirugía, oftalmología |

#### Características de Interfaz (UX)

- **Conversor bidireccional (`ConversorBidireccional`):** Componente reutilizable que permite editar cualquiera de los dos campos y actualiza el otro automáticamente. Implementado con el patrón de dos handlers (`handleA` / `handleB`) que se llaman mutuamente.
- **Sincronización con peso global:** La sección de peso muestra automáticamente el peso del paciente ingresado en la barra superior y su equivalente en libras.
- **Tabla de suturas interactiva:** Al hacer clic en una fila, se despliega un panel de detalle con el uso clínico recomendado. La fila seleccionada se resalta en azul.
- **Precisión configurable:** Los resultados se muestran con 4 decimales internamente y se redondean para la visualización, eliminando ceros finales innecesarios.

---

### 3.5 Fluidos

#### Objetivo Clínico

La calculadora de Fluidos es una de las más críticas del módulo. Permite calcular el plan de fluidoterapia completo para un paciente deshidratado, determinar la velocidad de infusión para medicamentos en CRI (*Constant Rate Infusion*), calcular la osmolalidad sérica para evaluar el estado osmótico del paciente, y cuantificar el déficit de agua libre en casos de hipernatremia.

#### Variables e Inputs

| Herramienta | Variable | Unidad | Descripción |
|-------------|----------|--------|-------------|
| Fluidoterapia | Peso | kg | Heredado del estado global |
| Fluidoterapia | % Deshidratación | % | Estimación clínica (5%, 8%, 12%) |
| Fluidoterapia | Pérdidas contemporáneas | mL | Vómito, diarrea, drenajes |
| Fluidoterapia | Tipo de gotero | — | Normogotero (20 gtt/mL) o Microgotero (60 gtt/mL) |
| CRI | Dosis | mcg/kg/min o mg/kg/min | Dosis del fármaco en infusión |
| CRI | Concentración | mcg/mL o mg/mL | Concentración de la solución preparada |
| Osmolalidad | Na⁺ | mEq/L | Sodio sérico |
| Osmolalidad | Glucosa | mg/dL | Glucosa sérica |
| Osmolalidad | BUN | mg/dL | Nitrógeno ureico en sangre |
| Déficit Agua Libre | Na⁺ actual | mEq/L | Sodio sérico del paciente |

#### Fórmulas y Lógica Matemática

**Fluidoterapia con Déficit:**

```
Mantenimiento (mL/24h) = Peso (kg) × 50 mL/kg/día

Déficit (mL) = (% Deshidratación / 100) × Peso (kg) × 1000

Volumen total (mL/24h) = Mantenimiento + Déficit + Pérdidas contemporáneas

Velocidad (mL/h) = Volumen total / 24

Goteo (gtt/min) = (Volumen total × Factor gotero) / (24 × 60)
```

**CRI — Constant Rate Infusion:**

```
Velocidad (mL/h) = Dosis (mcg/kg/min) × Peso (kg) × 60
                   ─────────────────────────────────────
                        Concentración (mcg/mL)
```

**Osmolalidad Sérica Calculada:**

```
Osmolalidad (mOsm/kg) = 2 × Na⁺ + Glucosa/18 + BUN/2.8

Rango normal: 280 – 310 mOsm/kg
< 280 mOsm/kg → Hipoosmolar
> 310 mOsm/kg → Hiperosmolar
```

**Déficit de Agua Libre (Hipernatremia):**

```
Déficit agua libre (L) = 0.6 × Peso (kg) × (Na⁺ actual / Na⁺ normal − 1)

Donde Na⁺ normal de referencia = 145 mEq/L
```

#### Características de Interfaz (UX)

- **Desglose de componentes del plan de fluidos:** Los resultados de fluidoterapia se presentan en tres tarjetas separadas (Mantenimiento / Déficit / Pérdidas) antes de mostrar el total, facilitando la comprensión del plan.
- **Toggle de tipo de gotero:** Dos botones de selección exclusiva para normogotero (20 gtt/mL) y microgotero (60 gtt/mL), con el goteo calculado automáticamente para el tipo seleccionado.
- **Selector de unidad en CRI:** El médico puede alternar entre mcg y mg para la dosis y concentración del CRI, adaptándose a la presentación del fármaco disponible.
- **Botón de cálculo explícito en fluidoterapia:** Para evitar resultados parciales, la fluidoterapia requiere presionar "Calcular fluidoterapia" antes de mostrar el plan completo.

---

### 3.6 Hematología

#### Objetivo Clínico

La calculadora de Hematología asiste en dos de las decisiones más críticas en medicina de urgencias veterinarias: determinar el volumen de sangre a transfundir en un paciente anémico, y estimar el volumen sanguíneo total del paciente para evaluar la magnitud de una hemorragia y los umbrales de pérdida que requieren soporte transfusional.

#### Variables e Inputs

| Herramienta | Variable | Unidad | Descripción |
|-------------|----------|--------|-------------|
| Transfusión | Especie | — | Perro (factor 90) o Gato (factor 60) |
| Transfusión | Peso | kg | Heredado del estado global |
| Transfusión | Hematocrito actual | % | Hct del paciente receptor |
| Transfusión | Hematocrito deseado | % | Meta terapéutica (ej. 30%) |
| Transfusión | Hematocrito del donador | % | Hct de la sangre a transfundir |
| Vol. Sanguíneo | Especie | — | Perro (85 mL/kg) o Gato (60 mL/kg) |
| Vol. Sanguíneo | Peso | kg | Heredado del estado global |

#### Fórmulas y Lógica Matemática

**Volumen de Transfusión Sanguínea:**

```
Volumen (mL) = Peso (kg) × (Hct deseado − Hct actual) × Factor especie
               ─────────────────────────────────────────────────────────
                                  Hct donador

Factor especie:
  Perro → 90
  Gato  → 60
```

> **Nota clínica:** Administrar a 5–10 mL/kg/h. Monitorear FC, FR y temperatura durante la transfusión.

**Volumen Sanguíneo Total Estimado:**

```
Volumen sanguíneo total (mL) = Peso (kg) × Factor especie

Factor especie:
  Perro → 85 mL/kg
  Gato  → 60 mL/kg
```

**Umbrales de pérdida sanguínea:**

```
Pérdida máxima segura (15%) = Volumen total × 0.15
Pérdida moderada (20%)      = Volumen total × 0.20
Pérdida grave (30%)         = Volumen total × 0.30
```

> **Referencia:** Pérdida > 15% del volumen sanguíneo total requiere soporte transfusional.

#### Características de Interfaz (UX)

- **Selector de especie con factor visible:** Los botones de especie muestran explícitamente el factor utilizado en la fórmula (ej. "🐕 Perro (factor 90)"), educando al médico sobre la base del cálculo.
- **Resultado de transfusión en rojo:** El volumen de transfusión se presenta en una tarjeta roja para enfatizar la gravedad del procedimiento y la necesidad de monitoreo.
- **Tabla de umbrales de pérdida:** Tres tarjetas codificadas por color (verde/ámbar/rojo) muestran los volúmenes correspondientes al 15%, 20% y 30% de pérdida, permitiendo al médico evaluar la gravedad de una hemorragia en curso.

---

### 3.7 Nutrición

#### Objetivo Clínico

La calculadora de Nutrición permite al médico veterinario determinar los requerimientos energéticos diarios de un paciente y traducirlos en una cantidad concreta de alimento a administrar. Es especialmente útil en pacientes hospitalizados, en recuperación, con obesidad o en estados fisiológicos especiales (gestación, lactancia, trabajo).

#### Variables e Inputs

| Variable | Unidad | Descripción |
|----------|--------|-------------|
| Peso | kg | Heredado del estado global |
| Estado del paciente | — | Selección de factor de vida (DER) |
| Densidad calórica del alimento | kcal/g | Dato de la etiqueta del alimento |

#### Fórmulas y Lógica Matemática

**RER — Requerimiento Energético en Reposo:**

```
RER (kcal/día) = 70 × (Peso en kg)^0.75
```

Esta es la **fórmula alométrica** estándar de la medicina veterinaria, válida para perros y gatos. Representa la energía mínima necesaria para mantener las funciones vitales en reposo.

**DER — Energía Diaria Requerida:**

```
DER (kcal/día) = RER × Factor de vida
```

**Tabla de factores de vida (DER):**

| Grupo | Estado del paciente | Factor |
|-------|---------------------|--------|
| **Perro** | Adulto intacto | 1.8 |
| **Perro** | Adulto castrado | 1.6 |
| **Perro** | Obeso (pérdida de peso) | 1.0 |
| **Perro** | Cachorro < 4 meses | 3.0 |
| **Perro** | Cachorro 4 meses – adulto | 2.0 |
| **Perro** | Trabajo ligero | 2.0 |
| **Perro** | Trabajo intenso | 4.0 |
| **Perro** | Gestación (últimas 3 sem) | 3.0 |
| **Perro** | Lactancia | 4.8 |
| **Gato** | Adulto intacto | 1.4 |
| **Gato** | Adulto castrado | 1.2 |
| **Gato** | Obeso (pérdida de peso) | 0.8 |
| **Gato** | Gatito < 4 meses | 2.5 |
| **Hospitalizado** | Mantenimiento | 1.0 |
| **Hospitalizado** | Recuperación | 1.2 |
| **Hospitalizado** | Crítico / quemado | 1.5 |

**Cantidad diaria de alimento:**

```
Gramos/día = DER (kcal/día) / Densidad calórica (kcal/g)
```

**Porciones por frecuencia de alimentación:**

```
1 comida/día  → Gramos/día
2 comidas/día → Gramos/día / 2
3 comidas/día → Gramos/día / 3
```

#### Características de Interfaz (UX)

- **Flujo de cálculo en cascada:** El módulo presenta tres secciones secuenciales (RER → DER → Cantidad). Cada sección se activa cuando la anterior tiene datos suficientes, guiando al médico paso a paso.
- **Select agrupado por especie:** Los factores de vida están organizados en `<optgroup>` por categoría (Perro / Gato / Hospitalizado), facilitando la navegación en el selector.
- **Resumen de porciones:** Una vez calculados los gramos diarios, se muestran automáticamente las porciones para 1, 2 y 3 comidas al día.
- **Nota clínica de advertencia:** Un banner ámbar permanente recuerda que los valores son estimaciones de referencia y deben ajustarse según la condición corporal (BCS) del paciente.

---

### 3.8 Farmacia

#### Objetivo Clínico

La calculadora de Farmacia es la herramienta de uso más frecuente del módulo. Permite calcular el **volumen exacto a administrar** de cualquier medicamento del catálogo, dado el peso del paciente, la dosis prescrita y la concentración de la presentación disponible. Elimina el error de cálculo en la preparación de fármacos, que es una de las principales causas de eventos adversos en medicina veterinaria.

#### Variables e Inputs

| Variable | Unidad | Descripción |
|----------|--------|-------------|
| Peso | kg | Heredado del estado global |
| Medicamento | — | Selección del catálogo (con autocompletado de dosis y concentración) |
| Dosis | mg/kg | Editable; se autocompleta con el valor del catálogo |
| Concentración | mg/mL | Editable; se autocompleta con el valor del catálogo |

#### Fórmulas y Lógica Matemática

**Volumen a administrar:**

```
Volumen (mL) = (Peso (kg) × Dosis (mg/kg)) / Concentración (mg/mL)
```

**Ejemplo de cálculo:**

```
Paciente: 25 kg
Medicamento: Meloxicam
Dosis: 0.2 mg/kg
Concentración: 5 mg/mL

Volumen = (25 × 0.2) / 5 = 5 / 5 = 1.00 mL
```

#### Características de Interfaz (UX)

- **Autocompletado editable:** Al seleccionar un medicamento del catálogo, los campos de Dosis y Concentración se rellenan automáticamente con los valores de referencia. Sin embargo, ambos campos son editables, permitiendo al médico ajustar la dosis dentro del rango terapéutico o usar una concentración diferente a la estándar.

```javascript
// Lógica de autocompletado al seleccionar medicamento
function handleSeleccion(e) {
  const med = medicamentos.find((m) => m.id === parseInt(e.target.value));
  setSeleccionado(med);
  setDosis(med ? (med.dosis_mg_por_kg ?? med.dosis_min_mg_kg ?? '') : '');
  setConcentracion(med ? (med.concentracion_mg_ml ?? '') : '');
}
```

- **Select agrupado por categoría terapéutica:** Los medicamentos se organizan en `<optgroup>` por categoría (AINE, Anestésico, Antibiótico, etc.), con la especie destino visible en cada opción.
- **Indicador de rango terapéutico:** Si el medicamento tiene rango de dosis definido (`dosis_min_mg_kg` y `dosis_max_mg_kg`), se muestra debajo del campo de dosis como referencia.
- **Nota clínica del medicamento:** Si el medicamento tiene `notas_clinicas` en el catálogo, se muestra en un banner ámbar con ícono de advertencia, incluyendo contraindicaciones y precauciones.
- **Estado de carga con spinner:** Durante el fetch al API, se muestra un spinner animado con el mensaje "Cargando catálogo de medicamentos…".
- **Manejo de error de API:** Si el servidor no está disponible, se muestra un mensaje de error en rojo con instrucciones para el usuario.

---

### 3.9 Toxicología

#### Objetivo Clínico

La calculadora de Toxicología es la herramienta de emergencia más crítica del módulo. Permite al médico veterinario evaluar en segundos el nivel de riesgo de una intoxicación, comparando la dosis ingerida (calculada a partir de la cantidad de sustancia y el peso del paciente) con los umbrales toxicológicos de referencia de la sustancia involucrada.

#### Variables e Inputs

| Variable | Unidad | Descripción |
|----------|--------|-------------|
| Peso | kg | Heredado del estado global |
| Toxina / Sustancia | — | Selección del catálogo, agrupado por especie afectada |
| Cantidad ingerida | mg | Cantidad total de la sustancia ingerida |

#### Fórmulas y Lógica Matemática

**Dosis ingerida normalizada por peso:**

```
Dosis ingerida (mg/kg) = Cantidad ingerida (mg) / Peso (kg)
```

**Algoritmo de clasificación de riesgo (semáforo de 4 niveles):**

```javascript
function calcularNivel(mgKgIngeridos, toxina) {
  // Nivel 1: Sin umbrales definidos → toxicidad idiosincrática
  if (!leve && !moderada && !letal) → "Toxicidad indeterminada" (ámbar)

  // Nivel 2: Dosis ≥ DL50 → Emergencia crítica
  if (mgKgIngeridos >= letal)       → "ZONA LETAL" (rojo)

  // Nivel 3: Dosis ≥ umbral moderado → Atención urgente
  if (mgKgIngeridos >= moderada)    → "Toxicidad moderada" (naranja)

  // Nivel 4: Dosis ≥ umbral leve → Monitoreo recomendado
  if (mgKgIngeridos >= leve)        → "Toxicidad leve" (ámbar)

  // Nivel 5: Por debajo de todos los umbrales → Seguro
  else                              → "Por debajo del umbral tóxico" (verde)
}
```

**Sistema de semáforo de 4 niveles de alerta:**

| Nivel | Ícono | Color | Título | Acción |
|-------|-------|-------|--------|--------|
| Letal | ☠️ | 🔴 Rojo | ZONA LETAL — Emergencia crítica | Tratamiento de emergencia inmediato |
| Moderado | 🔴 | 🟠 Naranja | Toxicidad moderada — Atención urgente | Protocolo de descontaminación |
| Leve | 🟡 | 🟡 Ámbar | Toxicidad leve — Monitoreo recomendado | Evaluar descontaminación |
| Indeterminado | ⚠️ | 🟡 Ámbar | Toxicidad indeterminada | Consultar toxicólogo veterinario |
| Seguro | ✅ | 🟢 Verde | Por debajo del umbral tóxico | Observación y monitoreo |

#### Características de Interfaz (UX)

- **Semáforo de riesgo dinámico:** El componente `AlertaNivel` renderiza una tarjeta con color, ícono, título y descripción personalizada que incluye los valores numéricos exactos de la dosis ingerida y el umbral superado.
- **Tabla de umbrales de referencia:** Después del resultado, se muestra una tabla con los tres umbrales (leve, moderado, letal) de la toxina seleccionada para que el médico pueda contextualizar el resultado.
- **Protocolo de tratamiento integrado:** Si la toxina tiene `signos_clinicos` y `tratamiento_base` en el catálogo, se muestran automáticamente en paneles separados (gris para signos, azul para tratamiento, ámbar para notas bibliográficas).
- **Agrupación por especie afectada:** El selector de toxinas agrupa las sustancias por especie (`canino` / `felino` / `general`) para facilitar la búsqueda en situaciones de emergencia.
- **Disclaimer clínico:** Un banner permanente al final recuerda que la herramienta es de apoyo clínico y que los umbrales son valores de referencia bibliográfica.

---

### 3.10 Scores Clínicos

#### Objetivo Clínico

La calculadora de Scores implementa tres herramientas de evaluación clínica estandarizada que permiten al médico veterinario cuantificar objetivamente el estado del paciente, comunicar hallazgos de forma precisa entre el equipo clínico, y tomar decisiones terapéuticas basadas en criterios validados internacionalmente.

#### 3.10.1 Pain Score — Escala Colorado (0–4)

**Objetivo:** Cuantificar el nivel de dolor del paciente para guiar la analgesia.

**Variables e Inputs:** Selección visual de nivel (0–4) mediante botones con emojis.

**Escala de 5 niveles:**

| Nivel | Emoji | Label | Color | Descripción clínica |
|-------|-------|-------|-------|---------------------|
| 0 | 😊 | Sin dolor | Verde | Comportamiento normal. Alerta, activo. |
| 1 | 😐 | Dolor leve | Lima | Levemente deprimido. Vocalización ocasional. |
| 2 | 😟 | Dolor moderado | Ámbar | Deprimido, reducción del apetito. Postura antiálgica. |
| 3 | 😣 | Dolor severo | Naranja | Muy deprimido, vocalización frecuente. Anorexia. |
| 4 | 😭 | Dolor insoportable | Rojo | Postrado. Vocalización continua o silencio total. |

**Fuente:** Colorado State University Veterinary Pain Scale.

#### 3.10.2 Glasgow Coma Score Modificado (Veterinario)

**Objetivo:** Evaluar el estado neurológico de pacientes con trauma craneoencefálico o alteraciones del nivel de conciencia.

**Variables e Inputs:** Tres selectores independientes (1–6 puntos cada uno):

| Dominio | Rango | Descripción extremos |
|---------|-------|----------------------|
| Actividad Motora | 1–6 | 1: Nula / 6: Movimientos voluntarios normales |
| Reflejos del Tronco Encefálico | 1–6 | 1: Ausencia de todos los reflejos / 6: Reflejos normales |
| Nivel de Conciencia | 1–6 | 1: Coma / 6: Alerta normal |

**Fórmula:**

```
Glasgow Total = Actividad Motora + Reflejos Tronco + Nivel Conciencia
Rango: 3 – 18 puntos
```

**Interpretación del puntaje total:**

```
Total ≤ 8  → Pronóstico GRAVE    — Alta mortalidad. Considerar UCI.
Total 9–13 → Pronóstico MODERADO — Monitoreo estrecho. Reevaluar frecuentemente.
Total ≥ 14 → Pronóstico FAVORABLE — Función neurológica relativamente conservada.
```

#### 3.10.3 SIRS — Síndrome de Respuesta Inflamatoria Sistémica

**Objetivo:** Identificar pacientes con SIRS para iniciar manejo temprano de sepsis.

**Variables e Inputs:** Cuatro criterios clínicos con checkboxes interactivos:

| Criterio | Umbral canino | Umbral felino |
|----------|---------------|---------------|
| ❤️ Frecuencia Cardíaca | > 120 lpm o < 60 lpm | > 250 lpm o < 100 lpm |
| 🫁 Frecuencia Respiratoria | > 20 rpm | > 40 rpm |
| 🌡️ Temperatura | > 39.5 °C o < 37.8 °C | > 39.5 °C o < 37.8 °C |
| 🔬 Leucocitos | > 12,000/μL o < 4,000/μL o > 10% bandas | Igual |

**Lógica de diagnóstico:**

```
Criterios positivos ≥ 2 → SIRS POSITIVO
  → Iniciar manejo de SIRS/Sepsis

Criterios positivos = 1 → Criterios insuficientes
  → Monitoreo estrecho

Criterios positivos = 0 → Sin criterios SIRS
```

**Fuente:** Kirby & Hauptman, *Journal of Veterinary Emergency and Critical Care*, 1992.

#### Características de Interfaz (UX) — Scores

- **Pain Score con emojis interactivos:** Los cinco botones de nivel muestran emojis representativos del estado de dolor, haciendo la evaluación intuitiva incluso para personal auxiliar. El botón activo adopta el color semántico del nivel.
- **Glasgow con selectores descriptivos:** Cada opción del selector incluye el valor numérico y una descripción clínica completa, eliminando la necesidad de consultar tablas de referencia externas.
- **SIRS con checkboxes visuales personalizados:** Los criterios SIRS se presentan como botones-checkbox de ancho completo. Al activarse, el botón cambia a fondo rojo con borde rojo, y el checkbox visual se rellena de rojo con un ícono de palomita blanca.
- **Resultado SIRS en tiempo real:** El panel de resultado se actualiza con cada clic, mostrando el conteo de criterios positivos (X/4) y el diagnóstico correspondiente con codificación de color.
- **Puntaje Glasgow prominente:** El total del Glasgow se muestra en un badge circular de tipografía 2xl junto al diagnóstico, con el denominador "/18" para contextualizar el puntaje.

---

## 4. Conclusión

### 4.1 Impacto Técnico

El Módulo de Calculadoras Clínicas representa un salto cualitativo en la arquitectura del sistema ANA-vet. Desde el punto de vista técnico, los logros más significativos son:

1. **Separación de responsabilidades:** La lógica de cálculo reside completamente en el frontend (React), mientras que el backend actúa exclusivamente como proveedor de datos de catálogo. Esto minimiza la latencia de red y permite que las calculadoras funcionen incluso con conectividad intermitente.

2. **Estado global de peso como prop drilling controlado:** El patrón de pasar `pesoKg` como prop desde la página `Calculadora.js` a todos los componentes hijos es una solución elegante que evita la complejidad de un gestor de estado global (Redux/Context) para un dato de alcance limitado.

3. **Componentes reutilizables:** Los sub-componentes `Seccion`, `ResultCard`, `ConversorBidireccional` y `ResultadoCard` son reutilizados en múltiples calculadoras, reduciendo la duplicación de código y garantizando consistencia visual.

4. **Extensibilidad del catálogo:** Las tablas `catalogo_medicamentos` y `catalogo_toxicologia` están diseñadas para crecer. Agregar un nuevo medicamento o toxina al catálogo no requiere ningún cambio en el código de la aplicación; basta con insertar un registro en la base de datos.

### 4.2 Impacto Operativo

Desde la perspectiva de la gestión clínica, el módulo transforma la forma en que el personal de la clínica veterinaria trabaja:

- **Reducción del tiempo de respuesta en emergencias:** Un médico puede evaluar una intoxicación por xilitol, calcular el volumen de dextrosa para el bolo inicial y determinar la velocidad de CRI en menos de 60 segundos, todo desde la misma pantalla.

- **Estandarización de protocolos:** Los scores clínicos (Glasgow, Colorado, SIRS) garantizan que todos los médicos de la clínica utilicen los mismos criterios de evaluación, mejorando la comunicación entre turnos y la calidad de los registros.

- **Reducción del error de medicación:** La calculadora de Farmacia con autocompletado de dosis y concentración elimina el paso más propenso a error en la preparación de fármacos: la búsqueda manual de la dosis en tablas y el cálculo a mano.

- **Educación continua integrada:** Las notas clínicas de los medicamentos, los protocolos de tratamiento toxicológico y las referencias bibliográficas de los scores están integradas directamente en la interfaz, convirtiendo cada uso de la herramienta en una oportunidad de aprendizaje.

### 4.3 Perspectivas de Desarrollo Futuro

El módulo está diseñado para escalar. Las siguientes funcionalidades están contempladas para fases posteriores:

| Funcionalidad | Descripción |
|---------------|-------------|
| **Integración con expediente** | Guardar los resultados de las calculadoras directamente en el expediente del paciente activo |
| **Catálogo expandido** | Ampliar `catalogo_medicamentos` a 50+ fármacos y `catalogo_toxicologia` a 30+ sustancias |
| **Calculadoras adicionales** | Índice de Masa Corporal (BCS), Tasa de Filtración Glomerular (TFG), Índice de Shock |
| **Historial de cálculos** | Registro de los cálculos realizados por sesión para auditoría y seguimiento |
| **Exportación a PDF** | Integración con el módulo de reportes existente para generar hojas de trabajo anestésico |

---

> **Aviso legal:** Las fórmulas, valores de referencia y protocolos incluidos en este módulo son de uso clínico orientativo. Deben ser validados por un médico veterinario colegiado antes de su aplicación en pacientes reales. ANA-vet no se responsabiliza por decisiones clínicas tomadas exclusivamente con base en los resultados de estas herramientas.

---

*Documento generado automáticamente a partir del análisis del código fuente del sistema ANA-vet.*
*Stack: React 18 · Node.js/Express · MySQL (MariaDB 10.4) · Tailwind CSS*
*Repositorio: https://github.com/agdisc11/vetapp*
