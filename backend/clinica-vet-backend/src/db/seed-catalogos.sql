-- Datos de referencia GLOBALES de ANA-vet (no son de ninguna clínica).
-- Los consumen las calculadoras de Farmacia y Toxicología: sin esto
-- esas pantallas salen vacías.
--
-- Cargar DESPUÉS de schema.sql:
--   mysql -u USUARIO -p clinica_veterinaria < src/db/seed-catalogos.sql

SET NAMES utf8mb4;

-- ── catalogo_medicamentos (7 filas) ─────────────────────────
INSERT IGNORE INTO `catalogo_medicamentos` (`id`, `nombre`, `categoria`, `especie_destino`, `dosis_mg_por_kg`, `dosis_min_mg_kg`, `dosis_max_mg_kg`, `concentracion_mg_ml`, `via_administracion`, `notas_clinicas`, `created_at`) VALUES
  (1, 'Meloxicam', 'AINE', 'general', '0.2000', '0.1000', '0.2000', '5.0000', 'SC, IV, PO', 'Dosis inicial 0.2 mg/kg; mantenimiento 0.1 mg/kg/24h. CONTRAINDICADO en gatos con enfermedad renal.', '2026-05-17 00:42:27'),
  (2, 'Propofol', 'Anestésico', 'general', '4.0000', '2.0000', '6.0000', '10.0000', 'IV', 'Inducción: 2–6 mg/kg IV lento a efecto. Puede causar apnea transitoria.', '2026-05-17 00:42:27'),
  (3, 'Amoxicilina-Ácido Clavulánico', 'Antibiótico', 'general', '12.5000', '12.5000', '25.0000', '50.0000', 'PO, SC, IV', '12.5–25 mg/kg cada 12h PO. Inyectable: 8.75 mg/kg SC/IV cada 24h.', '2026-05-17 00:42:27'),
  (4, 'Tramadol', 'Analgésico opioide', 'canino', '4.0000', '2.0000', '5.0000', '50.0000', 'PO, IV, SC', 'Perros: 2–5 mg/kg cada 8–12h PO. En gatos: 1–2 mg/kg cada 12h con precaución.', '2026-05-17 00:42:27'),
  (5, 'Dexametasona', 'Corticosteroide', 'general', '0.1000', '0.1000', '0.5000', '2.0000', 'IV, IM, SC', 'Antiinflamatorio: 0.1–0.2 mg/kg. Shock: 0.5–1 mg/kg IV. Potencia: 7× prednisolona.', '2026-05-17 00:42:27'),
  (6, 'Ketamina', 'Anestésico disociativo', 'general', '5.0000', '1.0000', '10.0000', '100.0000', 'IV, IM', 'CRI analgésico: 0.1–0.6 mg/kg/h IV. Siempre combinar con benzodiacepina o alfa-2.', '2026-05-17 00:42:27'),
  (7, 'Furosemida', 'Diurético', 'general', '2.0000', '1.0000', '4.0000', '50.0000', 'IV, IM, PO', 'Edema pulmonar agudo: 2–4 mg/kg IV. Monitorear K⁺ en uso crónico.', '2026-05-17 00:42:27');

-- ── catalogo_toxicologia (5 filas) ──────────────────────────
INSERT IGNORE INTO `catalogo_toxicologia` (`id`, `toxina`, `especie_afectada`, `dosis_toxica_leve_mg_kg`, `dosis_toxica_moderada_mg_kg`, `dosis_toxica_letal_mg_kg`, `mecanismo`, `signos_clinicos`, `tratamiento_base`, `notas`, `created_at`) VALUES
  (1, 'Teobromina (Chocolate)', 'canino', '20.0000', '40.0000', '100.0000', 'Inhibición de fosfodiesterasa → acumulación de AMPc; antagonismo de adenosina.', 'Vómito, diarrea, taquicardia, arritmias, temblores, convulsiones.', '1. Emesis si <2h (apomorfina). 2. Carbón activado 1–4 g/kg. 3. Fluidoterapia. 4. Diazepam.', 'Chocolate negro: ~16 mg/g. Leche: ~2.4 mg/g. Cacao en polvo: ~28 mg/g.', '2026-05-17 00:42:27'),
  (2, 'Acetaminofén (Paracetamol)', 'felino', '10.0000', '40.0000', '50.0000', 'Deficiencia de glucuroniltransferasa → NAPQI → metahemoglobinemia y daño hepático.', 'Mucosas marrones, edema facial, disnea, ictericia, colapso.', '1. NAC 140 mg/kg carga, luego 70 mg/kg c/6h ×7. 2. Ácido ascórbico 30 mg/kg IV. 3. SAMe.', 'EXTREMADAMENTE TÓXICO en gatos. Dosis de 10 mg/kg puede ser letal.', '2026-05-17 00:42:27'),
  (3, 'Uvas / Pasas', 'canino', NULL, '11.0000', NULL, 'Mecanismo desconocido. Posiblemente ácido tartárico. Necrosis tubular renal aguda.', 'Vómito, letargia, oliguria/anuria, azotemia, falla renal en 24–72h.', '1. Emesis si <2h. 2. Carbón activado. 3. Fluidoterapia IV agresiva 48h. 4. Monitoreo renal.', 'Toxicidad idiosincrática. Tratar SIEMPRE como emergencia.', '2026-05-17 00:42:27'),
  (4, 'Xilitol', 'canino', '0.1000', '0.5000', NULL, 'Estimulación de insulina pancreática → hipoglucemia. Dosis altas: necrosis hepática.', 'Vómito, ataxia, convulsiones, coma (30–60 min). Ictericia, coagulopatía (12–24h).', '1. Dextrosa IV (bolo D50% diluido, luego CRI D5%). 2. Glucemia c/2h. 3. Panel hepático 24–48h.', 'Presente en chicles, pasta dental, alimentos light. Xylitol = xilitol.', '2026-05-17 00:42:27'),
  (5, 'Permetrina (Piretroide)', 'felino', NULL, NULL, NULL, 'Canales de Na⁺ abiertos → hiperexcitabilidad neuronal. Gatos sin glucuroniltransferasa.', 'Temblores intensos, hipersalivación, ataxia, convulsiones, hipertermia.', '1. Baño con jabón lavavajillas. 2. Metocarbamol 55–220 mg/kg IV. 3. Diazepam. 4. Fluidoterapia.', 'Productos antipulgas caninos con permetrina 45–65% son LETALES en gatos.', '2026-05-17 00:42:27');
