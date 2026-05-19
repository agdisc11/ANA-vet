-- ============================================================
-- MIGRACIÓN: ASIGNACIÓN DE PERSONAL MÉDICO — Fase 4
-- Base de datos: `clinica_veterinaria`
-- Generado: 2026-05-18
-- ============================================================
-- INSTRUCCIONES:
--   1. Ejecutar el bloque PASO 1: ALTER TABLE en consulta
--   2. Ejecutar el bloque PASO 2: Tablas puente (cirugia_empleados, hospitalizacion_empleados)
--   3. Ejecutar el bloque PASO 3: Índices y Foreign Keys
-- ============================================================

USE `clinica_veterinaria`;

-- ============================================================
-- PASO 1: Agregar empleado_id a la tabla consulta (relación 1:N)
-- Un solo empleado atiende cada consulta
-- ============================================================

ALTER TABLE `consulta`
  ADD COLUMN IF NOT EXISTS `empleado_id` int(11) DEFAULT NULL
    COMMENT 'Empleado (veterinario/médico) que atiende la consulta'
    AFTER `expediente_id`;

ALTER TABLE `consulta`
  ADD KEY IF NOT EXISTS `idx_consulta_empleado` (`empleado_id`);

-- ============================================================
-- PASO 2: Tablas puente para relaciones N:M
-- Múltiples empleados pueden participar en una cirugía u hospitalización
-- ============================================================

-- ------------------------------------------------------------
-- Tabla puente: cirugia_empleados
-- Relaciona una cirugía con múltiples empleados participantes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cirugia_empleados` (
  `cirugia_id`   int(11) NOT NULL COMMENT 'ID de la cirugía',
  `empleado_id`  int(11) NOT NULL COMMENT 'ID del empleado participante',
  PRIMARY KEY (`cirugia_id`, `empleado_id`),
  KEY `idx_cirugia_emp_empleado` (`empleado_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Tabla puente N:M entre cirugías y empleados participantes';

-- ------------------------------------------------------------
-- Tabla puente: hospitalizacion_empleados
-- Relaciona una hospitalización con múltiples empleados participantes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `hospitalizacion_empleados` (
  `hospitalizacion_id`  int(11) NOT NULL COMMENT 'ID de la hospitalización',
  `empleado_id`         int(11) NOT NULL COMMENT 'ID del empleado participante',
  PRIMARY KEY (`hospitalizacion_id`, `empleado_id`),
  KEY `idx_hosp_emp_empleado` (`empleado_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Tabla puente N:M entre hospitalizaciones y empleados participantes';

-- ============================================================
-- PASO 3: Foreign Keys
-- ============================================================

-- consulta.empleado_id → empleados.id
-- SET NULL para no romper consultas si se elimina un empleado
ALTER TABLE `consulta`
  ADD CONSTRAINT `consulta_ibfk_empleado`
    FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE SET NULL;

-- cirugia_empleados.cirugia_id → cirugia.id
ALTER TABLE `cirugia_empleados`
  ADD CONSTRAINT `cirugia_emp_ibfk_cirugia`
    FOREIGN KEY (`cirugia_id`) REFERENCES `cirugia` (`id`) ON DELETE CASCADE;

-- cirugia_empleados.empleado_id → empleados.id
ALTER TABLE `cirugia_empleados`
  ADD CONSTRAINT `cirugia_emp_ibfk_empleado`
    FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE CASCADE;

-- hospitalizacion_empleados.hospitalizacion_id → hospitalizacion.id
ALTER TABLE `hospitalizacion_empleados`
  ADD CONSTRAINT `hosp_emp_ibfk_hospitalizacion`
    FOREIGN KEY (`hospitalizacion_id`) REFERENCES `hospitalizacion` (`id`) ON DELETE CASCADE;

-- hospitalizacion_empleados.empleado_id → empleados.id
ALTER TABLE `hospitalizacion_empleados`
  ADD CONSTRAINT `hosp_emp_ibfk_empleado`
    FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE CASCADE;

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
COMMIT;
