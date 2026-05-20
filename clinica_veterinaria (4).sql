-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 20-05-2026 a las 05:39:38
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
-- Estructura de tabla para la tabla `catalogo_medicamentos`
--

CREATE TABLE `catalogo_medicamentos` (
  `id` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `categoria` varchar(100) NOT NULL,
  `especie_destino` enum('canino','felino','general') NOT NULL DEFAULT 'general',
  `dosis_mg_por_kg` decimal(10,4) DEFAULT NULL,
  `dosis_min_mg_kg` decimal(10,4) DEFAULT NULL,
  `dosis_max_mg_kg` decimal(10,4) DEFAULT NULL,
  `concentracion_mg_ml` decimal(10,4) DEFAULT NULL,
  `via_administracion` varchar(50) DEFAULT NULL,
  `notas_clinicas` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `catalogo_medicamentos`
--

INSERT INTO `catalogo_medicamentos` (`id`, `nombre`, `categoria`, `especie_destino`, `dosis_mg_por_kg`, `dosis_min_mg_kg`, `dosis_max_mg_kg`, `concentracion_mg_ml`, `via_administracion`, `notas_clinicas`, `created_at`) VALUES
(1, 'Meloxicam', 'AINE', 'general', 0.2000, 0.1000, 0.2000, 5.0000, 'SC, IV, PO', 'Dosis inicial 0.2 mg/kg; mantenimiento 0.1 mg/kg/24h. CONTRAINDICADO en gatos con enfermedad renal.', '2026-05-17 00:42:27'),
(2, 'Propofol', 'Anestésico', 'general', 4.0000, 2.0000, 6.0000, 10.0000, 'IV', 'Inducción: 2–6 mg/kg IV lento a efecto. Puede causar apnea transitoria.', '2026-05-17 00:42:27'),
(3, 'Amoxicilina-Ácido Clavulánico', 'Antibiótico', 'general', 12.5000, 12.5000, 25.0000, 50.0000, 'PO, SC, IV', '12.5–25 mg/kg cada 12h PO. Inyectable: 8.75 mg/kg SC/IV cada 24h.', '2026-05-17 00:42:27'),
(4, 'Tramadol', 'Analgésico opioide', 'canino', 4.0000, 2.0000, 5.0000, 50.0000, 'PO, IV, SC', 'Perros: 2–5 mg/kg cada 8–12h PO. En gatos: 1–2 mg/kg cada 12h con precaución.', '2026-05-17 00:42:27'),
(5, 'Dexametasona', 'Corticosteroide', 'general', 0.1000, 0.1000, 0.5000, 2.0000, 'IV, IM, SC', 'Antiinflamatorio: 0.1–0.2 mg/kg. Shock: 0.5–1 mg/kg IV. Potencia: 7× prednisolona.', '2026-05-17 00:42:27'),
(6, 'Ketamina', 'Anestésico disociativo', 'general', 5.0000, 1.0000, 10.0000, 100.0000, 'IV, IM', 'CRI analgésico: 0.1–0.6 mg/kg/h IV. Siempre combinar con benzodiacepina o alfa-2.', '2026-05-17 00:42:27'),
(7, 'Furosemida', 'Diurético', 'general', 2.0000, 1.0000, 4.0000, 50.0000, 'IV, IM, PO', 'Edema pulmonar agudo: 2–4 mg/kg IV. Monitorear K⁺ en uso crónico.', '2026-05-17 00:42:27');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `catalogo_toxicologia`
--

CREATE TABLE `catalogo_toxicologia` (
  `id` int(11) NOT NULL,
  `toxina` varchar(150) NOT NULL,
  `especie_afectada` enum('canino','felino','general') NOT NULL DEFAULT 'general',
  `dosis_toxica_leve_mg_kg` decimal(10,4) DEFAULT NULL,
  `dosis_toxica_moderada_mg_kg` decimal(10,4) DEFAULT NULL,
  `dosis_toxica_letal_mg_kg` decimal(10,4) DEFAULT NULL,
  `mecanismo` varchar(255) DEFAULT NULL,
  `signos_clinicos` text DEFAULT NULL,
  `tratamiento_base` text DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `catalogo_toxicologia`
--

INSERT INTO `catalogo_toxicologia` (`id`, `toxina`, `especie_afectada`, `dosis_toxica_leve_mg_kg`, `dosis_toxica_moderada_mg_kg`, `dosis_toxica_letal_mg_kg`, `mecanismo`, `signos_clinicos`, `tratamiento_base`, `notas`, `created_at`) VALUES
(1, 'Teobromina (Chocolate)', 'canino', 20.0000, 40.0000, 100.0000, 'Inhibición de fosfodiesterasa → acumulación de AMPc; antagonismo de adenosina.', 'Vómito, diarrea, taquicardia, arritmias, temblores, convulsiones.', '1. Emesis si <2h (apomorfina). 2. Carbón activado 1–4 g/kg. 3. Fluidoterapia. 4. Diazepam.', 'Chocolate negro: ~16 mg/g. Leche: ~2.4 mg/g. Cacao en polvo: ~28 mg/g.', '2026-05-17 00:42:27'),
(2, 'Acetaminofén (Paracetamol)', 'felino', 10.0000, 40.0000, 50.0000, 'Deficiencia de glucuroniltransferasa → NAPQI → metahemoglobinemia y daño hepático.', 'Mucosas marrones, edema facial, disnea, ictericia, colapso.', '1. NAC 140 mg/kg carga, luego 70 mg/kg c/6h ×7. 2. Ácido ascórbico 30 mg/kg IV. 3. SAMe.', 'EXTREMADAMENTE TÓXICO en gatos. Dosis de 10 mg/kg puede ser letal.', '2026-05-17 00:42:27'),
(3, 'Uvas / Pasas', 'canino', NULL, 11.0000, NULL, 'Mecanismo desconocido. Posiblemente ácido tartárico. Necrosis tubular renal aguda.', 'Vómito, letargia, oliguria/anuria, azotemia, falla renal en 24–72h.', '1. Emesis si <2h. 2. Carbón activado. 3. Fluidoterapia IV agresiva 48h. 4. Monitoreo renal.', 'Toxicidad idiosincrática. Tratar SIEMPRE como emergencia.', '2026-05-17 00:42:27'),
(4, 'Xilitol', 'canino', 0.1000, 0.5000, NULL, 'Estimulación de insulina pancreática → hipoglucemia. Dosis altas: necrosis hepática.', 'Vómito, ataxia, convulsiones, coma (30–60 min). Ictericia, coagulopatía (12–24h).', '1. Dextrosa IV (bolo D50% diluido, luego CRI D5%). 2. Glucemia c/2h. 3. Panel hepático 24–48h.', 'Presente en chicles, pasta dental, alimentos light. Xylitol = xilitol.', '2026-05-17 00:42:27'),
(5, 'Permetrina (Piretroide)', 'felino', NULL, NULL, NULL, 'Canales de Na⁺ abiertos → hiperexcitabilidad neuronal. Gatos sin glucuroniltransferasa.', 'Temblores intensos, hipersalivación, ataxia, convulsiones, hipertermia.', '1. Baño con jabón lavavajillas. 2. Metocarbamol 55–220 mg/kg IV. 3. Diazepam. 4. Fluidoterapia.', 'Productos antipulgas caninos con permetrina 45–65% son LETALES en gatos.', '2026-05-17 00:42:27');

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
-- Estructura de tabla para la tabla `cirugia_empleados`
--

CREATE TABLE `cirugia_empleados` (
  `cirugia_id` int(11) NOT NULL COMMENT 'ID de la cirugía',
  `empleado_id` int(11) NOT NULL COMMENT 'ID del empleado participante'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabla puente N:M entre cirugías y empleados participantes';

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `clinicas`
--

CREATE TABLE `clinicas` (
  `id` int(11) NOT NULL,
  `nombre` varchar(150) NOT NULL COMMENT 'Nombre comercial de la clínica',
  `email` varchar(150) NOT NULL COMMENT 'Correo de acceso / login de la clínica',
  `password_hash` varchar(255) NOT NULL COMMENT 'Contraseña hasheada con bcrypt',
  `telefono` varchar(20) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL COMMENT 'Ruta o URL del logo de la clínica',
  `activa` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 = activa, 0 = suspendida',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabla maestra de clínicas (tenants del sistema SaaS)';

--
-- Volcado de datos para la tabla `clinicas`
--

INSERT INTO `clinicas` (`id`, `nombre`, `email`, `password_hash`, `telefono`, `direccion`, `logo_url`, `activa`, `created_at`, `updated_at`) VALUES
(1, 'Clinica Pro', 'especto32@gmail.com', '$2b$10$UaJIxc/U7OVQ/Aa1Bjr7ceRsMg2.8XxIqLlRIHMAtkSnp8mkC0NXS', NULL, NULL, NULL, 1, '2026-05-18 21:34:21', '2026-05-18 21:34:21');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `consulta`
--

CREATE TABLE `consulta` (
  `id` int(11) NOT NULL,
  `expediente_id` int(11) NOT NULL,
  `empleado_id` int(11) DEFAULT NULL COMMENT 'Empleado (veterinario/médico) que atiende la consulta',
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
-- Estructura de tabla para la tabla `empleados`
--

CREATE TABLE `empleados` (
  `id` int(11) NOT NULL,
  `clinica_id` int(11) NOT NULL COMMENT 'Clínica a la que pertenece',
  `rol_id` int(11) NOT NULL COMMENT 'Puesto/rol del empleado',
  `nombre` varchar(100) NOT NULL,
  `apellidos` varchar(150) NOT NULL,
  `email` varchar(150) NOT NULL COMMENT 'Correo de login del empleado',
  `password_hash` varchar(255) NOT NULL COMMENT 'Contraseña hasheada con bcrypt',
  `telefono` varchar(20) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 = activo, 0 = dado de baja',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Empleados/usuarios internos de cada clínica';

--
-- Volcado de datos para la tabla `empleados`
--

INSERT INTO `empleados` (`id`, `clinica_id`, `rol_id`, `nombre`, `apellidos`, `email`, `password_hash`, `telefono`, `activo`, `created_at`, `updated_at`) VALUES
(3, 1, 1, 'Yael', 'Alejandro', 'yael.alejandro@anavet-1.com', '$2b$10$wrh7NSvyO8ef3Jt7LiitqOZlHVKH3c1c8F/mRoyv5da79YxMUlTi6', '9619206218', 1, '2026-05-19 04:54:29', '2026-05-19 04:54:29'),
(4, 1, 3, 'Oscar', 'Abdel', 'oscar.abdel@anavet-1.com', '$2b$10$QVknm49Idv3p00MCB.EEsOQKSzvPiBBgYuXtHmr5H4EIbjc.FPcEW', '9612338999', 1, '2026-05-19 04:55:06', '2026-05-19 04:55:06');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `expediente`
--

CREATE TABLE `expediente` (
  `id` int(11) NOT NULL,
  `clinica_id` int(11) DEFAULT NULL COMMENT 'Clínica propietaria del registro',
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

--
-- Volcado de datos para la tabla `expediente`
--

INSERT INTO `expediente` (`id`, `clinica_id`, `paciente_id`, `fecha_apertura`, `anamnesis`, `examen_fisico`, `examenes_sistemicos`, `lista_problemas`, `dx_presuntivo`, `abordaje_dx`, `dx_definitivo`) VALUES
(12, 1, 9, '2026-05-19', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(13, 1, 10, '2026-05-19', NULL, NULL, NULL, NULL, NULL, NULL, NULL);

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
-- Estructura de tabla para la tabla `hospitalizacion_empleados`
--

CREATE TABLE `hospitalizacion_empleados` (
  `hospitalizacion_id` int(11) NOT NULL COMMENT 'ID de la hospitalización',
  `empleado_id` int(11) NOT NULL COMMENT 'ID del empleado participante'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inventario`
--

CREATE TABLE `inventario` (
  `id` int(11) NOT NULL,
  `clinica_id` int(11) NOT NULL,
  `nombre` varchar(155) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `stock_minimo` int(11) NOT NULL DEFAULT 0,
  `precio` decimal(10,2) NOT NULL DEFAULT 0.00,
  `unidad` varchar(50) DEFAULT 'unidades',
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `inventario`
--

INSERT INTO `inventario` (`id`, `clinica_id`, `nombre`, `descripcion`, `stock`, `stock_minimo`, `precio`, `unidad`, `creado_en`) VALUES
(1, 1, 'Amoxicilina 500g', 'hola', 10, 2, 50.00, 'tabletas', '2026-05-19 19:58:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `paciente`
--

CREATE TABLE `paciente` (
  `id` int(11) NOT NULL,
  `clinica_id` int(11) DEFAULT NULL COMMENT 'Clínica propietaria del registro',
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

--
-- Volcado de datos para la tabla `paciente`
--

INSERT INTO `paciente` (`id`, `clinica_id`, `tutor_id`, `nombre`, `especie`, `raza`, `sexo`, `fecha_nacimiento`, `funcion_zootecnica`, `tatuaje`, `microchip`, `created_at`, `esquemas_preventivos`) VALUES
(9, NULL, 9, 'Firu', 'Perro', 'Chihuahua', 'Macho', '2020-05-03', 'Mascota', 'Ninguno', '79234872393472', '2026-05-20 01:16:59', 'Completo'),
(10, 1, 9, 'Ladrillo', 'Perro', 'Labrador', 'Hembra', '2021-11-11', 'Mascota', 'No', '23547239765', '2026-05-20 03:27:25', 'Completo');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recibo`
--

CREATE TABLE `recibo` (
  `id` int(11) NOT NULL,
  `clinica_id` int(11) NOT NULL,
  `paciente_id` int(11) NOT NULL,
  `expediente_id` int(11) DEFAULT NULL,
  `empleado_id` int(11) DEFAULT NULL,
  `fecha` date NOT NULL,
  `motivo_consulta` text DEFAULT NULL,
  `total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('borrador','finalizado') NOT NULL DEFAULT 'borrador',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `recibo`
--

INSERT INTO `recibo` (`id`, `clinica_id`, `paciente_id`, `expediente_id`, `empleado_id`, `fecha`, `motivo_consulta`, `total`, `status`, `created_at`) VALUES
(1, 1, 9, 12, NULL, '2026-05-20', NULL, 4170.00, 'finalizado', '2026-05-20 01:36:28');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recibo_item`
--

CREATE TABLE `recibo_item` (
  `id` int(11) NOT NULL,
  `recibo_id` int(11) NOT NULL,
  `servicio_id` int(11) DEFAULT NULL,
  `nombre_servicio` varchar(200) NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `subtotal` decimal(10,2) NOT NULL DEFAULT 0.00,
  `notas` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `recibo_item`
--

INSERT INTO `recibo_item` (`id`, `recibo_id`, `servicio_id`, `nombre_servicio`, `precio_unitario`, `cantidad`, `subtotal`, `notas`) VALUES
(1, 1, NULL, 'Consulta general', 350.00, 1, 350.00, NULL),
(2, 1, NULL, 'Biometría hemática', 280.00, 1, 280.00, NULL),
(3, 1, NULL, 'Ultrasonido abdominal', 800.00, 1, 800.00, NULL),
(4, 1, NULL, 'Vacuna antirrábica', 180.00, 1, 180.00, NULL),
(5, 1, NULL, 'Castración felino macho', 1200.00, 1, 1200.00, NULL),
(6, 1, NULL, 'Terapia intensiva (por día)', 1200.00, 1, 1200.00, NULL),
(7, 1, NULL, 'Suero fisiológico 500ml', 80.00, 1, 80.00, NULL),
(8, 1, NULL, 'Corte de uñas', 80.00, 1, 80.00, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `clinica_id` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `clinica_id`, `nombre`, `descripcion`, `created_at`) VALUES
(1, 1, 'Administrador', 'Acceso total: gestión de empleados, reportes y configuración', '2026-05-18 21:34:21'),
(2, 1, 'Veterinario', 'Acceso a expedientes, consultas, cirugías y hospitalizaciones', '2026-05-18 21:34:21'),
(3, 1, 'Recepcionista', 'Registro de tutores, pacientes y citas', '2026-05-18 21:34:21'),
(4, 1, 'Auxiliar', 'Apoyo en consultas y hospitalización, sin acceso a reportes', '2026-05-18 21:34:21');

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
-- Estructura de tabla para la tabla `servicio_catalogo`
--

CREATE TABLE `servicio_catalogo` (
  `id` int(11) NOT NULL,
  `clinica_id` int(11) NOT NULL,
  `categoria` varchar(100) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `precio` decimal(10,2) NOT NULL DEFAULT 0.00,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `servicio_catalogo`
--

INSERT INTO `servicio_catalogo` (`id`, `clinica_id`, `categoria`, `nombre`, `precio`, `activo`, `created_at`) VALUES
(1, 1, 'Consultas', 'Consulta general', 350.00, 1, '2026-05-20 02:49:16'),
(2, 1, 'Consultas', 'Consulta especialidad', 500.00, 1, '2026-05-20 02:49:16'),
(3, 1, 'Vacunas', 'Vacuna antirrábica', 280.00, 1, '2026-05-20 02:49:16'),
(4, 1, 'Vacunas', 'Vacuna séxtuple', 320.00, 1, '2026-05-20 02:49:16'),
(5, 1, 'Estetica', 'Baño y corte pequeño', 250.00, 1, '2026-05-20 02:49:16'),
(6, 1, 'Estetica', 'Baño y corte mediano', 350.00, 1, '2026-05-20 02:49:16'),
(7, 1, 'Consultas', 'Consulta de urgencias', 600.00, 1, '2026-05-20 03:30:20'),
(8, 1, 'Consultas', 'Consulta de seguimiento', 250.00, 1, '2026-05-20 03:30:20'),
(9, 1, 'Consultas', 'Consulta geriátrica', 450.00, 1, '2026-05-20 03:30:20'),
(10, 1, 'Vacunas', 'Vacuna triple felina', 300.00, 1, '2026-05-20 03:30:20'),
(11, 1, 'Vacunas', 'Vacuna leucemia felina', 350.00, 1, '2026-05-20 03:30:20'),
(12, 1, 'Vacunas', 'Vacuna Bordetella', 280.00, 1, '2026-05-20 03:30:20'),
(13, 1, 'Vacunas', 'Vacuna Leptospira', 300.00, 1, '2026-05-20 03:30:20'),
(14, 1, 'Laboratorio', 'Biometría hemática', 380.00, 1, '2026-05-20 03:30:20'),
(15, 1, 'Laboratorio', 'Química sanguínea 6 elementos', 450.00, 1, '2026-05-20 03:30:20'),
(16, 1, 'Laboratorio', 'Química sanguínea 12 elementos', 650.00, 1, '2026-05-20 03:30:20'),
(17, 1, 'Laboratorio', 'Urianálisis', 280.00, 1, '2026-05-20 03:30:20'),
(18, 1, 'Laboratorio', 'Coproscópico', 220.00, 1, '2026-05-20 03:30:20'),
(19, 1, 'Laboratorio', 'Cultivo y antibiograma', 750.00, 1, '2026-05-20 03:30:20'),
(20, 1, 'Laboratorio', 'Prueba de Parvo', 350.00, 1, '2026-05-20 03:30:20'),
(21, 1, 'Laboratorio', 'Prueba de Distemper', 350.00, 1, '2026-05-20 03:30:20'),
(22, 1, 'Cirugia', 'Castración canino pequeño', 1200.00, 1, '2026-05-20 03:30:20'),
(23, 1, 'Cirugia', 'Castración canino mediano', 1500.00, 1, '2026-05-20 03:30:20'),
(24, 1, 'Cirugia', 'Castración canino grande', 1800.00, 1, '2026-05-20 03:30:20'),
(25, 1, 'Cirugia', 'Castración felino', 800.00, 1, '2026-05-20 03:30:20'),
(26, 1, 'Cirugia', 'Ovariohisterectomía canina pequeña', 1800.00, 1, '2026-05-20 03:30:20'),
(27, 1, 'Cirugia', 'Ovariohisterectomía canina mediana', 2200.00, 1, '2026-05-20 03:30:20'),
(28, 1, 'Cirugia', 'Ovariohisterectomía canina grande', 2600.00, 1, '2026-05-20 03:30:20'),
(29, 1, 'Cirugia', 'Ovariohisterectomía felina', 1200.00, 1, '2026-05-20 03:30:20'),
(30, 1, 'Cirugia', 'Cirugía general', 2500.00, 1, '2026-05-20 03:30:20'),
(31, 1, 'Cirugia', 'Extracción dental', 800.00, 1, '2026-05-20 03:30:20'),
(32, 1, 'Cirugia', 'Limpieza dental', 600.00, 1, '2026-05-20 03:30:20'),
(33, 1, 'Hospitalizacion', 'Hospitalización día (perro)', 400.00, 1, '2026-05-20 03:30:20'),
(34, 1, 'Hospitalizacion', 'Hospitalización noche (perro)', 500.00, 1, '2026-05-20 03:30:20'),
(35, 1, 'Hospitalizacion', 'Hospitalización día (gato)', 350.00, 1, '2026-05-20 03:30:20'),
(36, 1, 'Hospitalizacion', 'Terapia intensiva UCI', 800.00, 1, '2026-05-20 03:30:20'),
(37, 1, 'Estetica', 'Baño y corte grande', 450.00, 1, '2026-05-20 03:30:20'),
(38, 1, 'Estetica', 'Baño medicado', 300.00, 1, '2026-05-20 03:30:20'),
(39, 1, 'Estetica', 'Corte de uñas', 80.00, 1, '2026-05-20 03:30:20'),
(40, 1, 'Estetica', 'Limpieza de oídos', 100.00, 1, '2026-05-20 03:30:20'),
(41, 1, 'Estetica', 'Deslanado', 350.00, 1, '2026-05-20 03:30:20'),
(42, 1, 'Procedimientos', 'Radiografía simple', 450.00, 1, '2026-05-20 03:30:20'),
(43, 1, 'Procedimientos', 'Radiografía con contraste', 650.00, 1, '2026-05-20 03:30:20'),
(44, 1, 'Procedimientos', 'Ultrasonido abdominal', 700.00, 1, '2026-05-20 03:30:20'),
(45, 1, 'Procedimientos', 'Electrocardiograma', 550.00, 1, '2026-05-20 03:30:20'),
(46, 1, 'Procedimientos', 'Nebulización', 200.00, 1, '2026-05-20 03:30:20'),
(47, 1, 'Procedimientos', 'Vendaje', 150.00, 1, '2026-05-20 03:30:20'),
(48, 1, 'Procedimientos', 'Sutura', 350.00, 1, '2026-05-20 03:30:20'),
(49, 1, 'Procedimientos', 'Colocación de catéter', 200.00, 1, '2026-05-20 03:30:20'),
(50, 1, 'Procedimientos', 'Fluidoterapia (por día)', 300.00, 1, '2026-05-20 03:30:20'),
(51, 1, 'Procedimientos', 'Desparasitación interna', 150.00, 1, '2026-05-20 03:30:20'),
(52, 1, 'Procedimientos', 'Desparasitación externa', 120.00, 1, '2026-05-20 03:30:20'),
(53, 1, 'Procedimientos', 'Microchip', 350.00, 1, '2026-05-20 03:30:20');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitud_reabastecimiento`
--

CREATE TABLE `solicitud_reabastecimiento` (
  `id` int(11) NOT NULL,
  `clinica_id` int(11) NOT NULL,
  `empleado_id` int(11) NOT NULL,
  `producto_nombre` varchar(155) NOT NULL,
  `cantidad` int(11) NOT NULL DEFAULT 1,
  `notas` text DEFAULT NULL,
  `status` enum('pendiente','completado') DEFAULT 'pendiente',
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `solicitud_reabastecimiento`
--

INSERT INTO `solicitud_reabastecimiento` (`id`, `clinica_id`, `empleado_id`, `producto_nombre`, `cantidad`, `notas`, `status`, `creado_en`) VALUES
(1, 1, 3, 'Paracetamol 500g', 1, '10', 'pendiente', '2026-05-19 20:01:05'),
(2, 1, 3, 'Paracetamol 500g', 1, '10', 'pendiente', '2026-05-20 01:00:33');

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
  `clinica_id` int(11) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellidos` varchar(150) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `whatsapp` varchar(20) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `direccion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `codigo` varchar(30) DEFAULT NULL,
  `tags` varchar(255) DEFAULT NULL,
  `vetado` tinyint(1) DEFAULT 0,
  `estatus` enum('activo','inactivo','vetado') DEFAULT 'activo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tutor`
--

INSERT INTO `tutor` (`id`, `clinica_id`, `nombre`, `apellidos`, `telefono`, `whatsapp`, `correo`, `direccion`, `created_at`, `codigo`, `tags`, `vetado`, `estatus`) VALUES
(8, 1, 'Daniel', 'Gonzalez', '9619206218', '9612338999', 'DanielF@gmail.com', 'Prolongacion San Miguel 29110', '2026-05-20 00:53:14', 'TUT-1779238394975-2770', NULL, 1, 'vetado'),
(9, 1, 'Daniel', 'Gallardo', '9619206218', '9612338999', 'DanielG@gmail.com', 'Prolongacion San Miguel 29110', '2026-05-20 01:16:01', 'TUT-1779239761255-7902', NULL, 0, 'activo');

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
-- Indices de la tabla `catalogo_medicamentos`
--
ALTER TABLE `catalogo_medicamentos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_categoria` (`categoria`),
  ADD KEY `idx_especie` (`especie_destino`);

--
-- Indices de la tabla `catalogo_toxicologia`
--
ALTER TABLE `catalogo_toxicologia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_toxina` (`toxina`),
  ADD KEY `idx_especie_tox` (`especie_afectada`);

--
-- Indices de la tabla `cirugia`
--
ALTER TABLE `cirugia`
  ADD PRIMARY KEY (`id`),
  ADD KEY `expediente_id` (`expediente_id`);

--
-- Indices de la tabla `cirugia_empleados`
--
ALTER TABLE `cirugia_empleados`
  ADD PRIMARY KEY (`cirugia_id`,`empleado_id`),
  ADD KEY `idx_cirugia_emp_empleado` (`empleado_id`);

--
-- Indices de la tabla `clinicas`
--
ALTER TABLE `clinicas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_clinica_email` (`email`);

--
-- Indices de la tabla `consulta`
--
ALTER TABLE `consulta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `expediente_id` (`expediente_id`),
  ADD KEY `idx_consulta_empleado` (`empleado_id`);

--
-- Indices de la tabla `diagnostico`
--
ALTER TABLE `diagnostico`
  ADD PRIMARY KEY (`id`),
  ADD KEY `consulta_id` (`consulta_id`);

--
-- Indices de la tabla `empleados`
--
ALTER TABLE `empleados`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_empleado_email` (`email`),
  ADD KEY `idx_empleados_clinica` (`clinica_id`),
  ADD KEY `idx_empleados_rol` (`rol_id`);

--
-- Indices de la tabla `expediente`
--
ALTER TABLE `expediente`
  ADD PRIMARY KEY (`id`),
  ADD KEY `paciente_id` (`paciente_id`),
  ADD KEY `idx_expediente_clinica` (`clinica_id`);

--
-- Indices de la tabla `hospitalizacion`
--
ALTER TABLE `hospitalizacion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `expediente_id` (`expediente_id`);

--
-- Indices de la tabla `hospitalizacion_empleados`
--
ALTER TABLE `hospitalizacion_empleados`
  ADD PRIMARY KEY (`hospitalizacion_id`,`empleado_id`),
  ADD KEY `idx_hosp_emp_empleado` (`empleado_id`);

--
-- Indices de la tabla `inventario`
--
ALTER TABLE `inventario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_inventario_clinica` (`clinica_id`);

--
-- Indices de la tabla `paciente`
--
ALTER TABLE `paciente`
  ADD PRIMARY KEY (`id`),
  ADD KEY `tutor_id` (`tutor_id`),
  ADD KEY `idx_paciente_clinica` (`clinica_id`);

--
-- Indices de la tabla `recibo`
--
ALTER TABLE `recibo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_recibo_clinica` (`clinica_id`),
  ADD KEY `idx_recibo_paciente` (`paciente_id`),
  ADD KEY `idx_recibo_expediente` (`expediente_id`),
  ADD KEY `idx_recibo_empleado` (`empleado_id`),
  ADD KEY `idx_recibo_fecha` (`fecha`),
  ADD KEY `idx_recibo_status` (`status`);

--
-- Indices de la tabla `recibo_item`
--
ALTER TABLE `recibo_item`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_recitem_recibo` (`recibo_id`),
  ADD KEY `idx_recitem_servicio` (`servicio_id`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_roles_clinica` (`clinica_id`);

--
-- Indices de la tabla `seguimiento_hospitalizacion`
--
ALTER TABLE `seguimiento_hospitalizacion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `hospitalizacion_id` (`hospitalizacion_id`);

--
-- Indices de la tabla `servicio_catalogo`
--
ALTER TABLE `servicio_catalogo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_servcat_clinica` (`clinica_id`),
  ADD KEY `idx_servcat_categoria` (`categoria`),
  ADD KEY `idx_servcat_activo` (`activo`);

--
-- Indices de la tabla `solicitud_reabastecimiento`
--
ALTER TABLE `solicitud_reabastecimiento`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_solicitud_clinica` (`clinica_id`);

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
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `idx_tutor_clinica` (`clinica_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `catalogo_medicamentos`
--
ALTER TABLE `catalogo_medicamentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `catalogo_toxicologia`
--
ALTER TABLE `catalogo_toxicologia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `cirugia`
--
ALTER TABLE `cirugia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `clinicas`
--
ALTER TABLE `clinicas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `consulta`
--
ALTER TABLE `consulta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `diagnostico`
--
ALTER TABLE `diagnostico`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `empleados`
--
ALTER TABLE `empleados`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `expediente`
--
ALTER TABLE `expediente`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `hospitalizacion`
--
ALTER TABLE `hospitalizacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `inventario`
--
ALTER TABLE `inventario`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `paciente`
--
ALTER TABLE `paciente`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `recibo`
--
ALTER TABLE `recibo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `recibo_item`
--
ALTER TABLE `recibo_item`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `seguimiento_hospitalizacion`
--
ALTER TABLE `seguimiento_hospitalizacion`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `servicio_catalogo`
--
ALTER TABLE `servicio_catalogo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT de la tabla `solicitud_reabastecimiento`
--
ALTER TABLE `solicitud_reabastecimiento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `tratamiento`
--
ALTER TABLE `tratamiento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tutor`
--
ALTER TABLE `tutor`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de la tabla `vacuna`
--
ALTER TABLE `vacuna`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
-- Filtros para la tabla `cirugia_empleados`
--
ALTER TABLE `cirugia_empleados`
  ADD CONSTRAINT `cirugia_emp_ibfk_cirugia` FOREIGN KEY (`cirugia_id`) REFERENCES `cirugia` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `cirugia_emp_ibfk_empleado` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `consulta`
--
ALTER TABLE `consulta`
  ADD CONSTRAINT `consulta_ibfk_1` FOREIGN KEY (`expediente_id`) REFERENCES `expediente` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `consulta_ibfk_empleado` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `diagnostico`
--
ALTER TABLE `diagnostico`
  ADD CONSTRAINT `diagnostico_ibfk_1` FOREIGN KEY (`consulta_id`) REFERENCES `consulta` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `empleados`
--
ALTER TABLE `empleados`
  ADD CONSTRAINT `empleados_ibfk_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `empleados_ibfk_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`);

--
-- Filtros para la tabla `expediente`
--
ALTER TABLE `expediente`
  ADD CONSTRAINT `expediente_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `expediente_ibfk_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `hospitalizacion`
--
ALTER TABLE `hospitalizacion`
  ADD CONSTRAINT `hospitalizacion_ibfk_1` FOREIGN KEY (`expediente_id`) REFERENCES `expediente` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `hospitalizacion_empleados`
--
ALTER TABLE `hospitalizacion_empleados`
  ADD CONSTRAINT `hosp_emp_ibfk_empleado` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `hosp_emp_ibfk_hospitalizacion` FOREIGN KEY (`hospitalizacion_id`) REFERENCES `hospitalizacion` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `inventario`
--
ALTER TABLE `inventario`
  ADD CONSTRAINT `fk_inventario_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `paciente`
--
ALTER TABLE `paciente`
  ADD CONSTRAINT `paciente_ibfk_1` FOREIGN KEY (`tutor_id`) REFERENCES `tutor` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `paciente_ibfk_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `recibo`
--
ALTER TABLE `recibo`
  ADD CONSTRAINT `recibo_ibfk_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `recibo_ibfk_empleado` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `recibo_ibfk_expediente` FOREIGN KEY (`expediente_id`) REFERENCES `expediente` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `recibo_ibfk_paciente` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`);

--
-- Filtros para la tabla `recibo_item`
--
ALTER TABLE `recibo_item`
  ADD CONSTRAINT `recitem_ibfk_recibo` FOREIGN KEY (`recibo_id`) REFERENCES `recibo` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `recitem_ibfk_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicio_catalogo` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `roles`
--
ALTER TABLE `roles`
  ADD CONSTRAINT `roles_ibfk_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `seguimiento_hospitalizacion`
--
ALTER TABLE `seguimiento_hospitalizacion`
  ADD CONSTRAINT `seguimiento_hospitalizacion_ibfk_1` FOREIGN KEY (`hospitalizacion_id`) REFERENCES `hospitalizacion` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `servicio_catalogo`
--
ALTER TABLE `servicio_catalogo`
  ADD CONSTRAINT `servcat_ibfk_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `solicitud_reabastecimiento`
--
ALTER TABLE `solicitud_reabastecimiento`
  ADD CONSTRAINT `fk_solicitud_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tratamiento`
--
ALTER TABLE `tratamiento`
  ADD CONSTRAINT `tratamiento_ibfk_1` FOREIGN KEY (`consulta_id`) REFERENCES `consulta` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `tutor`
--
ALTER TABLE `tutor`
  ADD CONSTRAINT `tutor_ibfk_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `vacuna`
--
ALTER TABLE `vacuna`
  ADD CONSTRAINT `vacuna_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
