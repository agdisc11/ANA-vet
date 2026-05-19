-- ============================================================
-- MIGRACIÓN: MÓDULO DE RECIBOS DE PAGO — Fase 5
-- Base de datos: `clinica_veterinaria`
-- Generado: 2026-05-18
-- ============================================================
-- INSTRUCCIONES:
--   1. Asegúrate de haber ejecutado previamente:
--        - schema.sql
--        - migration_saas.sql          (crea: clinicas, empleados, roles)
--        - migration_empleados_medicos.sql
--   2. Ejecutar este archivo completo en orden:
--        PASO 1 → servicio_catalogo
--        PASO 2 → recibo
--        PASO 3 → recibo_item
--        PASO 4 → Índices y Foreign Keys
--        PASO 5 → AUTO_INCREMENT
-- ============================================================

USE `clinica_veterinaria`;

-- ============================================================
-- PASO 1: TABLA servicio_catalogo
-- Catálogo de servicios ofrecidos por cada clínica.
-- Permite definir precios estándar por categoría de servicio.
-- ============================================================

CREATE TABLE IF NOT EXISTS `servicio_catalogo` (
  `id`          int(11)       NOT NULL AUTO_INCREMENT,
  `clinica_id`  int(11)       NOT NULL
                  COMMENT 'Clínica propietaria del servicio (multi-tenant)',
  `categoria`   enum(
                  'Consulta',
                  'Laboratorio',
                  'Gabinete',
                  'Hospitalizacion',
                  'Cirugia',
                  'Procedimiento Ambulatorio'
                ) NOT NULL
                  COMMENT 'Categoría clínica del servicio',
  `nombre`      varchar(200)  NOT NULL
                  COMMENT 'Nombre descriptivo del servicio',
  `precio`      decimal(10,2) NOT NULL DEFAULT 0.00
                  COMMENT 'Precio unitario de lista (MXN)',
  `activo`      tinyint(1)    NOT NULL DEFAULT 1
                  COMMENT '1 = disponible para facturar, 0 = dado de baja',
  `created_at`  timestamp     NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_servcat_clinica`   (`clinica_id`),
  KEY `idx_servcat_categoria` (`categoria`),
  KEY `idx_servcat_activo`    (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Catálogo de servicios y precios por clínica';

-- ============================================================
-- PASO 2: TABLA recibo
-- Encabezado del recibo de pago.
-- Vincula la transacción con el paciente, expediente y empleado
-- que generó el cobro.
-- ============================================================

CREATE TABLE IF NOT EXISTS `recibo` (
  `id`              int(11)       NOT NULL AUTO_INCREMENT,
  `clinica_id`      int(11)       NOT NULL
                      COMMENT 'Clínica que emite el recibo (multi-tenant)',
  `paciente_id`     int(11)       NOT NULL
                      COMMENT 'Paciente al que corresponde el cobro',
  `expediente_id`   int(11)       DEFAULT NULL
                      COMMENT 'Expediente clínico relacionado (opcional)',
  `empleado_id`     int(11)       DEFAULT NULL
                      COMMENT 'Empleado que genera/autoriza el recibo',
  `fecha`           date          NOT NULL
                      COMMENT 'Fecha de emisión del recibo',
  `motivo_consulta` text          DEFAULT NULL
                      COMMENT 'Descripción breve del motivo de la visita o cobro',
  `total`           decimal(10,2) NOT NULL DEFAULT 0.00
                      COMMENT 'Suma total del recibo (calculada a partir de recibo_item)',
  `status`          enum('borrador','finalizado') NOT NULL DEFAULT 'borrador'
                      COMMENT 'borrador = editable; finalizado = cerrado/cobrado',
  `created_at`      timestamp     NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_recibo_clinica`    (`clinica_id`),
  KEY `idx_recibo_paciente`   (`paciente_id`),
  KEY `idx_recibo_expediente` (`expediente_id`),
  KEY `idx_recibo_empleado`   (`empleado_id`),
  KEY `idx_recibo_fecha`      (`fecha`),
  KEY `idx_recibo_status`     (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Encabezado de recibos de pago por consulta/servicio';

-- ============================================================
-- PASO 3: TABLA recibo_item
-- Líneas de detalle del recibo.
-- Cada fila representa un servicio cobrado dentro del recibo.
-- El nombre_servicio se copia desde servicio_catalogo para
-- preservar el historial aunque el catálogo cambie en el futuro.
-- ============================================================

CREATE TABLE IF NOT EXISTS `recibo_item` (
  `id`              int(11)       NOT NULL AUTO_INCREMENT,
  `recibo_id`       int(11)       NOT NULL
                      COMMENT 'Recibo al que pertenece esta línea',
  `servicio_id`     int(11)       DEFAULT NULL
                      COMMENT 'Servicio del catálogo (NULL si fue ingresado manualmente)',
  `nombre_servicio` varchar(200)  NOT NULL
                      COMMENT 'Nombre del servicio al momento del cobro (snapshot)',
  `precio_unitario` decimal(10,2) NOT NULL DEFAULT 0.00
                      COMMENT 'Precio por unidad al momento del cobro',
  `cantidad`        int(11)       NOT NULL DEFAULT 1
                      COMMENT 'Número de unidades cobradas',
  `subtotal`        decimal(10,2) NOT NULL DEFAULT 0.00
                      COMMENT 'precio_unitario × cantidad (calculado en aplicación)',
  `notas`           text          DEFAULT NULL
                      COMMENT 'Observaciones adicionales sobre este ítem',
  PRIMARY KEY (`id`),
  KEY `idx_recitem_recibo`   (`recibo_id`),
  KEY `idx_recitem_servicio` (`servicio_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  COMMENT='Líneas de detalle de cada recibo de pago';

-- ============================================================
-- PASO 4: FOREIGN KEYS
-- Todas las referencias apuntan a tablas existentes en el esquema.
-- ============================================================

-- servicio_catalogo → clinicas
ALTER TABLE `servicio_catalogo`
  ADD CONSTRAINT `servcat_ibfk_clinica`
    FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE;

-- recibo → clinicas
ALTER TABLE `recibo`
  ADD CONSTRAINT `recibo_ibfk_clinica`
    FOREIGN KEY (`clinica_id`) REFERENCES `clinicas` (`id`) ON DELETE CASCADE;

-- recibo → paciente
ALTER TABLE `recibo`
  ADD CONSTRAINT `recibo_ibfk_paciente`
    FOREIGN KEY (`paciente_id`) REFERENCES `paciente` (`id`) ON DELETE RESTRICT;

-- recibo → expediente (SET NULL: el recibo sobrevive si se elimina el expediente)
ALTER TABLE `recibo`
  ADD CONSTRAINT `recibo_ibfk_expediente`
    FOREIGN KEY (`expediente_id`) REFERENCES `expediente` (`id`) ON DELETE SET NULL;

-- recibo → empleados (SET NULL: el recibo sobrevive si se da de baja al empleado)
ALTER TABLE `recibo`
  ADD CONSTRAINT `recibo_ibfk_empleado`
    FOREIGN KEY (`empleado_id`) REFERENCES `empleados` (`id`) ON DELETE SET NULL;

-- recibo_item → recibo (CASCADE: al borrar el recibo se eliminan sus ítems)
ALTER TABLE `recibo_item`
  ADD CONSTRAINT `recitem_ibfk_recibo`
    FOREIGN KEY (`recibo_id`) REFERENCES `recibo` (`id`) ON DELETE CASCADE;

-- recibo_item → servicio_catalogo (SET NULL: el ítem conserva snapshot si se elimina el servicio)
ALTER TABLE `recibo_item`
  ADD CONSTRAINT `recitem_ibfk_servicio`
    FOREIGN KEY (`servicio_id`) REFERENCES `servicio_catalogo` (`id`) ON DELETE SET NULL;

-- ============================================================
-- PASO 5: AUTO_INCREMENT
-- ============================================================

ALTER TABLE `servicio_catalogo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `recibo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `recibo_item`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

-- ============================================================
-- FIN DE MIGRACIÓN
-- ============================================================
COMMIT;
