import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { PageHeader, DataTable, FormPanel, FormField } from '../components/ui';
import CarnetCompartir from '../components/CarnetCompartir';
import { usePaciente } from '../hooks/usePacientes';
import { useVacunasPorPaciente, useCrearVacuna } from '../hooks/useClinico';
import { mensajeError } from '../lib/queryClient';

const EMPTY = { nombre: '', fecha_aplicacion: '', proxima_dosis: '', lote: '', fabricante: '', via_administracion: '', dosis: '', observaciones: '' };

const diasHasta = (proxima) => {
  if (!proxima) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const p = new Date(proxima); p.setHours(0, 0, 0, 0);
  return Math.ceil((p - hoy) / 86_400_000);
};
const fmt = (d) => (d ? new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

function ProximaBadge({ proxima }) {
  const diff = diasHasta(proxima);
  if (diff === null) return '—';
  if (diff <= 0) return <span className="badge-red">Vencida · {fmt(proxima)}</span>;
  if (diff <= 30) return <span className="badge-yellow">En {diff}d · {fmt(proxima)}</span>;
  return <span className="badge-green">{fmt(proxima)}</span>;
}

export default function Vacunas() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: vacunas = [], isLoading } = useVacunasPorPaciente(pacienteId);
  const { data: paciente } = usePaciente(pacienteId);
  const crearVacuna = useCrearVacuna();

  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [compartirCarnet, setCompartirCarnet] = useState(false);
  const setCampo = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const guardar = async () => {
    if (!form.nombre.trim() || !form.fecha_aplicacion) {
      toast.warning('Nombre y fecha de aplicación son obligatorios');
      return;
    }
    try {
      await crearVacuna.mutateAsync({ paciente_id: pacienteId, ...form });
      toast.success('Vacuna registrada correctamente');
      setForm(EMPTY);
      setMostrarForm(false);
    } catch (e) {
      toast.error(mensajeError(e, 'Error al registrar la vacuna'));
    }
  };

  const rowClassName = (v) => {
    const diff = diasHasta(v.proxima_dosis);
    if (diff === null) return '';
    if (diff <= 0) return 'bg-red-50 dark:bg-red-900/10';
    if (diff <= 30) return 'bg-amber-50 dark:bg-amber-900/10';
    return '';
  };

  const columns = [
    { header: 'Vacuna', className: 'font-semibold text-slate-800 dark:text-slate-200', cell: (v) => v.nombre },
    { header: 'Aplicación', className: 'text-slate-500 dark:text-slate-400 whitespace-nowrap', cell: (v) => fmt(v.fecha_aplicacion) },
    { header: 'Próxima dosis', cell: (v) => <ProximaBadge proxima={v.proxima_dosis} /> },
    { header: 'Lote', className: 'text-slate-500 dark:text-slate-400', cell: (v) => v.lote || '—' },
    { header: 'Fabricante', className: 'text-slate-500 dark:text-slate-400', cell: (v) => v.fabricante || '—' },
    { header: 'Vía', className: 'text-slate-500 dark:text-slate-400', cell: (v) => v.via_administracion || '—' },
    { header: 'Dosis', className: 'text-slate-500 dark:text-slate-400', cell: (v) => v.dosis || '—' },
  ];

  return (
    <div className="animate-fade-in">
      <button onClick={() => navigate(`/expediente/${pacienteId}`)} className="back-link">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver al expediente
      </button>

      <PageHeader
        title="Vacunas"
        subtitle={`${vacunas.length} vacuna${vacunas.length !== 1 ? 's' : ''} registrada${vacunas.length !== 1 ? 's' : ''}`}
        action={
          <div className="flex items-center gap-2">
            <button onClick={() => setCompartirCarnet(true)} className="btn-secondary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              Carnet QR
            </button>
            <button onClick={() => { setMostrarForm(!mostrarForm); setForm(EMPTY); }} className="btn-primary">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nueva vacuna
            </button>
          </div>
        }
      />

      <CarnetCompartir
        open={compartirCarnet}
        onClose={() => setCompartirCarnet(false)}
        pacienteId={pacienteId}
        pacienteNombre={paciente?.nombre || 'la mascota'}
      />

      <FormPanel
        open={mostrarForm}
        onClose={() => setMostrarForm(false)}
        title="Registrar vacuna"
        footer={
          <>
            <button onClick={guardar} disabled={crearVacuna.isPending || !form.nombre.trim()} className="btn-success disabled:opacity-50">
              {crearVacuna.isPending ? 'Guardando...' : 'Guardar vacuna'}
            </button>
            <button onClick={() => setMostrarForm(false)} className="btn-secondary">Cancelar</button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField className="sm:col-span-2" label="Nombre de la vacuna *" value={form.nombre} onChange={setCampo('nombre')} placeholder="Ej: Rabia, Parvovirus, etc." />
          <FormField label="Fecha de aplicación" type="date" value={form.fecha_aplicacion} onChange={setCampo('fecha_aplicacion')} />
          <FormField label="Próxima dosis" type="date" value={form.proxima_dosis} onChange={setCampo('proxima_dosis')} />
          <FormField label="Fabricante" value={form.fabricante} onChange={setCampo('fabricante')} placeholder="Laboratorio fabricante" />
          <FormField label="Lote" value={form.lote} onChange={setCampo('lote')} placeholder="Número de lote" />
          <FormField label="Vía de administración">
            <select value={form.via_administracion} onChange={(e) => setCampo('via_administracion')(e.target.value)} className="input">
              <option value="">Seleccionar</option>
              <option value="Subcutánea">Subcutánea</option>
              <option value="Intramuscular">Intramuscular</option>
              <option value="Intravenosa">Intravenosa</option>
              <option value="Oral">Oral</option>
              <option value="Otro">Otro</option>
            </select>
          </FormField>
          <FormField label="Dosis" value={form.dosis} onChange={setCampo('dosis')} placeholder="Ej: 1 ml" />
          <FormField className="sm:col-span-2" label="Observaciones">
            <textarea rows={2} value={form.observaciones} onChange={(e) => setCampo('observaciones')(e.target.value)} className="input resize-none" placeholder="Observaciones adicionales" />
          </FormField>
        </div>
      </FormPanel>

      {vacunas.length > 0 && (
        <div className="flex gap-4 mb-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-200 dark:bg-red-900/40 border border-red-300 dark:border-red-700" />Vencida</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-200 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700" />Vence en 30 días</span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={vacunas}
        loading={isLoading}
        rowClassName={rowClassName}
        empty={{ title: 'Sin vacunas registradas' }}
      />
    </div>
  );
}
