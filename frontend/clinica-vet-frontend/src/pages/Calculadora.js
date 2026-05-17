import { useState } from 'react';
import Anestesia from '../components/calculadoras/Anestesia';
import BloodGas from '../components/calculadoras/BloodGas';
import Cardiac from '../components/calculadoras/Cardiac';
import Conversiones from '../components/calculadoras/Conversiones';
import Fluidos from '../components/calculadoras/Fluidos';
import Hematologia from '../components/calculadoras/Hematologia';
import Nutricion from '../components/calculadoras/Nutricion';
import Farmacia from '../components/calculadoras/Farmacia';
import Toxicologia from '../components/calculadoras/Toxicologia';
import Scores from '../components/calculadoras/Scores';

// ─── Definición de categorías del roadmap ────────────────────────────────────
const CATEGORIAS = [
  {
    id: 'anestesia',
    label: 'Anestesia',
    emoji: '💉',
    descripcion: 'Flow rates, ASA, agente volátil',
    disponible: true,
    componente: Anestesia,
  },
  {
    id: 'blood-gas',
    label: 'Blood Gas',
    emoji: '🩸',
    descripcion: 'Acid-base, Anion gap, A-a gradient, Bicarbonate deficit',
    disponible: true,
    componente: BloodGas,
  },
  {
    id: 'cardiac',
    label: 'Cardiac',
    emoji: '❤️',
    descripcion: 'MAP, Pulse pressure variation',
    disponible: true,
    componente: Cardiac,
  },
  {
    id: 'conversiones',
    label: 'Conversiones',
    emoji: '🔄',
    descripcion: 'Peso, temperatura, líquidos, presiones, suturas',
    disponible: true,
    componente: Conversiones,
  },
  {
    id: 'fluidos',
    label: 'Fluidos',
    emoji: '💧',
    descripcion: 'Fluid rate, CRI, Osmolalidad',
    disponible: true,
    componente: Fluidos,
  },
  {
    id: 'hematologia',
    label: 'Hematología',
    emoji: '🔬',
    descripcion: 'Transfusión, flebotomía, volumen sanguíneo',
    disponible: true,
    componente: Hematologia,
  },
  {
    id: 'nutricion',
    label: 'Nutrición',
    emoji: '🥩',
    descripcion: 'RER, peso ideal, cantidad a alimentar, dry matter',
    disponible: true,
    componente: Nutricion,
  },
  {
    id: 'farmacia',
    label: 'Farmacia',
    emoji: '💊',
    descripcion: 'BSA, dosis/drug calculator, diluciones',
    disponible: true,
    componente: Farmacia,
  },
  {
    id: 'toxicologia',
    label: 'Toxicología',
    emoji: '☠️',
    descripcion: 'Evaluación de exposición a toxinas, nivel de riesgo',
    disponible: true,
    componente: Toxicologia,
  },
  {
    id: 'scores',
    label: 'Scores',
    emoji: '📊',
    descripcion: 'Pain score, Glasgow, APGAR, SIRS',
    disponible: true,
    componente: Scores,
  },
];

// ─── Panel de bienvenida cuando no hay categoría seleccionada ─────────────────
function PanelBienvenida() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 py-20 text-center">
      <span className="text-7xl">🧮</span>
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
          Calculadoras Clínicas
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto text-sm">
          Selecciona una categoría del panel izquierdo para comenzar a usar las
          herramientas de cálculo clínico veterinario.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-2">
        {CATEGORIAS.map((cat) => (
          <div
            key={cat.id}
            className={`flex flex-col items-center gap-1 px-4 py-3 rounded-xl text-xs ${
              cat.disponible
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            <span className="text-2xl">{cat.emoji}</span>
            <span className="font-medium">{cat.label}</span>
            {cat.disponible && (
              <span className="text-xs text-blue-500 dark:text-blue-400 font-semibold">Activo</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Panel "Próximamente" para categorías no implementadas ────────────────────
function PanelProximamente({ categoria }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 py-20 text-center">
      <span className="text-6xl">{categoria.emoji}</span>
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          {categoria.label}
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm max-w-xs mx-auto">
          {categoria.descripcion}
        </p>
      </div>
      <span className="px-4 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs rounded-full font-semibold">
        Próximamente — Fase 2+
      </span>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Calculadora() {
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [pesoInput, setPesoInput] = useState('');
  const [unidadPeso, setUnidadPeso] = useState('kg'); // 'kg' | 'lb'

  // Peso siempre en kg para pasarlo a los sub-componentes
  const pesoEnKg =
    pesoInput === ''
      ? null
      : unidadPeso === 'kg'
      ? parseFloat(pesoInput)
      : parseFloat(pesoInput) / 2.20462;

  const pesoKgFinal = pesoEnKg ? parseFloat(pesoEnKg.toFixed(3)) : null;

  const categoriaObj = CATEGORIAS.find((c) => c.id === categoriaActiva);

  // Renderiza el componente activo o el panel correspondiente
  function renderPanel() {
    if (!categoriaObj) return <PanelBienvenida />;
    if (!categoriaObj.disponible) return <PanelProximamente categoria={categoriaObj} />;
    const Comp = categoriaObj.componente;
    return <Comp pesoKg={pesoKgFinal} />;
  }

  return (
    // Ocupa todo el espacio disponible del <main> sin padding extra
    <div className="-m-6 flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* ── Sidebar interno de categorías ─────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800">
        {/* Título del sidebar interno */}
        <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Categorías
          </h3>
        </div>

        {/* Lista de categorías */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {CATEGORIAS.map((cat) => {
            const isActive = categoriaActiva === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaActiva(cat.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span className="text-base leading-none flex-shrink-0">{cat.emoji}</span>
                <span className="truncate">{cat.label}</span>
                {!cat.disponible && (
                  <span
                    className="ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"
                    title="Próximamente"
                  />
                )}
                {cat.disponible && !isActive && (
                  <span
                    className="ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500"
                    title="Disponible"
                  />
                )}
                {cat.disponible && isActive && (
                  <span className="ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Leyenda */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
          <p className="text-xs text-slate-400 dark:text-slate-600 leading-relaxed flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-500" />
            Disponible
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-600 leading-relaxed flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
            Próximamente
          </p>
        </div>
      </aside>

      {/* ── Panel derecho ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── Barra superior: Peso global del paciente ───────────────────── */}
        <div className="flex-shrink-0 flex items-center gap-4 px-6 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
            🐾 Peso del paciente
          </label>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="0.1"
              value={pesoInput}
              onChange={(e) => setPesoInput(e.target.value)}
              placeholder="Ej. 25"
              className="w-28 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition"
            />

            {/* Toggle kg ↔ lb */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 gap-0.5">
              {['kg', 'lb'].map((u) => (
                <button
                  key={u}
                  onClick={() => setUnidadPeso(u)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all duration-150 ${
                    unidadPeso === u
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Conversión en tiempo real */}
          {pesoInput !== '' && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {unidadPeso === 'kg'
                ? `= ${(parseFloat(pesoInput) * 2.20462).toFixed(2)} lb`
                : `= ${(parseFloat(pesoInput) / 2.20462).toFixed(3)} kg`}
            </span>
          )}

          {/* Título de la categoría activa */}
          {categoriaObj && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-lg">{categoriaObj.emoji}</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {categoriaObj.label}
              </span>
              {categoriaObj.disponible && (
                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full font-semibold">
                  Activo
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Área de contenido de la calculadora ───────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderPanel()}
        </div>
      </div>
    </div>
  );
}
