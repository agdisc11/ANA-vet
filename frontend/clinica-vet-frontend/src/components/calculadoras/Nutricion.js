import { useState } from 'react';

// ─── Factores DER por estado del paciente ─────────────────────────────────────
const FACTORES_DER = [
  { grupo: 'Perro',  label: 'Perro adulto intacto',          factor: 1.8 },
  { grupo: 'Perro',  label: 'Perro adulto castrado',          factor: 1.6 },
  { grupo: 'Perro',  label: 'Perro obeso (pérdida de peso)',  factor: 1.0 },
  { grupo: 'Perro',  label: 'Perro con sobrepeso',            factor: 1.4 },
  { grupo: 'Perro',  label: 'Cachorro < 4 meses',             factor: 3.0 },
  { grupo: 'Perro',  label: 'Cachorro 4 meses – adulto',      factor: 2.0 },
  { grupo: 'Perro',  label: 'Perro de trabajo (ligero)',      factor: 2.0 },
  { grupo: 'Perro',  label: 'Perro de trabajo (moderado)',    factor: 3.0 },
  { grupo: 'Perro',  label: 'Perro de trabajo (intenso)',     factor: 4.0 },
  { grupo: 'Perro',  label: 'Gestación (primeras 6 sem)',     factor: 1.8 },
  { grupo: 'Perro',  label: 'Gestación (últimas 3 sem)',      factor: 3.0 },
  { grupo: 'Perro',  label: 'Lactancia',                      factor: 4.8 },
  { grupo: 'Gato',   label: 'Gato adulto intacto',            factor: 1.4 },
  { grupo: 'Gato',   label: 'Gato adulto castrado',           factor: 1.2 },
  { grupo: 'Gato',   label: 'Gato obeso (pérdida de peso)',   factor: 0.8 },
  { grupo: 'Gato',   label: 'Gato con sobrepeso',             factor: 1.0 },
  { grupo: 'Gato',   label: 'Gatito < 4 meses',               factor: 2.5 },
  { grupo: 'Gato',   label: 'Gatito 4 meses – adulto',        factor: 1.6 },
  { grupo: 'Gato',   label: 'Gestación',                      factor: 1.6 },
  { grupo: 'Gato',   label: 'Lactancia',                      factor: 2.0 },
  { grupo: 'Hospitalizado', label: 'Paciente hospitalizado (mantenimiento)', factor: 1.0 },
  { grupo: 'Hospitalizado', label: 'Paciente hospitalizado (recuperación)',  factor: 1.2 },
  { grupo: 'Hospitalizado', label: 'Paciente crítico / quemado',             factor: 1.5 },
];

// ─── Sub-componente: Card de resultado ───────────────────────────────────────
function ResultadoCard({ titulo, valor, unidad, formula, color = 'blue' }) {
  const colores = {
    blue:   'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300',
    green:  'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300',
    violet: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300',
  };
  return (
    <div className={`rounded-2xl border p-5 ${colores[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">{titulo}</p>
      <p className="text-5xl font-extrabold leading-none">
        {typeof valor === 'number' ? valor.toFixed(1) : valor}
        <span className="text-xl font-semibold ml-2 opacity-70">{unidad}</span>
      </p>
      {formula && (
        <p className="text-xs font-mono opacity-60 mt-3">{formula}</p>
      )}
    </div>
  );
}

// ─── Componente principal: Nutrición ─────────────────────────────────────────
export default function Nutricion({ pesoKg }) {
  const [factorSeleccionado, setFactorSeleccionado] = useState('');
  const [kcalPorGramo, setKcalPorGramo] = useState('');

  const peso = parseFloat(pesoKg);
  const factor = parseFloat(factorSeleccionado);
  const kcalG = parseFloat(kcalPorGramo);

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const rer = peso > 0 ? 70 * Math.pow(peso, 0.75) : null;
  const der = rer && factor > 0 ? rer * factor : null;
  const gramos = der && kcalG > 0 ? der / kcalG : null;

  // ── Agrupar factores por especie ──────────────────────────────────────────
  const grupos = [...new Set(FACTORES_DER.map((f) => f.grupo))];

  const inputCls = 'px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

  return (
    <div className="flex flex-col gap-7 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Nutrición</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Cálculo de requerimientos energéticos y cantidad de alimento diario.
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

      {/* ── Sección 1: RER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
          <span className="text-lg">🔥</span>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            RER — Requerimiento Energético en Reposo
          </h3>
        </div>

        {rer !== null ? (
          <ResultadoCard
            titulo="RER calculado"
            valor={rer}
            unidad="kcal/día"
            formula={`70 × (${pesoKg} kg)^0.75 = ${rer.toFixed(1)} kcal/día`}
            color="blue"
          />
        ) : (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Ingresa el peso del paciente para calcular el RER.
            </p>
          </div>
        )}

        <p className="text-xs text-slate-400 dark:text-slate-500">
          Fórmula: <span className="font-mono">RER = 70 × (Peso kg)^0.75</span> · Válida para perros y gatos.
        </p>
      </div>

      {/* ── Sección 2: DER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
          <span className="text-lg">📊</span>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            DER — Energía Diaria Requerida
          </h3>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Estado del paciente
          </label>
          <select
            value={factorSeleccionado}
            onChange={(e) => setFactorSeleccionado(e.target.value)}
            className={`${inputCls} w-full`}
          >
            <option value="">— Selecciona el estado del paciente —</option>
            {grupos.map((grupo) => (
              <optgroup key={grupo} label={grupo}>
                {FACTORES_DER.filter((f) => f.grupo === grupo).map((f) => (
                  <option key={f.label} value={f.factor}>
                    {f.label} (× {f.factor})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {der !== null ? (
          <ResultadoCard
            titulo="DER calculado"
            valor={der}
            unidad="kcal/día"
            formula={`RER (${rer.toFixed(1)}) × Factor (${factor}) = ${der.toFixed(1)} kcal/día`}
            color="green"
          />
        ) : rer !== null && !factor ? (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Selecciona el estado del paciente para calcular el DER.
            </p>
          </div>
        ) : null}

        <p className="text-xs text-slate-400 dark:text-slate-500">
          Fórmula: <span className="font-mono">DER = RER × Factor de vida</span>
        </p>
      </div>

      {/* ── Sección 3: Cantidad a alimentar ────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
          <span className="text-lg">🥩</span>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Cantidad a Alimentar
          </h3>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Densidad calórica del alimento
            <span className="ml-1 text-xs font-normal text-slate-400">(kcal/g)</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={kcalPorGramo}
            onChange={(e) => setKcalPorGramo(e.target.value)}
            placeholder="Ej. 3.5 (revisar etiqueta del alimento)"
            className={`${inputCls} w-full`}
          />
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Referencia: Croquetas secas ≈ 3.0–4.5 kcal/g · Alimento húmedo ≈ 0.8–1.2 kcal/g
          </p>
        </div>

        {gramos !== null ? (
          <ResultadoCard
            titulo="Cantidad diaria a alimentar"
            valor={gramos}
            unidad="g/día"
            formula={`DER (${der.toFixed(1)} kcal) ÷ ${kcalG} kcal/g = ${gramos.toFixed(1)} g/día`}
            color="violet"
          />
        ) : der !== null && !kcalG ? (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-sm text-slate-400 dark:text-slate-500">
              Ingresa la densidad calórica del alimento para calcular los gramos diarios.
            </p>
          </div>
        ) : null}

        {/* Resumen de porciones */}
        {gramos !== null && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '1 comida/día', valor: gramos },
              { label: '2 comidas/día', valor: gramos / 2 },
              { label: '3 comidas/día', valor: gramos / 3 },
            ].map((p) => (
              <div key={p.label} className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{p.label}</p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{p.valor.toFixed(1)}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">g/porción</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nota clínica */}
      <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
        <span className="text-amber-500 text-lg flex-shrink-0">⚠️</span>
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
          Estos valores son estimaciones de referencia. La cantidad real puede variar según la condición corporal,
          actividad, metabolismo individual y la composición exacta del alimento. Ajustar según la respuesta
          clínica del paciente y la evaluación de la condición corporal (BCS).
        </p>
      </div>
    </div>
  );
}
