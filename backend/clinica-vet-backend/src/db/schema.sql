-- Esquema de ANA-vet — GENERADO desde la base de datos viva.
-- No editar a mano: regenerar con `node scripts/dump-schema.js`.
--
-- OJO: "Base de datos/253582.sql" es el documento de DISEÑO y NO
-- coincide con este esquema. Para desplegar usa SIEMPRE este archivo.
--
--   mysql -u USUARIO -p clinica_veterinaria < src/db/schema.sql

SET NAMES utf8mb4;
-- Las FK se desactivan durante la carga para no depender del orden
-- alfabético de las tablas.
SET FOREIGN_KEY_CHECKS = 0;

-- ── alta ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `alta` (
  `id` int NOT NULL AUTO_INCREMENT,
  `hospitalizacion_id` int NOT NULL,
  `fecha` date NOT NULL,
  `tipo` enum('Alta médica','Alta condicionada','Alta voluntaria') COLLATE utf8mb4_general_ci NOT NULL,
  `indicaciones` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `hospitalizacion_id` (`hospitalizacion_id`),
  CONSTRAINT `alta_ibfk_1` FOREIGN KEY (`hospitalizacion_id`) REFERENCES `hospitalizacion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── anestesia ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `anestesia` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cirugia_id` int NOT NULL,
  `protocolo` varchar(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `farmacos` text COLLATE utf8mb4_general_ci,
  `dosis` text COLLATE utf8mb4_general_ci,
  `observaciones` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `cirugia_id` (`cirugia_id`),
  CONSTRAINT `anestesia_ibfk_1` FOREIGN KEY (`cirugia_id`) REFERENCES `cirugia` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── catalogo_medicamentos ───────────────────────────────────
CREATE TABLE IF NOT EXISTS `catalogo_medicamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `categoria` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `especie_destino` enum('canino','felino','general') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'general',
  `dosis_mg_por_kg` decimal(10,4) DEFAULT NULL,
  `dosis_min_mg_kg` decimal(10,4) DEFAULT NULL,
  `dosis_max_mg_kg` decimal(10,4) DEFAULT NULL,
  `concentracion_mg_ml` decimal(10,4) DEFAULT NULL,
  `via_administracion` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notas_clinicas` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_categoria` (`categoria`),
  KEY `idx_especie` (`especie_destino`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── catalogo_toxicologia ────────────────────────────────────
CREATE TABLE IF NOT EXISTS `catalogo_toxicologia` (
  `id` int NOT NULL AUTO_INCREMENT,
  `toxina` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `especie_afectada` enum('canino','felino','general') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'general',
  `dosis_toxica_leve_mg_kg` decimal(10,4) DEFAULT NULL,
  `dosis_toxica_moderada_mg_kg` decimal(10,4) DEFAULT NULL,
  `dosis_toxica_letal_mg_kg` decimal(10,4) DEFAULT NULL,
  `mecanismo` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `signos_clinicos` text COLLATE utf8mb4_general_ci,
  `tratamiento_base` text COLLATE utf8mb4_general_ci,
  `notas` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_toxina` (`toxina`),
  KEY `idx_especie_tox` (`especie_afectada`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── cirugia ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `cirugia` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expediente_id` int NOT NULL,
  `fecha` date NOT NULL,
  `procedimiento` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  `plan_quirurgico` text COLLATE utf8mb4_general_ci,
  `notas` text COLLATE utf8mb4_general_ci,
  `consentimiento` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `expediente_id` (`expediente_id`),
  CONSTRAINT `cirugia_ibfk_1` FOREIGN KEY (`expediente_id`) REFERENCES `expediente` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── cirugia_empleados ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS `cirugia_empleados` (
  `cirugia_id` int NOT NULL COMMENT 'ID de la cirugía',
  `empleado_id` int NOT NULL COMMENT 'ID del empleado participante',
  PRIMARY KEY (`cirugia_id`,`empleado_id`),
  KEY `idx_cirugia_emp_empleado` (`empleado_id`),
  CONSTRAINT `cirugia_emp_ibfk_cirugia` FOREIGN KEY (`cirugia_id`) REFERENCES `cirugia` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cirugia_emp_ibfk_empleado` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabla puente N:M entre cirugías y empleados participantes';

-- ── cita ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `cita` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clinica_id` int NOT NULL,
  `paciente_id` int NOT NULL,
  `empleado_id` int DEFAULT NULL COMMENT 'Veterinario asignado (opcional)',
  `fecha` date NOT NULL,
  `hora_inicio` time NOT NULL,
  `duracion_min` int NOT NULL DEFAULT '30',
  `motivo` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notas` text COLLATE utf8mb4_general_ci,
  `estado` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'programada',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cita_clinica_fecha` (`clinica_id`,`fecha`),
  KEY `idx_cita_empleado_fecha` (`empleado_id`,`fecha`),
  KEY `fk_cita_paciente` (`paciente_id`),
  CONSTRAINT `fk_cita_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cita_empleado` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_cita_paciente` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── clinicas ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `clinicas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Nombre comercial de la clínica',
  `email` varchar(150) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Correo de acceso / login de la clínica',
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Contraseña hasheada con bcrypt',
  `telefono` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `logo_url` varchar(500) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'Ruta o URL del logo de la clínica',
  `activa` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1 = activa, 0 = suspendida',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_clinica_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tabla maestra de clínicas (tenants del sistema SaaS)';

-- ── consulta ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `consulta` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expediente_id` int NOT NULL,
  `empleado_id` int DEFAULT NULL COMMENT 'Empleado (veterinario/médico) que atiende la consulta',
  `fecha` date DEFAULT NULL,
  `motivo` text COLLATE utf8mb4_general_ci,
  `anamnesis` text COLLATE utf8mb4_general_ci,
  `examen_fisico` text COLLATE utf8mb4_general_ci,
  `indicaciones` text COLLATE utf8mb4_general_ci,
  `examenes_sistemicos` text COLLATE utf8mb4_general_ci,
  `lista_problemas` text COLLATE utf8mb4_general_ci,
  `dx_presuntivo` text COLLATE utf8mb4_general_ci,
  `abordaje_dx` text COLLATE utf8mb4_general_ci,
  `tratamiento` text COLLATE utf8mb4_general_ci,
  `tratamiento_etiologico` text COLLATE utf8mb4_general_ci,
  `seguimiento_medico` text COLLATE utf8mb4_general_ci,
  `resumen` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `expediente_id` (`expediente_id`),
  KEY `idx_consulta_empleado` (`empleado_id`),
  CONSTRAINT `consulta_ibfk_1` FOREIGN KEY (`expediente_id`) REFERENCES `expediente` (`id`) ON DELETE CASCADE,
  CONSTRAINT `consulta_ibfk_empleado` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── diagnostico ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `diagnostico` (
  `id` int NOT NULL AUTO_INCREMENT,
  `consulta_id` int NOT NULL,
  `descripcion` text COLLATE utf8mb4_general_ci NOT NULL,
  `tipo` enum('Presuntivo','Definitivo') COLLATE utf8mb4_general_ci DEFAULT 'Presuntivo',
  PRIMARY KEY (`id`),
  KEY `consulta_id` (`consulta_id`),
  CONSTRAINT `diagnostico_ibfk_1` FOREIGN KEY (`consulta_id`) REFERENCES `consulta` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── empleados ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `empleados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clinica_id` int NOT NULL COMMENT 'Clínica a la que pertenece',
  `rol_id` int NOT NULL COMMENT 'Puesto/rol del empleado',
  `nombre` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `apellidos` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Correo de login del empleado',
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Contraseña hasheada con bcrypt',
  `telefono` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1 = activo, 0 = dado de baja',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_empleado_email` (`email`),
  KEY `idx_empleados_clinica` (`clinica_id`),
  KEY `idx_empleados_rol` (`rol_id`),
  CONSTRAINT `empleados_ibfk_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `empleados_ibfk_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Empleados/usuarios internos de cada clínica';

-- ── expediente ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `expediente` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clinica_id` int DEFAULT NULL COMMENT 'Clínica propietaria del registro',
  `paciente_id` int NOT NULL,
  `fecha_apertura` date NOT NULL DEFAULT (curdate()),
  `anamnesis` text COLLATE utf8mb4_general_ci,
  `examen_fisico` text COLLATE utf8mb4_general_ci,
  `examenes_sistemicos` text COLLATE utf8mb4_general_ci,
  `lista_problemas` text COLLATE utf8mb4_general_ci,
  `dx_presuntivo` text COLLATE utf8mb4_general_ci,
  `abordaje_dx` text COLLATE utf8mb4_general_ci,
  `dx_definitivo` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `paciente_id` (`paciente_id`),
  KEY `idx_expediente_clinica` (`clinica_id`),
  CONSTRAINT `expediente_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE CASCADE,
  CONSTRAINT `expediente_ibfk_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── hospitalizacion ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `hospitalizacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `expediente_id` int NOT NULL,
  `fecha_ingreso` date NOT NULL,
  `historia_clinica` text COLLATE utf8mb4_general_ci,
  `abordaje_hospitalario` text COLLATE utf8mb4_general_ci,
  `tratamiento_intrahospitalario` text COLLATE utf8mb4_general_ci,
  `abordaje_diagnostico` text COLLATE utf8mb4_general_ci,
  `seguimiento` text COLLATE utf8mb4_general_ci,
  `revaloraciones` text COLLATE utf8mb4_general_ci,
  `ajuste_plan_terapeutico` text COLLATE utf8mb4_general_ci,
  `plan_diagnostico` text COLLATE utf8mb4_general_ci,
  `tipo_alta` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `acta_responsiva` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expediente_id` (`expediente_id`),
  CONSTRAINT `hospitalizacion_ibfk_1` FOREIGN KEY (`expediente_id`) REFERENCES `expediente` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── hospitalizacion_empleados ───────────────────────────────
CREATE TABLE IF NOT EXISTS `hospitalizacion_empleados` (
  `hospitalizacion_id` int NOT NULL COMMENT 'ID de la hospitalización',
  `empleado_id` int NOT NULL COMMENT 'ID del empleado participante',
  PRIMARY KEY (`hospitalizacion_id`,`empleado_id`),
  KEY `idx_hosp_emp_empleado` (`empleado_id`),
  CONSTRAINT `hosp_emp_ibfk_empleado` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE CASCADE,
  CONSTRAINT `hosp_emp_ibfk_hospitalizacion` FOREIGN KEY (`hospitalizacion_id`) REFERENCES `hospitalizacion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── inventario ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `inventario` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clinica_id` int NOT NULL,
  `nombre` varchar(155) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `stock` int NOT NULL DEFAULT '0',
  `stock_minimo` int NOT NULL DEFAULT '0',
  `precio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `unidad` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'unidades',
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_inventario_clinica` (`clinica_id`),
  CONSTRAINT `fk_inventario_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── paciente ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `paciente` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clinica_id` int DEFAULT NULL COMMENT 'Clínica propietaria del registro',
  `tutor_id` int NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `especie` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `raza` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `sexo` enum('Macho','Hembra') COLLATE utf8mb4_general_ci NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `funcion_zootecnica` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tatuaje` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `microchip` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `esquemas_preventivos` text COLLATE utf8mb4_general_ci,
  `carnet_token` char(32) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_paciente_carnet_token` (`carnet_token`),
  KEY `tutor_id` (`tutor_id`),
  KEY `idx_paciente_clinica` (`clinica_id`),
  CONSTRAINT `paciente_ibfk_1` FOREIGN KEY (`tutor_id`) REFERENCES `tutor` (`id`) ON DELETE CASCADE,
  CONSTRAINT `paciente_ibfk_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── recibo ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `recibo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clinica_id` int NOT NULL,
  `paciente_id` int NOT NULL,
  `expediente_id` int DEFAULT NULL,
  `empleado_id` int DEFAULT NULL,
  `fecha` date NOT NULL,
  `motivo_consulta` text COLLATE utf8mb4_general_ci,
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('borrador','finalizado') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'borrador',
  `stock_descontado` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_recibo_clinica` (`clinica_id`),
  KEY `idx_recibo_paciente` (`paciente_id`),
  KEY `idx_recibo_expediente` (`expediente_id`),
  KEY `idx_recibo_empleado` (`empleado_id`),
  KEY `idx_recibo_fecha` (`fecha`),
  KEY `idx_recibo_status` (`status`),
  CONSTRAINT `recibo_ibfk_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recibo_ibfk_empleado` FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE SET NULL,
  CONSTRAINT `recibo_ibfk_expediente` FOREIGN KEY (`expediente_id`) REFERENCES `expediente` (`id`) ON DELETE SET NULL,
  CONSTRAINT `recibo_ibfk_paciente` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── recibo_item ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `recibo_item` (
  `id` int NOT NULL AUTO_INCREMENT,
  `recibo_id` int NOT NULL,
  `servicio_id` int DEFAULT NULL,
  `producto_id` int DEFAULT NULL,
  `nombre_servicio` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL DEFAULT '0.00',
  `cantidad` int NOT NULL DEFAULT '1',
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `notas` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `idx_recitem_recibo` (`recibo_id`),
  KEY `idx_recitem_servicio` (`servicio_id`),
  KEY `fk_recibo_item_producto` (`producto_id`),
  CONSTRAINT `fk_recibo_item_producto` FOREIGN KEY (`producto_id`) REFERENCES `inventario` (`id`) ON DELETE SET NULL,
  CONSTRAINT `recitem_ibfk_recibo` FOREIGN KEY (`recibo_id`) REFERENCES `recibo` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recitem_ibfk_servicio` FOREIGN KEY (`servicio_id`) REFERENCES `servicio_catalogo` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── recordatorio_enviado ────────────────────────────────────
CREATE TABLE IF NOT EXISTS `recordatorio_enviado` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clinica_id` int NOT NULL,
  `tipo` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `referencia_id` int NOT NULL,
  `paciente_id` int DEFAULT NULL,
  `canal` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'whatsapp',
  `enviado_por` int DEFAULT NULL,
  `enviado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_recordatorio` (`clinica_id`,`tipo`,`referencia_id`),
  KEY `fk_recordatorio_paciente` (`paciente_id`),
  KEY `idx_recordatorio_clinica` (`clinica_id`,`enviado_en`),
  CONSTRAINT `fk_recordatorio_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_recordatorio_paciente` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── roles ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clinica_id` int NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_general_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_roles_clinica` (`clinica_id`),
  CONSTRAINT `roles_ibfk_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── seguimiento_hospitalizacion ─────────────────────────────
CREATE TABLE IF NOT EXISTS `seguimiento_hospitalizacion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `hospitalizacion_id` int NOT NULL,
  `fecha` date NOT NULL,
  `revaloracion` text COLLATE utf8mb4_general_ci,
  `ajuste_terapeutico` text COLLATE utf8mb4_general_ci,
  `plan_diagnostico` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `hospitalizacion_id` (`hospitalizacion_id`),
  CONSTRAINT `seguimiento_hospitalizacion_ibfk_1` FOREIGN KEY (`hospitalizacion_id`) REFERENCES `hospitalizacion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── servicio_catalogo ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS `servicio_catalogo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clinica_id` int NOT NULL,
  `categoria` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `nombre` varchar(200) COLLATE utf8mb4_general_ci NOT NULL,
  `precio` decimal(10,2) NOT NULL DEFAULT '0.00',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_servcat_clinica` (`clinica_id`),
  KEY `idx_servcat_categoria` (`categoria`),
  KEY `idx_servcat_activo` (`activo`),
  CONSTRAINT `servcat_ibfk_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── solicitud_reabastecimiento ──────────────────────────────
CREATE TABLE IF NOT EXISTS `solicitud_reabastecimiento` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clinica_id` int NOT NULL,
  `empleado_id` int NOT NULL,
  `producto_id` int DEFAULT NULL,
  `producto_nombre` varchar(155) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cantidad` int NOT NULL DEFAULT '1',
  `notas` text COLLATE utf8mb4_unicode_ci,
  `status` enum('pendiente','completado') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `creado_en` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_solicitud_clinica` (`clinica_id`),
  KEY `fk_solicitud_producto` (`producto_id`),
  CONSTRAINT `fk_solicitud_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_solicitud_producto` FOREIGN KEY (`producto_id`) REFERENCES `inventario` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── tratamiento ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tratamiento` (
  `id` int NOT NULL AUTO_INCREMENT,
  `consulta_id` int NOT NULL,
  `medicamento` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `dosis` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `via` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `duracion_dias` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `consulta_id` (`consulta_id`),
  CONSTRAINT `tratamiento_ibfk_1` FOREIGN KEY (`consulta_id`) REFERENCES `consulta` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── tratamiento_tarea ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tratamiento_tarea` (
  `id` int NOT NULL AUTO_INCREMENT,
  `hospitalizacion_id` int NOT NULL,
  `fecha` date NOT NULL,
  `hora` time NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `categoria` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `dosis` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `via` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notas` text COLLATE utf8mb4_general_ci,
  `completada` tinyint(1) NOT NULL DEFAULT '0',
  `completada_en` timestamp NULL DEFAULT NULL,
  `completada_por` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_tarea_empleado` (`completada_por`),
  KEY `idx_tarea_hosp_fecha` (`hospitalizacion_id`,`fecha`,`hora`),
  CONSTRAINT `fk_tarea_empleado` FOREIGN KEY (`completada_por`) REFERENCES `empleados` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_tarea_hospitalizacion` FOREIGN KEY (`hospitalizacion_id`) REFERENCES `hospitalizacion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── tutor ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tutor` (
  `id` int NOT NULL AUTO_INCREMENT,
  `clinica_id` int DEFAULT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `apellidos` varchar(150) COLLATE utf8mb4_general_ci NOT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `whatsapp` varchar(20) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `correo` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `direccion` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `codigo` varchar(30) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tags` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `vetado` tinyint(1) DEFAULT '0',
  `estatus` enum('activo','inactivo','vetado') COLLATE utf8mb4_general_ci DEFAULT 'activo',
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`),
  KEY `idx_tutor_clinica` (`clinica_id`),
  CONSTRAINT `tutor_ibfk_clinica` FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ── vacuna ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `vacuna` (
  `id` int NOT NULL AUTO_INCREMENT,
  `paciente_id` int NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `fecha_aplicacion` date NOT NULL,
  `proxima_dosis` date DEFAULT NULL,
  `lote` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `fabricante` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `via_administracion` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `dosis` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`),
  KEY `paciente_id` (`paciente_id`),
  CONSTRAINT `vacuna_ibfk_1` FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;
