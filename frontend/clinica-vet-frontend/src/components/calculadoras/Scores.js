import { useState } from 'react';

// ─── Datos: Pain Score Colorado (0–4) ────────────────────────────────────────
const PAIN_LEVELS = [
  {
    nivel: 0,
    label: 'Sin dolor',
    color: 'green',
    descripcion: 'Comportamiento normal. Alerta, activo, interactúa con el entorno.',
    postura: 'Normal, cómodo.',
    palpacion: 'Sin respuesta a la palpación de la zona afectada.',
    emoji: '😊',
  },
  {
    nivel: 1,
    label: 'Dolor leve',
    color: 'lime',
    descripcion: 'Levemente deprimido. Puede vocalizar ocasionalmente.',
    postura: 'Puede proteger la zona afectada.',
    palpacion: 'Respuesta leve a la palpación directa.',
    emoji: '😐',
  },
  {
    nivel: 2,
    label: 'Dolor moderado',
    color: 'amber',
    descripcion: 'Deprimido, puede vocalizar. Reducción del apetito.',
    postura: 'Postura antiálgica. Puede estar en decúbito.',
    palpacion: 'Respuesta clara a la palpación. Puede intentar morder.',
    emoji: '😟',
  },
  {
    nivel: 3,
    label: 'Dolor severo',
    color: 'orange',
    descripcion: 'Muy deprimido, vocalización frecuente. Anorexia.',
    postura: 'Postura anormal, rígida. Taquicardia, taquipnea.',
    palpacion: 'Respuesta intensa. Agresividad defensiva.',
    emoji: '😣',
  },
  {
    nivel: 4,
    label: 'Dolor insoportable',
    color: 'red',
    descripcion: 'Postrado, inconsciente del entorno. Vocalización continua o silencio total.',
    postura: 'Incapaz de moverse. Signos de shock.',
    palpacion: 'No tolera ningún contacto.',
    emoji: '😭',
  },
];

// ─── Datos: Glasgow Coma Score Modificado (veterinario) ──────────────────────
const GLASGOW_MOTOR = [
  { valor: 1, descripcion: 'Actividad motora nula' },
  { valor: 2, descripcion: 'Extensión rígida (descerebración)' },
  { valor: 3, descripcion: 'Flexión rígida (decorticación)' },
  { valor: 4, descripcion: 'Movimientos estereotipados' },
  { valor: 5, descripcion: 'Movimientos voluntarios localizados' },
  { valor: 6, descripcion: 'Movimientos voluntarios normales' },
];

const GLASGOW_TRONCO = [
  { valor: 1, descripcion: 'Ausencia de todos los reflejos del tronco' },
  { valor: 2, descripcion: 'Ausencia de reflejos oculovestibulares y corneal' },
  { valor: 3, descripcion: 'Ausencia de reflejo corneal' },
  { valor: 4, descripcion: 'Ausencia de reflejo pupilar' },
  { valor: 5, descripcion: 'Reflejos reducidos' },
  { valor: 6, descripcion: 'Reflejos normales' },
];

const GLASGOW_CONCIENCIA = [
  { valor: 1, descripcion: 'Coma — sin respuesta a estímulos' },
  { valor: 2, descripcion: 'Semicoma — respuesta mínima a estímulos dolorosos' },
  { valor: 3, descripcion: 'Estupor — responde solo a estímulos dolorosos' },
  { valor: 4, descripcion: 'Obnubilación — deprimido, responde a estímulos' },
  { valor: 5, descripcion: 'Alerta — levemente deprimido' },
  { valor: 6, descripcion: 'Alerta — normal' },
];

function glasgowDiagnostico(total) {
  if (total <= 8)  return { label: 'Pronóstico grave', color: 'red',    descripcion: 'Alta mortalidad. Monitoreo intensivo. Considerar UCI.' };
  if (total <= 13) return { label: 'Pronóstico moderado', color: 'amber', descripcion: 'Monitoreo estrecho. Puede deteriorarse. Reevaluar frecuentemente.' };
  return           { label: 'Pronóstico favorable', color: 'green',  descripcion: 'Función neurológica relativamente conservada.' };
}

// ─── Datos: SIRS ──────────────────────────────────────────────────────────────
const SIRS_CRITERIOS = [
  {
    id: 'fc',
    label: 'Frecuencia Cardíaca',
    descripcion: 'Perro: >120 lpm o <60 lpm · Gato: >250 lpm o <100 lpm',
    emoji: '❤️',
  },
  {
    id: 'fr',
    label: 'Frecuencia Respiratoria',
    descripcion: 'Perro: >20 rpm · Gato: >40 rpm',
    emoji: '🫁',
  },
  {
    id: 'temp',
    label: 'Temperatura',
    descripcion: 'Perro/Gato: >39.5 °C o <37.8 °C',
    emoji: '🌡️',
  },
  {
    id: 'leuco',
    label: 'Leucocitos',
    descripcion: '>12,000/μL o <4,000/μL o >10% bandas',
    emoji: '🔬',
  },
];

// ─── Sub-componentes de utilidad ──────────────────────────────────────────────
function Seccion({ titulo, emoji, children }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
        <span className="text-lg">{emoji}</span>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          {titulo}
        </h3>
      </div>
      {children}
    </div>
  );
}

const COLOR_MAP = {
  green:  { bg: 'bg-green-50 dark:bg-green-900/20',   border: 'border-green-300 dark:border-green-700',   text: 'text-green-800 dark:text-green-200',   badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' },
  lime:   { bg: 'bg-lime-50 dark:bg-lime-900/20',     border: 'border-lime-300 dark:border-lime-700',     text: 'text-lime-800 dark:text-lime-200',     badge: 'bg-lime-100 dark:bg-lime-900/40 text-lime-700 dark:text-lime-300' },
  amber:  { bg: 'bg-amber-50 dark:bg-amber-900/20',   border: 'border-amber-300 dark:border-amber-700',   text: 'text-amber-800 dark:text-amber-200',   badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-800 dark:text-orange-200', badge: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' },
  red:    { bg: 'bg-red-50 dark:bg-red-900/20',       border: 'border-red-300 dark:border-red-700',       text: 'text-red-800 dark:text-red-200',       badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' },
};

// ─── Pain Score Colorado ──────────────────────────────────────────────────────
function PainScore() {
  const [seleccionado, setSeleccionado] = useState(null);
  const nivel = PAIN_LEVELS.find((p) => p.nivel === seleccionado);
  const c = nivel ? COLOR_MAP[nivel.color] : null;

  return (
    <div className="flex flex-col gap-4">
      {/* Selector visual */}
      <div className="flex gap-2">
        {PAIN_LEVELS.map((p) => {
          const isActive = seleccionado === p.nivel;
          const cm = COLOR_MAP[p.color];
          return (
            <button
              key={p.nivel}
              onClick={() => setSeleccionado(isActive ? null : p.nivel)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all duration-150 ${
                isActive
                  ? `${cm.bg} ${cm.border}`
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
              }`}
            >
              <span className="text-2xl">{p.emoji}</span>
              <span className={`text-xs font-bold ${isActive ? cm.text : 'text-slate-500 dark:text-slate-400'}`}>
                {p.nivel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Detalle del nivel seleccionado */}
      {nivel && c && (
        <div className={`rounded-2xl border p-5 flex flex-col gap-3 ${c.bg} ${c.border}`}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{nivel.emoji}</span>
            <div>
              <p className={`font-bold text-base ${c.text}`}>Nivel {nivel.nivel} — {nivel.label}</p>
              <p className={`text-sm ${c.text} opacity-80`}>{nivel.descripcion}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-3 ${c.badge}`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">Postura</p>
              <p className="text-xs leading-relaxed">{nivel.postura}</p>
            </div>
            <div className={`rounded-xl p-3 ${c.badge}`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70 mb-1">Palpación</p>
              <p className="text-xs leading-relaxed">{nivel.palpacion}</p>
            </div>
          </div>
        </div>
      )}

      {seleccionado === null && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Selecciona un nivel (0–4) para ver la descripción clínica completa.
        </p>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Fuente: Colorado State University Veterinary Pain Scale
      </p>
    </div>
  );
}

// ─── Glasgow Coma Score ───────────────────────────────────────────────────────
function GlasgowScore() {
  const [motor, setMotor] = useState('');
  const [tronco, setTronco] = useState('');
  const [conciencia, setConciencia] = useState('');

  const total = (parseInt(motor) || 0) + (parseInt(tronco) || 0) + (parseInt(conciencia) || 0);
  const listo = motor && tronco && conciencia;
  const dx = listo ? glasgowDiagnostico(total) : null;
  const c = dx ? COLOR_MAP[dx.color] : null;

  const selectCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

  function SelectScore({ label, opciones, valor, onChange }) {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</label>
        <select value={valor} onChange={(e) => onChange(e.target.value)} className={selectCls}>
          <option value="">— Selecciona —</option>
          {opciones.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.valor} — {o.descripcion}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SelectScore label="Actividad Motora (1–6)" opciones={GLASGOW_MOTOR} valor={motor} onChange={setMotor} />
      <SelectScore label="Reflejos del Tronco Encefálico (1–6)" opciones={GLASGOW_TRONCO} valor={tronco} onChange={setTronco} />
      <SelectScore label="Nivel de Conciencia (1–6)" opciones={GLASGOW_CONCIENCIA} valor={conciencia} onChange={setConciencia} />

      {/* Resultado */}
      {listo && dx && c && (
        <div className={`rounded-2xl border p-5 flex flex-col gap-2 ${c.bg} ${c.border}`}>
          <div className="flex items-center justify-between">
            <p className={`font-bold text-base ${c.text}`}>{dx.label}</p>
            <div className={`px-4 py-1.5 rounded-full font-extrabold text-2xl ${c.badge}`}>
              {total}<span className="text-sm font-semibold ml-1">/ 18</span>
            </div>
          </div>
          <p className={`text-sm ${c.text} opacity-80`}>{dx.descripcion}</p>
        </div>
      )}

      {!listo && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
          Completa los 3 selectores para obtener el puntaje total.
        </p>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Rango: 3–18 pts · ≤8: grave · 9–13: moderado · 14–18: favorable
      </p>
    </div>
  );
}

// ─── SIRS ─────────────────────────────────────────────────────────────────────
function SIRSScore() {
  const [marcados, setMarcados] = useState({});

  function toggle(id) {
    setMarcados((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const positivos = Object.values(marcados).filter(Boolean).length;
  const sirsPositivo = positivos >= 2;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {SIRS_CRITERIOS.map((c) => {
          const activo = !!marcados[c.id];
          return (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all duration-150 ${
                activo
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {/* Checkbox visual */}
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                activo
                  ? 'bg-red-500 border-red-500'
                  : 'border-slate-300 dark:border-slate-600'
              }`}>
                {activo && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className="text-xl flex-shrink-0">{c.emoji}</span>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${activo ? 'text-red-800 dark:text-red-200' : 'text-slate-700 dark:text-slate-300'}`}>
                  {c.label}
                </p>
                <p className={`text-xs mt-0.5 ${activo ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                  {c.descripcion}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Resultado */}
      <div className={`rounded-2xl border p-5 flex items-center justify-between transition-all ${
        sirsPositivo
          ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
          : positivos > 0
          ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
      }`}>
        <div>
          <p className={`font-bold text-base ${sirsPositivo ? 'text-red-800 dark:text-red-200' : positivos > 0 ? 'text-amber-800 dark:text-amber-200' : 'text-slate-600 dark:text-slate-400'}`}>
            {sirsPositivo ? '🚨 SIRS POSITIVO' : positivos > 0 ? '⚠️ Criterios insuficientes' : '✅ Sin criterios SIRS'}
          </p>
          <p className={`text-sm mt-0.5 ${sirsPositivo ? 'text-red-700 dark:text-red-300' : positivos > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>
            {sirsPositivo
              ? 'Se cumplen ≥2 criterios. Iniciar manejo de SIRS/Sepsis.'
              : positivos > 0
              ? `Solo ${positivos} criterio cumplido. Se requieren ≥2 para SIRS positivo.`
              : 'Marca los criterios presentes en el paciente.'}
          </p>
        </div>
        <div className={`text-4xl font-extrabold px-4 py-2 rounded-xl ${
          sirsPositivo ? 'text-red-700 dark:text-red-300' : 'text-slate-500 dark:text-slate-400'
        }`}>
          {positivos}<span className="text-lg font-semibold">/4</span>
        </div>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        SIRS positivo: ≥2 criterios presentes. Fuente: Kirby & Hauptman, JVECC 1992.
      </p>
    </div>
  );
}

// ─── Componente principal: Scores ────────────────────────────────────────────
export default function Scores() {
  return (
    <div className="flex flex-col gap-10 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Scores Clínicos</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Herramientas de evaluación clínica estandarizada para pacientes veterinarios.
        </p>
      </div>

      <Seccion titulo="Pain Score — Escala Colorado (0–4)" emoji="😣">
        <PainScore />
      </Seccion>

      <Seccion titulo="Glasgow Coma Score Modificado (Veterinario)" emoji="🧠">
        <GlasgowScore />
      </Seccion>

      <Seccion titulo="SIRS — Síndrome de Respuesta Inflamatoria Sistémica" emoji="🚨">
        <SIRSScore />
      </Seccion>
    </div>
  );
}
