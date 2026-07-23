-- ============================================================
-- Hoja de tratamiento hospitalario (Fase 3.6)
--
-- Tareas por hora de un paciente internado: medicación, curaciones,
-- toma de constantes… Cada una registra QUIÉN la aplicó y CUÁNDO,
-- que es lo que exige una hoja de tratamiento real.
--
-- Sin clinica_id propio: el aislamiento va por
-- hospitalizacion → expediente → clinica_id.
-- ============================================================
CREATE TABLE IF NOT EXISTS tratamiento_tarea (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  hospitalizacion_id  INT           NOT NULL,
  fecha               DATE          NOT NULL,
  hora                TIME          NOT NULL,
  descripcion         VARCHAR(255)  NOT NULL,
  categoria           VARCHAR(30)   NULL,      -- medicacion | fluidos | constantes | alimentacion | otro
  dosis               VARCHAR(100)  NULL,
  via                 VARCHAR(50)   NULL,
  notas               TEXT          NULL,

  completada          TINYINT(1)    NOT NULL DEFAULT 0,
  completada_en       TIMESTAMP     NULL,
  completada_por      INT           NULL,      -- empleados.id

  created_at          TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_tarea_hospitalizacion FOREIGN KEY (hospitalizacion_id)
    REFERENCES hospitalizacion(id) ON DELETE CASCADE,
  CONSTRAINT fk_tarea_empleado FOREIGN KEY (completada_por)
    REFERENCES empleados(id) ON DELETE SET NULL,

  KEY idx_tarea_hosp_fecha (hospitalizacion_id, fecha, hora)
);
