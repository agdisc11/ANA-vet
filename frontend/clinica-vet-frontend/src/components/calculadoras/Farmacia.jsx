import { useState } from 'react';
import { useMedicamentos } from '../../hooks/useDashboard';

// ─── Matriz de compatibilidad de unidades (v3.0) ──────────────────────────────
// Define qué unidades de dosis son compatibles con qué unidades de formulación.
// Si la unidad de dosis NO está en el array de compatibles de la formulación → incompatible.
const CLINICAL_CONSTANTS = Object.freeze({
  // Grupos de unidades compatibles entre sí
  // Clave: unidad de formulación (concentración) → array de unidades de dosis compatibles
  compatibilidad: {
    'mg/mL':  ['mg', 'mg/kg'],
    'mcg/mL': ['mcg', 'mcg/kg', 'μg', 'μg/kg'],
    'μg/mL':  ['mcg', 'mcg/kg', 'μg', 'μg/kg'],
    'U/mL':   ['U', 'UI', 'U/kg', 'UI/kg'],
    'mEq/mL': ['mEq', 'mEq/kg'],
    'g/mL':   ['g', 'g/kg'],
    '%':      ['mg', 'mg/kg', 'g', 'g/kg'],
  },
  // Unidades de dosis disponibles para selección manual
  unidadesDosis: ['mg', 'mg/kg', 'mcg', 'mcg/kg', 'μg', 'μg/kg', 'U', 'UI', 'U/kg', 'UI/kg', 'mEq', 'mEq/kg', 'g', 'g/kg'],
  // Unidades de formulación disponibles
  unidadesFormulacion: ['mg/mL', 'mcg/mL', 'μg/mL', 'U/mL', 'mEq/mL', 'g/mL', '%'],
});

// ─── Función de validación de compatibilidad ──────────────────────────────────
function esCompatible(unidadDosis, unidadFormulacion) {
  if (!unidadDosis || !unidadFormulacion) return null; // sin datos suficientes
  const compatibles = CLINICAL_CONSTANTS.compatibilidad[unidadFormulacion];
  if (!compatibles) return null; // formulación desconocida → no bloquear
  return compatibles.includes(unidadDosis);
}

// ─── Sub-componente: Card de resultado ───────────────────────────────────────
function ResultadoCard({ volumen, medicamento, pesoKg, dosis, concentracion, unidadDosis }) {
  return (
    <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1">
        Volumen a administrar
      </p>
      <p className="text-5xl font-extrabold text-blue-700 dark:text-blue-300 leading-none">
        {volumen.toFixed(2)}
        <span className="text-2xl font-semibold ml-2">mL</span>
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-mono">
        Fórmula: ({pesoKg} kg × {dosis} {unidadDosis}) ÷ {concentracion} mg/mL = {volumen.toFixed(4)} mL
      </p>
      {medicamento?.via_administracion && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Vía recomendada: <strong>{medicamento.via_administracion}</strong>
        </p>
      )}
    </div>
  );
}

// ─── Sub-componente: Badge de incompatibilidad ────────────────────────────────
function BadgeIncompatibilidad({ unidadDosis, unidadFormulacion }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-400 dark:border-red-600">
      <span className="text-red-500 text-xl flex-shrink-0 mt-0.5">🚫</span>
      <div>
        <p className="text-sm font-bold text-red-800 dark:text-red-200">
          Incompatibilidad de unidades detectada
        </p>
        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
          La unidad de dosis <strong className="font-mono bg-red-100 dark:bg-red-900/40 px-1 rounded">{unidadDosis}</strong> no es compatible con la formulación en <strong className="font-mono bg-red-100 dark:bg-red-900/40 px-1 rounded">{unidadFormulacion}</strong>.
        </p>
        <p className="text-xs text-red-600 dark:text-red-400 mt-1.5">
          Verifica las unidades antes de calcular para evitar errores de dosificación.
        </p>
        <div className="mt-2 text-xs text-red-700 dark:text-red-300">
          <span className="font-semibold">Unidades compatibles con {unidadFormulacion}:</span>{' '}
          <span className="font-mono">
            {(CLINICAL_CONSTANTS.compatibilidad[unidadFormulacion] || []).join(', ') || 'No definidas'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componente: Nota clínica ─────────────────────────────────────────────
function NotaClinica({ texto }) {
  if (!texto) return null;
  return (
    <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
      <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
      <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{texto}</p>
    </div>
  );
}

// ─── Componente principal: Farmacia ──────────────────────────────────────────
export default function Farmacia({ pesoKg }) {
  // Catálogo vía TanStack Query (cacheado 1 h; ver useMedicamentos)
  const { data: medicamentos = [], isLoading: cargando, isError } = useMedicamentos();
  const errorApi = isError
    ? 'No se pudo cargar el catálogo de medicamentos. Verifica que el servidor esté activo.'
    : null;

  const [seleccionado, setSeleccionado] = useState(null);
  const [dosis, setDosis] = useState('');
  const [concentracion, setConcentracion] = useState('');
  const [unidadDosis, setUnidadDosis] = useState('mg');
  const [unidadFormulacion, setUnidadFormulacion] = useState('mg/mL');
  const [volumen, setVolumen] = useState(null);

  // ── Al seleccionar medicamento: autocompletar campos ───────────────────────
  function handleSeleccion(e) {
    const id = parseInt(e.target.value, 10);
    const med = medicamentos.find((m) => m.id === id) || null;
    setSeleccionado(med);
    setDosis(med ? (med.dosis_mg_por_kg ?? med.dosis_min_mg_kg ?? '') : '');
    setConcentracion(med ? (med.concentracion_mg_ml ?? '') : '');
    setUnidadDosis('mg');
    setUnidadFormulacion('mg/mL');
    setVolumen(null);
  }

  // ── Validación de compatibilidad ───────────────────────────────────────────
  const compatibilidadStatus = esCompatible(unidadDosis, unidadFormulacion);
  const hayIncompatibilidad = compatibilidadStatus === false;

  // ── Calcular volumen ───────────────────────────────────────────────────────
  function calcular() {
    if (hayIncompatibilidad) return; // bloquear si hay incompatibilidad
    const d = parseFloat(dosis);
    const c = parseFloat(concentracion);
    const p = parseFloat(pesoKg);
    if (!p || !d || !c || c === 0) return;
    setVolumen((p * d) / c);
  }

  // ── Limpiar resultado al cambiar inputs ────────────────────────────────────
  function handleDosisChange(e) {
    setDosis(e.target.value);
    setVolumen(null);
  }

  function handleConcentracionChange(e) {
    setConcentracion(e.target.value);
    setVolumen(null);
  }

  function handleUnidadDosisChange(e) {
    setUnidadDosis(e.target.value);
    setVolumen(null);
  }

  function handleUnidadFormulacionChange(e) {
    setUnidadFormulacion(e.target.value);
    setVolumen(null);
  }

  // ── Agrupar medicamentos por categoría para el <select> ───────────────────
  const categorias = [...new Set(medicamentos.map((m) => m.categoria))].sort();

  const selectCls = 'px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Farmacia — Calculadora de Dosis
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Selecciona un medicamento del catálogo para calcular el volumen a administrar según el peso del paciente.
        </p>
      </div>

      {/* Peso heredado */}
      {pesoKg ? (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300 font-medium w-fit">
          <span>🐾</span>
          <span>Peso del paciente: <strong>{pesoKg} kg</strong></span>
        </div>
      ) : (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-sm text-amber-700 dark:text-amber-300 font-medium w-fit">
          <span>⚠️</span>
          <span>Ingresa el peso del paciente en la barra superior para calcular.</span>
        </div>
      )}

      {/* Estado de carga / error */}
      {cargando && (
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Cargando catálogo de medicamentos…
        </div>
      )}

      {errorApi && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-300">
          ❌ {errorApi}
        </div>
      )}

      {/* Formulario */}
      {!cargando && !errorApi && (
        <div className="flex flex-col gap-5">
          {/* Select de medicamento */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Medicamento
            </label>
            <select
              onChange={handleSeleccion}
              defaultValue=""
              className={selectCls}
            >
              <option value="" disabled>— Selecciona un medicamento —</option>
              {categorias.map((cat) => (
                <optgroup key={cat} label={cat}>
                  {medicamentos
                    .filter((m) => m.categoria === cat)
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} ({m.especie_destino})
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Inputs de dosis y concentración con unidades */}
          <div className="grid grid-cols-2 gap-4">
            {/* Dosis + unidad de dosis */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Dosis
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={dosis}
                  onChange={handleDosisChange}
                  placeholder="Ej. 0.2"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <select
                  value={unidadDosis}
                  onChange={handleUnidadDosisChange}
                  className="px-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  {CLINICAL_CONSTANTS.unidadesDosis.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              {seleccionado?.dosis_min_mg_kg && seleccionado?.dosis_max_mg_kg && (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Rango: {seleccionado.dosis_min_mg_kg} – {seleccionado.dosis_max_mg_kg} mg/kg
                </p>
              )}
            </div>

            {/* Concentración + unidad de formulación */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Concentración
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={concentracion}
                  onChange={handleConcentracionChange}
                  placeholder="Ej. 5"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <select
                  value={unidadFormulacion}
                  onChange={handleUnidadFormulacionChange}
                  className="px-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                >
                  {CLINICAL_CONSTANTS.unidadesFormulacion.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Badge de incompatibilidad de unidades */}
          {hayIncompatibilidad && dosis && concentracion && (
            <BadgeIncompatibilidad
              unidadDosis={unidadDosis}
              unidadFormulacion={unidadFormulacion}
            />
          )}

          {/* Indicador de compatibilidad OK */}
          {compatibilidadStatus === true && dosis && concentracion && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-xs text-green-700 dark:text-green-300 font-semibold">
              <span>✅</span>
              <span>Unidades compatibles: <span className="font-mono">{unidadDosis}</span> con formulación <span className="font-mono">{unidadFormulacion}</span></span>
            </div>
          )}

          {/* Botón calcular — bloqueado si hay incompatibilidad */}
          <button
            onClick={calcular}
            disabled={!pesoKg || !dosis || !concentracion || hayIncompatibilidad}
            title={hayIncompatibilidad ? 'Corrige la incompatibilidad de unidades antes de calcular' : ''}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-150 shadow-sm ${
              hayIncompatibilidad
                ? 'bg-red-200 dark:bg-red-900/40 text-red-700 dark:text-red-400 cursor-not-allowed border-2 border-red-400 dark:border-red-600'
                : 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white'
            }`}
          >
            {hayIncompatibilidad ? '🚫 Incompatibilidad de unidades — Corrige antes de calcular' : 'Calcular volumen'}
          </button>

          {/* Resultado */}
          {volumen !== null && !hayIncompatibilidad && (
            <ResultadoCard
              volumen={volumen}
              medicamento={seleccionado}
              pesoKg={pesoKg}
              dosis={dosis}
              concentracion={concentracion}
              unidadDosis={unidadDosis}
            />
          )}

          {/* Nota clínica del medicamento seleccionado */}
          {seleccionado && <NotaClinica texto={seleccionado.notas_clinicas} />}

          {/* Fórmula de referencia */}
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            Fórmula: <span className="font-mono">(Peso kg × Dosis) ÷ Concentración = Volumen mL</span>
          </p>
        </div>
      )}
    </div>
  );
}
