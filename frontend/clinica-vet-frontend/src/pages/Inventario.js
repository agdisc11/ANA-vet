import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';

// ─────────────────────────────────────────────────────────────
// Inventario — Vista diferenciada por rol
//   'clinica'  → tabla completa con precios, agregar/editar, solicitudes
//   'empleado' → tabla sin precios ni edición, botón solicitar reabastecimiento
// ─────────────────────────────────────────────────────────────

export default function Inventario() {
  const { tipo } = useAuth();
  const esClinica = tipo === 'clinica';

  // ── Estado principal ──────────────────────────────────────
  const [productos, setProductos] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Modal agregar/editar (solo clínica) ───────────────────
  const [modalProducto, setModalProducto] = useState(false);
  const [editando, setEditando] = useState(null); // null = nuevo
  const [formProducto, setFormProducto] = useState({
    nombre: '', descripcion: '', stock: '', stock_minimo: '', precio: '', unidad: '',
  });
  const [guardando, setGuardando] = useState(false);

  // ── Modal solicitar reabastecimiento (empleado) ───────────
  const [modalSolicitud, setModalSolicitud] = useState(false);
  const [formSolicitud, setFormSolicitud] = useState({ producto_nombre: '', notas: '' });
  const [enviando, setEnviando] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // ── Carga de datos ────────────────────────────────────────
  const cargarProductos = useCallback(async () => {
    try {
      const { data } = await API.get('/inventario');
      setProductos(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Error al cargar inventario');
    }
  }, []);

  const cargarSolicitudes = useCallback(async () => {
    if (!esClinica) return;
    try {
      const { data } = await API.get('/inventario/solicitudes');
      setSolicitudes(data);
    } catch {
      // silencioso — no crítico
    }
  }, [esClinica]);

  useEffect(() => {
    setLoading(true);
    Promise.all([cargarProductos(), cargarSolicitudes()]).finally(() => setLoading(false));
  }, [cargarProductos, cargarSolicitudes]);

  // ── Toast helper ──────────────────────────────────────────
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ── Abrir modal para nuevo producto ───────────────────────
  const abrirNuevo = () => {
    setEditando(null);
    setFormProducto({ nombre: '', descripcion: '', stock: '', stock_minimo: '', precio: '', unidad: '' });
    setModalProducto(true);
  };

  // ── Abrir modal para editar producto ─────────────────────
  const abrirEditar = (p) => {
    setEditando(p);
    setFormProducto({
      nombre: p.nombre || '',
      descripcion: p.descripcion || '',
      stock: p.stock ?? '',
      stock_minimo: p.stock_minimo ?? '',
      precio: p.precio ?? '',
      unidad: p.unidad || '',
    });
    setModalProducto(true);
  };

  // ── Guardar producto (crear o actualizar) ─────────────────
  const guardarProducto = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (editando) {
        await API.put(`/inventario/${editando.id}`, formProducto);
        showToast('Producto actualizado correctamente');
      } else {
        await API.post('/inventario', formProducto);
        showToast('Producto agregado al inventario');
      }
      setModalProducto(false);
      await cargarProductos();
    } catch (e) {
      showToast(e.response?.data?.error || 'Error al guardar producto');
    } finally {
      setGuardando(false);
    }
  };

  // ── Enviar solicitud de reabastecimiento ──────────────────
  const enviarSolicitud = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await API.post('/inventario/reabastecer', formSolicitud);
      showToast('Solicitud enviada correctamente');
      setModalSolicitud(false);
      setFormSolicitud({ producto_nombre: '', notas: '' });
      if (esClinica) await cargarSolicitudes();
    } catch (e) {
      showToast(e.response?.data?.error || 'Error al enviar solicitud');
    } finally {
      setEnviando(false);
    }
  };

  // ── Badge de stock ────────────────────────────────────────
  const stockBadge = (p) => {
    const bajo = p.stock_minimo != null && p.stock <= p.stock_minimo;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
        bajo
          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
      }`}>
        {bajo && <span>⚠️</span>}
        {p.stock} {p.unidad || 'uds'}
      </span>
    );
  };

  // ── Render ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-red-700 dark:text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">📦 Inventario</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {esClinica ? 'Gestión completa de productos y solicitudes' : 'Consulta de stock disponible'}
          </p>
        </div>
        {esClinica && (
          <button
            onClick={abrirNuevo}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl shadow transition-colors"
          >
            <span className="text-base">+</span> Agregar producto
          </button>
        )}
      </div>

      {/* ── Tabla de productos ── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-5 py-3 text-left font-semibold">Producto</th>
                <th className="px-5 py-3 text-left font-semibold">Descripción</th>
                <th className="px-5 py-3 text-left font-semibold">Stock</th>
                <th className="px-5 py-3 text-left font-semibold">Stock mín.</th>
                {esClinica && <th className="px-5 py-3 text-left font-semibold">Precio</th>}
                {esClinica && <th className="px-5 py-3 text-center font-semibold">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {productos.length === 0 ? (
                <tr>
                  <td colSpan={esClinica ? 6 : 4} className="px-5 py-10 text-center text-slate-400 dark:text-slate-500">
                    No hay productos en el inventario
                  </td>
                </tr>
              ) : (
                productos.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{p.nombre}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{p.descripcion || '—'}</td>
                    <td className="px-5 py-3">{stockBadge(p)}</td>
                    <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                      {p.stock_minimo != null ? `${p.stock_minimo} ${p.unidad || 'uds'}` : '—'}
                    </td>
                    {esClinica && (
                      <td className="px-5 py-3 text-slate-700 dark:text-slate-300 font-medium">
                        {p.precio != null ? `$${Number(p.precio).toFixed(2)}` : '—'}
                      </td>
                    )}
                    {esClinica && (
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => abrirEditar(p)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 rounded-lg transition-colors"
                        >
                          ✏️ Editar
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Sección solicitudes pendientes (solo clínica) ── */}
      {esClinica && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              🔔 Solicitudes de reabastecimiento
            </h2>
            <span className="text-xs text-slate-400 dark:text-slate-500">{solicitudes.length} solicitud(es)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-5 py-3 text-left font-semibold">Producto</th>
                  <th className="px-5 py-3 text-left font-semibold">Notas</th>
                  <th className="px-5 py-3 text-left font-semibold">Solicitado por</th>
                  <th className="px-5 py-3 text-left font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {solicitudes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400 dark:text-slate-500">
                      No hay solicitudes pendientes
                    </td>
                  </tr>
                ) : (
                  solicitudes.map((solicitud) => (
                    <tr key={solicitud.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{solicitud.producto_nombre}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">{solicitud.notas || '—'}</td>
                      <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                        {solicitud.solicitado_por || 'Administrador'}
                      </td>
                      <td className="px-5 py-3 text-slate-400 dark:text-slate-500 text-xs">
                        {solicitud.creado_en ? new Date(solicitud.creado_en).toLocaleDateString('es-MX') : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Botón flotante solicitar reabastecimiento (empleado) ── */}
      {!esClinica && (
        <button
          onClick={() => setModalSolicitud(true)}
          className="fixed bottom-8 right-8 flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-2xl shadow-lg transition-colors z-40"
        >
          📦 Solicitar reabastecimiento
        </button>
      )}

      {/* ── Modal agregar/editar producto (clínica) ── */}
      {modalProducto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editando ? '✏️ Editar producto' : '➕ Nuevo producto'}
              </h3>
              <button
                onClick={() => setModalProducto(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={guardarProducto} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    value={formProducto.nombre}
                    onChange={e => setFormProducto(f => ({ ...f, nombre: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Ej. Amoxicilina 500mg"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Descripción</label>
                  <input
                    value={formProducto.descripcion}
                    onChange={e => setFormProducto(f => ({ ...f, descripcion: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Descripción opcional"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Stock actual</label>
                  <input
                    type="number" min="0"
                    value={formProducto.stock}
                    onChange={e => setFormProducto(f => ({ ...f, stock: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Stock mínimo</label>
                  <input
                    type="number" min="0"
                    value={formProducto.stock_minimo}
                    onChange={e => setFormProducto(f => ({ ...f, stock_minimo: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Precio ($)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={formProducto.precio}
                    onChange={e => setFormProducto(f => ({ ...f, precio: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Unidad</label>
                  <input
                    value={formProducto.unidad}
                    onChange={e => setFormProducto(f => ({ ...f, unidad: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    placeholder="Ej. tabletas, ml, frascos"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalProducto(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  {guardando ? 'Guardando…' : editando ? 'Actualizar' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal solicitar reabastecimiento (empleado) ── */}
      {modalSolicitud && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">📦 Solicitar reabastecimiento</h3>
              <button
                onClick={() => setModalSolicitud(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={enviarSolicitud} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Producto <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  value={formSolicitud.producto_nombre}
                  onChange={e => setFormSolicitud(f => ({ ...f, producto_nombre: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Nombre del producto a reabastecer"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Notas adicionales</label>
                <textarea
                  rows={3}
                  value={formSolicitud.notas}
                  onChange={e => setFormSolicitud(f => ({ ...f, notas: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  placeholder="Cantidad aproximada, urgencia, etc."
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModalSolicitud(false)}
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="flex-1 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  {enviando ? 'Enviando…' : 'Enviar solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Toast de notificación ── */}
      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-medium rounded-2xl shadow-xl animate-fade-in">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
