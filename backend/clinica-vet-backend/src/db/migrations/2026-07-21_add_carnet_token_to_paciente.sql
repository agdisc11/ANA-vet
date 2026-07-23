-- ============================================================
-- Carnet de vacunación público (Fase 3.5)
--
-- Token opaco por paciente que permite consultar SOLO su carnet de
-- vacunación desde un enlace público (sin sesión). Es un identificador
-- aleatorio no adivinable; se puede revocar generando uno nuevo.
-- ============================================================
ALTER TABLE paciente
  ADD COLUMN carnet_token CHAR(32) NULL AFTER esquemas_preventivos,
  ADD UNIQUE KEY uq_paciente_carnet_token (carnet_token);
