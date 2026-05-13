import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Tutores() {
  const [tutores, setTutores] = useState([]);
  const [form, setForm] = useState({ nombre: '', apellidos: '', telefono: '', correo: '', direccion: '' });
  const [mostrarForm, setMostrarForm] = useState(false);

  const cargar = () => axios.get('http://localhost:4000/api/tutores').then(r => setTutores(r.data));

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    await axios.post('http://localhost:4000/api/tutores', form);
    setForm({ nombre: '', apellidos: '', telefono: '', correo: '', direccion: '' });
    setMostrarForm(false);
    cargar();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tutores</h2>
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Nuevo tutor
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-xl shadow p-5 mb-6 grid grid-cols-2 gap-4">
          {['nombre','apellidos','telefono','correo','direccion'].map(f => (
            <input key={f} placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
              value={form[f]} onChange={e => setForm({...form, [f]: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          ))}
          <button onClick={guardar}
            className="col-span-2 bg-green-500 text-white py-2 rounded-lg text-sm hover:bg-green-600">
            Guardar
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs">
            <tr>{['Nombre','Teléfono','Correo','Dirección'].map(h => (
              <th key={h} className="px-4 py-3 text-left">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {tutores.map(t => (
              <tr key={t.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200">
                <td className="px-4 py-3 font-medium">{t.nombre} {t.apellidos}</td>
                <td className="px-4 py-3">{t.telefono}</td>
                <td className="px-4 py-3">{t.correo}</td>
                <td className="px-4 py-3">{t.direccion}</td>
              </tr>
            ))}
            {tutores.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Sin tutores registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}