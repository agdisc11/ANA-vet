import { useState } from 'react';

// ─── Tabla de tallas de sutura USP ↔ Métrico ─────────────────────────────────
const TALLAS_SUTURA = [
  { usp: '7',   metrico: '10',  diametro: '1.000 mm', uso: 'Fascia, tendones grandes' },
  { usp: '6',   metrico: '7',   diametro: '0.700 mm', uso: 'Fascia, tejido subcutáneo grueso' },
  { usp: '5',   metrico: '6',   diametro: '0.600 mm', uso: 'Fascia, tejido subcutáneo' },
  { usp: '4',   metrico: '5',   diametro: '0.500 mm', uso: 'Tejido subcutáneo, músculo' },
  { usp: '3',   metrico: '3.5', diametro: '0.350 mm', uso: 'Tejido subcutáneo, músculo' },
  { usp: '2',   metrico: '3',   diametro: '0.300 mm', uso: 'Tejido subcutáneo, músculo' },
  { usp: '1',   metrico: '2',   diametro: '0.200 mm', uso: 'Tejido subcutáneo, piel' },
  { usp: '0',   metrico: '1.5', diametro: '0.150 mm', uso: 'Piel, tejido subcutáneo fino' },
  { usp: '2-0', metrico: '1',   diametro: '0.100 mm', uso: 'Piel, mucosas, vasos pequeños' },
  { usp: '3-0', metrico: '0.7', diametro: '0.070 mm', uso: 'Piel fina, vasos, nervios' },
  { usp: '4-0', metrico: '0.5', diametro: '0.050 mm', uso: 'Vasos, nervios, oftalmología' },
  { usp: '5-0', metrico: '0.3', diametro: '0.030 mm', uso: 'Microcirugía, vasos finos' },
  { usp: '6-0', metrico: '0.2', diametro: '0.020 mm', uso: 'Microcirugía, oftalmología' },
];

// ─── Sub-componente: Sección con título ──────────────────────────────────────
function Seccion({ titulo, emoji, children }) {
  return (
    <div className="flex flex-col gap-3">
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

// ─── Sub-componente: Par de inputs bidireccional ──────────────────────────────
function ConversorBidireccional({ labelA, labelB, unidadA, unidadB, aToB, bToA, placeholderA, placeholderB }) {
  const [valA, setValA] = useState('');
  const [valB, setValB] = useState('');

  function handleA(e) {
    const v = e.target.value;
    setValA(v);
    setValB(v === '' ? '' : parseFloat(aToB(parseFloat(v))).toFixed(4).replace(/\.?0+$/, ''));
  }

  function handleB(e) {
    const v = e.target.value;
    setValB(v);
    setValA(v === '' ? '' : parseFloat(bToA(parseFloat(v))).toFixed(4).replace(/\.?0+$/, ''));
  }

  const inputCls = 'flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{labelA}</label>
        <div className="flex items-center gap-2">
          <input type="number" value={valA} onChange={handleA} placeholder={placeholderA || '0'} className={inputCls} />
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500 w-10 text-center">{unidadA}</span>
        </div>
      </div>
      <span className="text-slate-400 dark:text-slate-500 text-lg mt-4">⇄</span>
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{labelB}</label>
        <div className="flex items-center gap-2">
          <input type="number" value={valB} onChange={handleB} placeholder={placeholderB || '0'} className={inputCls} />
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500 w-10 text-center">{unidadB}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-componente: Conversor de líquidos (multi-unidad) ─────────────────────
function ConversorLiquidos() {
  const [ml, setMl] = useState('');

  const v = parseFloat(ml);
  const resultados = isNaN(v) || ml === '' ? null : {
    L:    (v / 1000).toFixed(4),
    oz:   (v / 29.5735).toFixed(4),
    floz: (v / 29.5735).toFixed(4),
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Volumen base (mL)</label>
        <input
          type="number"
          value={ml}
          onChange={(e) => setMl(e.target.value)}
          placeholder="Ej. 500"
          className="w-48 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />
      </div>
      {resultados && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Litros', valor: resultados.L, unidad: 'L' },
            { label: 'Onzas líquidas', valor: resultados.oz, unidad: 'fl oz' },
            { label: 'Onzas (US)', valor: resultados.oz, unidad: 'oz' },
          ].map((r) => (
            <div key={r.label} className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{r.label}</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{parseFloat(r.valor).toFixed(3)}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{r.unidad}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub-componente: Tabla de suturas ─────────────────────────────────────────
function TablaSuturas() {
  const [seleccionada, setSeleccionada] = useState(null);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Haz clic en una fila para ver el detalle de uso clínico.
      </p>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">USP</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Métrico</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Diámetro</th>
            </tr>
          </thead>
          <tbody>
            {TALLAS_SUTURA.map((t) => {
              const isSelected = seleccionada?.usp === t.usp;
              return (
                <tr
                  key={t.usp}
                  onClick={() => setSeleccionada(isSelected ? null : t)}
                  className={`border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <td className={`px-4 py-2.5 font-bold ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>{t.usp}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{t.metrico}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-500 font-mono text-xs">{t.diametro}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {seleccionada && (
        <div className="flex gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <span className="text-blue-500 text-lg flex-shrink-0">🧵</span>
          <div>
            <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
              USP {seleccionada.usp} = Métrico {seleccionada.metrico}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
              Diámetro: {seleccionada.diametro} · Uso: {seleccionada.uso}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal: Conversiones ──────────────────────────────────────
export default function Conversiones({ pesoKg }) {
  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Conversiones</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Conversión bidireccional de unidades clínicas veterinarias.
        </p>
      </div>

      {/* Peso sincronizado con el global */}
      <Seccion titulo="Peso" emoji="⚖️">
        <ConversorBidireccional
          labelA="Kilogramos"
          labelB="Libras"
          unidadA="kg"
          unidadB="lb"
          aToB={(v) => v * 2.20462}
          bToA={(v) => v / 2.20462}
          placeholderA={pesoKg ? String(pesoKg) : '0'}
        />
        {pesoKg && (
          <p className="text-xs text-blue-600 dark:text-blue-400">
            🐾 Peso global del paciente: <strong>{pesoKg} kg</strong> = <strong>{(pesoKg * 2.20462).toFixed(2)} lb</strong>
          </p>
        )}
      </Seccion>

      {/* Temperatura */}
      <Seccion titulo="Temperatura" emoji="🌡️">
        <ConversorBidireccional
          labelA="Celsius"
          labelB="Fahrenheit"
          unidadA="°C"
          unidadB="°F"
          aToB={(v) => (v * 9) / 5 + 32}
          bToA={(v) => ((v - 32) * 5) / 9}
          placeholderA="38.5"
        />
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Referencia: Temperatura normal canina 38.0–39.2 °C · felina 38.1–39.2 °C
        </p>
      </Seccion>

      {/* Líquidos */}
      <Seccion titulo="Líquidos" emoji="💧">
        <ConversorLiquidos />
        <p className="text-xs text-slate-400 dark:text-slate-500">
          1 L = 1000 mL · 1 fl oz = 29.5735 mL
        </p>
      </Seccion>

      {/* Presiones */}
      <Seccion titulo="Presiones" emoji="🩺">
        <ConversorBidireccional
          labelA="mmHg"
          labelB="kPa"
          unidadA="mmHg"
          unidadB="kPa"
          aToB={(v) => v * 0.133322}
          bToA={(v) => v / 0.133322}
          placeholderA="120"
        />
        <ConversorBidireccional
          labelA="mmHg"
          labelB="cmH₂O"
          unidadA="mmHg"
          unidadB="cmH₂O"
          aToB={(v) => v * 1.35951}
          bToA={(v) => v / 1.35951}
          placeholderA="120"
        />
        <p className="text-xs text-slate-400 dark:text-slate-500">
          1 mmHg = 0.133322 kPa = 1.35951 cmH₂O
        </p>
      </Seccion>

      {/* Tallas de sutura */}
      <Seccion titulo="Tallas de Sutura (USP ↔ Métrico)" emoji="🧵">
        <TablaSuturas />
      </Seccion>
    </div>
  );
}
