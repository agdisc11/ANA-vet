import { useState } from 'react';

// ─── Constantes clínicas inmutables (v3.0) ────────────────────────────────────
const CLINICAL_CONSTANTS = Object.freeze({
  // Factor K para flebotomía terapéutica por especie
  flebotomia: {
    perro: 90,
    gato:  70,
  },
  // Factor para cálculo de transfusión por especie
  transfusion: {
    perro: 90,
    gato:  60,
  },
  // Volumen sanguíneo estimado por especie (mL/kg)
  volumenSanguineo: {
    perro: 85,
    gato:  60,
  },
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

// ─── Selector de especie reutilizable ─────────────────────────────────────────
function SelectorEspecie({ especie, onChange, factorKey }) {
  const factores = CLINICAL_CONSTANTS[factorKey];
  return (
    <div className="flex gap-2">
      {[
        { v: 'perro', l: '🐕 Perro', f: factores.perro },
        { v: 'gato',  l: '🐈 Gato',  f: factores.gato  },
      ].map((e) => (
        <button key={e.v} onClick={() => onChange(e.v)}
          className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all flex flex-col items-center gap-0.5 ${especie === e.v ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
          <span>{e.l}</span>
          <span className="text-xs font-normal opacity-70">K = {e.f}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Transfusión ──────────────────────────────────────────────────────────────
function Transfusion({ pesoKg }) {
  const [especie, setEspecie] = useState('perro');
  const [hctActual, setHctActual] = useState('');
  const [hctDeseado, setHctDeseado] = useState('');
  const [hctDonador, setHctDonador] = useState('');

  const peso = parseFloat(pesoKg);
  const hctA = parseFloat(hctActual);
  const hctD = parseFloat(hctDeseado);
  const hctDon = parseFloat(hctDonador);
  const factor = CLINICAL_CONSTANTS.transfusion[especie];

  const volumen = peso > 0 && hctA > 0 && hctD > 0 && hctDon > 0
    ? (peso * (hctD - hctA) * factor) / hctDon
    : null;

  function handleChange(setter) {
    return (e) => {
      setter(e.target.value);
    };
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Especie */}
      <SelectorEspecie especie={especie} onChange={(v) => { setEspecie(v); }} factorKey="transfusion" />

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Hct actual (%)', val: hctActual, set: setHctActual, ph: 'Ej. 18' },
          { label: 'Hct deseado (%)', val: hctDeseado, set: setHctDeseado, ph: 'Ej. 30' },
          { label: 'Hct donador (%)', val: hctDonador, set: setHctDonador, ph: 'Ej. 45' },
        ].map((f) => (
          <div key={f.label} className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{f.label}</label>
            <input type="number" min="0" max="100" step="1" value={f.val}
              onChange={handleChange(f.set)} placeholder={f.ph} className={inputCls} />
          </div>
        ))}
      </div>

      {volumen !== null && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-red-500 dark:text-red-400 mb-1">Volumen de sangre a transfundir</p>
          <p className="text-5xl font-extrabold text-red-700 dark:text-red-300 leading-none">
            {volumen.toFixed(1)}
            <span className="text-2xl font-semibold ml-2">mL</span>
          </p>
          <p className="text-xs font-mono text-red-600 dark:text-red-400 mt-3 opacity-70">
            {pesoKg} kg × ({hctDeseado} − {hctActual}) × {factor} ÷ {hctDonador} = {volumen.toFixed(1)} mL
          </p>
          <p className="text-xs text-red-700 dark:text-red-300 mt-1 opacity-80">
            Administrar a 5–10 mL/kg/h. Monitorear FC, FR y temperatura durante la transfusión.
          </p>
        </div>
      )}

      {!pesoKg && <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ Ingresa el peso del paciente en la barra superior.</p>}
      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
        Fórmula: Peso × (Hct deseado − Hct actual) × Factor ÷ Hct donador
      </p>
    </div>
  );
}

// ─── Flebotomía Terapéutica ───────────────────────────────────────────────────
function Flebotomia({ pesoKg }) {
  const [especie, setEspecie] = useState('perro');
  const [pcvActual, setPcvActual] = useState('');
  const [pcvDeseado, setPcvDeseado] = useState('');

  const peso = parseFloat(pesoKg);
  const pcvA = parseFloat(pcvActual);
  const pcvD = parseFloat(pcvDeseado);
  const K = CLINICAL_CONSTANTS.flebotomia[especie];

  // Validación: PCV deseado debe ser menor al actual
  const pcvError = pcvA > 0 && pcvD > 0 && pcvD >= pcvA
    ? 'El PCV deseado debe ser menor al PCV actual.'
    : null;

  // Fórmula: Volumen (mL) = pesoKg × K × ((PCV actual - PCV deseado) / PCV actual)
  const volumen = peso > 0 && pcvA > 0 && pcvD > 0 && pcvD < pcvA
    ? peso * K * ((pcvA - pcvD) / pcvA)
    : null;

  function handlePcvActual(e) {
    setPcvActual(e.target.value);
    setPcvDeseado(''); // limpiar PCV deseado al cambiar el actual
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Especie */}
      <SelectorEspecie especie={especie} onChange={(v) => { setEspecie(v); setPcvActual(''); setPcvDeseado(''); }} factorKey="flebotomia" />

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">PCV actual (%)</label>
          <input type="number" min="0" max="100" step="1" value={pcvActual}
            onChange={handlePcvActual}
            placeholder="Ej. 65" className={inputCls} />
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Normal: Perro 37–55% · Gato 30–45%
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">PCV deseado (%)</label>
          <input type="number" min="0" max="100" step="1" value={pcvDeseado}
            onChange={(e) => setPcvDeseado(e.target.value)}
            placeholder="Ej. 50"
            className={`${inputCls} ${pcvError ? 'border-red-400 dark:border-red-600 focus:ring-red-500' : ''}`}
            disabled={!pcvActual} />
          {pcvError && (
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold">⚠️ {pcvError}</p>
          )}
        </div>
      </div>

      {/* Resultado */}
      {volumen !== null && !pcvError && (
        <div className="rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-400 mb-1">
            Volumen a extraer (Flebotomía)
          </p>
          <p className="text-5xl font-extrabold text-violet-700 dark:text-violet-300 leading-none">
            {volumen.toFixed(1)}
            <span className="text-2xl font-semibold ml-2">mL</span>
          </p>
          <p className="text-xs font-mono text-violet-600 dark:text-violet-400 mt-3 opacity-70">
            {pesoKg} kg × {K} × (({pcvActual} − {pcvDeseado}) ÷ {pcvActual}) = {volumen.toFixed(1)} mL
          </p>
          <div className="mt-3 p-3 rounded-xl bg-violet-100 dark:bg-violet-900/40 border border-violet-200 dark:border-violet-700">
            <p className="text-xs text-violet-700 dark:text-violet-300 font-semibold">
              📋 Recomendaciones clínicas:
            </p>
            <ul className="text-xs text-violet-600 dark:text-violet-400 mt-1 space-y-0.5 list-disc list-inside">
              <li>Extraer en sesiones de máx. 10–15 mL/kg por evento</li>
              <li>Reemplazar con solución isotónica si el volumen es grande</li>
              <li>Monitorear FC, PA y mucosas durante el procedimiento</li>
              <li>Reevaluar PCV a las 24–48h post-flebotomía</li>
            </ul>
          </div>
        </div>
      )}

      {/* Indicador de validación en tiempo real */}
      {pcvA > 0 && pcvD > 0 && !pcvError && pcvD < pcvA && (
        <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
          <span>✅</span>
          <span>PCV deseado válido: {pcvD}% &lt; PCV actual: {pcvA}%</span>
        </div>
      )}

      {!pesoKg && <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ Ingresa el peso del paciente en la barra superior.</p>}
      <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
        Fórmula: Peso × K × ((PCV actual − PCV deseado) ÷ PCV actual) · K: Perro={CLINICAL_CONSTANTS.flebotomia.perro}, Gato={CLINICAL_CONSTANTS.flebotomia.gato}
      </p>
    </div>
  );
}

// ─── Volumen Sanguíneo Estimado ───────────────────────────────────────────────
function VolumenSanguineo({ pesoKg }) {
  const [especie, setEspecie] = useState('perro');
  const peso = parseFloat(pesoKg);
  const factor = CLINICAL_CONSTANTS.volumenSanguineo[especie];
  const volTotal = peso > 0 ? peso * factor : null;
  const maxPerdida = volTotal ? volTotal * 0.15 : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {[
          { v: 'perro', l: `🐕 Perro (${CLINICAL_CONSTANTS.volumenSanguineo.perro} mL/kg)` },
          { v: 'gato',  l: `🐈 Gato (${CLINICAL_CONSTANTS.volumenSanguineo.gato} mL/kg)` },
        ].map((e) => (
          <button key={e.v} onClick={() => setEspecie(e.v)}
            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${especie === e.v ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
            {e.l}
          </button>
        ))}
      </div>

      {volTotal !== null ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1">Volumen sanguíneo total estimado</p>
            <p className="text-5xl font-extrabold text-blue-700 dark:text-blue-300 leading-none">
              {volTotal.toFixed(0)}
              <span className="text-2xl font-semibold ml-2">mL</span>
            </p>
            <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-3 opacity-70">
              {pesoKg} kg × {factor} mL/kg = {volTotal.toFixed(0)} mL
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pérdida máx. segura (15%)', valor: maxPerdida, color: 'text-green-700 dark:text-green-300' },
              { label: 'Pérdida moderada (20%)', valor: volTotal * 0.20, color: 'text-amber-700 dark:text-amber-300' },
              { label: 'Pérdida grave (30%)', valor: volTotal * 0.30, color: 'text-red-700 dark:text-red-300' },
            ].map((p) => (
              <div key={p.label} className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1 leading-tight">{p.label}</p>
                <p className={`text-lg font-bold ${p.color}`}>{p.valor.toFixed(0)}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">mL</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ Ingresa el peso del paciente en la barra superior.</p>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Referencia: Perro {CLINICAL_CONSTANTS.volumenSanguineo.perro} mL/kg · Gato {CLINICAL_CONSTANTS.volumenSanguineo.gato} mL/kg · Pérdida &gt;15% requiere soporte transfusional.
      </p>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Hematologia({ pesoKg }) {
  const [subPantalla, setSubPantalla] = useState('transfusion'); // 'transfusion' | 'flebotomia'

  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Hematología</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Calculadoras de transfusión, flebotomía y volumen sanguíneo veterinario.</p>
      </div>
      {pesoKg && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300 font-medium w-fit">
          <span>🐾</span><span>Peso: <strong>{pesoKg} kg</strong></span>
        </div>
      )}

      {/* ── Selector de sub-pantalla: Transfusión / Flebotomía ─────────────── */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        {[
          { id: 'transfusion', label: '🩸 Transfusión Sanguínea' },
          { id: 'flebotomia',  label: '💉 Flebotomía Terapéutica' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubPantalla(tab.id)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
              subPantalla === tab.id
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Contenido de la sub-pantalla activa ─────────────────────────────── */}
      {subPantalla === 'transfusion' && (
        <Seccion titulo="Cálculo de Transfusión Sanguínea" emoji="🩸">
          <Transfusion pesoKg={pesoKg} />
        </Seccion>
      )}

      {subPantalla === 'flebotomia' && (
        <Seccion titulo="Flebotomía Terapéutica" emoji="💉">
          <Flebotomia pesoKg={pesoKg} />
        </Seccion>
      )}

      {/* ── Volumen sanguíneo siempre visible ───────────────────────────────── */}
      <Seccion titulo="Volumen Sanguíneo Estimado" emoji="🔬">
        <VolumenSanguineo pesoKg={pesoKg} />
      </Seccion>
    </div>
  );
}
