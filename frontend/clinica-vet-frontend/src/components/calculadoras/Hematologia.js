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
  const factor = especie === 'perro' ? 90 : 60;

  const volumen = peso > 0 && hctA > 0 && hctD > 0 && hctDon > 0
    ? (peso * (hctD - hctA) * factor) / hctDon
    : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Especie */}
      <div className="flex gap-2">
        {[{ v: 'perro', l: '🐕 Perro (factor 90)', f: 90 }, { v: 'gato', l: '🐈 Gato (factor 60)', f: 60 }].map((e) => (
          <button key={e.v} onClick={() => setEspecie(e.v)}
            className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${especie === e.v ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
            {e.l}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Hct actual (%)', val: hctActual, set: setHctActual, ph: 'Ej. 18' },
          { label: 'Hct deseado (%)', val: hctDeseado, set: setHctDeseado, ph: 'Ej. 30' },
          { label: 'Hct donador (%)', val: hctDonador, set: setHctDonador, ph: 'Ej. 45' },
        ].map((f) => (
          <div key={f.label} className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{f.label}</label>
            <input type="number" min="0" max="100" step="1" value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph} className={inputCls} />
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

// ─── Volumen Sanguíneo Estimado ───────────────────────────────────────────────
function VolumenSanguineo({ pesoKg }) {
  const [especie, setEspecie] = useState('perro');
  const peso = parseFloat(pesoKg);
  const factor = especie === 'perro' ? 85 : 60;
  const volTotal = peso > 0 ? peso * factor : null;
  const maxPerdida = volTotal ? volTotal * 0.15 : null; // 15% = límite seguro

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {[{ v: 'perro', l: '🐕 Perro (85 mL/kg)' }, { v: 'gato', l: '🐈 Gato (60 mL/kg)' }].map((e) => (
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
        Referencia: Perro 85 mL/kg · Gato 60 mL/kg · Pérdida &gt;15% requiere soporte transfusional.
      </p>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Hematologia({ pesoKg }) {
  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Hematología</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Calculadoras de transfusión y volumen sanguíneo veterinario.</p>
      </div>
      {pesoKg && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300 font-medium w-fit">
          <span>🐾</span><span>Peso: <strong>{pesoKg} kg</strong></span>
        </div>
      )}
      <Seccion titulo="Cálculo de Transfusión Sanguínea" emoji="🩸">
        <Transfusion pesoKg={pesoKg} />
      </Seccion>
      <Seccion titulo="Volumen Sanguíneo Estimado" emoji="💉">
        <VolumenSanguineo pesoKg={pesoKg} />
      </Seccion>
    </div>
  );
}
