import { useEffect, useMemo, useState } from 'react';
import { DURACIONES } from './constantes';

// ─────────────────────────────────────────────────────────────
// CitaFormModal — Crear o reagendar una cita.
// `inicial` puede traer { fecha, hora_inicio } (clic en un slot vacío)
// o una cita completa (edición).
// ─────────────────────────────────────────────────────────────

const FORM_VACIO = {
  paciente_id: null,
  empleado_id: '',
  fecha: '',
  hora_inicio: '',
  duracion_min: 30,
  motivo: '',
  notas: '',
};

export default function CitaFormModal({
  abierta,
  inicial,
  pacientes,
  veterinarios,
  guardando,
  onGuardar,
  onCerrar,
}) {
  const [form, setForm] = useState(FORM_VACIO);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarLista, setMostrarLista] = useState(false);

  const esEdicion = Boolean(inicial?.id);

  // Sincroniza el formulario cada vez que se abre el modal
  useEffect(() => {
    if (!abierta) return;
    setForm({
      paciente_id: inicial?.paciente_id ?? null,
      empleado_id: inicial?.empleado_id ?? '',
      fecha: (inicial?.fecha || '').slice(0, 10),
      hora_inicio: (inicial?.hora_inicio || '').slice(0, 5),
      duracion_min: inicial?.duracion_min ?? 30,
      motivo: inicial?.motivo ?? '',
      notas: inicial?.notas ?? '',
    });
    setBusqueda(inicial?.paciente_nombre || '');
    setMostrarLista(false);
  }, [abierta, inicial]);

  const resultados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return pacientes.slice(0, 8);
    return pacientes
      .filter(
        (p) =>
          p.nombre?.toLowerCase().includes(q) ||
          p.tutor?.toLowerCase().includes(q) ||
          p.especie?.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [busqueda, pacientes]);

  const pacienteSeleccionado = useMemo(
    () => pacientes.find((p) => p.id === form.paciente_id) || null,
    [pacientes, form.paciente_id]
  );

  if (!abierta) return null;

  const guardar = (e) => {
    e.preventDefault();
    onGuardar({
      paciente_id: form.paciente_id,
      empleado_id: form.empleado_id === '' ? null : Number(form.empleado_id),
      fecha: form.fecha,
      hora_inicio: form.hora_inicio,
      duracion_min: Number(form.duracion_min),
      motivo: form.motivo || null,
      notas: form.notas || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onCerrar} />

      <form
        onSubmit={guardar}
        className="relative card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-slide-up"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {esEdicion ? 'Reagendar cita' : 'Nueva cita'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {esEdicion ? 'Modifica los datos de la cita' : 'Agenda una cita en el calendario'}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Paciente (buscador) ── */}
        <div className="mb-4 relative">
          <label className="input-label">Paciente *</label>
          {pacienteSeleccionado ? (
            <div className="flex items-center justify-between gap-2 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-3 py-2.5">
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-violet-800 dark:text-violet-200 truncate">
                  🐾 {pacienteSeleccionado.nombre}
                </p>
                <p className="text-xs text-violet-500 dark:text-violet-400 truncate">
                  {pacienteSeleccionado.especie}
                  {pacienteSeleccionado.raza ? ` · ${pacienteSeleccionado.raza}` : ''}
                  {pacienteSeleccionado.tutor ? ` · Tutor: ${pacienteSeleccionado.tutor}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setForm({ ...form, paciente_id: null }); setBusqueda(''); }}
                className="text-xs font-semibold text-violet-600 dark:text-violet-300 hover:underline flex-shrink-0"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <>
              <input
                className="input"
                placeholder="Busca por nombre, tutor o especie…"
                value={busqueda}
                onChange={(e) => { setBusqueda(e.target.value); setMostrarLista(true); }}
                onFocus={() => setMostrarLista(true)}
                onBlur={() => setTimeout(() => setMostrarLista(false), 150)}
                autoFocus={!esEdicion}
              />
              {mostrarLista && resultados.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full card max-h-56 overflow-y-auto py-1 shadow-lg">
                  {resultados.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onMouseDown={() => {
                          setForm((f) => ({ ...f, paciente_id: p.id }));
                          setMostrarLista(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-violet-50 dark:hover:bg-violet-900/20"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-100">{p.nombre}</span>
                        <span className="text-xs text-slate-400 ml-2">
                          {p.especie}{p.tutor ? ` · ${p.tutor}` : ''}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {mostrarLista && busqueda && resultados.length === 0 && (
                <p className="absolute z-10 mt-1 w-full card px-3 py-2 text-xs text-slate-400 shadow-lg">
                  Sin coincidencias. Registra al paciente primero en “Pacientes”.
                </p>
              )}
            </>
          )}
        </div>

        {/* ── Veterinario ── */}
        <div className="mb-4">
          <label className="input-label">Veterinario</label>
          <select
            className="input"
            value={form.empleado_id}
            onChange={(e) => setForm({ ...form, empleado_id: e.target.value })}
          >
            <option value="">Sin asignar</option>
            {veterinarios.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nombre} {v.apellidos}{v.rol_nombre ? ` — ${v.rol_nombre}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* ── Fecha / hora / duración ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="input-label">Fecha *</label>
            <input
              type="date"
              className="input"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="input-label">Hora *</label>
            <input
              type="time"
              className="input"
              value={form.hora_inicio}
              onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="input-label">Duración</label>
            <select
              className="input"
              value={form.duracion_min}
              onChange={(e) => setForm({ ...form, duracion_min: e.target.value })}
            >
              {DURACIONES.map((d) => (
                <option key={d} value={d}>{d} min</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Motivo / notas ── */}
        <div className="mb-4">
          <label className="input-label">Motivo</label>
          <input
            className="input"
            placeholder="Vacunación, revisión, seguimiento…"
            value={form.motivo}
            onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            maxLength={255}
          />
        </div>
        <div className="mb-6">
          <label className="input-label">Notas</label>
          <textarea
            className="input resize-none"
            rows={2}
            placeholder="Indicaciones para recepción o el veterinario…"
            value={form.notas}
            onChange={(e) => setForm({ ...form, notas: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={onCerrar} className="btn-secondary">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando || !form.paciente_id || !form.fecha || !form.hora_inicio}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Agendar cita'}
          </button>
        </div>
      </form>
    </div>
  );
}
