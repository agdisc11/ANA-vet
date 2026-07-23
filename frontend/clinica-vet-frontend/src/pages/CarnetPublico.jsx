import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { carnetService } from '../services/carnetService';

// ─────────────────────────────────────────────────────────────
// Carnet de vacunación PÚBLICO (Fase 3.5)
// Página sin sesión: la abre el tutor desde el QR o el enlace.
// Solo lectura, sin datos sensibles, pensada para el móvil.
// ─────────────────────────────────────────────────────────────

const EMOJI = { Perro: '🐕', Gato: '🐈', Conejo: '🐇', Ave: '🦜', Reptil: '🦎', Caballo: '🐴' };

const fmt = (d) => {
  if (!d) return '—';
  const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const f = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(d);
  return Number.isNaN(f.getTime()) ? '—' : f.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
};

function estadoDosis(proxima) {
  if (!proxima) return null;
  const m = String(proxima).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const f = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(proxima);
  if (Number.isNaN(f.getTime())) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0); f.setHours(0, 0, 0, 0);
  const dias = Math.round((f - hoy) / 86_400_000);
  if (dias < 0) return { texto: 'Vencida', clase: 'bg-red-100 text-red-700' };
  if (dias <= 30) return { texto: `En ${dias} d`, clase: 'bg-amber-100 text-amber-700' };
  return { texto: 'Al día', clase: 'bg-emerald-100 text-emerald-700' };
}

export default function CarnetPublico() {
  const { token } = useParams();
  const [carnet, setCarnet] = useState(null);
  const [estado, setEstado] = useState('cargando'); // cargando | ok | error

  useEffect(() => {
    let activo = true;
    carnetService.consultarPublico(token)
      .then((data) => { if (activo) { setCarnet(data); setEstado('ok'); } })
      .catch(() => { if (activo) setEstado('error'); });
    return () => { activo = false; };
  }, [token]);

  if (estado === 'cargando') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (estado === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="text-lg font-bold text-slate-800 mb-1">Carnet no disponible</h1>
          <p className="text-sm text-slate-500">
            Este enlace no es válido o fue revocado por la clínica. Pide uno nuevo a tu veterinaria.
          </p>
        </div>
      </div>
    );
  }

  const { paciente, clinica, vacunas } = carnet;

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4">
      <div className="mx-auto max-w-lg space-y-4">
        {/* Encabezado con la mascota */}
        <header className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-700 text-white p-6 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-widest text-violet-200 mb-2">
            Carnet de vacunación
          </p>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl flex-shrink-0">
              {EMOJI[paciente.especie] || '🐾'}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate">{paciente.nombre}</h1>
              <p className="text-violet-100 text-sm">
                {[paciente.especie, paciente.raza].filter(Boolean).join(' · ')}
              </p>
              <p className="text-violet-200 text-xs mt-0.5">
                {[paciente.sexo, paciente.edad != null ? `${paciente.edad} años` : null].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
          {paciente.microchip && (
            <p className="mt-4 pt-3 border-t border-white/20 text-xs text-violet-100">
              Microchip: <span className="font-mono">{paciente.microchip}</span>
            </p>
          )}
        </header>

        {/* Vacunas */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">Vacunas aplicadas</h2>
            <span className="text-xs text-slate-400">{vacunas.length}</span>
          </div>

          {vacunas.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-400">
              Aún no hay vacunas registradas.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {vacunas.map((v, i) => {
                const est = estadoDosis(v.proxima_dosis);
                return (
                  <li key={i} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800">{v.nombre}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Aplicada el {fmt(v.fecha_aplicacion)}
                        </p>
                        {v.proxima_dosis && (
                          <p className="text-xs text-slate-500">
                            Próxima dosis: {fmt(v.proxima_dosis)}
                          </p>
                        )}
                        {(v.lote || v.fabricante) && (
                          <p className="text-[11px] text-slate-400 mt-1">
                            {[v.fabricante, v.lote && `Lote ${v.lote}`].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      {est && (
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${est.clase}`}>
                          {est.texto}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Clínica */}
        <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
            Atendido en
          </p>
          <p className="font-semibold text-slate-800">{clinica.nombre}</p>
          {clinica.direccion && <p className="text-sm text-slate-500 mt-0.5">{clinica.direccion}</p>}
          {clinica.telefono && (
            <a href={`tel:${clinica.telefono}`} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-violet-600">
              📞 {clinica.telefono}
            </a>
          )}
        </section>

        <p className="text-center text-[11px] text-slate-400 pb-4">
          Documento informativo generado por ANA-vet · No sustituye el expediente clínico oficial.
        </p>
      </div>
    </div>
  );
}
