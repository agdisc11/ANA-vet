import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../api';

const PAGE_SIZE = 10;

const EMPTY = { nombre: '', apellidos: '', telefono: '', whatsapp: '', correo: '', direccion: '' };

export default function Tutores() {
  const { search } = useLocation();
  const [tutores, setTutores] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    API.get('/tutores').then(r => setTutores(r.data));
    if (new URLSearchParams(search).get('new') === 'true') setMostrarForm(true);
  }, [search]);

  useEffect(() => { setPagina(1); }, [busqueda]);

  const guardar = async () => {
    if (!form.nombre.trim()) return;
    setGuardando(true);
    try {
      await API.post('/tutores', form);
      setForm(EMPTY);
      setMostrarForm(false);
      API.get('/tutores').then(r => setTutores(r.data));
    } catch (e) {
      console.error(e);
    } finally {
      setGuardando(false);
    }
  };

  const filtrados = tutores.filter(t => {
    const q = busqueda.toLowerCase();
    return (
      t.nombre?.toLowerCase().includes(q) ||
      t.apellidos?.toLowerCase().includes(q) ||
      t.telefono?.toLowerCase().includes(q) ||
      t.correo?.toLowerCase().includes(q) ||
      t.direccion?.toLowerCase().includes(q) ||
      t.codigo?.toLowerCase().includes(q)
    );
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const pagina_items = filtrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);

  const campos = [
    { key: 'nombre', label: 'Nombre *', placeholder: 'Nombre' },
    { key: 'apellidos', label: 'Apellidos', placeholder: 'Apellidos' },
    { key: 'telefono', label: 'Teléfono', placeholder: '555-000-0000' },
    { key: 'whatsapp', label: 'WhatsApp', placeholder: '555-000-0000' },
    { key: 'correo', label: 'Correo', placeholder: 'correo@ejemplo.com' },
    { key: 'direccion', label: 'Dirección', placeholder: 'Calle, colonia, ciudad' },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Tutores</h1>
          <p className="page-subtitle">{tutores.length} propietario{tutores.length !== 1 ? 's' : ''} registrado{tutores.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setMostrarForm(!mostrarForm); setForm(EMPTY); }}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo tutor
        </button>
      </div>

      {/* Form */}
      {mostrarForm && (
        <div className="form-section animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Registrar tutor</h2>
            <button onClick={() => setMostrarForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {campos.map(c => (
              <div key={c.key}>
                <label className="input-label">{c.label}</label>
                <input
                  placeholder={c.placeholder}
                  value={form[c.key]}
                  onChange={e => setForm({ ...form, [c.key]: e.target.value })}
                  className="input"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={guardar} disabled={guardando || !form.nombre.trim()} className="btn-success disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar tutor'}
            </button>
            <button onClick={() => setMostrarForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono, correo..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="input pl-9"
        />
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              {['Código', 'Nombre', 'Teléfono', 'WhatsApp', 'Correo', 'Dirección'].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagina_items.map(t => (
              <tr key={t.id} className="table-row">
                <td className="table-cell">
                  <span className="badge-blue">{t.codigo || '—'}</span>
                </td>
                <td className="table-cell font-semibold text-slate-800 dark:text-slate-200">{t.nombre} {t.apellidos}</td>
                <td className="table-cell">{t.telefono || '—'}</td>
                <td className="table-cell">{t.whatsapp || '—'}</td>
                <td className="table-cell">{t.correo || '—'}</td>
                <td className="table-cell text-slate-500 dark:text-slate-400">{t.direccion || '—'}</td>
              </tr>
            ))}
            {pagina_items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="text-slate-400 dark:text-slate-500">
                    <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm font-medium">Sin tutores registrados</p>
                    {busqueda && <p className="text-xs mt-1">Intenta con otra búsqueda</p>}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Página {paginaActual} de {totalPaginas} · {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-1.5">
            <button onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={paginaActual === 1} className="page-btn">←</button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPagina(n)} className={n === paginaActual ? 'page-btn-active' : 'page-btn'}>{n}</button>
            ))}
            <button onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas} className="page-btn">→</button>
          </div>
        </div>
      )}
    </div>
  );
}
