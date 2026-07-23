import { useState } from 'react';

// ─── Constantes clínicas inmutables (v3.0) ────────────────────────────────────
const CLINICAL_CONSTANTS = Object.freeze({
  // Tasa de mantenimiento por especie (mL/kg/día)
  mantenimiento: {
    perro: 60,  // (pesoKg * 60) / 24 mL/h
    gato:  45,  // (pesoKg * 45) / 24 mL/h
  },
  // Tabla de suplementación de potasio sérico
  potasio: [
    { min: 3.5,  max: Infinity, label: '≥ 3.5',      supl: 0,  descripcion: 'Normal — sin suplementación' },
    { min: 3.0,  max: 3.5,     label: '3.0 – 3.5',   supl: 14, descripcion: 'Hipocalemia leve' },
    { min: 2.5,  max: 3.0,     label: '2.5 – 3.0',   supl: 28, descripcion: 'Hipocalemia moderada' },
    { min: 2.0,  max: 2.5,     label: '2.0 – 2.5',   supl: 40, descripcion: 'Hipocalemia severa' },
    { min: -Infinity, max: 2.0, label: '< 2.0',      supl: 80, descripcion: 'Hipocalemia crítica' },
  ],
  // Umbral de seguridad de infusión de K+
  kMaxRate: 0.5, // mEq/kg/h — por encima de este valor: riesgo de paro cardíaco
});

const inputCls = 'px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

function Seccion({ titulo, emoji, children }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
        <span className="text-lg">{emoji}</span>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">{titulo}</h3>
      </div>
      {children}
    </div>
  );
}

function ResultCard({ titulo, valor, unidad, formula, color = 'blue' }) {
  const cols = {
    blue:   'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300',
    green:  'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300',
    violet: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300',
    amber:  'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300',
  };
  return (
    <div className={`rounded-2xl border p-5 ${cols[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">{titulo}</p>
      <p className="text-4xl font-extrabold leading-none">
        {typeof valor === 'number' ? valor.toFixed(2) : valor}
        <span className="text-lg font-semibold ml-2 opacity-70">{unidad}</span>
      </p>
      {formula && <p className="text-xs font-mono opacity-60 mt-2">{formula}</p>}
    </div>
  );
}

// ─── Modal de advertencia de K+ crítico ──────────────────────────────────────
function ModalKCritico({ tasa, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay rojo parpadeante */}
      <div className="absolute inset-0 bg-red-900/70 animate-pulse" />
      {/* Card de advertencia */}
      <div className="relative z-10 max-w-md w-full rounded-2xl bg-white dark:bg-slate-900 border-4 border-red-500 shadow-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl animate-pulse">🚨</span>
          <div>
            <h3 className="text-lg font-extrabold text-red-700 dark:text-red-400">
              ¡ALERTA DE SEGURIDAD CRÍTICA!
            </h3>
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold">
              Riesgo de PARO CARDÍACO
            </p>
          </div>
        </div>
        <div className="rounded-xl bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 p-4">
          <p className="text-sm font-bold text-red-800 dark:text-red-200 mb-2">
            La tasa de infusión de K⁺ calculada supera el límite seguro:
          </p>
          <p className="text-3xl font-extrabold text-red-700 dark:text-red-300 font-mono">
            {tasa.toFixed(3)} <span className="text-base font-semibold">mEq/kg/h</span>
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            Límite máximo seguro: <strong>0.5 mEq/kg/h</strong>
          </p>
        </div>
        <div className="text-sm text-slate-700 dark:text-slate-300 space-y-1">
          <p>⚠️ Tasas &gt; 0.5 mEq/kg/h pueden causar:</p>
          <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 space-y-0.5 ml-2">
            <li>Arritmias ventriculares graves</li>
            <li>Fibrilación ventricular</li>
            <li>Paro cardíaco</li>
          </ul>
        </div>
        <p className="text-xs font-semibold text-red-700 dark:text-red-400">
          Reduce la concentración de K⁺ en la solución o disminuye la velocidad de infusión antes de continuar.
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition"
        >
          Entendido — Revisar parámetros
        </button>
      </div>
    </div>
  );
}

// ─── 1. Fluidoterapia con Déficit (por especie) ───────────────────────────────
function FluidoterapiaDeficit({ pesoKg }) {
  const [especie, setEspecie] = useState('perro');
  const [deshPct, setDeshPct] = useState('');
  const [perdidasMl, setPerdidasMl] = useState('');
  const [gotero, setGotero] = useState('20');
  const [calcular, setCalcular] = useState(false);

  const peso = parseFloat(pesoKg);
  const desh = parseFloat(deshPct);
  const perdidas = parseFloat(perdidasMl) || 0;

  // Tasa de mantenimiento por especie (v3.0)
  const factorEspecie = CLINICAL_CONSTANTS.mantenimiento[especie];
  const mantenimientoMlH = peso > 0 ? (peso * factorEspecie) / 24 : null;
  const mantenimiento24h = mantenimientoMlH !== null ? mantenimientoMlH * 24 : null;

  // Déficit: pesoKg * % Deshidratación * 10 (v3.0)
  const deficit = peso > 0 && desh > 0 ? peso * desh * 10 : 0;

  const total = mantenimiento24h !== null ? mantenimiento24h + deficit + perdidas : null;
  const gttMin = total !== null ? (total * parseInt(gotero)) / (24 * 60) : null;
  const mlH = total !== null ? total / 24 : null;

  // function handleReset() {
  //   setDeshPct('');
  //   setPerdidasMl('');
  //   setCalcular(false);
  // }

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de especie */}
      <div className="flex gap-2">
        {[
          { v: 'perro', l: '🐕 Perro', sub: `${CLINICAL_CONSTANTS.mantenimiento.perro} mL/kg/día` },
          { v: 'gato',  l: '🐈 Gato',  sub: `${CLINICAL_CONSTANTS.mantenimiento.gato} mL/kg/día` },
        ].map((e) => (
          <button key={e.v} onClick={() => { setEspecie(e.v); setCalcular(false); }}
            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all flex flex-col items-center gap-0.5 ${especie === e.v ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
            <span>{e.l}</span>
            <span className="text-xs font-normal opacity-70">{e.sub}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">% Deshidratación</label>
          <input type="number" min="0" max="15" step="1" value={deshPct}
            onChange={(e) => { setDeshPct(e.target.value); setCalcular(false); }}
            placeholder="Ej. 8" className={inputCls} />
          <p className="text-xs text-slate-400 dark:text-slate-500">Leve: 5% · Moderada: 8% · Grave: 12%</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Pérdidas contemporáneas (mL)</label>
          <input type="number" min="0" step="1" value={perdidasMl}
            onChange={(e) => { setPerdidasMl(e.target.value); setCalcular(false); }}
            placeholder="Ej. 200" className={inputCls} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Tipo de gotero</label>
        <div className="flex gap-2">
          {[{ v: '20', l: 'Normogotero (20 gtt/mL)' }, { v: '60', l: 'Microgotero (60 gtt/mL)' }].map((g) => (
            <button key={g.v} onClick={() => setGotero(g.v)}
              className={`flex-1 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${gotero === g.v ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
              {g.l}
            </button>
          ))}
        </div>
      </div>

      <button onClick={() => setCalcular(true)} disabled={!pesoKg}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold text-sm transition">
        Calcular fluidoterapia
      </button>

      {calcular && total !== null && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Mantenimiento</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{mantenimiento24h.toFixed(0)}</p>
              <p className="text-xs text-slate-400">mL/24h</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Déficit</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{deficit.toFixed(0)}</p>
              <p className="text-xs text-slate-400">mL</p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Pérdidas</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{perdidas.toFixed(0)}</p>
              <p className="text-xs text-slate-400">mL</p>
            </div>
          </div>
          <ResultCard titulo="Volumen total / 24h" valor={total} unidad="mL/24h"
            formula={`Mantenimiento (${mantenimiento24h.toFixed(0)}) + Déficit (${deficit.toFixed(0)}) + Pérdidas (${perdidas.toFixed(0)}) = ${total.toFixed(0)} mL`}
            color="blue" />
          <div className="grid grid-cols-2 gap-3">
            <ResultCard titulo="Velocidad de infusión" valor={mlH} unidad="mL/h" color="green" />
            <ResultCard titulo={`Goteo (${gotero} gtt/mL)`} valor={gttMin} unidad="gtt/min" color="violet" />
          </div>
        </div>
      )}

      {!pesoKg && <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ Ingresa el peso del paciente en la barra superior.</p>}
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Mantenimiento: Perro {CLINICAL_CONSTANTS.mantenimiento.perro} mL/kg/día · Gato {CLINICAL_CONSTANTS.mantenimiento.gato} mL/kg/día · Déficit: %desh × peso × 10
      </p>
    </div>
  );
}

// ─── 2. Suplementación de Potasio e Infusión Crítica ─────────────────────────
function SuplementacionPotasio({ pesoKg }) {
  const [kSerico, setKSerico] = useState('');
  const [rateMlH, setRateMlH] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);

  const peso = parseFloat(pesoKg);
  const kVal = parseFloat(kSerico);
  const rate = parseFloat(rateMlH);

  // Determinar fila de la tabla de K+
  const filaK = !isNaN(kVal) && kVal > 0
    ? CLINICAL_CONSTANTS.potasio.find((f) => kVal >= f.min && kVal < f.max) || null
    : null;

  const mEqPerL = filaK ? filaK.supl : null;

  // Tasa de infusión de K+ (mEq/kg/h)
  // = (mEq_per_L * Rate_mL_h) / (1000 * pesoKg)
  const tasaKgH = mEqPerL !== null && !isNaN(rate) && rate > 0 && peso > 0
    ? (mEqPerL * rate) / (1000 * peso)
    : null;

  const esCritico = tasaKgH !== null && tasaKgH > CLINICAL_CONSTANTS.kMaxRate;

  function handleRateChange(e) {
    setRateMlH(e.target.value);
    // Si la nueva tasa es crítica, mostrar modal automáticamente
    const newRate = parseFloat(e.target.value);
    if (mEqPerL !== null && !isNaN(newRate) && newRate > 0 && peso > 0) {
      const newTasa = (mEqPerL * newRate) / (1000 * peso);
      if (newTasa > CLINICAL_CONSTANTS.kMaxRate) {
        setMostrarModal(true);
      }
    }
  }

  function handleKChange(e) {
    setKSerico(e.target.value);
    setRateMlH('');
  }

  return (
    <>
      {mostrarModal && tasaKgH !== null && (
        <ModalKCritico tasa={tasaKgH} onClose={() => setMostrarModal(false)} />
      )}

      <div className="flex flex-col gap-4">
        {/* Input K+ sérico */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">K⁺ sérico (mEq/L)</label>
            <input type="number" min="0" max="10" step="0.1" value={kSerico}
              onChange={handleKChange}
              placeholder="Ej. 2.8" className={inputCls} />
            <p className="text-xs text-slate-400 dark:text-slate-500">Normal: 3.5 – 5.0 mEq/L</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Velocidad de infusión (mL/h)</label>
            <input type="number" min="0" step="0.1" value={rateMlH}
              onChange={handleRateChange}
              placeholder="Ej. 50" className={inputCls}
              disabled={!filaK || filaK.supl === 0} />
            <p className="text-xs text-slate-400 dark:text-slate-500">Para calcular tasa de K⁺</p>
          </div>
        </div>

        {/* Tabla de rangos de K+ */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="px-3 py-2 text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">K⁺ sérico</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Suplementación</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Clasificación</th>
              </tr>
            </thead>
            <tbody>
              {CLINICAL_CONSTANTS.potasio.map((f) => {
                const isActive = filaK && filaK.label === f.label;
                return (
                  <tr key={f.label}
                    className={`border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors ${
                      isActive
                        ? f.supl >= 40 ? 'bg-red-50 dark:bg-red-900/20' : f.supl >= 14 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-green-50 dark:bg-green-900/20'
                        : ''
                    }`}>
                    <td className={`px-3 py-2 font-mono font-semibold ${isActive ? (f.supl >= 40 ? 'text-red-700 dark:text-red-300' : f.supl >= 14 ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300') : 'text-slate-700 dark:text-slate-300'}`}>
                      {f.label} mEq/L
                    </td>
                    <td className={`px-3 py-2 text-center font-bold font-mono ${isActive ? (f.supl >= 40 ? 'text-red-700 dark:text-red-300' : f.supl >= 14 ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300') : 'text-slate-600 dark:text-slate-400'}`}>
                      {f.supl} mEq/L
                    </td>
                    <td className={`px-3 py-2 ${isActive ? (f.supl >= 40 ? 'text-red-600 dark:text-red-400' : f.supl >= 14 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400') : 'text-slate-500 dark:text-slate-400'}`}>
                      {f.descripcion}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Resultado de suplementación */}
        {filaK && (
          <div className={`rounded-2xl border p-5 flex flex-col gap-2 ${
            filaK.supl === 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' :
            filaK.supl >= 40 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700' :
            'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
          }`}>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${
              filaK.supl === 0 ? 'text-green-600 dark:text-green-400' :
              filaK.supl >= 40 ? 'text-red-600 dark:text-red-400' :
              'text-amber-600 dark:text-amber-400'
            }`}>
              Suplementación recomendada
            </p>
            <p className={`text-4xl font-extrabold leading-none ${
              filaK.supl === 0 ? 'text-green-700 dark:text-green-300' :
              filaK.supl >= 40 ? 'text-red-700 dark:text-red-300' :
              'text-amber-700 dark:text-amber-300'
            }`}>
              {filaK.supl}
              <span className="text-lg font-semibold ml-2 opacity-70">mEq/L</span>
            </p>
            <p className={`text-sm font-medium ${
              filaK.supl === 0 ? 'text-green-700 dark:text-green-300' :
              filaK.supl >= 40 ? 'text-red-700 dark:text-red-300' :
              'text-amber-700 dark:text-amber-300'
            }`}>
              {filaK.descripcion}
            </p>
          </div>
        )}

        {/* Tasa de infusión de K+ */}
        {tasaKgH !== null && (
          <div className={`rounded-2xl border p-5 flex flex-col gap-2 ${
            esCritico
              ? 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600 animate-pulse'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}>
            <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${esCritico ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
              Tasa de infusión de K⁺
            </p>
            <p className={`text-4xl font-extrabold leading-none ${esCritico ? 'text-red-700 dark:text-red-300' : 'text-slate-800 dark:text-slate-100'}`}>
              {tasaKgH.toFixed(4)}
              <span className="text-lg font-semibold ml-2 opacity-70">mEq/kg/h</span>
            </p>
            <p className="text-xs font-mono opacity-60 mt-1">
              ({mEqPerL} mEq/L × {rateMlH} mL/h) ÷ (1000 × {pesoKg} kg)
            </p>
            {esCritico ? (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-red-500 text-lg">🚨</span>
                <p className="text-sm font-bold text-red-700 dark:text-red-300">
                  SUPERA EL LÍMITE SEGURO (0.5 mEq/kg/h) — Riesgo de paro cardíaco
                </p>
              </div>
            ) : (
              <p className="text-xs text-green-700 dark:text-green-300 font-semibold mt-1">
                ✅ Dentro del límite seguro (&lt; 0.5 mEq/kg/h)
              </p>
            )}
          </div>
        )}

        {!pesoKg && <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ Ingresa el peso del paciente en la barra superior.</p>}
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Tasa máxima segura de K⁺: 0.5 mEq/kg/h · Fuente: v3.0 Clinical Fluid Therapy Reference
        </p>
      </div>
    </>
  );
}

// ─── 3. CRI Básico ────────────────────────────────────────────────────────────
function CRIBasico({ pesoKg }) {
  const [dosis, setDosis] = useState('');
  const [conc, setConc] = useState('');
  const [unidadDosis, setUnidadDosis] = useState('mcg');

  const peso = parseFloat(pesoKg);
  const d = parseFloat(dosis);
  const c = parseFloat(conc);

  const velocidad = peso > 0 && d > 0 && c > 0 ? (d * peso * 60) / c : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Dosis ({unidadDosis}/kg/min)</label>
          <input type="number" min="0" step="0.01" value={dosis}
            onChange={(e) => setDosis(e.target.value)} placeholder="Ej. 5" className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Concentración ({unidadDosis}/mL)</label>
          <input type="number" min="0" step="0.01" value={conc}
            onChange={(e) => setConc(e.target.value)} placeholder="Ej. 1000" className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Unidad</label>
          <select value={unidadDosis} onChange={(e) => setUnidadDosis(e.target.value)} className={inputCls}>
            <option value="mcg">mcg (μg)</option>
            <option value="mg">mg</option>
          </select>
        </div>
      </div>
      {velocidad !== null && (
        <ResultCard titulo="Velocidad de infusión CRI" valor={velocidad} unidad="mL/h"
          formula={`${dosis} ${unidadDosis}/kg/min × ${pesoKg} kg × 60 ÷ ${conc} ${unidadDosis}/mL`} color="violet" />
      )}
      {!pesoKg && <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ Ingresa el peso del paciente en la barra superior.</p>}
      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">Fórmula: Dosis × Peso × 60 ÷ Concentración = mL/h</p>
    </div>
  );
}

// ─── 4. Osmolalidad Sérica ────────────────────────────────────────────────────
function Osmolalidad() {
  const [na, setNa] = useState('');
  const [glu, setGlu] = useState('');
  const [bun, setBun] = useState('');

  const naV = parseFloat(na);
  const gluV = parseFloat(glu);
  const bunV = parseFloat(bun);

  const osm = naV > 0 && gluV > 0 && bunV > 0
    ? 2 * naV + gluV / 18 + bunV / 2.8
    : null;

  const interpretacion = osm === null ? null
    : osm < 280 ? { label: 'Hipoosmolar', color: 'blue' }
    : osm > 310 ? { label: 'Hiperosmolar', color: 'red' }
    : { label: 'Normal (280–310 mOsm/kg)', color: 'green' };

  const colText = { blue: 'text-blue-700 dark:text-blue-300', red: 'text-red-700 dark:text-red-300', green: 'text-green-700 dark:text-green-300' };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Na⁺ (mEq/L)', val: na, set: setNa, ph: '145' },
          { label: 'Glucosa (mg/dL)', val: glu, set: setGlu, ph: '90' },
          { label: 'BUN (mg/dL)', val: bun, set: setBun, ph: '20' },
        ].map((f) => (
          <div key={f.label} className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{f.label}</label>
            <input type="number" min="0" step="0.1" value={f.val}
              onChange={(e) => f.set(e.target.value)} placeholder={f.ph} className={inputCls} />
          </div>
        ))}
      </div>
      {osm !== null && (
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">Osmolalidad sérica calculada</p>
          <p className={`text-4xl font-extrabold ${colText[interpretacion.color]}`}>
            {osm.toFixed(1)} <span className="text-lg font-semibold opacity-70">mOsm/kg</span>
          </p>
          <p className={`text-sm font-semibold mt-2 ${colText[interpretacion.color]}`}>{interpretacion.label}</p>
          <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-1">2×{na} + {glu}/18 + {bun}/2.8</p>
        </div>
      )}
      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">Fórmula: 2×Na + Glucosa/18 + BUN/2.8 · Normal: 280–310 mOsm/kg</p>
    </div>
  );
}

// ─── 5. Déficit de Agua Libre ─────────────────────────────────────────────────
function DeficitAguaLibre({ pesoKg }) {
  const [naActual, setNaActual] = useState('');
  const NA_NORMAL = 145;

  const peso = parseFloat(pesoKg);
  const na = parseFloat(naActual);

  const deficit = peso > 0 && na > 0 ? 0.6 * peso * (na / NA_NORMAL - 1) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5 max-w-xs">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Na⁺ actual del paciente (mEq/L)</label>
        <input type="number" min="0" step="0.1" value={naActual}
          onChange={(e) => setNaActual(e.target.value)} placeholder="Ej. 165" className={inputCls} />
        <p className="text-xs text-slate-400 dark:text-slate-500">Na normal de referencia: {NA_NORMAL} mEq/L</p>
      </div>
      {deficit !== null && (
        <ResultCard titulo="Déficit de agua libre" valor={deficit} unidad="L"
          formula={`0.6 × ${pesoKg} kg × (${naActual} ÷ ${NA_NORMAL} − 1) = ${deficit.toFixed(3)} L`}
          color={deficit > 0 ? 'amber' : 'green'} />
      )}
      {!pesoKg && <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ Ingresa el peso del paciente en la barra superior.</p>}
      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">Fórmula: 0.6 × Peso × (Na actual ÷ Na normal − 1)</p>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Fluidos({ pesoKg }) {
  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Fluidos</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Calculadoras de fluidoterapia, CRI y parámetros osmóticos.</p>
      </div>
      {pesoKg && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300 font-medium w-fit">
          <span>🐾</span><span>Peso: <strong>{pesoKg} kg</strong></span>
        </div>
      )}
      <Seccion titulo="Fluidoterapia con Déficit (por Especie)" emoji="💧">
        <FluidoterapiaDeficit pesoKg={pesoKg} />
      </Seccion>
      <Seccion titulo="Suplementación de Potasio (K⁺) e Infusión Crítica" emoji="⚡">
        <SuplementacionPotasio pesoKg={pesoKg} />
      </Seccion>
      <Seccion titulo="CRI — Constant Rate Infusion" emoji="⏱️">
        <CRIBasico pesoKg={pesoKg} />
      </Seccion>
      <Seccion titulo="Osmolalidad Sérica" emoji="🧪">
        <Osmolalidad />
      </Seccion>
      <Seccion titulo="Déficit de Agua Libre" emoji="🫗">
        <DeficitAguaLibre pesoKg={pesoKg} />
      </Seccion>
    </div>
  );
}
