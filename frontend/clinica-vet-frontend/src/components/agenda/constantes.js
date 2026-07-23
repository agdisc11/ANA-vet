// ─────────────────────────────────────────────────────────────
// Constantes del módulo Agenda (espejo del dominio del backend:
// src/domain/Cita.js). Si cambias la máquina de estados allá,
// actualiza TRANSICIONES aquí.
// ─────────────────────────────────────────────────────────────

export const ESTADOS = {
  PROGRAMADA: 'programada',
  CONFIRMADA: 'confirmada',
  EN_SALA: 'en_sala',
  ATENDIDA: 'atendida',
  CANCELADA: 'cancelada',
  NO_ASISTIO: 'no_asistio',
};

export const TRANSICIONES = {
  programada: ['confirmada', 'en_sala', 'atendida', 'cancelada', 'no_asistio'],
  confirmada: ['en_sala', 'atendida', 'cancelada', 'no_asistio'],
  en_sala: ['atendida', 'cancelada'],
  atendida: [],
  cancelada: ['programada'],
  no_asistio: [],
};

// Estilo por estado: bloque en la grilla, chip de texto y botón de acción
export const ESTADO_CONFIG = {
  programada: {
    label: 'Programada',
    bloque: 'bg-violet-500 hover:bg-violet-600 border-violet-700/30 text-white',
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
    boton: 'bg-violet-600 hover:bg-violet-700 text-white',
    punto: 'bg-violet-500',
  },
  confirmada: {
    label: 'Confirmada',
    bloque: 'bg-sky-500 hover:bg-sky-600 border-sky-700/30 text-white',
    chip: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
    boton: 'bg-sky-600 hover:bg-sky-700 text-white',
    punto: 'bg-sky-500',
  },
  en_sala: {
    label: 'En sala',
    bloque: 'bg-amber-500 hover:bg-amber-600 border-amber-700/30 text-white',
    chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    boton: 'bg-amber-500 hover:bg-amber-600 text-white',
    punto: 'bg-amber-500',
  },
  atendida: {
    label: 'Atendida',
    bloque: 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700/30 text-white',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    boton: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    punto: 'bg-emerald-500',
  },
  cancelada: {
    label: 'Cancelada',
    bloque: 'bg-slate-300 hover:bg-slate-400 border-slate-400/40 text-slate-600 line-through dark:bg-slate-700 dark:text-slate-400',
    chip: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    boton: 'bg-slate-500 hover:bg-slate-600 text-white',
    punto: 'bg-slate-400',
  },
  no_asistio: {
    label: 'No asistió',
    bloque: 'bg-rose-400 hover:bg-rose-500 border-rose-600/30 text-white',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    boton: 'bg-rose-500 hover:bg-rose-600 text-white',
    punto: 'bg-rose-500',
  },
};

// Etiqueta de la ACCIÓN que lleva a cada estado (para los botones del detalle)
export const ACCION_LABEL = {
  confirmada: '✓ Confirmar',
  en_sala: '🪑 Pasar a sala',
  atendida: '✅ Marcar atendida',
  cancelada: '✕ Cancelar cita',
  no_asistio: '⚠ No asistió',
  programada: '↺ Reactivar',
};

export const DURACIONES = [15, 20, 30, 45, 60, 90, 120];

// ── Helpers de fecha/hora compartidos ────────────────────────
export const aISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** 'YYYY-MM-DD' (o ISO con hora) → Date local a medianoche, sin corrimiento de zona */
export const desdeISO = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const sumarDias = (d, dias) => {
  const copia = new Date(d);
  copia.setDate(copia.getDate() + dias);
  return copia;
};

/** Lunes de la semana de `d` */
export const lunesDe = (d) => {
  const copia = new Date(d);
  const dia = copia.getDay(); // 0=Dom … 6=Sáb
  copia.setDate(copia.getDate() - ((dia + 6) % 7));
  return copia;
};

export const aMinutos = (horaHHMM) => {
  const [h, m] = String(horaHHMM).slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};

export const aHHMM = (minutos) => {
  const h = String(Math.floor(minutos / 60)).padStart(2, '0');
  const m = String(minutos % 60).padStart(2, '0');
  return `${h}:${m}`;
};

export const fechaLegible = (iso, opciones = {}) =>
  desdeISO(iso).toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', ...opciones,
  });

/**
 * Número utilizable en wa.me: solo dígitos; si son 10 (formato nacional
 * mexicano — la app usa locale es-MX) se antepone 52.
 */
export const telefonoWa = (telefono) => {
  const digitos = String(telefono || '').replace(/\D/g, '');
  if (!digitos) return null;
  return digitos.length === 10 ? `52${digitos}` : digitos;
};
