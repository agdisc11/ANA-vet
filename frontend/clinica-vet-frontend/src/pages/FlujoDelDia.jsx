import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui';
import { useCitasPorRango, useCambiarEstadoCita, useVeterinarios } from '../hooks/useCitas';
import { mensajeError } from '../lib/queryClient';

// ─────────────────────────────────────────────────────────────
// Flujo del día (Fase 3.3)
// Tablero operativo de la jornada sobre los estados de las citas:
//   Por llegar → En sala → Atendidas → (cobrar)
// Se refresca solo cada 30 s para que recepción y consultorio vean
// lo mismo sin recargar.
// ─────────────────────────────────────────────────────────────

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Columnas del tablero: qué estados agrupa y qué acciones ofrece cada tarjeta. */
const COLUMNAS = [
  {
    id: 'por_llegar',
    titulo: 'Por llegar',
    descripcion: 'Programadas y confirmadas',
    estados: ['programada', 'confirmada'],
    acento: 'border-slate-300 dark:border-slate-700',
    encabezado: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    acciones: [
      { estado: 'en_sala', etiqueta: 'Llegó → Sala', clase: 'bg-amber-500 hover:bg-amber-600 text-white' },
      { estado: 'no_asistio', etiqueta: 'No asistió', clase: 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700' },
    ],
  },
  {
    id: 'en_sala',
    titulo: 'En sala',
    descripcion: 'Esperando o en consulta',
    estados: ['en_sala'],
    acento: 'border-amber-300 dark:border-amber-700',
    encabezado: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    acciones: [
      { estado: 'atendida', etiqueta: 'Marcar atendida', clase: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    ],
  },
  {
    id: 'atendidas',
    titulo: 'Atendidas',
    descripcion: 'Listas para cobrar',
    estados: ['atendida'],
    acento: 'border-emerald-300 dark:border-emerald-700',
    encabezado: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
    acciones: [],
  },
];

const EMOJI_ESPECIE = { Perro: '🐕', Gato: '🐈', Conejo: '🐇', Ave: '🦜', Reptil: '🦎', Caballo: '🐴' };

function Tarjeta({ cita, acciones, onAvanzar, onCobrar, ocupado }) {
  return (
    <div className="card p-3.5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
            {EMOJI_ESPECIE[cita.paciente_especie] || '🐾'} {cita.paciente_nombre}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{cita.tutor_nombre || 'Sin tutor'}</p>
        </div>
        <span className="flex-shrink-0 text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
          {String(cita.hora_inicio).slice(0, 5)}
        </span>
      </div>

      {cita.motivo && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{cita.motivo}</p>
      )}

      {cita.empleado_nombre && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-2 truncate">👤 {cita.empleado_nombre}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {acciones.map((a) => (
          <button
            key={a.estado}
            onClick={() => onAvanzar(cita, a.estado)}
            disabled={ocupado}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 ${a.clase}`}
          >
            {a.etiqueta}
          </button>
        ))}
        <button
          onClick={() => onCobrar(cita)}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-violet-700 bg-violet-50 hover:bg-violet-100 dark:text-violet-300 dark:bg-violet-900/30 dark:hover:bg-violet-900/50 transition-colors"
        >
          {acciones.length === 0 ? '🧾 Cobrar' : 'Expediente'}
        </button>
      </div>
    </div>
  );
}

export default function FlujoDelDia() {
  const navigate = useNavigate();
  const toast = useToast();
  const hoy = useMemo(() => hoyISO(), []);
  const [filtroVet, setFiltroVet] = useState('');

  const { data: citas = [], isLoading } = useCitasPorRango(
    { desde: hoy, hasta: hoy, empleadoId: filtroVet || null },
    { refetchInterval: 30_000 } // tablero vivo
  );
  const { data: veterinarios = [] } = useVeterinarios();
  const cambiarEstado = useCambiarEstadoCita();

  const porColumna = useMemo(() => {
    const mapa = {};
    for (const col of COLUMNAS) {
      mapa[col.id] = citas
        .filter((c) => col.estados.includes(c.estado))
        .sort((a, b) => String(a.hora_inicio).localeCompare(String(b.hora_inicio)));
    }
    return mapa;
  }, [citas]);

  const avanzar = async (cita, estado) => {
    try {
      await cambiarEstado.mutateAsync({ id: cita.id, estado });
      const textos = { en_sala: 'pasó a sala', atendida: 'fue atendida', no_asistio: 'marcada como no asistió' };
      toast.success(`${cita.paciente_nombre} ${textos[estado] || 'actualizada'}`);
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo actualizar la cita'));
    }
  };

  const totalActivas = citas.filter((c) => c.estado !== 'cancelada' && c.estado !== 'no_asistio').length;
  const atendidas = porColumna.atendidas?.length ?? 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Flujo del día"
        subtitle={`${new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} · ${totalActivas} cita${totalActivas !== 1 ? 's' : ''} · ${atendidas} atendida${atendidas !== 1 ? 's' : ''}`}
        action={
          <div className="flex items-center gap-2">
            <select value={filtroVet} onChange={(e) => setFiltroVet(e.target.value)} className="input py-2 w-auto">
              <option value="">Todo el equipo</option>
              {veterinarios.map((v) => (
                <option key={v.id} value={v.id}>{v.nombre} {v.apellidos}</option>
              ))}
            </select>
            <button onClick={() => navigate('/agenda')} className="btn-secondary">Ver agenda</button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNAS.map((c) => (
            <div key={c.id} className="card p-4 animate-pulse h-64" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNAS.map((col) => {
            const items = porColumna[col.id] || [];
            return (
              <section key={col.id} className={`rounded-2xl border-2 border-dashed ${col.acento} p-3 min-h-[16rem]`}>
                <header className={`flex items-center justify-between rounded-xl px-3 py-2 mb-3 ${col.encabezado}`}>
                  <div>
                    <h2 className="text-sm font-bold">{col.titulo}</h2>
                    <p className="text-[11px] opacity-70">{col.descripcion}</p>
                  </div>
                  <span className="text-lg font-bold tabular-nums">{items.length}</span>
                </header>

                <div className="space-y-2.5">
                  {items.map((cita) => (
                    <Tarjeta
                      key={cita.id}
                      cita={cita}
                      acciones={col.acciones}
                      ocupado={cambiarEstado.isPending}
                      onAvanzar={avanzar}
                      onCobrar={(c) => navigate(`/expediente/${c.paciente_id}`)}
                    />
                  ))}

                  {items.length === 0 && (
                    <p className="text-center text-xs text-slate-400 dark:text-slate-600 py-8">
                      {col.id === 'por_llegar' ? 'Nadie por llegar' : col.id === 'en_sala' ? 'Sala vacía' : 'Aún sin atender'}
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400 dark:text-slate-500 text-center">
        El tablero se actualiza automáticamente cada 30 segundos.
      </p>
    </div>
  );
}
