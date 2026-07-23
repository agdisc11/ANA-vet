-- ============================================================
-- Migración: Agrega columna producto_id a solicitud_reabastecimiento
-- Permite identificar el producto por ID único en lugar de por nombre.
-- ============================================================

ALTER TABLE `solicitud_reabastecimiento`
  ADD COLUMN `producto_id` INT(11) NULL DEFAULT NULL AFTER `empleado_id`,
  ADD CONSTRAINT `fk_solicitud_producto`
    FOREIGN KEY (`producto_id`) REFERENCES `inventario` (`id`)
    ON DELETE SET NULL;
