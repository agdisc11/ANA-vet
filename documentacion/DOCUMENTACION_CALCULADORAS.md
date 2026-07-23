# 🧮 Documentación Técnica — Módulo de Calculadoras Clínicas

**ANA-vet · Sistema de Gestión Veterinaria**  
**Versión:** 3.0 (Refinamiento Clínico Masivo)  
**Estado:** ✅ 100% Operativo — 10 categorías activas  
**Stack:** React 18 · Node.js/Express · MySQL (MariaDB 10.4) · Tailwind CSS  
**Repositorio:** https://github.com/agdisc11/vetapp

---

## 1. Arquitectura General

### 1.1 Principios de Diseño

El módulo de Calculadoras Clínicas sigue una arquitectura de tres capas estrictamente desacopladas:

```
MySQL (catálogos) ──► Node.js/Express (API REST) ──► React (UI + lógica clínica)
```

**Reglas de oro de la arquitectura:**
- La base de datos MySQL **solo almacena catálogos dinámicos** (medicamentos, toxinas). Toda la lógica matemática clínica reside en el frontend como constantes inmutables.
- El backend **no realiza cálculos clínicos**. Su único rol es servir los catálogos mediante endpoints REST.
- El frontend **no modifica la base de datos**. Solo consume datos de lectura.
- Todos los componentes son **React funcionales con Hooks** (`useState`, `useEffect`). Prohibido el uso de clases.

### 1.2 Flujo de Datos

```
Calculadora.js (Shell Maestro)
│
├── Estado global: pesoKg (number | null)
│   └── Propagado como prop a todos los sub-módulos
│
├── fetch('http://localhost:4000/api/calculadora/medicamentos')
│   └── Consumido por: Farmacia.js
│
└── fetch('http://localhost:4000/api/calculadora/toxicologia')
    └── Consumido por: Toxicologia.js
```

### 1.3 Estructura de Archivos

```
frontend/clinica-vet-frontend/src/
├── pages/
│   ├── Dashboard.js          ← Banner de acceso rápido al módulo
│   └── Calculadora.js        ← Shell maestro: peso global + navegación entre módulos
└── components/calculadoras/
    ├── Anestesia.js           ← Flow rates, ASA, agente volátil
    ├── BloodGas.js            ← Ácido-base, Anion Gap, HCO₃
    ├── Cardiac.js             ← MAP, presión de pulso
    ├── Conversiones.js        ← Unidades SI, peso, temperatura, líquidos, suturas
    ├── Farmacia.js            ← Dosis + catálogo BD + matriz de compatibilidad
    ├── Fluidos.js             ← Fluidoterapia, K⁺, CRI, osmolalidad
    ├── Hematologia.js         ← Transfusión, flebotomía, volumen sanguíneo
    ├── Nutricion.js           ← RER, DER, cantidad a alimentar
    ├── Scores.js              ← Pain Colorado, CMPS-SF, Glasgow, SIRS
    └── Toxicologia.js         ← Exposición + catálogo BD + semáforo de riesgo

backend/clinica-vet-backend/src/routes/
└── calculadora.js             ← GET /medicamentos · GET /toxicologia
```

### 1.4 Patrón de Constantes Clínicas

Cada componente declara sus constantes matemáticas como objeto inmutable al inicio del archivo:

```js
const CLINICAL_CONSTANTS = Object.freeze({
  // Factores, tablas, umbrales...
});
```

Este patrón garantiza que los valores clínicos no puedan ser mutados accidentalmente en tiempo de ejecución y facilita la auditoría de los valores de referencia.

---

## 2. API REST — Backend (Node.js/Express)

### 2.1 Endpoints Disponibles

**Base URL:** `http://localhost:4000/api/calculadora`

| Método | Ruta | Descripción | Archivo |
|--------|------|-------------|---------|
| `GET` | `/medicamentos` | Catálogo completo de medicamentos veterinarios | `calculadora.js` |
| `GET` | `/toxicologia` | Catálogo completo de toxinas con umbrales de riesgo | `calculadora.js` |

### 2.2 Esquema de Respuesta — `/medicamentos`

```json
[
  {
    "id": 1,
    "nombre": "Meloxicam",
    "categoria": "AINE",
    "especie_destino": "general",
    "dosis_mg_por_kg": 0.2,
    "dosis_min_mg_kg": 0.1,
    "dosis_max_mg_kg": 0.2,
    "concentracion_mg_ml": 5.0,
    "via_administracion": "SC, IV, PO",
    "notas_clinicas": "Dosis inicial 0.2 mg/kg..."
  }
]
```

### 2.3 Esquema de Respuesta — `/toxicologia`

```json
[
  {
    "id": 1,
    "toxina": "Teobromina (Chocolate)",
    "especie_afectada": "canino",
    "dosis_toxica_leve_mg_kg": 20.0,
    "dosis_toxica_moderada_mg_kg": 40.0,
    "dosis_toxica_letal_mg_kg": 100.0,
    "mecanismo": "Inhibición de fosfodiesterasa...",
    "signos_clinicos": "Vómito, diarrea...",
    "tratamiento_base": "1. Inducción de emesis...",
    "notas": "Chocolate negro: ~16 mg/g..."
  }
]
```

---

## 3. Módulos Clínicos — Especificación Técnica Completa

### 3.1 💉 Anestesia (`Anestesia.js`)

**Estado:** ✅ Operativo

#### Calculadoras incluidas:

**a) Flow Rate de Oxígeno**
- Mapleson D/E/F: `Flow = 2.5 × FR × VolTidal` (mL/min)
- Círculo cerrado: `Flow = 10 × pesoKg` (mL/min)
- Inputs: Frecuencia respiratoria (rpm), Volumen tidal (mL/kg), Sistema de anestesia

**b) Clasificación ASA**
- Escala I–V con descripción clínica interactiva
- Selector visual con código de color por nivel de riesgo

**c) Consumo de Agente Volátil**
- Fórmula: `Consumo (mL/h) = (FGF × CAM × Factor) / PVS`
  - FGF: Flujo de gas fresco (mL/min)
  - CAM: Concentración alveolar mínima (%)
  - PVS: Presión de vapor saturado del agente
- Agentes: Isoflurano (PVS 239 mmHg), Sevoflurano (PVS 160 mmHg)

---

### 3.2 🩸 Blood Gas (`BloodGas.js`)

**Estado:** ✅ Operativo

#### Calculadoras incluidas:

**a) Interpretador Ácido-Base**
- Inputs: pH, pCO₂ (mmHg), HCO₃ (mEq/L)
- Algoritmo de interpretación:
  - pH < 7.35 → Acidosis; pH > 7.45 → Alcalosis
  - pCO₂ > 45 → Componente respiratorio; HCO₃ < 22 → Componente metabólico
  - Detección de compensación mixta

**b) Anion Gap**
- Fórmula: `AG = Na⁺ − (Cl⁻ + HCO₃⁻)`
- Referencia: Normal 12–24 mEq/L (canino/felino)
- AG corregido por albúmina: `AG_corr = AG + 2.5 × (4.0 − Albúmina)`

**c) Déficit de Bicarbonato**
- Fórmula: `Déficit = 0.3 × pesoKg × (HCO₃_normal − HCO₃_actual)`
- HCO₃ normal de referencia: 22 mEq/L

---

### 3.3 ❤️ Cardiac (`Cardiac.js`)

**Estado:** ✅ Operativo

#### Calculadoras incluidas:

**a) Presión Arterial Media (MAP)**
- Fórmula: `MAP = (PAS + 2 × PAD) / 3`
- Interpretación:
  - MAP < 60 mmHg → Hipotensión crítica (rojo)
  - MAP 60–100 mmHg → Normal (verde)
  - MAP > 100 mmHg → Hipertensión (ámbar)

**b) Presión de Pulso**
- Fórmula: `PP = PAS − PAD`
- Interpretación:
  - PP < 20 mmHg → Reducida (shock, tamponamiento)
  - PP 20–60 mmHg → Normal
  - PP > 60 mmHg → Amplia (insuficiencia aórtica, sepsis)

---

### 3.4 🔄 Conversiones (`Conversiones.js`)

**Estado:** ✅ Operativo — v3.0 con sub-pantalla SI

#### Constantes clínicas inmutables:

```js
const CLINICAL_CONSTANTS = Object.freeze({
  grupos: [
    {
      id: 'hematologia',
      label: 'Hematología',
      componentes: [
        { id: 'rbc',       label: 'Eritrocitos (RBC)',  unidConv: '×10⁶/μL', unidSI: '×10¹²/L', factor: 1.0    },
        { id: 'hb',        label: 'Hemoglobina (Hb)',   unidConv: 'g/dL',     unidSI: 'g/L',      factor: 10.0   },
        { id: 'wbc',       label: 'Leucocitos (WBC)',   unidConv: '×10³/μL',  unidSI: '×10⁹/L',  factor: 1.0    },
        { id: 'neutro',    label: 'Neutrófilos',        unidConv: '×10³/μL',  unidSI: '×10⁹/L',  factor: 1.0    },
        { id: 'linfocito', label: 'Linfocitos',         unidConv: '×10³/μL',  unidSI: '×10⁹/L',  factor: 1.0    },
        { id: 'plaquetas', label: 'Plaquetas',          unidConv: '×10³/μL',  unidSI: '×10⁹/L',  factor: 0.001  },
        { id: 'prot_tot',  label: 'Proteínas totales',  unidConv: 'g/dL',     unidSI: 'g/L',      factor: 10.0   },
      ],
    },
    {
      id: 'bioquimica',
      label: 'Bioquímica',
      componentes: [
        { id: 'alt',        label: 'ALT / Fosfatasa Alcalina', unidConv: 'U/L',   unidSI: 'μkat/L', factor: 0.0167 },
        { id: 'albumina',   label: 'Albúmina',                 unidConv: 'g/dL',  unidSI: 'g/L',    factor: 10.0   },
        { id: 'creatinina', label: 'Creatinina',               unidConv: 'mg/dL', unidSI: 'μmol/L', factor: 88.4   },
        { id: 'glucosa',    label: 'Glucosa',                  unidConv: 'mg/dL', unidSI: 'mmol/L', factor: 0.0555 },
        { id: 'bun',        label: 'BUN',                      unidConv: 'mg/dL', unidSI: 'mmol/L', factor: 0.357  },
        { id: 'sodio',      label: 'Sodio (Na⁺)',              unidConv: 'mEq/L', unidSI: 'mmol/L', factor: 1.0    },
        { id: 'potasio',    label: 'Potasio (K⁺)',             unidConv: 'mEq/L', unidSI: 'mmol/L', factor: 1.0    },
        { id: 'cloro',      label: 'Cloro (Cl⁻)',              unidConv: 'mEq/L', unidSI: 'mmol/L', factor: 1.0    },
        { id: 'calcio',     label: 'Calcio (Ca²⁺)',            unidConv: 'mg/dL', unidSI: 'mmol/L', factor: 0.250  },
      ],
    },
    {
      id: 'endocrino',
      label: 'Endocrino & Fármacos',
      componentes: [
        { id: 'cortisol',     label: 'Cortisol',     unidConv: 'μg/dL', unidSI: 'nmol/L', factor: 27.59 },
        { id: 't4',           label: 'T4 total',     unidConv: 'μg/dL', unidSI: 'nmol/L', factor: 12.87 },
        { id: 'fenobarbital', label: 'Fenobarbital', unidConv: 'μg/mL', unidSI: 'μmol/L', factor: 4.31  },
        { id: 'digoxina',     label: 'Digoxina',     unidConv: 'ng/mL', unidSI: 'nmol/L', factor: 1.28  },
      ],
    },
  ],
});
```

#### Fórmulas de conversión:
- **Conv → SI:** `valor_SI = valor_conv × factor`
- **SI → Conv:** `valor_conv = valor_SI ÷ factor`

#### Otras conversiones disponibles:
- Peso: kg ↔ lb (factor 2.20462)
- Temperatura: °C ↔ °F (`(°C × 9/5) + 32`)
- Líquidos: mL → L (÷1000), mL → fl oz (÷29.5735)
- Presiones: mmHg ↔ kPa (×0.133322), mmHg ↔ cmH₂O (×1.35951)
- Suturas: Tabla USP ↔ Métrico (13 tallas, de 7 a 6-0)

---

### 3.5 💧 Fluidos (`Fluidos.js`)

**Estado:** ✅ Operativo — v3.0 con especie, K⁺ y modal de emergencia

#### Constantes clínicas inmutables:

```js
const CLINICAL_CONSTANTS = Object.freeze({
  mantenimiento: {
    perro: 60,  // mL/kg/día → (pesoKg × 60) / 24 = mL/h
    gato:  45,  // mL/kg/día → (pesoKg × 45) / 24 = mL/h
  },
  potasio: [
    { min: 3.5,       max: Infinity, label: '≥ 3.5',    supl: 0,  descripcion: 'Normal — sin suplementación' },
    { min: 3.0,       max: 3.5,      label: '3.0–3.5',  supl: 14, descripcion: 'Hipocalemia leve' },
    { min: 2.5,       max: 3.0,      label: '2.5–3.0',  supl: 28, descripcion: 'Hipocalemia moderada' },
    { min: 2.0,       max: 2.5,      label: '2.0–2.5',  supl: 40, descripcion: 'Hipocalemia severa' },
    { min: -Infinity, max: 2.0,      label: '< 2.0',    supl: 80, descripcion: 'Hipocalemia crítica' },
  ],
  kMaxRate: 0.5, // mEq/kg/h — umbral de seguridad cardíaca
});
```

#### Calculadoras incluidas:

**a) Fluidoterapia con Déficit (por especie)**
- Selector de especie: Perro / Gato (cambia el factor de mantenimiento)
- `Mantenimiento (mL/h) = (pesoKg × factor_especie) / 24`
- `Déficit (mL) = pesoKg × %_deshidratación × 10`
- `Total (mL/24h) = Mantenimiento_24h + Déficit + Pérdidas_contemporáneas`
- `Goteo (gtt/min) = (Total × factor_gotero) / (24 × 60)`
  - Normogotero: 20 gtt/mL · Microgotero: 60 gtt/mL

**b) Suplementación de Potasio (K⁺) e Infusión Crítica**
- Input: K⁺ sérico (mEq/L) → lookup en tabla de 5 rangos → suplementación recomendada (mEq/L)
- Input: Velocidad de infusión (mL/h) → cálculo de tasa de K⁺:
  - `Tasa (mEq/kg/h) = (mEq_per_L × Rate_mL_h) / (1000 × pesoKg)`
- **UX de emergencia:** Si `Tasa > 0.5 mEq/kg/h`:
  - Se dispara automáticamente un modal de pantalla completa
  - Fondo rojo con clase `animate-pulse` de Tailwind CSS
  - Bloquea el flujo hasta que el usuario confirme haber revisado los parámetros
  - Riesgo: arritmias ventriculares, fibrilación ventricular, paro cardíaco

**c) CRI — Constant Rate Infusion**
- `Velocidad (mL/h) = (Dosis × pesoKg × 60) / Concentración`
- Unidades: mcg/kg/min o mg/kg/min

**d) Osmolalidad Sérica**
- `Osm (mOsm/kg) = 2×Na + Glucosa/18 + BUN/2.8`
- Referencia: Normal 280–310 mOsm/kg

**e) Déficit de Agua Libre**
- `DAL (L) = 0.6 × pesoKg × (Na_actual / 145 − 1)`

---

### 3.6 🔬 Hematología (`Hematologia.js`)

**Estado:** ✅ Operativo — v3.0 con sub-pantalla de Flebotomía

#### Constantes clínicas inmutables:

```js
const CLINICAL_CONSTANTS = Object.freeze({
  flebotomia:      { perro: 90, gato: 70  },  // Factor K por especie
  transfusion:     { perro: 90, gato: 60  },  // Factor por especie
  volumenSanguineo:{ perro: 85, gato: 60  },  // mL/kg
});
```

#### Sub-pantallas (tabs):

**a) Transfusión Sanguínea**
- `Volumen (mL) = pesoKg × (Hct_deseado − Hct_actual) × Factor / Hct_donador`
- Factor: Perro = 90, Gato = 60
- Inputs: Hct actual (%), Hct deseado (%), Hct donador (%)
- Velocidad de administración recomendada: 5–10 mL/kg/h

**b) Flebotomía Terapéutica** *(nuevo en v3.0)*
- `Volumen_extraer (mL) = pesoKg × K × ((PCV_actual − PCV_deseado) / PCV_actual)`
- K: Perro = 90, Gato = 70
- **Validación en tiempo real:** Si `PCV_deseado ≥ PCV_actual` → error en input, cálculo bloqueado
- El campo PCV deseado se limpia automáticamente al cambiar PCV actual
- Recomendaciones clínicas integradas: máx. 10–15 mL/kg por sesión, reemplazar con isotónica

**c) Volumen Sanguíneo Estimado**
- `VST (mL) = pesoKg × factor_especie`
- Umbrales de pérdida: 15% (seguro), 20% (moderado), 30% (grave)

---

### 3.7 🥩 Nutrición (`Nutricion.js`)

**Estado:** ✅ Operativo

#### Calculadoras incluidas:

**a) RER — Requerimiento Energético en Reposo**
- `RER (kcal/día) = 70 × (pesoKg)^0.75`
- Alternativa lineal (< 2 kg o > 45 kg): `RER = 30 × pesoKg + 70`

**b) DER — Requerimiento Energético Diario**
- `DER (kcal/día) = RER × Factor_vida`
- 23 factores de vida disponibles (cachorro, adulto activo, gestación, lactancia, obesidad, etc.)

**c) Cantidad a Alimentar**
- `Cantidad (g/día) = DER / Densidad_energética_alimento`
- Densidad energética configurable (kcal/g)
- Resultado en g/día + porciones por comida

---

### 3.8 💊 Farmacia (`Farmacia.js`)

**Estado:** ✅ Operativo — v3.0 con matriz de compatibilidad de unidades

#### Constantes clínicas inmutables:

```js
const CLINICAL_CONSTANTS = Object.freeze({
  compatibilidad: {
    'mg/mL':  ['mg', 'mg/kg'],
    'mcg/mL': ['mcg', 'mcg/kg', 'μg', 'μg/kg'],
    'μg/mL':  ['mcg', 'mcg/kg', 'μg', 'μg/kg'],
    'U/mL':   ['U', 'UI', 'U/kg', 'UI/kg'],
    'mEq/mL': ['mEq', 'mEq/kg'],
    'g/mL':   ['g', 'g/kg'],
    '%':      ['mg', 'mg/kg', 'g', 'g/kg'],
  },
  unidadesDosis:       ['mg', 'mg/kg', 'mcg', 'mcg/kg', 'μg', 'μg/kg', 'U', 'UI', 'U/kg', 'UI/kg', 'mEq', 'mEq/kg', 'g', 'g/kg'],
  unidadesFormulacion: ['mg/mL', 'mcg/mL', 'μg/mL', 'U/mL', 'mEq/mL', 'g/mL', '%'],
});
```

#### Flujo de la calculadora:

1. **Fetch al montar** → `GET /api/calculadora/medicamentos` → lista de medicamentos agrupados por categoría
2. **Selección de medicamento** → autocompletado de dosis (`dosis_mg_por_kg`) y concentración (`concentracion_mg_ml`)
3. **Selección de unidades** → usuario elige unidad de dosis y unidad de formulación
4. **Validación de compatibilidad** (en tiempo real):
   - `esCompatible(unidadDosis, unidadFormulacion)` → `true | false | null`
   - Si `false` → badge rojo de incompatibilidad + botón calcular deshabilitado con texto de error
   - Si `true` → badge verde de compatibilidad confirmada
5. **Cálculo:** `Volumen (mL) = (pesoKg × Dosis) / Concentración`
6. **Limpieza de resultado:** Cualquier cambio en inputs limpia el resultado previo (`setVolumen(null)`)

---

### 3.9 ☠️ Toxicología (`Toxicologia.js`)

**Estado:** ✅ Operativo

#### Flujo de la calculadora:

1. **Fetch al montar** → `GET /api/calculadora/toxicologia` → catálogo de toxinas
2. **Selección de toxina** → muestra umbrales de riesgo (leve/moderado/letal en mg/kg)
3. **Input de dosis ingerida** (mg/kg) → comparación con umbrales:
   - `< dosis_leve` → Sin riesgo significativo (verde)
   - `≥ dosis_leve` → Riesgo leve (ámbar)
   - `≥ dosis_moderada` → Riesgo moderado (naranja)
   - `≥ dosis_letal` → Riesgo letal (rojo)
4. **Información clínica:** mecanismo, signos clínicos, protocolo de tratamiento base, notas bibliográficas

---

### 3.10 📊 Scores (`Scores.js`)

**Estado:** ✅ Operativo — v3.0 con CMPS-SF integrado

#### Escalas incluidas:

**a) Pain Score Colorado (0–4)**
- Selector visual de 5 niveles con emoji y código de color
- Descripción clínica detallada por nivel: comportamiento, postura, respuesta a palpación
- Fuente: Colorado State University Veterinary Pain Scale

**b) CMPS-SF — Composite Measure Pain Scale Short Form** *(nuevo en v3.0)*

```js
const CLINICAL_CONSTANTS = Object.freeze({
  cmps: {
    secciones: [
      { id: 'vocalizacion',    label: 'A. Vocalización',              opciones: [0,1,2,3] },
      { id: 'atencion_herida', label: 'B. Atención a la herida',      opciones: [0,1,2,3] },
      { id: 'locomocion',      label: 'C. Locomoción / Postura',      opciones: [0,1,2,3] },
      { id: 'palpacion',       label: 'D. Respuesta a la palpación',  opciones: [0,1,2,3] },
      { id: 'animo',           label: 'E. Ánimo / Estado mental',     opciones: [0,1,2,3] },
      { id: 'postura',         label: 'F. Postura corporal',          opciones: [0,1,2,3] },
    ],
    umbralSinFractura: 5,   // Score ≥ 5 → rescate analgésico (máx. 23 pts)
    umbralConFractura: 6,   // Score ≥ 6 → rescate analgésico (máx. 24 pts)
    maxSinFractura: 23,
    maxConFractura: 24,
  },
});
```

- **6 secciones obligatorias** con radio buttons personalizados (accesibles con `sr-only`)
- **Toggle de fractura** que ajusta dinámicamente el umbral y el máximo
- **Barra de progreso** de secciones completadas
- **Alerta de rescate analgésico:** Si `score ≥ umbral` → card roja con `animate-pulse` + mensaje de acción inmediata
- **Botón de reset** que limpia todas las respuestas
- Fuente: Murrell et al., Vet Anaesth Analg 2008

**c) Glasgow Coma Score Modificado (Veterinario)**
- 3 subescalas: Actividad Motora (1–6), Reflejos del Tronco (1–6), Nivel de Conciencia (1–6)
- Rango total: 3–18 pts
- Interpretación:
  - ≤ 8 → Pronóstico grave (rojo)
  - 9–13 → Pronóstico moderado (ámbar)
  - 14–18 → Pronóstico favorable (verde)

**d) SIRS — Síndrome de Respuesta Inflamatoria Sistémica**
- 4 criterios con checkboxes interactivos: FC, FR, Temperatura, Leucocitos
- SIRS positivo: ≥ 2 criterios presentes
- Fuente: Kirby & Hauptman, JVECC 1992

---

## 4. UX de Emergencia — Especificación de Alertas Críticas

### 4.1 Modal de K⁺ Crítico (Fluidos.js)

**Condición de disparo:** `(mEq_per_L × Rate_mL_h) / (1000 × pesoKg) > 0.5 mEq/kg/h`

**Comportamiento:**
- Se dispara automáticamente al cambiar el input de velocidad de infusión
- Overlay de pantalla completa con `position: fixed; inset: 0; z-index: 50`
- Fondo: `bg-red-900/70 animate-pulse` (Tailwind CSS)
- Card central con borde rojo de 4px, muestra la tasa calculada y el límite seguro
- Botón de confirmación: "Entendido — Revisar parámetros"
- La card de resultado también muestra `animate-pulse` mientras la tasa sea crítica

**Riesgo clínico:** Tasas > 0.5 mEq/kg/h pueden causar arritmias ventriculares, fibrilación ventricular y paro cardíaco.

### 4.2 Alerta de Rescate Analgésico CMPS-SF (Scores.js)

**Condición de disparo:** `scoreTotal ≥ umbral` (5 sin fractura / 6 con fractura)

**Comportamiento:**
- Card de resultado cambia a fondo rojo
- Emoji 🚨 con `animate-pulse`
- Mensaje: "RESCATE ANALGÉSICO INMEDIATO REQUERIDO"
- Instrucción: administrar analgesia de rescate y reevaluar en 30 minutos

### 4.3 Badge de Incompatibilidad de Unidades (Farmacia.js)

**Condición de disparo:** `unidadDosis` no está en el array de compatibles de `unidadFormulacion`

**Comportamiento:**
- Badge rojo con ícono 🚫 y descripción de la incompatibilidad
- Lista de unidades compatibles con la formulación seleccionada
- Botón "Calcular" cambia a estado rojo con texto de error y `cursor-not-allowed`
- El cálculo está completamente bloqueado hasta corregir las unidades

### 4.4 Validación PCV en Flebotomía (Hematologia.js)

**Condición de disparo:** `PCV_deseado ≥ PCV_actual`

**Comportamiento:**
- Input de PCV deseado muestra borde rojo
- Mensaje de error en tiempo real debajo del input
- El resultado de volumen no se muestra hasta que la condición sea válida

---

## 5. Principios de Limpieza de Estado

Para evitar lecturas médicas obsoletas, todos los componentes implementan el siguiente patrón:

```js
// Al cambiar cualquier input → limpiar el resultado previo
function handleInputChange(setter) {
  return (e) => {
    setter(e.target.value);
    setResultado(null); // ← Limpieza explícita del output
  };
}
```

**Casos específicos:**
- **Farmacia:** `handleDosisChange`, `handleConcentracionChange`, `handleUnidadDosisChange`, `handleUnidadFormulacionChange` → todos llaman `setVolumen(null)`
- **Hematología/Flebotomía:** `handlePcvActual` → limpia `pcvDeseado` y el resultado
- **Fluidos/Fluidoterapia:** Cambio de especie o inputs → `setCalcular(false)` oculta resultados
- **Fluidos/K⁺:** Cambio de K⁺ sérico → limpia `rateMlH` y la tasa calculada

---

## 6. Extensibilidad

### 6.1 Agregar un nuevo medicamento al catálogo

Solo requiere un `INSERT` en la base de datos. No se modifica ningún archivo de código:

```sql
INSERT INTO catalogo_medicamentos
  (nombre, categoria, especie_destino, dosis_mg_por_kg, dosis_min_mg_kg, dosis_max_mg_kg, concentracion_mg_ml, via_administracion, notas_clinicas)
VALUES
  ('Nuevo Fármaco', 'Categoría', 'general', 1.0, 0.5, 2.0, 10.0, 'IV, IM', 'Notas clínicas...');
```

### 6.2 Agregar una nueva toxina al catálogo

```sql
INSERT INTO catalogo_toxicologia
  (toxina, especie_afectada, dosis_toxica_leve_mg_kg, dosis_toxica_moderada_mg_kg, dosis_toxica_letal_mg_kg, mecanismo, signos_clinicos, tratamiento_base, notas)
VALUES
  ('Nueva Toxina', 'canino', 10.0, 50.0, 200.0, 'Mecanismo...', 'Signos...', 'Tratamiento...', 'Fuente...');
```

### 6.3 Agregar un nuevo factor de conversión SI

Editar `CLINICAL_CONSTANTS` en `Conversiones.js`:

```js
{ id: 'nuevo_analito', label: 'Nuevo Analito', unidConv: 'mg/dL', unidSI: 'mmol/L', factor: X.XXX }
```

---

## 7. Impacto Operativo

- **Reducción del tiempo de respuesta en emergencias:** Evaluación de intoxicación, cálculo de bolo y CRI en < 60 segundos desde la misma pantalla.
- **Estandarización de protocolos:** Glasgow, Colorado y CMPS-SF garantizan criterios de evaluación uniformes entre turnos.
- **Reducción del error de medicación:** Matriz de compatibilidad de unidades bloquea combinaciones inválidas antes del cálculo.
- **Seguridad en fluidoterapia:** Modal de K⁺ crítico previene tasas de infusión potencialmente letales.
- **Educación continua integrada:** Notas clínicas, protocolos y referencias bibliográficas integradas en la interfaz.

---

## 8. Perspectivas de Desarrollo Futuro

| Funcionalidad | Descripción |
|---|---|
| **Integración con expediente** | Guardar resultados de calculadoras directamente en el expediente del paciente activo |
| **Catálogo expandido** | Ampliar `catalogo_medicamentos` a 50+ fármacos y `catalogo_toxicologia` a 30+ sustancias |
| **Calculadoras adicionales** | BCS (Body Condition Score), TFG (Tasa de Filtración Glomerular), Índice de Shock |
| **Historial de cálculos** | Registro de cálculos por sesión para auditoría y seguimiento |
| **Exportación a PDF** | Integración con el módulo de reportes para generar hojas de trabajo anestésico |

---

> **Aviso legal:** Las fórmulas, valores de referencia y protocolos incluidos en este módulo son de uso clínico orientativo. Deben ser validados por un médico veterinario colegiado antes de su aplicación en pacientes reales. ANA-vet no se responsabiliza por decisiones clínicas tomadas exclusivamente con base en los resultados de estas herramientas.

---

*Documento actualizado a la versión 3.0 — Refinamiento Clínico Masivo (2026-05-16)*  
*Stack: React 18 · Node.js/Express · MySQL (MariaDB 10.4) · Tailwind CSS*  
*Repositorio: https://github.com/agdisc11/vetapp*
