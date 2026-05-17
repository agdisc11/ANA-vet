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

// ─── 1. Fluidoterapia con Déficit ─────────────────────────────────────────────
function FluidoterapiaDeficit({ pesoKg }) {
  const [deshPct, setDeshPct] = useState('');
  const [perdidasMl, setPerdidasMl] = useState('');
  const [gotero, setGotero] = useState('20');
  const [calcular, setCalcular] = useState(false);

  const peso = parseFloat(pesoKg);
  const desh = parseFloat(deshPct);
  const perdidas = parseFloat(perdidasMl) || 0;

  const mantenimiento = peso > 0 ? peso * 50 : null;
  const deficit = peso > 0 && desh > 0 ? (desh / 100) * peso * 1000 : 0;
  const total = mantenimiento !== null ? mantenimiento + deficit + perdidas : null;
  const gttMin = total !== null ? (total * parseInt(gotero)) / (24 * 60) : null;
  const mlH = total !== null ? total / 24 : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">% Deshidratación</label>
          <input type="number" min="0" max="15" step="1" value={deshPct} onChange={(e) => { setDeshPct(e.target.value); setCalcular(false); }} placeholder="Ej. 8" className={inputCls} />
          <p className="text-xs text-slate-400 dark:text-slate-500">Leve: 5% · Moderada: 8% · Grave: 12%</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Pérdidas contemporáneas (mL)</label>
          <input type="number" min="0" step="1" value={perdidasMl} onChange={(e) => { setPerdidasMl(e.target.value); setCalcular(false); }} placeholder="Ej. 200" className={inputCls} />
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
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{mantenimiento.toFixed(0)}</p>
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
          <ResultCard titulo="Volumen total / 24h" valor={total} unidad="mL/24h" formula={`Mantenimiento + Déficit + Pérdidas = ${total.toFixed(0)} mL`} color="blue" />
          <div className="grid grid-cols-2 gap-3">
            <ResultCard titulo="Velocidad de infusión" valor={mlH} unidad="mL/h" color="green" />
            <ResultCard titulo={`Goteo (${gotero} gtt/mL)`} valor={gttMin} unidad="gtt/min" color="violet" />
          </div>
        </div>
      )}
      {!pesoKg && <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ Ingresa el peso del paciente en la barra superior.</p>}
      <p className="text-xs text-slate-400 dark:text-slate-500">Mantenimiento: 50 mL/kg/día · Déficit: %desh × peso × 1000</p>
    </div>
  );
}

// ─── 2. CRI Básico ────────────────────────────────────────────────────────────
function CRIBasico({ pesoKg }) {
  const [dosis, setDosis] = useState('');
  const [conc, setConc] = useState('');
  const [unidadDosis, setUnidadDosis] = useState('mcg');

  const peso = parseFloat(pesoKg);
  const d = parseFloat(dosis);
  const c = parseFloat(conc);

  // Velocidad (mL/h) = Dosis (mcg/kg/min) × peso × 60 / Concentración (mcg/mL)
  const velocidad = peso > 0 && d > 0 && c > 0 ? (d * peso * 60) / c : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Dosis ({unidadDosis}/kg/min)</label>
          <input type="number" min="0" step="0.01" value={dosis} onChange={(e) => setDosis(e.target.value)} placeholder="Ej. 5" className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Concentración ({unidadDosis}/mL)</label>
          <input type="number" min="0" step="0.01" value={conc} onChange={(e) => setConc(e.target.value)} placeholder="Ej. 1000" className={inputCls} />
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

// ─── 3. Osmolalidad Sérica ────────────────────────────────────────────────────
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
            <input type="number" min="0" step="0.1" value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} className={inputCls} />
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

// ─── 4. Déficit de Agua Libre ─────────────────────────────────────────────────
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
        <input type="number" min="0" step="0.1" value={naActual} onChange={(e) => setNaActual(e.target.value)} placeholder="Ej. 165" className={inputCls} />
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
      <Seccion titulo="Fluidoterapia con Déficit" emoji="💧">
        <FluidoterapiaDeficit pesoKg={pesoKg} />
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
