import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { PageHeader, SearchInput, DataTable, Pagination, Modal } from '../components/ui';
import { useClientTable } from '../hooks/useClientTable';
import { useRecordatorios, useMarcarEnviado, useDesmarcarEnviado } from '../hooks/useRecordatorios';
import { mensajeError } from '../lib/queryClient';

// ─────────────────────────────────────────────────────────────
// Recordatorios (Fase 3.2)
// Vacunas por vencer/vencidas y citas próximas, con el mensaje ya
// redactado y un enlace wa.me que abre WhatsApp listo para enviar.
// No requiere API de pago: usa el WhatsApp del propio usuario.
// ─────────────────────────────────────────────────────────────

const URGENCIA = {
  vencido: { texto: 'Vencido', clase: 'badge-red' },
  hoy: { texto: 'Hoy', clase: 'badge-yellow' },
  pronto: { texto: 'Pronto', clase: 'badge-yellow' },
  proximo: { texto: 'Próximo', clase: 'badge-green' },
};

const TIPO = {
  vacuna: { icono: '💉', etiqueta: 'Vacuna', clase: 'badge-purple' },
  cita: { icono: '📅', etiqueta: 'Cita', clase: 'badge-blue' },
};

const fmt = (d) => {
  if (!d) return '—';
  const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const fecha = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(d);
  return Number.isNaN(fecha.getTime()) ? '—' : fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
};

function textoDias(dias) {
  if (dias === null || dias === undefined) return '';
  if (dias === 0) return 'hoy';
  if (dias < 0) return `hace ${Math.abs(dias)} d`;
  return `en ${dias} d`;
}

export default function Recordatorios() {
  const toast = useToast();
  const [soloPendientes, setSoloPendientes] = useState(true);
  const [preview, setPreview] = useState(null); // recordatorio a previsualizar

  const { data: todos = [], isLoading } = useRecordatorios();
  const marcarEnviado = useMarcarEnviado();
  const desmarcarEnviado = useDesmarcarEnviado();

  const visibles = soloPendientes ? todos.filter((r) => !r.enviado_en) : todos;

  const { query, setQuery, page, setPage, totalPages, filtered, pageItems } = useClientTable(
    visibles,
    { searchKeys: ['paciente_nombre', 'tutor_nombre', 'detalle', 'tipo'], pageSize: 12 }
  );

  const pendientes = todos.filter((r) => !r.enviado_en).length;
  const vencidos = todos.filter((r) => r.urgencia === 'vencido' && !r.enviado_en).length;

  const abrirWhatsApp = async (r) => {
    if (!r.enlace_whatsapp) {
      toast.warning(`${r.tutor_nombre || 'El tutor'} no tiene teléfono registrado`);
      return;
    }
    window.open(r.enlace_whatsapp, '_blank', 'noopener');
    try {
      await marcarEnviado.mutateAsync({
        tipo: r.tipo, referencia_id: r.referencia_id, paciente_id: r.paciente_id,
      });
      toast.success(`Recordatorio de ${r.paciente_nombre} marcado como enviado`);
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo registrar el envío'));
    }
  };

  const reactivar = async (r) => {
    try {
      await desmarcarEnviado.mutateAsync({ tipo: r.tipo, referenciaId: r.referencia_id });
      toast.info('Recordatorio disponible para reenviar');
    } catch (e) {
      toast.error(mensajeError(e, 'No se pudo reactivar'));
    }
  };

  const copiarMensaje = async (r) => {
    try {
      await navigator.clipboard.writeText(r.mensaje);
      toast.success('Mensaje copiado');
    } catch {
      toast.error('No se pudo copiar el mensaje');
    }
  };

  const columns = [
    {
      header: 'Tipo',
      cell: (r) => {
        const t = TIPO[r.tipo] || {};
        return <span className={t.clase}>{t.icono} {t.etiqueta}</span>;
      },
    },
    {
      header: 'Paciente',
      className: 'font-semibold text-slate-800 dark:text-slate-200',
      cell: (r) => (
        <>
          {r.paciente_nombre}
          {r.detalle && <span className="block text-xs font-normal text-slate-400 dark:text-slate-500 truncate max-w-[180px]">{r.detalle}</span>}
        </>
      ),
    },
    { header: 'Tutor', cell: (r) => r.tutor_nombre || '—' },
    {
      header: 'Fecha',
      className: 'whitespace-nowrap',
      cell: (r) => (
        <>
          <span className="text-slate-600 dark:text-slate-300">{fmt(r.fecha)}{r.hora ? ` · ${r.hora}` : ''}</span>
          <span className="block text-xs text-slate-400 dark:text-slate-500">{textoDias(r.dias_restantes)}</span>
        </>
      ),
    },
    {
      header: 'Estado',
      cell: (r) => {
        const u = URGENCIA[r.urgencia] || URGENCIA.proximo;
        return r.enviado_en
          ? <span className="badge-green">✓ Enviado</span>
          : <span className={u.clase}>{u.texto}</span>;
      },
    },
    {
      header: '', align: 'right', stopPropagation: true,
      cell: (r) => (
        <div className="flex items-center justify-end gap-1.5">
          <button onClick={() => setPreview(r)} title="Ver mensaje" className="px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
            Ver
          </button>
          {r.enviado_en ? (
            <button onClick={() => reactivar(r)} title="Permitir reenviar" className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 transition-colors">
              Reenviar
            </button>
          ) : (
            <button
              onClick={() => abrirWhatsApp(r)}
              disabled={!r.enlace_whatsapp}
              title={r.enlace_whatsapp ? 'Abrir WhatsApp con el mensaje' : 'Sin teléfono registrado'}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
              </svg>
              WhatsApp
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Recordatorios"
        subtitle={`${pendientes} pendiente${pendientes !== 1 ? 's' : ''}${vencidos > 0 ? ` · ${vencidos} vencido${vencidos !== 1 ? 's' : ''}` : ''}`}
        action={
          <button
            onClick={() => setSoloPendientes((v) => !v)}
            className={soloPendientes ? 'btn-primary' : 'btn-secondary'}
          >
            {soloPendientes ? 'Ver todos' : 'Solo pendientes'}
          </button>
        }
      />

      <div className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 px-4 py-3">
        <p className="text-sm text-emerald-800 dark:text-emerald-200">
          <strong>💬 Cómo funciona:</strong> al pulsar <em>WhatsApp</em> se abre la conversación con el tutor y el mensaje ya escrito; solo revisas y envías. El recordatorio queda marcado como enviado.
        </p>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar por paciente, tutor o vacuna..." className="mb-4" />

      <DataTable
        columns={columns}
        data={pageItems}
        loading={isLoading}
        empty={{
          title: soloPendientes ? 'Sin recordatorios pendientes' : 'Sin recordatorios',
          hint: soloPendientes ? 'Todo al día: no hay vacunas por vencer ni citas próximas sin avisar.' : undefined,
          icon: (
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.4}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          ),
        }}
      />

      <Pagination page={page} totalPages={totalPages} onChange={setPage} totalItems={filtered.length} />

      {/* Vista previa del mensaje */}
      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title="Mensaje de WhatsApp"
        maxWidth="max-w-md"
        footer={
          <>
            <button onClick={() => copiarMensaje(preview)} className="btn-secondary flex-1">Copiar</button>
            <button
              onClick={() => { const r = preview; setPreview(null); abrirWhatsApp(r); }}
              disabled={!preview?.enlace_whatsapp}
              className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 transition-colors"
            >
              Abrir WhatsApp
            </button>
          </>
        }
      >
        {preview && (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
              Para <span className="font-semibold text-slate-700 dark:text-slate-300">{preview.tutor_nombre || '—'}</span>
              {preview.whatsapp || preview.telefono
                ? <span className="text-slate-400"> · {preview.whatsapp || preview.telefono}</span>
                : <span className="text-red-500"> · sin teléfono</span>}
            </p>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-4">
              <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{preview.mensaje}</p>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
