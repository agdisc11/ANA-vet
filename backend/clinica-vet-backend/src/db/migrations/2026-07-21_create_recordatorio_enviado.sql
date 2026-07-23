-- ============================================================
-- Recordatorios enviados (Fase 3.2)
-- Registra qué recordatorio se envió por WhatsApp y cuándo, para
-- no volver a enviar el mismo y llevar historial de contacto.
--
-- `referencia` identifica el origen del recordatorio:
--   tipo = 'vacuna' → referencia_id = vacuna.id
--   tipo = 'cita'   → referencia_id = cita.id
-- ============================================================
CREATE TABLE IF NOT EXISTS recordatorio_enviado (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  clinica_id    INT          NOT NULL,
  tipo          VARCHAR(20)  NOT NULL,
  referencia_id INT          NOT NULL,
  paciente_id   INT          NULL,
  canal         VARCHAR(20)  NOT NULL DEFAULT 'whatsapp',
  enviado_por   INT          NULL,
  enviado_en    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_recordatorio_clinica  FOREIGN KEY (clinica_id)  REFERENCES clinicas(id) ON DELETE CASCADE,
  CONSTRAINT fk_recordatorio_paciente FOREIGN KEY (paciente_id) REFERENCES paciente(id) ON DELETE CASCADE,

  -- Un mismo recordatorio no se registra dos veces
  UNIQUE KEY uq_recordatorio (clinica_id, tipo, referencia_id),
  KEY idx_recordatorio_clinica (clinica_id, enviado_en)
);
