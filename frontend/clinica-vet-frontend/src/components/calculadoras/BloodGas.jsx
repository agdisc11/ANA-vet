import { useState } from 'react';

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

// ─── Interpretador Ácido-Base ─────────────────────────────────────────────────
function AcidBase() {
  const [ph, setPh] = useState('');
  const [pco2, setPco2] = useState('');
  const [hco3, setHco3] = useState('');
  const [calcular, setCalcular] = useState(false);

  const phV = parseFloat(ph);
  const pco2V = parseFloat(pco2);
  const hco3V = parseFloat(hco3);

  // Rangos normales veterinarios (perro/gato)
  const PH_NORMAL = { min: 7.35, max: 7.45 };
  const PCO2_NORMAL = { min: 35, max: 45 };
  const HCO3_NORMAL = { min: 18, max: 24 };

  function interpretar() {
    if (!phV || !pco2V || !hco3V) return null;

    const acidosis = phV < PH_NORMAL.min;
    const alcalosis = phV > PH_NORMAL.max;
    const pco2Alto = pco2V > PCO2_NORMAL.max;
    const pco2Bajo = pco2V < PCO2_NORMAL.min;
    const hco3Alto = hco3V > HCO3_NORMAL.max;
    const hco3Bajo = hco3V < HCO3_NORMAL.min;

    let trastorno = 'Normal';
    let tipo = '';
    let color = 'green';

    if (acidosis) {
      color = 'red';
      if (pco2Alto && hco3Bajo) { trastorno = 'Acidosis mixta'; tipo = 'Respiratoria + Metabólica'; }
      else if (pco2Alto) { trastorno = 'Acidosis respiratoria'; tipo = hco3Alto ? 'con compensación metabólica' : 'sin compensación'; }
      else if (hco3Bajo) { trastorno = 'Acidosis metabólica'; tipo = pco2Bajo ? 'con compensación respiratoria' : 'sin compensación'; }
      else { trastorno = 'Acidosis'; tipo = 'Evaluar parámetros'; }
    } else if (alcalosis) {
      color = 'blue';
      if (pco2Bajo && hco3Alto) { trastorno = 'Alcalosis mixta'; tipo = 'Respiratoria + Metabólica'; }
      else if (pco2Bajo) { trastorno = 'Alcalosis respiratoria'; tipo = hco3Bajo ? 'con compensación metabólica' : 'sin compensación'; }
      else if (hco3Alto) { trastorno = 'Alcalosis metabólica'; tipo = pco2Alto ? 'con compensación respiratoria' : 'sin compensación'; }
      else { trastorno = 'Alcalosis'; tipo = 'Evaluar parámetros'; }
    }

    return { trastorno, tipo, color, phV, pco2V, hco3V };
  }

  const resultado = calcular ? interpretar() : null;

  const colores = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200',
    red:   'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200',
    blue:  'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200',
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'pH', val: ph, set: setPh, ph: '7.40', min: '6.5', max: '8.0', step: '0.01' },
          { label: 'pCO₂ (mmHg)', val: pco2, set: setPco2, ph: '40', min: '0', max: '120', step: '0.1' },
          { label: 'HCO₃⁻ (mEq/L)', val: hco3, set: setHco3, ph: '22', min: '0', max: '60', step: '0.1' },
        ].map((f) => (
          <div key={f.label} className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{f.label}</label>
            <input type="number" min={f.min} max={f.max} step={f.step} value={f.val}
              onChange={(e) => { f.set(e.target.value); setCalcular(false); }}
              placeholder={f.ph} className={inputCls} />
          </div>
        ))}
      </div>

      {/* Rangos de referencia */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'pH normal', rango: '7.35–7.45' },
          { label: 'pCO₂ normal', rango: '35–45 mmHg' },
          { label: 'HCO₃⁻ normal', rango: '18–24 mEq/L' },
        ].map((r) => (
          <div key={r.label} className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1.5">
            <p className="text-xs text-slate-400 dark:text-slate-500">{r.label}</p>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">{r.rango}</p>
          </div>
        ))}
      </div>

      <button onClick={() => setCalcular(true)} disabled={!ph || !pco2 || !hco3}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold text-sm transition">
        Interpretar gases
      </button>

      {resultado && (
        <div className={`rounded-2xl border p-5 flex flex-col gap-2 ${colores[resultado.color]}`}>
          <p className="font-bold text-lg">{resultado.trastorno}</p>
          {resultado.tipo && <p className="text-sm opacity-80">{resultado.tipo}</p>}
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[
              { label: 'pH', val: resultado.phV, normal: resultado.phV >= 7.35 && resultado.phV <= 7.45 },
              { label: 'pCO₂', val: resultado.pco2V, normal: resultado.pco2V >= 35 && resultado.pco2V <= 45 },
              { label: 'HCO₃⁻', val: resultado.hco3V, normal: resultado.hco3V >= 18 && resultado.hco3V <= 24 },
            ].map((p) => (
              <div key={p.label} className="text-center">
                <p className="text-xs opacity-70">{p.label}</p>
                <p className={`text-base font-bold ${p.normal ? 'opacity-100' : 'underline decoration-2'}`}>{p.val}</p>
                <p className="text-xs opacity-60">{p.normal ? '✓ Normal' : '⚠ Alterado'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Anion Gap ────────────────────────────────────────────────────────────────
function AnionGap() {
  const [na, setNa] = useState('');
  const [cl, setCl] = useState('');
  const [hco3, setHco3] = useState('');

  const naV = parseFloat(na);
  const clV = parseFloat(cl);
  const hco3V = parseFloat(hco3);

  const ag = naV > 0 && clV > 0 && hco3V > 0 ? naV - (clV + hco3V) : null;
  const elevado = ag !== null && ag > 16;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Na⁺ (mEq/L)', val: na, set: setNa, ph: '145' },
          { label: 'Cl⁻ (mEq/L)', val: cl, set: setCl, ph: '110' },
          { label: 'HCO₃⁻ (mEq/L)', val: hco3, set: setHco3, ph: '22' },
        ].map((f) => (
          <div key={f.label} className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{f.label}</label>
            <input type="number" min="0" step="0.1" value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} className={inputCls} />
          </div>
        ))}
      </div>
      {ag !== null && (
        <div className={`rounded-2xl border p-5 ${elevado ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'}`}>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Anion Gap</p>
          <p className={`text-4xl font-extrabold ${elevado ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
            {ag.toFixed(1)} <span className="text-lg font-semibold opacity-70">mEq/L</span>
          </p>
          <p className={`text-sm font-semibold mt-1 ${elevado ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>
            {elevado ? '⚠️ Elevado — Acidosis metabólica con AG alto' : '✅ Normal (8–16 mEq/L)'}
          </p>
          <p className="text-xs font-mono opacity-60 mt-1">{na} − ({cl} + {hco3}) = {ag.toFixed(1)}</p>
        </div>
      )}
      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">Fórmula: Na − (Cl + HCO₃) · Normal: 8–16 mEq/L</p>
    </div>
  );
}

// ─── Déficit de Bicarbonato ───────────────────────────────────────────────────
function DeficitBicarbonato({ pesoKg }) {
  const [hco3Actual, setHco3Actual] = useState('');
  const HCO3_NORMAL = 22;

  const peso = parseFloat(pesoKg);
  const hco3 = parseFloat(hco3Actual);

  const deficit = peso > 0 && hco3 > 0 ? 0.3 * peso * (HCO3_NORMAL - hco3) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5 max-w-xs">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">HCO₃⁻ actual del paciente (mEq/L)</label>
        <input type="number" min="0" step="0.1" value={hco3Actual} onChange={(e) => setHco3Actual(e.target.value)} placeholder="Ej. 12" className={inputCls} />
        <p className="text-xs text-slate-400 dark:text-slate-500">HCO₃ normal de referencia: {HCO3_NORMAL} mEq/L</p>
      </div>
      {deficit !== null && (
        <div className={`rounded-2xl border p-5 ${deficit > 0 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200' : 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200'}`}>
          <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">Déficit de bicarbonato</p>
          <p className="text-4xl font-extrabold">{deficit.toFixed(2)} <span className="text-lg font-semibold opacity-70">mEq</span></p>
          <p className="text-xs font-mono opacity-60 mt-2">0.3 × {pesoKg} kg × ({HCO3_NORMAL} − {hco3Actual})</p>
          {deficit > 0 && <p className="text-xs mt-1 opacity-80">Administrar como NaHCO₃ IV lento. Corregir 50% en las primeras 4–6h.</p>}
        </div>
      )}
      {!pesoKg && <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ Ingresa el peso del paciente en la barra superior.</p>}
      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">Fórmula: 0.3 × Peso × (HCO₃ normal − HCO₃ actual)</p>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function BloodGas({ pesoKg }) {
  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Blood Gas</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Interpretación de gases arteriales y parámetros ácido-base.</p>
      </div>
      {pesoKg && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300 font-medium w-fit">
          <span>🐾</span><span>Peso: <strong>{pesoKg} kg</strong></span>
        </div>
      )}
      <Seccion titulo="Interpretador Ácido-Base" emoji="🔬">
        <AcidBase />
      </Seccion>
      <Seccion titulo="Anion Gap" emoji="⚡">
        <AnionGap />
      </Seccion>
      <Seccion titulo="Déficit de Bicarbonato" emoji="🧪">
        <DeficitBicarbonato pesoKg={pesoKg} />
      </Seccion>
    </div>
  );
}
