import { useState, useEffect } from 'react';
import API from '../../api';

// ─── Helpers de nivel de riesgo ───────────────────────────────────────────────
function calcularNivel(mgKgIngeridos, toxina) {
  const leve = parseFloat(toxina?.dosis_toxica_leve_mg_kg);
  const moderada = parseFloat(toxina?.dosis_toxica_moderada_mg_kg);
  const letal = parseFloat(toxina?.dosis_toxica_letal_mg_kg);

  if (!mgKgIngeridos || mgKgIngeridos <= 0) return null;

  // Si no hay umbrales definidos (idiosincrático), siempre alerta máxima
  if (!leve && !moderada && !letal) {
    return {
      nivel: 'indeterminado',
      color: 'amber',
      icono: '⚠️',
      titulo: 'Toxicidad indeterminada',
      descripcion:
        'No existe un umbral de dosis establecido para esta toxina. Cualquier exposición debe considerarse potencialmente peligrosa. Consulta con un toxicólogo veterinario.',
    };
  }

  if (letal && mgKgIngeridos >= letal) {
    return {
      nivel: 'letal',
      color: 'red',
      icono: '☠️',
      titulo: 'ZONA LETAL — Emergencia crítica',
      descripcion: `La dosis ingerida (${mgKgIngeridos.toFixed(3)} mg/kg) supera o iguala la dosis letal de referencia (${letal} mg/kg). Iniciar tratamiento de emergencia de inmediato.`,
    };
  }

  if (moderada && mgKgIngeridos >= moderada) {
    return {
      nivel: 'moderado',
      color: 'orange',
      icono: '🔴',
      titulo: 'Toxicidad moderada — Atención urgente',
      descripcion: `La dosis ingerida (${mgKgIngeridos.toFixed(3)} mg/kg) supera la dosis de toxicidad moderada (${moderada} mg/kg). Se esperan signos sistémicos. Iniciar protocolo de descontaminación.`,
    };
  }

  if (leve && mgKgIngeridos >= leve) {
    return {
      nivel: 'leve',
      color: 'amber',
      icono: '🟡',
      titulo: 'Toxicidad leve — Monitoreo recomendado',
      descripcion: `La dosis ingerida (${mgKgIngeridos.toFixed(3)} mg/kg) supera el umbral de toxicidad leve (${leve} mg/kg). Pueden aparecer signos gastrointestinales. Evaluar descontaminación.`,
    };
  }

  return {
    nivel: 'seguro',
    color: 'green',
    icono: '✅',
    titulo: 'Por debajo del umbral tóxico',
    descripcion: `La dosis ingerida (${mgKgIngeridos.toFixed(3)} mg/kg) está por debajo del umbral de toxicidad leve (${leve} mg/kg). Monitorear al paciente y mantener en observación.`,
  };
}

// ─── Sub-componente: Badge de nivel de riesgo ─────────────────────────────────
function AlertaNivel({ resultado }) {
  if (!resultado) return null;

  const estilos = {
    letal: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200',
    moderado: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200',
    leve: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200',
    indeterminado: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200',
    seguro: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200',
  };

  return (
    <div className={`rounded-2xl border p-5 flex flex-col gap-2 ${estilos[resultado.nivel]}`}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{resultado.icono}</span>
        <p className="font-bold text-base">{resultado.titulo}</p>
      </div>
      <p className="text-sm leading-relaxed">{resultado.descripcion}</p>
    </div>
  );
}

// ─── Sub-componente: Card de resultado numérico ───────────────────────────────
function ResultadoNumerico({ mgKgIngeridos, cantidadMg, pesoKg }) {
  return (
    <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1">
        Dosis ingerida calculada
      </p>
      <p className="text-5xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">
        {mgKgIngeridos.toFixed(3)}
        <span className="text-xl font-semibold ml-2 text-slate-500 dark:text-slate-400">mg/kg</span>
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-mono">
        Fórmula: {cantidadMg} mg ÷ {pesoKg} kg = {mgKgIngeridos.toFixed(4)} mg/kg
      </p>
    </div>
  );
}

// ─── Sub-componente: Tabla de umbrales de referencia ─────────────────────────
function TablaUmbrales({ toxina }) {
  const filas = [
    { label: 'Toxicidad leve', valor: toxina.dosis_toxica_leve_mg_kg, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Toxicidad moderada', valor: toxina.dosis_toxica_moderada_mg_kg, color: 'text-orange-600 dark:text-orange-400' },
    { label: 'Dosis letal (DL50)', valor: toxina.dosis_toxica_letal_mg_kg, color: 'text-red-600 dark:text-red-400' },
  ];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Umbrales de referencia — {toxina.toxina}
        </p>
      </div>
      <table className="w-full text-sm">
        <tbody>
          {filas.map((f) => (
            <tr key={f.label} className="border-b border-slate-100 dark:border-slate-800 last:border-0">
              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{f.label}</td>
              <td className={`px-4 py-2.5 font-bold text-right ${f.color}`}>
                {f.valor != null ? `${parseFloat(f.valor).toFixed(4)} mg/kg` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sub-componente: Protocolo de tratamiento ─────────────────────────────────
function ProtocoloTratamiento({ toxina }) {
  if (!toxina?.tratamiento_base && !toxina?.signos_clinicos) return null;
  return (
    <div className="flex flex-col gap-3">
      {toxina.signos_clinicos && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
            Signos clínicos esperados
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{toxina.signos_clinicos}</p>
        </div>
      )}
      {toxina.tratamiento_base && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1">
            Protocolo de tratamiento base
          </p>
          <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed whitespace-pre-line">
            {toxina.tratamiento_base}
          </p>
        </div>
      )}
      {toxina.notas && (
        <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
          <span className="text-amber-500 text-lg flex-shrink-0">📚</span>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{toxina.notas}</p>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal: Toxicología ───────────────────────────────────────
export default function Toxicologia({ pesoKg }) {
  const [toxinas, setToxinas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorApi, setErrorApi] = useState(null);

  const [seleccionada, setSeleccionada] = useState(null);
  const [cantidadMg, setCantidadMg] = useState('');
  const [mgKgIngeridos, setMgKgIngeridos] = useState(null);
  const [nivelRiesgo, setNivelRiesgo] = useState(null);

  // ── Fetch al montar ────────────────────────────────────────────────────────
  useEffect(() => {
    setCargando(true);
    API.get('/calculadora/toxicologia')
      .then((res) => {
        setToxinas(res.data);
        setErrorApi(null);
      })
      .catch((err) => {
        setErrorApi('No se pudo cargar el catálogo de toxicología. Verifica que el servidor esté activo.');
        console.error('[Toxicologia] Error fetch:', err.message);
      })
      .finally(() => setCargando(false));
  }, []);

  // ── Al seleccionar toxina ──────────────────────────────────────────────────
  function handleSeleccion(e) {
    const id = parseInt(e.target.value, 10);
    const tox = toxinas.find((t) => t.id === id) || null;
    setSeleccionada(tox);
    setCantidadMg('');
    setMgKgIngeridos(null);
    setNivelRiesgo(null);
  }

  // ── Calcular ───────────────────────────────────────────────────────────────
  function calcular() {
    const cantidad = parseFloat(cantidadMg);
    const peso = parseFloat(pesoKg);
    if (!cantidad || !peso || peso === 0) return;
    const resultado = cantidad / peso;
    setMgKgIngeridos(resultado);
    setNivelRiesgo(calcularNivel(resultado, seleccionada));
  }

  // ── Agrupar por especie ────────────────────────────────────────────────────
  const especies = [...new Set(toxinas.map((t) => t.especie_afectada))].sort();

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
          Toxicología — Evaluación de Exposición
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ingresa la toxina y la cantidad ingerida para evaluar el nivel de riesgo según el peso del paciente.
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

      {/* Estado de carga / error */}
      {cargando && (
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Cargando catálogo de toxicología…
        </div>
      )}

      {errorApi && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-300">
          ❌ {errorApi}
        </div>
      )}

      {/* Formulario */}
      {!cargando && !errorApi && (
        <div className="flex flex-col gap-5">
          {/* Select de toxina */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Toxina / Sustancia
            </label>
            <select
              onChange={handleSeleccion}
              defaultValue=""
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="" disabled>— Selecciona una toxina —</option>
              {especies.map((esp) => (
                <optgroup key={esp} label={`Especie: ${esp}`}>
                  {toxinas
                    .filter((t) => t.especie_afectada === esp)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.toxina}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Input de cantidad ingerida */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Cantidad ingerida
              <span className="ml-1 text-xs font-normal text-slate-400">(mg)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={cantidadMg}
              onChange={(e) => { setCantidadMg(e.target.value); setMgKgIngeridos(null); setNivelRiesgo(null); }}
              placeholder="Ej. 500"
              className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {seleccionada && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Especie afectada: <strong className="capitalize">{seleccionada.especie_afectada}</strong>
                {seleccionada.mecanismo && ` · ${seleccionada.mecanismo}`}
              </p>
            )}
          </div>

          {/* Botón calcular */}
          <button
            onClick={calcular}
            disabled={!pesoKg || !cantidadMg || !seleccionada}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-150 shadow-sm"
          >
            Evaluar nivel de riesgo
          </button>

          {/* Resultado numérico */}
          {mgKgIngeridos !== null && (
            <ResultadoNumerico
              mgKgIngeridos={mgKgIngeridos}
              cantidadMg={cantidadMg}
              pesoKg={pesoKg}
            />
          )}

          {/* Alerta de nivel de riesgo */}
          {nivelRiesgo && <AlertaNivel resultado={nivelRiesgo} />}

          {/* Tabla de umbrales */}
          {seleccionada && mgKgIngeridos !== null && (
            <TablaUmbrales toxina={seleccionada} />
          )}

          {/* Protocolo de tratamiento */}
          {seleccionada && mgKgIngeridos !== null && (
            <ProtocoloTratamiento toxina={seleccionada} />
          )}

          {/* Fórmula de referencia */}
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            Fórmula: <span className="font-mono">Cantidad ingerida (mg) ÷ Peso (kg) = Dosis mg/kg</span>
          </p>

          {/* Disclaimer */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center leading-relaxed">
              ⚕️ Esta herramienta es de apoyo clínico. Los umbrales son valores de referencia bibliográfica.
              Siempre consulta con un toxicólogo veterinario ante casos de intoxicación.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
