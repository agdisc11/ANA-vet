-- ============================================================
-- Migración: tabla `cita` (módulo Agenda)
-- Aplicar con: node scripts/run-migration.js src/db/migrations/2026-07-20_create_cita.sql
--
-- Estados y transiciones (los valida la entidad de dominio Cita):
--   programada → confirmada | en_sala | atendida | cancelada | no_asistio
--   confirmada → en_sala | atendida | cancelada | no_asistio
--   en_sala    → atendida | cancelada
--   atendida   → (final)          cancelada → programada (reactivar)
--   no_asistio → (final)
-- ============================================================

CREATE TABLE IF NOT EXISTS cita (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  clinica_id    INT          NOT NULL,
  paciente_id   INT          NOT NULL,
  empleado_id   INT          NULL COMMENT 'Veterinario asignado (opcional)',
  fecha         DATE         NOT NULL,
  hora_inicio   TIME         NOT NULL,
  duracion_min  INT          NOT NULL DEFAULT 30,
  motivo        VARCHAR(255) NULL,
  notas         TEXT         NULL,
  estado        VARCHAR(20)  NOT NULL DEFAULT 'programada',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  KEY idx_cita_clinica_fecha  (clinica_id, fecha),
  KEY idx_cita_empleado_fecha (empleado_id, fecha),

  CONSTRAINT fk_cita_clinica  FOREIGN KEY (clinica_id)  REFERENCES clinicas  (id) ON DELETE CASCADE,
  CONSTRAINT fk_cita_paciente FOREIGN KEY (paciente_id) REFERENCES paciente  (id) ON DELETE CASCADE,
  CONSTRAINT fk_cita_empleado FOREIGN KEY (empleado_id) REFERENCES empleados (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
