import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../api';

const PAGE_SIZE = 10;

export default function Tutores() {
  const { search } = useLocation();
  const [tutores, setTutores] = useState([]);
  const [form, setForm] = useState({ nombre: '', apellidos: '', telefono: '', whatsapp: '', correo: '', direccion: '' });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    API.get('/tutores').then(r => setTutores(r.data));
    if (new URLSearchParams(search).get('new') === 'true') {
      setMostrarForm(true);
    }
  }, [search]);

  // Reset page when search changes
  useEffect(() => {
    setPagina(1);
  }, [busqueda]);

  const guardar = async () => {
    try {
      await API.post('/tutores', form);
      setForm({ nombre: '', apellidos: '', telefono: '', whatsapp: '', correo: '', direccion: '' });
      setMostrarForm(false);
      API.get('/tutores').then(r => setTutores(r.data));
    } catch (error) {
      console.error('Error al guardar tutor:', error);
    }
  };

  const tutoresFiltrados = tutores.filter(t => {
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

  const totalPaginas = Math.max(1, Math.ceil(tutoresFiltrados.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const tutoresPagina = tutoresFiltrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Tutores</h2>
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Nuevo tutor
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5 mb-6 grid grid-cols-2 gap-4">
          {['nombre','apellidos','telefono','whatsapp','correo','direccion'].map(f => (
            <input key={f} placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
              value={form[f]} onChange={e => setForm({...form, [f]: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          ))}
          <button onClick={guardar}
            className="col-span-2 bg-green-500 text-white py-2 rounded-lg text-sm hover:bg-green-600">
            Guardar
          </button>
        </div>
      )}

      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre, apellidos, teléfono, correo o dirección..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          className="w-full border rounded-lg px-4 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs">
            <tr>{['Código','Nombre','Teléfono','WhatsApp','Correo','Dirección'].map(h => (
              <th key={h} className="px-4 py-3 text-left">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {tutoresPagina.map(t => (
              <tr key={t.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200">
                <td className="px-4 py-3 font-medium">{t.codigo || '—'}</td>
                <td className="px-4 py-3 font-medium">{t.nombre} {t.apellidos}</td>
                <td className="px-4 py-3">{t.telefono}</td>
                <td className="px-4 py-3">{t.whatsapp || '—'}</td>
                <td className="px-4 py-3">{t.correo}</td>
                <td className="px-4 py-3">{t.direccion}</td>
              </tr>
            ))}
            {tutoresPagina.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Sin tutores registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Página {paginaActual} de {totalPaginas} &mdash; {tutoresFiltrados.length} resultado{tutoresFiltrados.length !== 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
              ← Anterior
            </button>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPagina(n)}
                className={`px-3 py-1 rounded-lg border text-sm dark:border-gray-600 ${n === paginaActual ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200'}`}>
                {n}
              </button>
            ))}
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className="px-3 py-1 rounded-lg border text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
