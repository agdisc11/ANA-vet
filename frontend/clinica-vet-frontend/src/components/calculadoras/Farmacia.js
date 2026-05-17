import { useState, useEffect } from 'react';
import API from '../../api';

// ─── Sub-componente: Card de resultado ───────────────────────────────────────
function ResultadoCard({ volumen, medicamento, pesoKg, dosis, concentracion }) {
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
        Fórmula: ({pesoKg} kg × {dosis} mg/kg) ÷ {concentracion} mg/mL = {volumen.toFixed(4)} mL
      </p>
      {medicamento?.via_administracion && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Vía recomendada: <strong>{medicamento.via_administracion}</strong>
        </p>
      )}
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
  const [medicamentos, setMedicamentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorApi, setErrorApi] = useState(null);

  const [seleccionado, setSeleccionado] = useState(null);
  const [dosis, setDosis] = useState('');
  const [concentracion, setConcentracion] = useState('');
  const [volumen, setVolumen] = useState(null);

  // ── Fetch al montar ────────────────────────────────────────────────────────
  useEffect(() => {
    setCargando(true);
    API.get('/calculadora/medicamentos')
      .then((res) => {
        setMedicamentos(res.data);
        setErrorApi(null);
      })
      .catch((err) => {
        setErrorApi('No se pudo cargar el catálogo de medicamentos. Verifica que el servidor esté activo.');
        console.error('[Farmacia] Error fetch:', err.message);
      })
      .finally(() => setCargando(false));
  }, []);

  // ── Al seleccionar medicamento: autocompletar campos ───────────────────────
  function handleSeleccion(e) {
    const id = parseInt(e.target.value, 10);
    const med = medicamentos.find((m) => m.id === id) || null;
    setSeleccionado(med);
    setDosis(med ? (med.dosis_mg_por_kg ?? med.dosis_min_mg_kg ?? '') : '');
    setConcentracion(med ? (med.concentracion_mg_ml ?? '') : '');
    setVolumen(null);
  }

  // ── Calcular volumen ───────────────────────────────────────────────────────
  function calcular() {
    const d = parseFloat(dosis);
    const c = parseFloat(concentracion);
    const p = parseFloat(pesoKg);
    if (!p || !d || !c || c === 0) return;
    setVolumen((p * d) / c);
  }

  // ── Agrupar medicamentos por categoría para el <select> ───────────────────
  const categorias = [...new Set(medicamentos.map((m) => m.categoria))].sort();

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
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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

          {/* Inputs de dosis y concentración */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Dosis
                <span className="ml-1 text-xs font-normal text-slate-400">(mg/kg)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={dosis}
                onChange={(e) => { setDosis(e.target.value); setVolumen(null); }}
                placeholder="Ej. 0.2"
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
              {seleccionado?.dosis_min_mg_kg && seleccionado?.dosis_max_mg_kg && (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Rango: {seleccionado.dosis_min_mg_kg} – {seleccionado.dosis_max_mg_kg} mg/kg
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Concentración
                <span className="ml-1 text-xs font-normal text-slate-400">(mg/mL)</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={concentracion}
                onChange={(e) => { setConcentracion(e.target.value); setVolumen(null); }}
                placeholder="Ej. 5"
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>

          {/* Botón calcular */}
          <button
            onClick={calcular}
            disabled={!pesoKg || !dosis || !concentracion}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-150 shadow-sm"
          >
            Calcular volumen
          </button>

          {/* Resultado */}
          {volumen !== null && (
            <ResultadoCard
              volumen={volumen}
              medicamento={seleccionado}
              pesoKg={pesoKg}
              dosis={dosis}
              concentracion={concentracion}
            />
          )}

          {/* Nota clínica del medicamento seleccionado */}
          {seleccionado && <NotaClinica texto={seleccionado.notas_clinicas} />}

          {/* Fórmula de referencia */}
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            Fórmula: <span className="font-mono">(Peso kg × Dosis mg/kg) ÷ Concentración mg/mL = Volumen mL</span>
          </p>
        </div>
      )}
    </div>
  );
}
