import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';

export default function Vacunas() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  const [vacunas, setVacunas] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', fecha_aplicacion: '', proxima_dosis: '', lote: '', fabricante: '', via_administracion: '', dosis: '', observaciones: '' });

  useEffect(() => {
    API.get(`/vacunas/${pacienteId}`).then(r => setVacunas(r.data));
  }, [pacienteId]);

  const guardar = async () => {
    await API.post('/vacunas', { paciente_id: pacienteId, ...form });
    setForm({ nombre: '', fecha_aplicacion: '', proxima_dosis: '', lote: '', fabricante: '', via_administracion: '', dosis: '', observaciones: '' });
    setMostrarForm(false);
    API.get(`/vacunas/${pacienteId}`).then(r => setVacunas(r.data));
  };

  return (
    <div>
      <button onClick={() => navigate(`/expediente/${pacienteId}`)}
        className="text-blue-600 text-sm mb-4 hover:underline">← Volver al expediente</button>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Vacunas</h2>
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Nueva vacuna
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5 mb-6 grid grid-cols-2 gap-4">
          <input placeholder="Nombre de la vacuna" value={form.nombre}
            onChange={e => setForm({...form, nombre: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm col-span-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">Fecha de aplicacion</label>
            <input type="date" value={form.fecha_aplicacion}
              onChange={e => setForm({...form, fecha_aplicacion: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 dark:text-gray-400">Proxima dosis</label>
            <input type="date" value={form.proxima_dosis}
              onChange={e => setForm({...form, proxima_dosis: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
          <input placeholder="Lote" value={form.lote}
            onChange={e => setForm({...form, lote: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm col-span-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <input placeholder="Fabricante" value={form.fabricante}
            onChange={e => setForm({...form, fabricante: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <select value={form.via_administracion} onChange={e => setForm({...form, via_administracion: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="">Vía de administración</option>
            <option value="Subcutánea">Subcutánea</option>
            <option value="Intramuscular">Intramuscular</option>
            <option value="Intravenosa">Intravenosa</option>
            <option value="Oral">Oral</option>
            <option value="Otro">Otro</option>
          </select>
          <input placeholder="Dosis" value={form.dosis}
            onChange={e => setForm({...form, dosis: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <textarea placeholder="Observaciones" rows={2} value={form.observaciones}
            onChange={e => setForm({...form, observaciones: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm col-span-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <button onClick={guardar}
            className="col-span-2 bg-green-500 text-white py-2 rounded-lg text-sm hover:bg-green-600">
            Guardar vacuna
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
        <div className="flex gap-4 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-red-100 border border-red-300"></span> Vencida o vence hoy</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 rounded-sm bg-yellow-100 border border-yellow-300"></span> Vence en 30 días</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs">
            <tr>{['Vacuna','Aplicacion','Proxima dosis','Lote','Fabricante','Vía','Dosis'].map(h => (
              <th key={h} className="px-4 py-3 text-left">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {vacunas.map(v => {
              const hoy = new Date();
              hoy.setHours(0, 0, 0, 0);
              let rowClass = 'border-t dark:border-gray-700 dark:text-gray-200';
              if (v.proxima_dosis) {
                const proxima = new Date(v.proxima_dosis);
                proxima.setHours(0, 0, 0, 0);
                const diffDias = Math.ceil((proxima - hoy) / (1000 * 60 * 60 * 24));
                if (diffDias <= 0) {
                  rowClass = 'border-t border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-700 text-red-800 dark:text-red-200';
                } else if (diffDias <= 30) {
                  rowClass = 'border-t border-yellow-200 bg-yellow-50 dark:bg-yellow-900/30 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200';
                }
              }
              return (
              <tr key={v.id} className={rowClass}>
                <td className="px-4 py-3 font-medium">{v.nombre}</td>
                <td className="px-4 py-3">{new Date(v.fecha_aplicacion).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                <td className="px-4 py-3">{v.proxima_dosis ? new Date(v.proxima_dosis).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}</td>
                <td className="px-4 py-3">{v.lote || '—'}</td>
                <td className="px-4 py-3">{v.fabricante || '—'}</td>
                <td className="px-4 py-3">{v.via_administracion || '—'}</td>
                <td className="px-4 py-3">{v.dosis || '—'}</td>
              </tr>
              );
            })}
            {vacunas.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">Sin vacunas registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}