-- ============================================================
-- MIGRACIÓN SaaS MULTI-TENANT — Clínica Veterinaria
-- Fase 1: Base de Datos
-- Generado: 2026-05-18
-- ============================================================
-- INSTRUCCIONES:
--   1. Ejecutar PRIMERO el bloque "NUEVAS TABLAS"
--   2. Ejecutar DESPUÉS el bloque "ALTER TABLE (tablas existentes)"
--   3. Ejecutar FINALMENTE el bloque "FOREIGN KEYS"
-- ============================================================

USE `clinica_veterinaria`;

-- ============================================================
-- PASO 1: NUEVAS TABLAS MULTI-TENANT
-- ============================================================

-- ------------------------------------------------------------
-- Tabla: clinicas
-- Representa cada clínica veterinaria (tenant del sistema)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `clinicas` (
  `id`            int(11)       NOT NULL AUTO_INCREMENT,
  `nombre`        varchar(150)  NOT NULL                    COMMENT 'Nombre comercial de la clínica',
  `email`         varchar(150)  NOT NULL                    COMMENT 'Correo de acceso / login de la clínica',
  `password_hash` varchar(255)  NOT NULL                    COMMENT 'Contraseña hasheada con bcrypt',
  `telefono`      varchar(20)   DEFAULT NULL,
  `direccion`     varchar(255)  DEFAULT NULL,
  `logo_url`      varchar(500)  DEFAULT NULL                COMMENT 'Ruta o URL del logo de la clínica',
  `activa`        tinyint(1)    NOT NULL DEFAULT 1          COMMENT '1 = activa, 0 = suspendida',
  `created_at`    timestamp     NOT NULL DEFAULT current_timestamp(),
  `updated_at`    timestamp     NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_clinica_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Tabla maestra de clínicas (tenants del sistema SaaS)';

-- ------------------------------------------------------------
-- Tabla: roles
-- Catálogo de puestos/roles dentro de una clínica
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
  `id`          int(11)      NOT NULL AUTO_INCREMENT,
  `clinica_id`  int(11)      NOT NULL                      COMMENT 'Cada clínica define sus propios roles',
  `nombre`      varchar(100) NOT NULL                      COMMENT 'Ej: Veterinario, Recepcionista, Admin',
  `descripcion` text         DEFAULT NULL,
  `created_at`  timestamp    NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_roles_clinica` (`clinica_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Catálogo de roles/puestos por clínica';

-- ------------------------------------------------------------
-- Tabla: empleados
-- Usuarios internos de cada clínica (veterinarios, recepcionistas, etc.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `empleados` (
  `id`            int(11)       NOT NULL AUTO_INCREMENT,
  `clinica_id`    int(11)       NOT NULL                   COMMENT 'Clínica a la que pertenece',
  `rol_id`        int(11)       NOT NULL                   COMMENT 'Puesto/rol del empleado',
  `nombre`        varchar(100)  NOT NULL,
  `apellidos`     varchar(150)  NOT NULL,
  `email`         varchar(150)  NOT NULL                   COMMENT 'Correo de login del empleado',
  `password_hash` varchar(255)  NOT NULL                   COMMENT 'Contraseña hasheada con bcrypt',
  `telefono`      varchar(20)   DEFAULT NULL,
  `activo`        tinyint(1)    NOT NULL DEFAULT 1         COMMENT '1 = activo, 0 = dado de baja',
  `created_at`    timestamp     NOT NULL DEFAULT current_timestamp(),
  `updated_at`    timestamp     NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_empleado_email` (`email`),
  KEY `idx_empleados_clinica` (`clinica_id`),
  KEY `idx_empleados_rol`     (`rol_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Empleados/usuarios internos de cada clínica';

-- ============================================================
-- PASO 2: ALTER TABLE — Vincular tablas existentes a clinica_id
-- Se agrega clinica_id a las tablas "raíz" del modelo de datos.
-- Las tablas hijas (consulta, cirugia, etc.) heredan el tenant
-- a través de sus FK hacia expediente → paciente → tutor.
-- Solo se agrega clinica_id directamente a tutor y paciente
-- (punto de entrada de datos), y a expediente como refuerzo.
-- ============================================================

-- tutor: punto de entrada principal de datos de clientes
ALTER TABLE `tutor`
  ADD COLUMN IF NOT EXISTS `clinica_id` int(11) DEFAULT NULL
    COMMENT 'Clínica propietaria del registro'
    AFTER `id`,
  ADD KEY IF NOT EXISTS `idx_tutor_clinica` (`clinica_id`);

-- paciente: vinculado a tutor, pero se refuerza con clinica_id
ALTER TABLE `paciente`
  ADD COLUMN IF NOT EXISTS `clinica_id` int(11) DEFAULT NULL
    COMMENT 'Clínica propietaria del registro'
    AFTER `id`,
  ADD KEY IF NOT EXISTS `idx_paciente_clinica` (`clinica_id`);

-- expediente: punto de entrada de historial clínico
ALTER TABLE `expediente`
  ADD COLUMN IF NOT EXISTS `clinica_id` int(11) DEFAULT NULL
    COMMENT 'Clínica propietaria del registro'
    AFTER `id`,
  ADD KEY IF NOT EXISTS `idx_expediente_clinica` (`clinica_id`);

-- ============================================================
-- PASO 3: FOREIGN KEYS — Nuevas tablas
-- ============================================================

-- roles → clinicas
ALTER TABLE `roles`
  ADD CONSTRAINT `roles_ibfk_clinica`
    FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE;

-- empleados → clinicas
ALTER TABLE `empleados`
  ADD CONSTRAINT `empleados_ibfk_clinica`
    FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE;

-- empleados → roles
ALTER TABLE `empleados`
  ADD CONSTRAINT `empleados_ibfk_rol`
    FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT;

-- tutor → clinicas (FK suave: SET NULL para no romper datos legacy)
ALTER TABLE `tutor`
  ADD CONSTRAINT `tutor_ibfk_clinica`
    FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE SET NULL;

-- paciente → clinicas
ALTER TABLE `paciente`
  ADD CONSTRAINT `paciente_ibfk_clinica`
    FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE SET NULL;

-- expediente → clinicas
ALTER TABLE `expediente`
  ADD CONSTRAINT `expediente_ibfk_clinica`
    FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE SET NULL;

-- ============================================================
-- PASO 4: AUTO_INCREMENT para nuevas tablas
-- ============================================================
ALTER TABLE `clinicas`  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `roles`     MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `empleados` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- ============================================================
-- PASO 5: DATOS SEMILLA — Roles por defecto
-- (Se insertan DESPUÉS de crear la primera clínica real)
-- Ejemplo comentado para referencia:
-- ============================================================
/*
INSERT INTO `roles` (`clinica_id`, `nombre`, `descripcion`) VALUES
  (1, 'Administrador',  'Acceso total: gestión de empleados, reportes y configuración'),
  (1, 'Veterinario',    'Acceso a expedientes, consultas, cirugías y hospitalizaciones'),
  (1, 'Recepcionista',  'Registro de tutores, pacientes y citas'),
  (1, 'Auxiliar',       'Apoyo en consultas y hospitalización, sin acceso a reportes');
*/

COMMIT;
