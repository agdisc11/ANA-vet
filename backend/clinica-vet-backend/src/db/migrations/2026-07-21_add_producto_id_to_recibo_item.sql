-- ============================================================
-- POS: vincular items de recibo con el inventario (Fase 3.4)
--
-- Un item de recibo puede ser:
--   · un SERVICIO  → servicio_id (catálogo de servicios)
--   · un PRODUCTO  → producto_id (inventario) ← nuevo
--
-- Al finalizar el recibo, los items con producto_id descuentan stock.
-- ON DELETE SET NULL: si se borra el producto, el item histórico
-- conserva nombre y precio (el recibo es historial financiero).
-- ============================================================
ALTER TABLE recibo_item
  ADD COLUMN producto_id INT NULL AFTER servicio_id,
  ADD CONSTRAINT fk_recibo_item_producto
    FOREIGN KEY (producto_id) REFERENCES inventario(id) ON DELETE SET NULL;

-- Marca en el recibo si ya se descontó el stock, para que finalizar
-- dos veces no descuente doble.
ALTER TABLE recibo
  ADD COLUMN stock_descontado TINYINT(1) NOT NULL DEFAULT 0 AFTER status;
