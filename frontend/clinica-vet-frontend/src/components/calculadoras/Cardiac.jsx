import { useState } from 'react';

const inputCls = 'px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition';

function mapInterpretacion(map) {
  if (map < 60)  return { label: 'Hipotensión — Perfusión comprometida', color: 'red' };
  if (map <= 100) return { label: 'Normal (60–100 mmHg)', color: 'green' };
  return              { label: 'Hipertensión', color: 'amber' };
}

export default function Cardiac() {
  const [pas, setPas] = useState('');
  const [pad, setPad] = useState('');

  const pasV = parseFloat(pas);
  const padV = parseFloat(pad);

  const map = pasV > 0 && padV > 0 ? (pasV + 2 * padV) / 3 : null;
  const pp  = pasV > 0 && padV > 0 ? pasV - padV : null;
  const dx  = map !== null ? mapInterpretacion(map) : null;

  const colores = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200',
    red:   'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200',
  };

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Cardiac</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Calculadoras de parámetros cardiovasculares.</p>
      </div>

      {/* MAP */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
          <span className="text-lg">❤️</span>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Presión Arterial Media (MAP)
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              PAS — Presión Sistólica <span className="text-xs font-normal text-slate-400">(mmHg)</span>
            </label>
            <input type="number" min="0" step="1" value={pas} onChange={(e) => setPas(e.target.value)} placeholder="Ej. 120" className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              PAD — Presión Diastólica <span className="text-xs font-normal text-slate-400">(mmHg)</span>
            </label>
            <input type="number" min="0" step="1" value={pad} onChange={(e) => setPad(e.target.value)} placeholder="Ej. 80" className={inputCls} />
          </div>
        </div>

        {map !== null && dx && (
          <div className="flex flex-col gap-3">
            {/* MAP resultado */}
            <div className={`rounded-2xl border p-6 ${colores[dx.color]}`}>
              <p className="text-xs font-semibold uppercase tracking-widest opacity-70 mb-1">MAP — Presión Arterial Media</p>
              <p className="text-6xl font-extrabold leading-none">
                {map.toFixed(1)}
                <span className="text-2xl font-semibold ml-2 opacity-70">mmHg</span>
              </p>
              <p className="font-semibold text-sm mt-3">{dx.label}</p>
              <p className="text-xs font-mono opacity-60 mt-1">({pas} + 2 × {pad}) ÷ 3 = {map.toFixed(1)} mmHg</p>
            </div>

            {/* Presión de pulso */}
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
                Presión de Pulso (PP)
              </p>
              <p className="text-4xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                {pp.toFixed(0)}
                <span className="text-xl font-semibold ml-2 text-slate-500 dark:text-slate-400">mmHg</span>
              </p>
              <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-2">{pas} − {pad} = {pp.toFixed(0)} mmHg</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                {pp < 25 ? '⚠️ PP estrecha — posible bajo gasto cardíaco' : pp > 60 ? '⚠️ PP amplia — evaluar regurgitación aórtica' : '✅ PP normal (25–60 mmHg)'}
              </p>
            </div>

            {/* Tabla de referencia */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Rangos de referencia MAP</p>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {[
                    { rango: '< 60 mmHg', estado: 'Hipotensión crítica', color: 'text-red-600 dark:text-red-400' },
                    { rango: '60–80 mmHg', estado: 'Hipotensión leve', color: 'text-amber-600 dark:text-amber-400' },
                    { rango: '80–100 mmHg', estado: 'Normal', color: 'text-green-600 dark:text-green-400' },
                    { rango: '> 100 mmHg', estado: 'Hipertensión', color: 'text-orange-600 dark:text-orange-400' },
                  ].map((r) => (
                    <tr key={r.rango} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400">{r.rango}</td>
                      <td className={`px-4 py-2.5 font-semibold text-sm ${r.color}`}>{r.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(!pas || !pad) && (
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            Ingresa la presión sistólica y diastólica para calcular la MAP.
          </p>
        )}

        <p className="text-xs text-slate-400 dark:text-slate-500">
          Fórmula: <span className="font-mono">(PAS + 2 × PAD) ÷ 3</span> · Meta anestésica: MAP ≥ 60 mmHg
        </p>
      </div>
    </div>
  );
}
