import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

export default function Pacientes() {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState([]);
  const [tutores, setTutores] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    tutor_id: '', nombre: '', especie: '', raza: '',
    sexo: '', fecha_nacimiento: '', funcion_zootecnica: '',
    esquemas_preventivos: '', tatuaje: '', microchip: ''
  });

  const cargar = () => {
    API.get('/pacientes').then(r => setPacientes(r.data));
    API.get('/tutores').then(r => setTutores(r.data));
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    if (!form.tutor_id || !form.nombre || !form.especie || !form.sexo) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    
    try {
      const datos = {
        tutor_id: parseInt(form.tutor_id),
        nombre: form.nombre,
        especie: form.especie,
        raza: form.raza || null,
        sexo: form.sexo,
        fecha_nacimiento: form.fecha_nacimiento || null,
        funcion_zootecnica: form.funcion_zootecnica || null,
        esquemas_preventivos: form.esquemas_preventivos || null,
        tatuaje: form.tatuaje || null,
        microchip: form.microchip || null
      };
      
      await API.post('/pacientes', datos);
      setForm({ tutor_id: '', nombre: '', especie: '', raza: '', sexo: '', fecha_nacimiento: '', funcion_zootecnica: '', esquemas_preventivos: '', tatuaje: '', microchip: '' });
      setMostrarForm(false);
      cargar();
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
      alert('Error al guardar: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Pacientes</h2>
        <button onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
          + Nuevo paciente
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-5 mb-6 grid grid-cols-2 gap-4">
          <select value={form.tutor_id} onChange={e => setForm({...form, tutor_id: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm col-span-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="">Seleccionar tutor</option>
            {tutores.map(t => <option key={t.id} value={t.id}>{t.nombre} {t.apellidos}</option>)}
          </select>
          {[
            { key: 'nombre', label: 'Nombre' },
            { key: 'especie', label: 'Especie' },
            { key: 'raza', label: 'Raza' },
            { key: 'funcion_zootecnica', label: 'Función zootécnica' },
            { key: 'esquemas_preventivos', label: 'Esquemas preventivos' },
            { key: 'tatuaje', label: 'Tatuaje' },
            { key: 'microchip', label: 'Microchip' },
          ].map(f => (
            <input key={f.key} placeholder={f.label}
              value={form[f.key]} onChange={e => setForm({...form, [f.key]: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          ))}
          <select value={form.sexo} onChange={e => setForm({...form, sexo: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300">
            <option value="">Sexo</option>
            <option value="Macho">Macho</option>
            <option value="Hembra">Hembra</option>
          </select>
          <input type="date" value={form.fecha_nacimiento}
            onChange={e => setForm({...form, fecha_nacimiento: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <button onClick={guardar}
            className="col-span-2 bg-green-500 text-white py-2 rounded-lg text-sm hover:bg-green-600">
            Guardar
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 uppercase text-xs">
            <tr>{['Nombre','Especie','Raza','Sexo','Esquemas preventivos','Tutor'].map(h => (
              <th key={h} className="px-4 py-3 text-left">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {pacientes.map(p => (
              <tr key={p.id} onClick={() => navigate(`/expediente/${p.id}`)} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200 cursor-pointer">
                <td className="px-4 py-3 font-medium">{p.nombre}</td>
                <td className="px-4 py-3">{p.especie}</td>
                <td className="px-4 py-3">{p.raza}</td>
                <td className="px-4 py-3">{p.sexo}</td>
                <td className="px-4 py-3">{p.esquemas_preventivos || '—'}</td>
                <td className="px-4 py-3">{p.tutor}</td>
              </tr>
            ))}
            {pacientes.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Sin pacientes registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}