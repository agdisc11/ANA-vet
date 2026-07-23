import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageHeader, DataTable, Modal, FormField } from '../components/ui';
import { useProductos, useSolicitudesReabastecimiento, useCrearProducto, useActualizarProducto, useReabastecer } from '../hooks/useAdmin';
import { mensajeError } from '../lib/queryClient';

// ─────────────────────────────────────────────────────────────
// Inventario — Vista diferenciada por rol
//   'clinica'  → tabla completa con precios, agregar/editar, solicitudes
//   'empleado' → tabla sin precios ni edición, botón solicitar reabastecimiento
// ─────────────────────────────────────────────────────────────

const EMPTY_PRODUCTO = { nombre: '', descripcion: '', stock: '', stock_minimo: '', precio: '', unidad: '' };

function StockBadge({ p }) {
  const bajo = p.stock_minimo != null && p.stock <= p.stock_minimo;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
      bajo ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
           : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
    }`}>
      {bajo && <span>⚠️</span>}{p.stock} {p.unidad || 'uds'}
    </span>
  );
}

export default function Inventario() {
  const { tipo } = useAuth();
  const toast = useToast();
  const esClinica = tipo === 'clinica';

  const { data: productos = [], isLoading: cargandoProductos, isError, error } = useProductos();
  const { data: solicitudes = [] } = useSolicitudesReabastecimiento(esClinica);
  const crearProducto = useCrearProducto();
  const actualizarProducto = useActualizarProducto();
  const reabastecer = useReabastecer();

  const [modalProducto, setModalProducto] = useState(false);
  const [editando, setEditando] = useState(null); // null = nuevo
  const [formProducto, setFormProducto] = useState(EMPTY_PRODUCTO);

  const [modalSolicitud, setModalSolicitud] = useState(false);
  const [formSolicitud, setFormSolicitud] = useState({ producto_id: '', producto_nombre: '', notas: '' });

  const abrirNuevo = () => { setEditando(null); setFormProducto(EMPTY_PRODUCTO); setModalProducto(true); };
  const abrirEditar = (p) => {
    setEditando(p);
    setFormProducto({
      nombre: p.nombre || '', descripcion: p.descripcion || '',
      stock: p.stock ?? '', stock_minimo: p.stock_minimo ?? '',
      precio: p.precio ?? '', unidad: p.unidad || '',
    });
    setModalProducto(true);
  };

  const guardarProducto = async () => {
    if (!formProducto.nombre.trim()) { toast.warning('El nombre del producto es obligatorio'); return; }
    try {
      if (editando) {
        await actualizarProducto.mutateAsync({ id: editando.id, payload: formProducto });
        toast.success('Producto actualizado correctamente');
      } else {
        await crearProducto.mutateAsync(formProducto);
        toast.success('Producto agregado al inventario');
      }
      setModalProducto(false);
    } catch (e) {
      toast.error(mensajeError(e, 'Error al guardar producto'));
    }
  };
  const guardandoProducto = crearProducto.isPending || actualizarProducto.isPending;

  const enviarSolicitud = async () => {
    if (!formSolicitud.producto_id) { toast.warning('Selecciona un producto del inventario'); return; }
    try {
      await reabastecer.mutateAsync({
        producto_id: Number(formSolicitud.producto_id),
        producto_nombre: formSolicitud.producto_nombre,
        notas: formSolicitud.notas,
      });
      toast.success('Solicitud enviada correctamente');
      setModalSolicitud(false);
      setFormSolicitud({ producto_id: '', producto_nombre: '', notas: '' });
    } catch (e) {
      toast.error(mensajeError(e, 'Error al enviar solicitud'));
    }
  };

  // ── Columnas ──────────────────────────────────────────────
  const columnasProductos = [
    { header: 'Producto', className: 'font-medium text-slate-900 dark:text-slate-100', cell: (p) => p.nombre },
    { header: 'Descripción', className: 'text-slate-500 dark:text-slate-400', cell: (p) => p.descripcion || '—' },
    { header: 'Stock', cell: (p) => <StockBadge p={p} /> },
    { header: 'Stock mín.', className: 'text-slate-500 dark:text-slate-400', cell: (p) => p.stock_minimo != null ? `${p.stock_minimo} ${p.unidad || 'uds'}` : '—' },
    ...(esClinica ? [
      { header: 'Precio', className: 'text-slate-700 dark:text-slate-300 font-medium', cell: (p) => p.precio != null ? `$${Number(p.precio).toFixed(2)}` : '—' },
      {
        header: 'Acciones', align: 'center', stopPropagation: true,
        cell: (p) => (
          <button onClick={() => abrirEditar(p)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 rounded-lg transition-colors">
            ✏️ Editar
          </button>
        ),
      },
    ] : []),
  ];

  const columnasSolicitudes = [
    { header: 'Producto', className: 'font-medium text-slate-900 dark:text-slate-100', cell: (s) => s.producto_nombre },
    { header: 'Notas', className: 'text-slate-500 dark:text-slate-400', cell: (s) => s.notas || '—' },
    { header: 'Solicitado por', className: 'text-slate-500 dark:text-slate-400', cell: (s) => s.solicitado_por || 'Administrador' },
    { header: 'Fecha', className: 'text-slate-400 dark:text-slate-500 text-xs', cell: (s) => s.creado_en ? new Date(s.creado_en).toLocaleDateString('es-MX') : '—' },
  ];

  if (isError) {
    return (
      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-red-700 dark:text-red-300">
        {mensajeError(error, 'Error al cargar inventario')}
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="📦 Inventario"
        subtitle={esClinica ? 'Gestión completa de productos y solicitudes' : 'Consulta de stock disponible'}
        action={esClinica && (
          <button onClick={abrirNuevo} className="btn-primary">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Agregar producto
          </button>
        )}
      />

      <DataTable
        columns={columnasProductos}
        data={productos}
        loading={cargandoProductos}
        empty={{ title: 'No hay productos en el inventario' }}
      />

      {esClinica && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">🔔 Solicitudes de reabastecimiento</h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">{solicitudes.length} solicitud(es)</span>
          </div>
          <DataTable
            columns={columnasSolicitudes}
            data={solicitudes}
            empty={{ title: 'No hay solicitudes pendientes' }}
          />
        </div>
      )}

      {!esClinica && (
        <button
          onClick={() => setModalSolicitud(true)}
          className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-2xl shadow-lg transition-colors z-40"
        >
          📦 Solicitar reabastecimiento
        </button>
      )}

      {/* Modal agregar/editar producto (clínica) */}
      <Modal
        open={modalProducto}
        onClose={() => setModalProducto(false)}
        title={editando ? '✏️ Editar producto' : '➕ Nuevo producto'}
        maxWidth="max-w-lg"
        footer={
          <>
            <button onClick={() => setModalProducto(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={guardarProducto} disabled={guardandoProducto} className="btn-primary flex-1 justify-center">
              {guardandoProducto ? 'Guardando…' : editando ? 'Actualizar' : 'Agregar'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <FormField className="col-span-2" label="Nombre *" value={formProducto.nombre} onChange={(v) => setFormProducto(f => ({ ...f, nombre: v }))} placeholder="Ej. Amoxicilina 500mg" />
          <FormField className="col-span-2" label="Descripción" value={formProducto.descripcion} onChange={(v) => setFormProducto(f => ({ ...f, descripcion: v }))} placeholder="Descripción opcional" />
          <FormField label="Stock actual" type="number" min="0" value={formProducto.stock} onChange={(v) => setFormProducto(f => ({ ...f, stock: v }))} placeholder="0" />
          <FormField label="Stock mínimo" type="number" min="0" value={formProducto.stock_minimo} onChange={(v) => setFormProducto(f => ({ ...f, stock_minimo: v }))} placeholder="0" />
          <FormField label="Precio ($)" type="number" min="0" step="0.01" value={formProducto.precio} onChange={(v) => setFormProducto(f => ({ ...f, precio: v }))} placeholder="0.00" />
          <FormField label="Unidad" value={formProducto.unidad} onChange={(v) => setFormProducto(f => ({ ...f, unidad: v }))} placeholder="Ej. tabletas, ml, frascos" />
        </div>
      </Modal>

      {/* Modal solicitar reabastecimiento (empleado) */}
      <Modal
        open={modalSolicitud}
        onClose={() => setModalSolicitud(false)}
        title="📦 Solicitar reabastecimiento"
        maxWidth="max-w-md"
        footer={
          <>
            <button onClick={() => setModalSolicitud(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={enviarSolicitud} disabled={reabastecer.isPending} className="btn-primary flex-1 justify-center">
              {reabastecer.isPending ? 'Enviando…' : 'Enviar solicitud'}
            </button>
          </>
        }
      >
        <FormField label="Producto *">
          <select
            value={formSolicitud.producto_id}
            onChange={e => {
              const id = e.target.value;
              const prod = productos.find(p => String(p.id) === String(id));
              setFormSolicitud(f => ({ ...f, producto_id: id, producto_nombre: prod?.nombre || '' }));
            }}
            className="input"
          >
            <option value="">Selecciona un producto…</option>
            {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </FormField>
        {productos.length === 0 && (
          <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">No hay productos en el inventario para solicitar.</p>
        )}
        <FormField className="mt-4" label="Notas adicionales">
          <textarea
            rows={3}
            value={formSolicitud.notas}
            onChange={e => setFormSolicitud(f => ({ ...f, notas: e.target.value }))}
            className="input resize-none"
            placeholder="Cantidad aproximada, urgencia, etc."
          />
        </FormField>
      </Modal>
    </div>
  );
}
