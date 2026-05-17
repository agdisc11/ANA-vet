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

// ─── Factores de conversión Convencional ↔ SI (v2.0) ─────────────────────────
// Conv → SI = valor * factor
// SI → Conv = valor / factor
const CLINICAL_CONSTANTS = Object.freeze({
  grupos: [
    {
      id: 'hematologia',
      label: 'Hematología',
      emoji: '🩸',
      componentes: [
        { id: 'rbc',       label: 'Eritrocitos (RBC)',    unidConv: '×10⁶/μL',  unidSI: '×10¹²/L',  factor: 1.0    },
        { id: 'hb',        label: 'Hemoglobina (Hb)',     unidConv: 'g/dL',      unidSI: 'g/L',       factor: 10.0   },
        { id: 'wbc',       label: 'Leucocitos (WBC)',     unidConv: '×10³/μL',   unidSI: '×10⁹/L',   factor: 1.0    },
        { id: 'neutro',    label: 'Neutrófilos',          unidConv: '×10³/μL',   unidSI: '×10⁹/L',   factor: 1.0    },
        { id: 'linfocito', label: 'Linfocitos',           unidConv: '×10³/μL',   unidSI: '×10⁹/L',   factor: 1.0    },
        { id: 'plaquetas', label: 'Plaquetas',            unidConv: '×10³/μL',   unidSI: '×10⁹/L',   factor: 0.001  },
        { id: 'prot_tot',  label: 'Proteínas totales',   unidConv: 'g/dL',      unidSI: 'g/L',       factor: 10.0   },
      ],
    },
    {
      id: 'bioquimica',
      label: 'Bioquímica',
      emoji: '🧪',
      componentes: [
        { id: 'alt',       label: 'ALT / Fosfatasa Alcalina', unidConv: 'U/L',    unidSI: 'μkat/L',  factor: 0.0167 },
        { id: 'albumina',  label: 'Albúmina',                 unidConv: 'g/dL',   unidSI: 'g/L',     factor: 10.0   },
        { id: 'creatinina',label: 'Creatinina',               unidConv: 'mg/dL',  unidSI: 'μmol/L',  factor: 88.4   },
        { id: 'glucosa',   label: 'Glucosa',                  unidConv: 'mg/dL',  unidSI: 'mmol/L',  factor: 0.0555 },
        { id: 'bun',       label: 'BUN',                      unidConv: 'mg/dL',  unidSI: 'mmol/L',  factor: 0.357  },
        { id: 'sodio',     label: 'Sodio (Na⁺)',              unidConv: 'mEq/L',  unidSI: 'mmol/L',  factor: 1.0    },
        { id: 'potasio',   label: 'Potasio (K⁺)',             unidConv: 'mEq/L',  unidSI: 'mmol/L',  factor: 1.0    },
        { id: 'cloro',     label: 'Cloro (Cl⁻)',              unidConv: 'mEq/L',  unidSI: 'mmol/L',  factor: 1.0    },
        { id: 'calcio',    label: 'Calcio (Ca²⁺)',            unidConv: 'mg/dL',  unidSI: 'mmol/L',  factor: 0.250  },
      ],
    },
    {
      id: 'endocrino',
      label: 'Endocrino & Fármacos',
      emoji: '💊',
      componentes: [
        { id: 'cortisol',     label: 'Cortisol',       unidConv: 'μg/dL',  unidSI: 'nmol/L',  factor: 27.59 },
        { id: 't4',           label: 'T4 total',       unidConv: 'μg/dL',  unidSI: 'nmol/L',  factor: 12.87 },
        { id: 'fenobarbital', label: 'Fenobarbital',   unidConv: 'μg/mL',  unidSI: 'μmol/L',  factor: 4.31  },
        { id: 'digoxina',     label: 'Digoxina',       unidConv: 'ng/mL',  unidSI: 'nmol/L',  factor: 1.28  },
      ],
    },
  ],
});

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
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500 w-14 text-center">{unidadA}</span>
        </div>
      </div>
      <span className="text-slate-400 dark:text-slate-500 text-lg mt-4">⇄</span>
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">{labelB}</label>
        <div className="flex items-center gap-2">
          <input type="number" value={valB} onChange={handleB} placeholder={placeholderB || '0'} className={inputCls} />
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500 w-14 text-center">{unidadB}</span>
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

// ─── Sub-componente: Conversor Clínico Convencional ↔ SI ─────────────────────
function ConversorUnidadesClincias() {
  const [grupoId, setGrupoId] = useState('');
  const [compId, setCompId] = useState('');
  const [valorConv, setValorConv] = useState('');
  const [valorSI, setValorSI] = useState('');
  const [direccion, setDireccion] = useState('conv_to_si'); // 'conv_to_si' | 'si_to_conv'

  const grupo = CLINICAL_CONSTANTS.grupos.find((g) => g.id === grupoId) || null;
  const comp = grupo ? grupo.componentes.find((c) => c.id === compId) || null : null;

  function handleGrupoChange(e) {
    setGrupoId(e.target.value);
    setCompId('');
    setValorConv('');
    setValorSI('');
  }

  function handleCompChange(e) {
    setCompId(e.target.value);
    setValorConv('');
    setValorSI('');
  }

  function handleValorConv(e) {
    const v = e.target.value;
    setValorConv(v);
    setDireccion('conv_to_si');
    if (comp && v !== '') {
      const num = parseFloat(v);
      if (!isNaN(num)) {
        setValorSI((num * comp.factor).toFixed(6).replace(/\.?0+$/, ''));
      } else {
        setValorSI('');
      }
    } else {
      setValorSI('');
    }
  }

  function handleValorSI(e) {
    const v = e.target.value;
    setValorSI(v);
    setDireccion('si_to_conv');
    if (comp && v !== '') {
      const num = parseFloat(v);
      if (!isNaN(num)) {
        setValorConv((num / comp.factor).toFixed(6).replace(/\.?0+$/, ''));
      } else {
        setValorConv('');
      }
    } else {
      setValorConv('');
    }
  }

  const selectCls = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition';
  const inputCls = 'flex-1 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

  return (
    <div className="flex flex-col gap-4">
      {/* Selector de grupo */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Grupo analítico</label>
          <select value={grupoId} onChange={handleGrupoChange} className={selectCls}>
            <option value="">— Selecciona grupo —</option>
            {CLINICAL_CONSTANTS.grupos.map((g) => (
              <option key={g.id} value={g.id}>{g.emoji} {g.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Componente</label>
          <select value={compId} onChange={handleCompChange} disabled={!grupo} className={selectCls}>
            <option value="">— Selecciona componente —</option>
            {grupo && grupo.componentes.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inputs de conversión */}
      {comp && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Convencional
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={valorConv}
                  onChange={handleValorConv}
                  placeholder="0"
                  className={inputCls}
                />
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500 w-16 text-center shrink-0">
                  {comp.unidConv}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-center mt-4 gap-0.5">
              <span className="text-slate-400 dark:text-slate-500 text-lg">⇄</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">×{comp.factor}</span>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Sistema Internacional (SI)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={valorSI}
                  onChange={handleValorSI}
                  placeholder="0"
                  className={inputCls}
                />
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500 w-16 text-center shrink-0">
                  {comp.unidSI}
                </span>
              </div>
            </div>
          </div>

          {/* Resultado destacado */}
          {(valorConv !== '' || valorSI !== '') && (
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4">
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                {comp.label}
              </p>
              {direccion === 'conv_to_si' && valorConv !== '' && valorSI !== '' && (
                <p className="text-sm text-blue-800 dark:text-blue-200 font-mono">
                  {valorConv} {comp.unidConv} × {comp.factor} = <strong>{valorSI} {comp.unidSI}</strong>
                </p>
              )}
              {direccion === 'si_to_conv' && valorSI !== '' && valorConv !== '' && (
                <p className="text-sm text-blue-800 dark:text-blue-200 font-mono">
                  {valorSI} {comp.unidSI} ÷ {comp.factor} = <strong>{valorConv} {comp.unidConv}</strong>
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Tabla de referencia del grupo seleccionado */}
      {grupo && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="px-3 py-2 text-left font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Componente</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Unid. Conv.</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Factor</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Unid. SI</th>
              </tr>
            </thead>
            <tbody>
              {grupo.componentes.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => { setCompId(c.id); setValorConv(''); setValorSI(''); }}
                  className={`border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer transition-colors ${
                    compId === c.id
                      ? 'bg-blue-50 dark:bg-blue-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <td className={`px-3 py-2 font-medium ${compId === c.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>{c.label}</td>
                  <td className="px-3 py-2 text-center font-mono text-slate-500 dark:text-slate-400">{c.unidConv}</td>
                  <td className="px-3 py-2 text-center font-mono text-blue-600 dark:text-blue-400 font-semibold">{c.factor}</td>
                  <td className="px-3 py-2 text-center font-mono text-slate-500 dark:text-slate-400">{c.unidSI}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Conv → SI: valor × factor · SI → Conv: valor ÷ factor · Fuente: v2.0 Clinical Units Reference
      </p>
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

      {/* Unidades Clínicas SI ↔ Convencional */}
      <Seccion titulo="Unidades Clínicas (Convencional ↔ SI)" emoji="⚗️">
        <ConversorUnidadesClincias />
      </Seccion>

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
