import { ESTADO_CONFIG, TRANSICIONES, ACCION_LABEL, fechaLegible, telefonoWa, aMinutos, aHHMM } from './constantes';

// ─────────────────────────────────────────────────────────────
// CitaDetallePanel — Detalle de una cita con:
//   · acciones de estado (solo transiciones válidas de la máquina de estados)
//   · recordatorio por WhatsApp con mensaje pre-redactado (sin APIs de pago:
//     usa el deep-link wa.me con el teléfono del tutor ya registrado)
//   · reagendar / eliminar según reglas del backend
// ─────────────────────────────────────────────────────────────

export default function CitaDetallePanel({
  cita,
  nombreClinica,
  cambiandoEstado,
  onCambiarEstado,
  onEditar,
  onEliminar,
  onCerrar,
}) {
  if (!cita) return null;

  const cfg = ESTADO_CONFIG[cita.estado] || ESTADO_CONFIG.programada;
  const transiciones = TRANSICIONES[cita.estado] || [];
  const hora = String(cita.hora_inicio).slice(0, 5);
  const horaFin = aHHMM(aMinutos(hora) + Number(cita.duracion_min));
  const editable = ['programada', 'confirmada', 'en_sala'].includes(cita.estado);
  const eliminable = cita.estado !== 'atendida';

  const telefono = telefonoWa(cita.tutor_whatsapp || cita.tutor_telefono);
  const mensajeWa = encodeURIComponent(
    `Hola${cita.tutor_nombre ? ` ${cita.tutor_nombre}` : ''} 🐾 Te recordamos la cita de ` +
    `${cita.paciente_nombre} el ${fechaLegible(cita.fecha)} a las ${hora} hrs` +
    `${nombreClinica ? ` en ${nombreClinica}` : ''}.` +
    `${cita.motivo ? ` Motivo: ${cita.motivo}.` : ''} ¡Te esperamos!`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onCerrar} />

      <div className="relative card w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Encabezado con color del estado */}
        <div className={`rounded-t-2xl px-6 py-4 ${cfg.bloque.split(' ')[0]} text-white`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider opacity-80">{cfg.label}</p>
              <h2 className="text-xl font-bold truncate">🐾 {cita.paciente_nombre}</h2>
              <p className="text-sm opacity-90 truncate">
                {cita.paciente_especie}
                {cita.paciente_raza ? ` · ${cita.paciente_raza}` : ''}
              </p>
            </div>
            <button
              onClick={onCerrar}
              aria-label="Cerrar"
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/20"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Datos de la cita */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2 flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <span className="text-base">📅</span>
              <span className="font-medium capitalize">{fechaLegible(cita.fecha, { year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <span className="text-base">🕐</span>
              <span>{hora} – {horaFin} <span className="text-slate-400">({cita.duracion_min} min)</span></span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
              <span className="text-base">🩺</span>
              <span className="truncate">{cita.empleado_nombre || 'Sin asignar'}</span>
            </div>
            {cita.tutor_nombre && (
              <div className="col-span-2 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                <span className="text-base">👤</span>
                <span className="truncate">
                  {cita.tutor_nombre}
                  {(cita.tutor_whatsapp || cita.tutor_telefono) && (
                    <span className="text-slate-400 ml-1">· {cita.tutor_whatsapp || cita.tutor_telefono}</span>
                  )}
                </span>
              </div>
            )}
            {cita.motivo && (
              <div className="col-span-2">
                <p className="input-label">Motivo</p>
                <p className="text-slate-700 dark:text-slate-200">{cita.motivo}</p>
              </div>
            )}
            {cita.notas && (
              <div className="col-span-2">
                <p className="input-label">Notas</p>
                <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap text-xs">{cita.notas}</p>
              </div>
            )}
          </div>

          {/* Recordatorio por WhatsApp */}
          {telefono && (
            <a
              href={`https://wa.me/${telefono}?text=${mensajeWa}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#25D366] hover:bg-[#1fb857] text-white text-sm font-semibold py-2.5 transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Enviar recordatorio por WhatsApp
            </a>
          )}

          {/* Acciones de estado (solo transiciones válidas) */}
          {transiciones.length > 0 && (
            <div>
              <p className="input-label">Acciones</p>
              <div className="grid grid-cols-2 gap-2">
                {transiciones.map((destino) => (
                  <button
                    key={destino}
                    disabled={cambiandoEstado}
                    onClick={() => onCambiarEstado(destino)}
                    className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${ESTADO_CONFIG[destino].boton}`}
                  >
                    {ACCION_LABEL[destino]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reagendar / eliminar */}
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
            {editable ? (
              <button onClick={onEditar} className="btn-secondary text-xs">
                ✏️ Reagendar
              </button>
            ) : <span />}
            {eliminable && (
              <button
                onClick={onEliminar}
                className="text-xs font-semibold text-red-500 hover:text-red-600 hover:underline"
              >
                Eliminar cita
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
