import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api';

const especieOptions = [
  { value: '', label: 'Seleccionar especie' },
  { value: 'Perro', label: 'Perro' },
  { value: 'Gato', label: 'Gato' },
  { value: 'Conejo', label: 'Conejo' },
  { value: 'Ave', label: 'Ave' },
  { value: 'Reptil', label: 'Reptil' },
  { value: 'Caballo', label: 'Caballo' },
];

const razaOptions = {
  Perro: ['Labrador', 'Pastor Alemán', 'Golden Retriever', 'Beagle', 'Rottweiler', 'Bulldog Francés', 'Chihuahua', 'Shih Tzu', 'Otro'],
  Gato: ['Siames', 'Persa', 'Maine Coon', 'Sphynx', 'Bengalí', 'Abisinio', 'Ragdoll', 'Otro'],
  Conejo: ['Angora', 'Neozelandés', 'Mini Lop', 'Belier', 'Holandés', 'Otro'],
  Ave: ['Periquito', 'Canario', 'Cacatúa', 'Loro', 'Agapornis', 'Otro'],
  Reptil: ['Iguana', 'Serpiente', 'Tortuga', 'Camaleón', 'Gecko', 'Otro'],
  Caballo: ['Pura Sangre', 'Andaluz', 'Cuarto de Milla', 'Criollo', 'Frisón', 'Otro'],
};

const especieColors = {
  Perro: '#B7791F',
  Gato: '#4A5568',
  Conejo: '#9F7AEA',
  Ave: '#319795',
  Reptil: '#2F855A',
  Caballo: '#D69E2E',
};

const razaColors = {
  labrador: '#D69E2E',
  'pastor alemán': '#A05622',
  'golden retriever': '#E9A34C',
  beagle: '#DD6B20',
  rottweiler: '#9B2C2C',
  'bulldog francés': '#F6AD55',
  chihuahua: '#F6E05E',
  'shih tzu': '#B794F4',
  siames: '#4A5568',
  persa: '#718096',
  'maine coon': '#6B46C1',
  sphynx: '#A0AEC0',
  bengalí: '#ED8936',
  abisinio: '#C05621',
  ragdoll: '#63B3ED',
  angora: '#F687B3',
  neozelandés: '#9F7AEA',
  'mini lop': '#F56565',
  belier: '#68D391',
  holandés: '#2B6CB0',
  periquito: '#48BB78',
  canario: '#F6E05E',
  cacatúa: '#D69E2E',
  loro: '#38B2AC',
  agapornis: '#2F855A',
  iguana: '#2F855A',
  serpiente: '#718096',
  tortuga: '#2C7A7B',
  camaleón: '#38A169',
  gecko: '#68D391',
  'pura sangre': '#C05621',
  andaluz: '#805AD5',
  'cuarto de milla': '#D69E2E',
  criollo: '#CC7722',
  frisón: '#2D3748',
};

function stringToColor(value) {
  const str = value?.trim().toLowerCase() || '';
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `hsl(${h}, 60%, 50%)`;
}

function getPreviewColor(especie, raza) {
  if (!raza) return especieColors[especie] || '#4B5563';
  const normalized = raza.trim().toLowerCase();
  return razaColors[normalized] || stringToColor(normalized);
}

export default function Pacientes() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [pacientes, setPacientes] = useState([]);
  const [tutores, setTutores] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    tutor_id: '', nombre: '', especie: '', raza: '', raza_custom: '',
    sexo: '', fecha_nacimiento: '', funcion_zootecnica: '',
    esquemas_preventivos: '', tatuaje: '', microchip: ''
  });

  const cargar = () => {
    API.get('/pacientes').then(r => setPacientes(r.data));
    API.get('/tutores').then(r => setTutores(r.data));
  };

  useEffect(() => {
    cargar();
    if (new URLSearchParams(search).get('new') === 'true') {
      setMostrarForm(true);
    }
  }, [search]);

  const guardar = async () => {
    const razaFinal = form.raza === 'Otro' ? form.raza_custom.trim() : form.raza;

    if (!form.tutor_id || !form.nombre || !form.especie || !form.sexo || !razaFinal) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    
    try {
      const datos = {
        tutor_id: parseInt(form.tutor_id),
        nombre: form.nombre,
        especie: form.especie,
        raza: razaFinal || null,
        sexo: form.sexo,
        fecha_nacimiento: form.fecha_nacimiento || null,
        funcion_zootecnica: form.funcion_zootecnica || null,
        esquemas_preventivos: form.esquemas_preventivos || null,
        tatuaje: form.tatuaje || null,
        microchip: form.microchip || null
      };
      
      await API.post('/pacientes', datos);
      setForm({ tutor_id: '', nombre: '', especie: '', raza: '', raza_custom: '', sexo: '', fecha_nacimiento: '', funcion_zootecnica: '', esquemas_preventivos: '', tatuaje: '', microchip: '' });
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
          <input placeholder="Nombre"
            value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <select value={form.especie} onChange={e => setForm({...form, especie: e.target.value, raza: '', raza_custom: ''})}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300">
            {especieOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={form.raza} onChange={e => setForm({...form, raza: e.target.value, raza_custom: ''})}
            disabled={!form.especie}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60">
            <option value="">Seleccionar raza</option>
            {(razaOptions[form.especie] || ['Otro']).map(raza => (
              <option key={raza} value={raza}>{raza}</option>
            ))}
          </select>
          {form.raza === 'Otro' && (
            <input placeholder="Escribe la raza"
              value={form.raza_custom} onChange={e => setForm({...form, raza_custom: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm col-span-2 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          )}
          {form.especie && (
            <div className="col-span-2 flex items-center gap-3 mt-1">
              <span className="h-8 w-8 rounded-lg border border-gray-200 dark:border-gray-700"
                style={{ backgroundColor: getPreviewColor(form.especie, form.raza === 'Otro' ? form.raza_custom : form.raza) }} />
              <p className="text-sm text-gray-700 dark:text-gray-200">
                Color activo para {form.raza === 'Otro' ? (form.raza_custom || 'otra raza') : form.raza || form.especie}
              </p>
            </div>
          )}
          <input placeholder="Función zootécnica"
            value={form.funcion_zootecnica} onChange={e => setForm({...form, funcion_zootecnica: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <input placeholder="Esquemas preventivos"
            value={form.esquemas_preventivos} onChange={e => setForm({...form, esquemas_preventivos: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <input placeholder="Tatuaje"
            value={form.tatuaje} onChange={e => setForm({...form, tatuaje: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <input placeholder="Microchip"
            value={form.microchip} onChange={e => setForm({...form, microchip: e.target.value})}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300" />
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