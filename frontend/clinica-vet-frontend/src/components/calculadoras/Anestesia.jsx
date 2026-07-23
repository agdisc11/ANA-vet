import { useState } from 'react';

// ─── Datos ASA ────────────────────────────────────────────────────────────────
const ASA_NIVELES = [
  {
    nivel: 'I',
    label: 'Paciente sano',
    color: 'green',
    criterios: 'Sin enfermedad sistémica. Procedimiento electivo. Ej: castración en animal joven y sano.',
    riesgo: 'Mínimo',
    recomendacion: 'Protocolo estándar. Sin precauciones especiales.',
  },
  {
    nivel: 'II',
    label: 'Enfermedad sistémica leve',
    color: 'lime',
    criterios: 'Enfermedad sistémica leve sin limitación funcional. Ej: obesidad leve, cachorro/geriátrico, fractura sin shock.',
    riesgo: 'Bajo',
    recomendacion: 'Monitoreo estándar. Ajustar dosis según condición.',
  },
  {
    nivel: 'III',
    label: 'Enfermedad sistémica moderada',
    color: 'amber',
    criterios: 'Enfermedad sistémica moderada con limitación funcional. Ej: anemia moderada, deshidratación leve, soplo cardíaco compensado.',
    riesgo: 'Moderado',
    recomendacion: 'Estabilizar antes de anestesia. Monitoreo intensivo. Fluidoterapia perioperatoria.',
  },
  {
    nivel: 'IV',
    label: 'Enfermedad sistémica grave',
    color: 'orange',
    criterios: 'Enfermedad sistémica grave con amenaza constante para la vida. Ej: insuficiencia cardíaca descompensada, sepsis, trauma grave.',
    riesgo: 'Alto',
    recomendacion: 'Anestesia solo si es emergencia. Equipo de reanimación disponible. Monitoreo multiparamétrico.',
  },
  {
    nivel: 'V',
    label: 'Paciente moribundo',
    color: 'red',
    criterios: 'No se espera sobrevivir sin la cirugía. Ej: shock hemorrágico, GDV con torsión, trauma masivo.',
    riesgo: 'Crítico',
    recomendacion: 'Emergencia absoluta. Inducción rápida. Mínima premedicación. Soporte cardiovascular activo.',
  },
];

// ─── Sistemas de respiración ──────────────────────────────────────────────────
const SISTEMAS = [
  { id: 'no-reinhalacion', label: 'No reinhalación / Mapleson', factorMin: 200, factorMax: 300, descripcion: 'Para pacientes < 7 kg. Factor: 200–300 mL/kg/min.' },
  { id: 'circulo',         label: 'Círculo / Reinhalación',     factorMin: 10,  factorMax: 50,  descripcion: 'Para pacientes > 7 kg. Factor: 10–50 mL/kg/min.' },
];

// ─── Agentes volátiles ────────────────────────────────────────────────────────
const AGENTES = [
  { id: 'isoflurano',  label: 'Isoflurano',  mac: 1.28, densidad: 1.496, pm: 184.5 },
  { id: 'sevoflurano', label: 'Sevoflurano', mac: 2.36, densidad: 1.520, pm: 200.1 },
];

// ─── Helpers de color ─────────────────────────────────────────────────────────
const COLOR_MAP = {
  green:  { bg: 'bg-green-50 dark:bg-green-900/20',   border: 'border-green-300 dark:border-green-700',   text: 'text-green-800 dark:text-green-200',   badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
  lime:   { bg: 'bg-lime-50 dark:bg-lime-900/20',     border: 'border-lime-300 dark:border-lime-700',     text: 'text-lime-800 dark:text-lime-200',     badge: 'bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-300' },
  amber:  { bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-300 dark:border-amber-700',   text: 'text-amber-800 dark:text-amber-200',   badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-800 dark:text-orange-200', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' },
  red:    { bg: 'bg-red-50 dark:bg-red-900/20',       border: 'border-red-300 dark:border-red-700',       text: 'text-red-800 dark:text-red-200',       badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' },
};

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

const inputCls = 'px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

// ─── Flow Rates ───────────────────────────────────────────────────────────────
function FlowRates({ pesoKg }) {
  const [sistema, setSistema] = useState('');
  const sys = SISTEMAS.find((s) => s.id === sistema);
  const peso = parseFloat(pesoKg);

  const flowMin = sys && peso > 0 ? (sys.factorMin * peso).toFixed(0) : null;
  const flowMax = sys && peso > 0 ? (sys.factorMax * peso).toFixed(0) : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sistema de respiración</label>
        <select value={sistema} onChange={(e) => setSistema(e.target.value)} className={`${inputCls} w-full`}>
          <option value="">— Selecciona el sistema —</option>
          {SISTEMAS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        {sys && <p className="text-xs text-slate-400 dark:text-slate-500">{sys.descripcion}</p>}
      </div>

      {flowMin && flowMax && (
        <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1">Flujo de O₂ requerido</p>
          <p className="text-4xl font-extrabold text-blue-700 dark:text-blue-300">
            {flowMin} – {flowMax}
            <span className="text-xl font-semibold ml-2">mL/min</span>
          </p>
          <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-2 opacity-70">
            {pesoKg} kg × {sys.factorMin}–{sys.factorMax} mL/kg/min
          </p>
        </div>
      )}
      {!pesoKg && <p className="text-xs text-amber-600 dark:text-amber-400">⚠️ Ingresa el peso del paciente en la barra superior.</p>}
    </div>
  );
}

// ─── Clasificación ASA ────────────────────────────────────────────────────────
function ClasificacionASA() {
  const [seleccionado, setSeleccionado] = useState(null);
  const asa = ASA_NIVELES.find((a) => a.nivel === seleccionado);
  const c = asa ? COLOR_MAP[asa.color] : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {ASA_NIVELES.map((a) => {
          const isActive = seleccionado === a.nivel;
          const cm = COLOR_MAP[a.color];
          return (
            <button
              key={a.nivel}
              onClick={() => setSeleccionado(isActive ? null : a.nivel)}
              className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all duration-150 ${
                isActive ? `${cm.bg} ${cm.border} ${cm.text}` : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              {a.nivel}
            </button>
          );
        })}
      </div>

      {asa && c && (
        <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${c.bg} ${c.border}`}>
          <div>
            <p className={`font-bold text-base ${c.text}`}>ASA {asa.nivel} — {asa.label}</p>
            <p className={`text-xs mt-1 ${c.text} opacity-80`}>{asa.criterios}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-3 ${c.badge}`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">Riesgo</p>
              <p className="text-sm font-bold">{asa.riesgo}</p>
            </div>
            <div className={`rounded-xl p-3 ${c.badge}`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">Recomendación</p>
              <p className="text-xs leading-relaxed">{asa.recomendacion}</p>
            </div>
          </div>
        </div>
      )}
      {!seleccionado && <p className="text-xs text-slate-400 dark:text-slate-500 text-center">Selecciona un nivel ASA (I–V) para ver los criterios clínicos.</p>}
    </div>
  );
}

// ─── Agente Volátil ───────────────────────────────────────────────────────────
function AgenteVolatil({ pesoKg }) {
  const [agente, setAgente] = useState('');
  const [dialPct, setDialPct] = useState('');
  const [flujoL, setFlujoL] = useState('');

  const ag = AGENTES.find((a) => a.id === agente);
  const dial = parseFloat(dialPct);
  const flujo = parseFloat(flujoL);

  // Consumo estimado: (dial% / 100) × flujo_mL/min × (PM / 22400) × densidad × 1000 → mL líquido/h
  // Simplificado: mL vapor/min = (dial/100) × flujo_mL_min; mL líquido/h ≈ mL_vapor/min × 60 / (densidad × 1000 / PM × 22.4)
  const consumoMlH = ag && dial > 0 && flujo > 0
    ? ((dial / 100) * flujo * 1000 * 60 * ag.pm) / (ag.densidad * 1000 * 22400)
    : null;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Agente</label>
          <select value={agente} onChange={(e) => setAgente(e.target.value)} className={inputCls}>
            <option value="">— Agente —</option>
            {AGENTES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">% Dial vaporizador</label>
          <input type="number" min="0" max="8" step="0.1" value={dialPct} onChange={(e) => setDialPct(e.target.value)} placeholder="Ej. 2" className={inputCls} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Flujo gas (L/min)</label>
          <input type="number" min="0" step="0.1" value={flujoL} onChange={(e) => setFlujoL(e.target.value)} placeholder="Ej. 1" className={inputCls} />
        </div>
      </div>

      {consumoMlH !== null && (
        <div className="rounded-2xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-500 dark:text-violet-400 mb-1">Consumo estimado de {ag.label}</p>
          <p className="text-4xl font-extrabold text-violet-700 dark:text-violet-300">
            {consumoMlH.toFixed(2)}
            <span className="text-xl font-semibold ml-2">mL líquido/h</span>
          </p>
          <p className="text-xs text-violet-600 dark:text-violet-400 mt-2 opacity-70 font-mono">
            MAC referencia: {ag.mac}% · Densidad: {ag.densidad} g/mL
          </p>
        </div>
      )}
      <p className="text-xs text-slate-400 dark:text-slate-500">Estimación basada en consumo de vapor. Valores reales varían según el circuito y el paciente.</p>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Anestesia({ pesoKg }) {
  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Anestesia</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Calculadoras de soporte anestésico veterinario.</p>
      </div>
      {pesoKg && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-blue-700 dark:text-blue-300 font-medium w-fit">
          <span>🐾</span><span>Peso: <strong>{pesoKg} kg</strong></span>
        </div>
      )}
      <Seccion titulo="Flow Rates — Flujo de Oxígeno" emoji="💨">
        <FlowRates pesoKg={pesoKg} />
      </Seccion>
      <Seccion titulo="Clasificación ASA" emoji="📋">
        <ClasificacionASA />
      </Seccion>
      <Seccion titulo="Consumo de Agente Volátil" emoji="🫧">
        <AgenteVolatil pesoKg={pesoKg} />
      </Seccion>
    </div>
  );
}
