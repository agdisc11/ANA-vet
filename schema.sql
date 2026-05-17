-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 16-05-2026 a las 08:23:38
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `clinica_veterinaria`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `alta`
--

CREATE TABLE `alta` (
  `id` int(11) NOT NULL,
  `hospitalizacion_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `tipo` enum('Alta médica','Alta condicionada','Alta voluntaria') NOT NULL,
  `indicaciones` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `anestesia`
--

CREATE TABLE `anestesia` (
  `id` int(11) NOT NULL,
  `cirugia_id` int(11) NOT NULL,
  `protocolo` varchar(200) DEFAULT NULL,
  `farmacos` text DEFAULT NULL,
  `dosis` text DEFAULT NULL,
  `observaciones` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cirugia`
--

CREATE TABLE `cirugia` (
  `id` int(11) NOT NULL,
  `expediente_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `procedimiento` varchar(200) NOT NULL,
  `plan_quirurgico` text DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `consentimiento` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `consulta`
--

CREATE TABLE `consulta` (
  `id` int(11) NOT NULL,
  `expediente_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `motivo` text DEFAULT NULL,
  `anamnesis` text DEFAULT NULL,
  `examen_fisico` text DEFAULT NULL,
  `indicaciones` text DEFAULT NULL,
  `examenes_sistemicos` text DEFAULT NULL,
  `lista_problemas` text DEFAULT NULL,
  `dx_presuntivo` text DEFAULT NULL,
  `abordaje_dx` text DEFAULT NULL,
  `tratamiento` text DEFAULT NULL,
  `tratamiento_etiologico` text DEFAULT NULL,
  `seguimiento_medico` text DEFAULT NULL,
  `resumen` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `diagnostico`
--

CREATE TABLE `diagnostico` (
  `id` int(11) NOT NULL,
  `consulta_id` int(11) NOT NULL,
  `descripcion` text NOT NULL,
  `tipo` enum('Presuntivo','Definitivo') DEFAULT 'Presuntivo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `expediente`
--

CREATE TABLE `expediente` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `fecha_apertura` date NOT NULL DEFAULT curdate(),
  `anamnesis` text DEFAULT NULL,
  `examen_fisico` text DEFAULT NULL,
  `examenes_sistemicos` text DEFAULT NULL,
  `lista_problemas` text DEFAULT NULL,
  `dx_presuntivo` text DEFAULT NULL,
  `abordaje_dx` text DEFAULT NULL,
  `dx_definitivo` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `hospitalizacion`
--

CREATE TABLE `hospitalizacion` (
  `id` int(11) NOT NULL,
  `expediente_id` int(11) NOT NULL,
  `fecha_ingreso` date NOT NULL,
  `historia_clinica` text DEFAULT NULL,
  `abordaje_hospitalario` text DEFAULT NULL,
  `tratamiento_intrahospitalario` text DEFAULT NULL,
  `abordaje_diagnostico` text DEFAULT NULL,
  `seguimiento` text DEFAULT NULL,
  `revaloraciones` text DEFAULT NULL,
  `ajuste_plan_terapeutico` text DEFAULT NULL,
  `plan_diagnostico` text DEFAULT NULL,
  `tipo_alta` varchar(50) DEFAULT NULL,
  `acta_responsiva` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `paciente`
--

CREATE TABLE `paciente` (
  `id` int(11) NOT NULL,
  `tutor_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `especie` varchar(50) NOT NULL,
  `raza` varchar(100) DEFAULT NULL,
  `sexo` enum('Macho','Hembra') NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `funcion_zootecnica` varchar(100) DEFAULT NULL,
  `tatuaje` varchar(50) DEFAULT NULL,
  `microchip` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `esquemas_preventivos` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `seguimiento_hospitalizacion`
--

CREATE TABLE `seguimiento_hospitalizacion` (
  `id` int(11) NOT NULL,
  `hospitalizacion_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `revaloracion` text DEFAULT NULL,
  `ajuste_terapeutico` text DEFAULT NULL,
  `plan_diagnostico` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tratamiento`
--

CREATE TABLE `tratamiento` (
  `id` int(11) NOT NULL,
  `consulta_id` int(11) NOT NULL,
  `medicamento` varchar(150) NOT NULL,
  `dosis` varchar(100) DEFAULT NULL,
  `via` varchar(50) DEFAULT NULL,
  `duracion_dias` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tutor`
--

CREATE TABLE `tutor` (
  `id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellidos` varchar(150) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `codigo` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vacuna`
--

CREATE TABLE `vacuna` (
  `id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `fecha_aplicacion` date NOT NULL,
  `proxima_dosis` date DEFAULT NULL,
  `lote` varchar(50) DEFAULT NULL,
  `fabricante` varchar(255) DEFAULT NULL,
  `via_administracion` varchar(50) DEFAULT NULL,
  `dosis` varchar(100) DEFAULT NULL,
  `observaciones` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `alta`
--
ALTER TABLE `alta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospitalizacion_id` (`hospitalizacion_id`);

--
-- Indices de la tabla `anestesia`
--
ALTER TABLE `anestesia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `cirugia_id` (`cirugia_id`);

--
-- Indices de la tabla `cirugia`
--
ALTER TABLE `cirugia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `expediente_id` (`expediente_id`);

--
-- Indices de la tabla `consulta`
--
ALTER TABLE `consulta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `expediente_id` (`expediente_id`);

--
-- Indices de la tabla `diagnostico`
--
ALTER TABLE `diagnostico`
  ADD PRIMARY KEY (`id`),
  ADD KEY `consulta_id` (`consulta_id`);

--
-- Indices de la tabla `expediente`
--
ALTER TABLE `expediente`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`);

--
-- Indices de la tabla `hospitalizacion`
--
ALTER TABLE `hospitalizacion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `expediente_id` (`expediente_id`);

--
-- Indices de la tabla `paciente`
--
ALTER TABLE `paciente`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tutor_id` (`tutor_id`);

--
-- Indices de la tabla `seguimiento_hospitalizacion`
--
ALTER TABLE `seguimiento_hospitalizacion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospitalizacion_id` (`hospitalizacion_id`);

--
-- Indices de la tabla `tratamiento`
--
ALTER TABLE `tratamiento`
  ADD PRIMARY KEY (`id`),
  ADD KEY `consulta_id` (`consulta_id`);

--
-- Indices de la tabla `tutor`
--
ALTER TABLE `tutor`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- Indices de la tabla `vacuna`
--
ALTER TABLE `vacuna`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `alta`
--
ALTER TABLE `alta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `anestesia`
--
ALTER TABLE `anestesia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `cirugia`
--
ALTER TABLE `cirugia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `consulta`
--
ALTER TABLE `consulta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `diagnostico`
--
ALTER TABLE `diagnostico`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `expediente`
--
ALTER TABLE `expediente`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `hospitalizacion`
--
ALTER TABLE `hospitalizacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `paciente`
--
ALTER TABLE `paciente`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `seguimiento_hospitalizacion`
--
ALTER TABLE `seguimiento_hospitalizacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tratamiento`
--
ALTER TABLE `tratamiento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tutor`
--
ALTER TABLE `tutor`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `vacuna`
--
ALTER TABLE `vacuna`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `alta`
--
ALTER TABLE `alta`
  ADD CONSTRAINT `alta_ibfk_1` FOREIGN KEY (`hospitalizacion_id`) REFERENCES `hospitalizacion` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `anestesia`
--
ALTER TABLE `anestesia`
  ADD CONSTRAINT `anestesia_ibfk_1` FOREIGN KEY (`cirugia_id`) REFERENCES `cirugia` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `cirugia`
--
ALTER TABLE `cirugia`
  ADD CONSTRAINT `cirugia_ibfk_1` FOREIGN KEY (`expediente_id`) REFERENCES `expediente` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `consulta`
--
ALTER TABLE `consulta`
  ADD CONSTRAINT `consulta_ibfk_1` FOREIGN KEY (`expediente_id`) REFERENCES `expediente` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `diagnostico`
--
ALTER TABLE `diagnostico`
  ADD CONSTRAINT `diagnostico_ibfk_1` FOREIGN KEY (`consulta_id`) REFERENCES `consulta` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `expediente`
--
ALTER TABLE `expediente`
  ADD CONSTRAINT `expediente_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `hospitalizacion`
--
ALTER TABLE `hospitalizacion`
  ADD CONSTRAINT `hospitalizacion_ibfk_1` FOREIGN KEY (`expediente_id`) REFERENCES `expediente` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `paciente`
--
ALTER TABLE `paciente`
  ADD CONSTRAINT `paciente_ibfk_1` FOREIGN KEY (`tutor_id`) REFERENCES `tutor` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `seguimiento_hospitalizacion`
--
ALTER TABLE `seguimiento_hospitalizacion`
  ADD CONSTRAINT `seguimiento_hospitalizacion_ibfk_1` FOREIGN KEY (`hospitalizacion_id`) REFERENCES `hospitalizacion` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tratamiento`
--
ALTER TABLE `tratamiento`
  ADD CONSTRAINT `tratamiento_ibfk_1` FOREIGN KEY (`consulta_id`) REFERENCES `consulta` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `vacuna`
--
ALTER TABLE `vacuna`
  ADD CONSTRAINT `vacuna_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE CASCADE;
-- ============================================================
-- MÓDULO: CALCULADORAS CLÍNICAS — Fase 2
-- Base de datos: `clinica_veterinaria`
-- Generado: 2026-05-16
-- ============================================================

-- --------------------------------------------------------
--
-- Estructura de tabla para la tabla `catalogo_medicamentos`
--
-- Campos:
--   categoria          : grupo terapéutico (AINE, Anestésico, Antibiótico, etc.)
--   especie_destino    : canino | felino | general
--   dosis_mg_por_kg    : dosis estándar en mg/kg (puede ser NULL si varía mucho)
--   concentracion_mg_ml: concentración de la presentación comercial más común
--   via_administracion : IV, IM, SC, PO, etc.
--   notas_clinicas     : advertencias, contraindicaciones o notas de uso
-- --------------------------------------------------------

CREATE TABLE `catalogo_medicamentos` (
  `id`                  int(11)        NOT NULL AUTO_INCREMENT,
  `nombre`              varchar(150)   NOT NULL,
  `categoria`           varchar(100)   NOT NULL,
  `especie_destino`     enum('canino','felino','general') NOT NULL DEFAULT 'general',
  `dosis_mg_por_kg`     decimal(10,4)  DEFAULT NULL COMMENT 'mg/kg — dosis estándar de referencia',
  `dosis_min_mg_kg`     decimal(10,4)  DEFAULT NULL COMMENT 'mg/kg — límite inferior del rango',
  `dosis_max_mg_kg`     decimal(10,4)  DEFAULT NULL COMMENT 'mg/kg — límite superior del rango',
  `concentracion_mg_ml` decimal(10,4)  DEFAULT NULL COMMENT 'mg/mL de la presentación comercial',
  `via_administracion`  varchar(50)    DEFAULT NULL,
  `notas_clinicas`      text           DEFAULT NULL,
  `created_at`          timestamp      NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_categoria` (`categoria`),
  KEY `idx_especie` (`especie_destino`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Catálogo de medicamentos para calculadora de farmacia veterinaria';

-- --------------------------------------------------------
--
-- Estructura de tabla para la tabla `catalogo_toxicologia`
--
-- Campos:
--   toxina                    : nombre de la sustancia tóxica
--   especie_afectada          : canino | felino | general
--   dosis_toxica_leve_mg_kg   : dosis a partir de la cual aparecen signos leves
--   dosis_toxica_moderada_mg_kg: dosis con signos moderados/sistémicos
--   dosis_toxica_letal_mg_kg  : DL50 o dosis letal de referencia
--   mecanismo                 : mecanismo de toxicidad resumido
--   signos_clinicos           : signos esperados
--   tratamiento_base          : protocolo de descontaminación/antídoto
--   notas                     : fuente bibliográfica u observaciones
-- --------------------------------------------------------

CREATE TABLE `catalogo_toxicologia` (
  `id`                          int(11)       NOT NULL AUTO_INCREMENT,
  `toxina`                      varchar(150)  NOT NULL,
  `especie_afectada`            enum('canino','felino','general') NOT NULL DEFAULT 'general',
  `dosis_toxica_leve_mg_kg`     decimal(10,4) DEFAULT NULL COMMENT 'mg/kg — inicio de signos leves',
  `dosis_toxica_moderada_mg_kg` decimal(10,4) DEFAULT NULL COMMENT 'mg/kg — signos moderados/sistémicos',
  `dosis_toxica_letal_mg_kg`    decimal(10,4) DEFAULT NULL COMMENT 'mg/kg — DL50 o dosis letal de referencia',
  `mecanismo`                   varchar(255)  DEFAULT NULL,
  `signos_clinicos`             text          DEFAULT NULL,
  `tratamiento_base`            text          DEFAULT NULL,
  `notas`                       text          DEFAULT NULL,
  `created_at`                  timestamp     NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_toxina` (`toxina`),
  KEY `idx_especie_tox` (`especie_afectada`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Catálogo toxicológico para calculadora de dosis tóxicas veterinarias';

-- ============================================================
-- DATOS DE PRUEBA — catalogo_medicamentos
-- (5 medicamentos reales de uso clínico veterinario común)
-- ============================================================

INSERT INTO `catalogo_medicamentos`
  (`nombre`, `categoria`, `especie_destino`, `dosis_mg_por_kg`, `dosis_min_mg_kg`, `dosis_max_mg_kg`, `concentracion_mg_ml`, `via_administracion`, `notas_clinicas`)
VALUES
  -- 1. Meloxicam — AINE de primera línea
  (
    'Meloxicam',
    'AINE',
    'general',
    0.2000,   -- dosis estándar inicial
    0.1000,   -- mantenimiento
    0.2000,
    5.0000,   -- 5 mg/mL presentación inyectable
    'SC, IV, PO',
    'Dosis inicial 0.2 mg/kg; mantenimiento 0.1 mg/kg/24h. CONTRAINDICADO en gatos con enfermedad renal. No combinar con otros AINEs ni corticosteroides.'
  ),

  -- 2. Propofol — Anestésico de inducción IV
  (
    'Propofol',
    'Anestésico',
    'general',
    4.0000,   -- dosis media de inducción
    2.0000,
    6.0000,
    10.0000,  -- 10 mg/mL (1%)
    'IV',
    'Inducción: 2–6 mg/kg IV lento a efecto. En gatos reducir dosis y velocidad de infusión. Puede causar apnea transitoria; tener ventilación disponible.'
  ),

  -- 3. Amoxicilina-Ácido Clavulánico — Antibiótico de amplio espectro
  (
    'Amoxicilina-Ácido Clavulánico',
    'Antibiótico',
    'general',
    12.5000,  -- dosis estándar
    12.5000,
    25.0000,
    50.0000,  -- 50 mg/mL suspensión oral (ratio 4:1)
    'PO, SC, IV',
    'Dosis: 12.5–25 mg/kg cada 12h PO. Presentación inyectable: 8.75 mg/kg SC/IV cada 24h. Cubrir infecciones de piel, tracto urinario y respiratorio.'
  ),

  -- 4. Tramadol — Analgésico opioide
  (
    'Tramadol',
    'Analgésico opioide',
    'canino',
    4.0000,
    2.0000,
    5.0000,
    50.0000,  -- 50 mg/mL inyectable
    'PO, IV, SC',
    'Perros: 2–5 mg/kg cada 8–12h PO. IV: administrar lento diluido. En gatos usar con precaución (metabolismo diferente); dosis máxima 1–2 mg/kg cada 12h.'
  ),

  -- 5. Dexametasona — Corticosteroide
  (
    'Dexametasona',
    'Corticosteroide',
    'general',
    0.1000,   -- dosis antiinflamatoria
    0.1000,
    0.5000,
    2.0000,   -- 2 mg/mL inyectable
    'IV, IM, SC',
    'Antiinflamatorio: 0.1–0.2 mg/kg. Shock: 0.5–1 mg/kg IV. No usar en gestación. Evitar uso crónico sin protocolo de descenso gradual. Potencia relativa: 7× prednisolona.'
  ),

  -- 6. Ketamina — Disociativo / Analgésico CRI
  (
    'Ketamina',
    'Anestésico disociativo',
    'general',
    5.0000,   -- inducción IM
    1.0000,
    10.0000,
    100.0000, -- 100 mg/mL
    'IV, IM',
    'Inducción IM: 5–10 mg/kg (gatos), 5 mg/kg (perros). CRI analgésico: 0.1–0.6 mg/kg/h IV. Siempre combinar con benzodiacepina o alfa-2 agonista. Mantiene tono cardiovascular.'
  ),

  -- 7. Furosemida — Diurético de asa
  (
    'Furosemida',
    'Diurético',
    'general',
    2.0000,
    1.0000,
    4.0000,
    50.0000,  -- 50 mg/mL inyectable
    'IV, IM, PO',
    'Edema pulmonar agudo: 2–4 mg/kg IV. Mantenimiento: 1–2 mg/kg cada 8–12h PO. Monitorear electrolitos (K⁺) en uso crónico. CRI: 0.1–1 mg/kg/h.'
  );

-- ============================================================
-- DATOS DE PRUEBA — catalogo_toxicologia
-- (toxinas de alta prevalencia clínica en pequeñas especies)
-- ============================================================

INSERT INTO `catalogo_toxicologia`
  (`toxina`, `especie_afectada`, `dosis_toxica_leve_mg_kg`, `dosis_toxica_moderada_mg_kg`, `dosis_toxica_letal_mg_kg`, `mecanismo`, `signos_clinicos`, `tratamiento_base`, `notas`)
VALUES
  -- 1. Teobromina / Chocolate
  (
    'Teobromina (Chocolate)',
    'canino',
    20.0000,   -- signos leves (GI)
    40.0000,   -- signos cardíacos/neurológicos
    100.0000,  -- DL50 estimada en perros
    'Inhibición de fosfodiesterasa → acumulación de AMPc; antagonismo de receptores de adenosina. Estimulación del SNC y miocardio.',
    'Vómito, diarrea, poliuria, taquicardia, arritmias, temblores musculares, convulsiones, hipertermia.',
    '1. Inducción de emesis si < 2h post-ingesta (apomorfina 0.03 mg/kg IV o 0.04 mg/kg IM). 2. Carbón activado 1–4 g/kg PO. 3. Fluidoterapia IV. 4. Diazepam para convulsiones. 5. Antiarrítmicos si necesario.',
    'Chocolate negro: ~16 mg teobromina/g. Chocolate con leche: ~2.4 mg/g. Cacao en polvo: ~28 mg/g. Calcular dosis total ingerida antes de decidir tratamiento.'
  ),

  -- 2. Acetaminofén (Paracetamol)
  (
    'Acetaminofén (Paracetamol)',
    'felino',
    10.0000,   -- cualquier dosis es potencialmente tóxica en gatos
    40.0000,   -- signos graves
    50.0000,   -- DL50 en gatos ~50–60 mg/kg
    'Deficiencia de glucuroniltransferasa en gatos → acumulación de NAPQI → metahemoglobinemia, daño hepático y eritrocitos de Heinz.',
    'Metahemoglobinemia (mucosas marrones/cianóticas), edema facial, disnea, ictericia, hepatotoxicidad, colapso.',
    '1. NO inducir emesis si hay signos neurológicos. 2. N-acetilcisteína (NAC): 140 mg/kg IV/PO carga, luego 70 mg/kg cada 6h × 7 dosis. 3. Ácido ascórbico 30 mg/kg IV para metahemoglobinemia. 4. SAMe hepatoprotector. 5. Oxigenoterapia.',
    'EXTREMADAMENTE TÓXICO en gatos. Dosis única de 10 mg/kg puede ser letal. En perros el umbral es mayor (~150 mg/kg) pero igualmente peligroso. Fuente: Plumb''s Veterinary Drug Handbook.'
  ),

  -- 3. Uvas y Pasas
  (
    'Uvas / Pasas',
    'canino',
    NULL,      -- dosis tóxica mínima desconocida (idiosincrática)
    11.0000,   -- pasas: ~11 g/kg asociadas a falla renal
    NULL,      -- no hay DL50 establecida
    'Mecanismo desconocido. Posiblemente ácido tartárico. Produce necrosis tubular renal aguda.',
    'Vómito (primeras 6h), letargia, anorexia, dolor abdominal, oliguria/anuria, azotemia, falla renal aguda en 24–72h.',
    '1. Emesis inmediata si < 2h (apomorfina). 2. Carbón activado. 3. Fluidoterapia agresiva IV por 48h mínimo. 4. Monitoreo de BUN, creatinina, fósforo cada 24h. 5. Diálisis si falla renal establecida.',
    'Toxicidad idiosincrática: algunos perros toleran grandes cantidades sin efecto; otros desarrollan falla renal con dosis mínimas. Tratar SIEMPRE como emergencia. Pasas son más concentradas que uvas frescas.'
  ),

  -- 4. Xilitol
  (
    'Xilitol',
    'canino',
    0.1000,    -- hipoglucemia desde 0.1 g/kg
    0.5000,    -- falla hepática desde 0.5 g/kg
    NULL,      -- DL50 no bien establecida
    'Estimulación de liberación de insulina pancreática (hipoglucemia). A dosis altas: necrosis hepática fulminante por mecanismo no completamente dilucidado.',
    'Hipoglucemia: vómito, debilidad, ataxia, convulsiones, coma (30–60 min post-ingesta). Falla hepática: ictericia, coagulopatía, encefalopatía (12–24h).',
    '1. Emesis si asintomático y < 30 min. 2. Dextrosa IV (bolo 0.5 mL/kg D50% diluido, luego CRI D5%). 3. Monitoreo glucemia cada 2h. 4. Panel hepático a las 24 y 48h. 5. Hepatoprotectores (SAMe, silimarina).',
    'Presente en chicles sin azúcar, pasta dental, algunos alimentos "light". Revisar etiqueta: xylitol = xilitol. En gatos no se ha demostrado el mismo mecanismo insulinotrópico.'
  ),

  -- 5. Permetrina (Piretroide)
  (
    'Permetrina (Piretroide)',
    'felino',
    NULL,      -- cualquier exposición tópica es peligrosa en gatos
    NULL,
    NULL,      -- DL50 no aplicable (toxicidad por exposición tópica)
    'Los gatos carecen de glucuroniltransferasa para metabolizar piretroides. Mantiene canales de Na⁺ abiertos → hiperexcitabilidad neuronal.',
    'Temblores musculares intensos, hipersalivación, ataxia, convulsiones, hipertermia, muerte por falla respiratoria.',
    '1. Baño inmediato con jabón lavavajillas (descontaminación dérmica). 2. Metocarbamol 55–220 mg/kg IV lento (relajante muscular de elección). 3. Diazepam para convulsiones. 4. Fluidoterapia. 5. Control de temperatura.',
    'Productos antipulgas caninos con permetrina al 45–65% son LETALES en gatos con exposición mínima. No aplicar nunca en gatos ni en hogares con gatos. Fuente: ASPCA Animal Poison Control.'
  );

-- ============================================================
-- AUTO_INCREMENT para las nuevas tablas
-- ============================================================

ALTER TABLE `catalogo_medicamentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

ALTER TABLE `catalogo_toxicologia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
