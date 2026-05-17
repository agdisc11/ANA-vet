import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import { breedColorMap as razaColors, speciesColorMap as especieColors } from '../SelectedAnimalContext';

const especieOptions = [
  { value: '', label: 'Seleccionar especie' },
  { value: 'Perro', label: '🐕 Perro' },
  { value: 'Gato', label: '🐈 Gato' },
  { value: 'Conejo', label: '🐇 Conejo' },
  { value: 'Ave', label: '🦜 Ave' },
  { value: 'Reptil', label: '🦎 Reptil' },
  { value: 'Caballo', label: '🐴 Caballo' },
];

const razaOptions = {
  Perro: ['Labrador', 'Pastor Alemán', 'Golden Retriever', 'Beagle', 'Rottweiler', 'Bulldog Francés', 'Chihuahua', 'Shih Tzu', 'Otro'],
  Gato: ['Siames', 'Persa', 'Maine Coon', 'Sphynx', 'Bengalí', 'Abisinio', 'Ragdoll', 'Otro'],
  Conejo: ['Angora', 'Neozelandés', 'Mini Lop', 'Belier', 'Holandés', 'Otro'],
  Ave: ['Periquito', 'Canario', 'Cacatúa', 'Loro', 'Agapornis', 'Otro'],
  Reptil: ['Iguana', 'Serpiente', 'Tortuga', 'Camaleón', 'Gecko', 'Otro'],
  Caballo: ['Pura Sangre', 'Andaluz', 'Cuarto de Milla', 'Criollo', 'Frisón', 'Otro'],
};

function stringToColor(value) {
  const str = value?.trim().toLowerCase() || '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash % 360)}, 60%, 50%)`;
}

function getPreviewColor(especie, raza) {
  if (!raza) return especieColors[especie?.toLowerCase()] || '#4B5563';
  const n = raza.trim().toLowerCase();
  return razaColors[n] || stringToColor(n);
}

const PAGE_SIZE = 10;

const EMPTY = {
  tutor_id: '', nombre: '', especie: '', raza: '', raza_custom: '',
  sexo: '', fecha_nacimiento: '', funcion_zootecnica: '',
  esquemas_preventivos: '', tatuaje: '', microchip: ''
};

export default function Pacientes() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [pacientes, setPacientes] = useState([]);
  const [tutores, setTutores] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    API.get('/pacientes').then(r => setPacientes(r.data));
    API.get('/tutores').then(r => setTutores(r.data));
  };

  useEffect(() => {
    cargar();
    const params = new URLSearchParams(search);
    if (params.get('action') === 'new') {
      setMostrarForm(true);
      window.history.replaceState({}, '', '/pacientes');
    }
  }, [search]);

  useEffect(() => { setPagina(1); }, [busqueda]);

  const guardar = async () => {
    const razaFinal = form.raza === 'Otro' ? form.raza_custom.trim() : form.raza;
    if (!form.tutor_id || !form.nombre || !form.especie || !form.sexo || !razaFinal) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    setGuardando(true);
    try {
      await API.post('/pacientes', {
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
      });
      setForm(EMPTY);
      setMostrarForm(false);
      cargar();
    } catch (error) {
      alert('Error al guardar: ' + (error.response?.data?.error || error.message));
    } finally {
      setGuardando(false);
    }
  };

  const filtrados = pacientes.filter(p => {
    const q = busqueda.toLowerCase();
    return (
      p.nombre?.toLowerCase().includes(q) ||
      p.especie?.toLowerCase().includes(q) ||
      p.raza?.toLowerCase().includes(q) ||
      p.sexo?.toLowerCase().includes(q) ||
      p.tutor?.toLowerCase().includes(q)
    );
  });

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaActual = Math.min(pagina, totalPaginas);
  const pagina_items = filtrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);

  const razaFinalPreview = form.raza === 'Otro' ? form.raza_custom : form.raza;
  const previewColor = form.especie ? getPreviewColor(form.especie, razaFinalPreview) : null;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Pacientes</h1>
          <p className="page-subtitle">{pacientes.length} animal{pacientes.length !== 1 ? 'es' : ''} registrado{pacientes.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setMostrarForm(!mostrarForm); setForm(EMPTY); }}
          className="btn-primary"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo paciente
        </button>
      </div>

      {/* Form */}
      {mostrarForm && (
        <div className="form-section animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Registrar paciente</h2>
            <button onClick={() => setMostrarForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tutor */}
            <div className="sm:col-span-2">
              <label className="input-label">Tutor *</label>
              <select value={form.tutor_id} onChange={e => setForm({ ...form, tutor_id: e.target.value })} className="input">
                <option value="">Seleccionar tutor</option>
                {tutores.map(t => <option key={t.id} value={t.id}>{t.nombre} {t.apellidos}</option>)}
              </select>
            </div>

            {/* Nombre */}
            <div>
              <label className="input-label">Nombre *</label>
              <input placeholder="Nombre del paciente" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="input" />
            </div>

            {/* Especie */}
            <div>
              <label className="input-label">Especie *</label>
              <select value={form.especie} onChange={e => setForm({ ...form, especie: e.target.value, raza: '', raza_custom: '' })} className="input">
                {especieOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            {/* Raza */}
            <div>
              <label className="input-label">Raza *</label>
              <select value={form.raza} onChange={e => setForm({ ...form, raza: e.target.value, raza_custom: '' })} disabled={!form.especie} className="input disabled:opacity-50 disabled:cursor-not-allowed">
                <option value="">Seleccionar raza</option>
                {(razaOptions[form.especie] || ['Otro']).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Raza custom */}
            {form.raza === 'Otro' && (
              <div>
                <label className="input-label">Especificar raza</label>
                <input placeholder="Escribe la raza" value={form.raza_custom} onChange={e => setForm({ ...form, raza_custom: e.target.value })} className="input" />
              </div>
            )}

            {/* Color preview */}
            {previewColor && (
              <div className="sm:col-span-2 flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div className="w-8 h-8 rounded-lg border-2 border-white dark:border-slate-700 shadow-sm flex-shrink-0" style={{ backgroundColor: previewColor }} />
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Color del sidebar para <strong>{razaFinalPreview || form.especie}</strong>
                </p>
              </div>
            )}

            {/* Sexo */}
            <div>
              <label className="input-label">Sexo *</label>
              <select value={form.sexo} onChange={e => setForm({ ...form, sexo: e.target.value })} className="input">
                <option value="">Seleccionar</option>
                <option value="Macho">♂ Macho</option>
                <option value="Hembra">♀ Hembra</option>
              </select>
            </div>

            {/* Fecha nacimiento */}
            <div>
              <label className="input-label">Fecha de nacimiento</label>
              <input type="date" value={form.fecha_nacimiento} onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })} className="input" />
            </div>

            {/* Función zootécnica */}
            <div>
              <label className="input-label">Función zootécnica</label>
              <input placeholder="Ej: Mascota, Trabajo, Reproducción" value={form.funcion_zootecnica} onChange={e => setForm({ ...form, funcion_zootecnica: e.target.value })} className="input" />
            </div>

            {/* Esquemas preventivos */}
            <div>
              <label className="input-label">Esquemas preventivos</label>
              <input placeholder="Ej: Completo, Incompleto" value={form.esquemas_preventivos} onChange={e => setForm({ ...form, esquemas_preventivos: e.target.value })} className="input" />
            </div>

            {/* Tatuaje */}
            <div>
              <label className="input-label">Tatuaje</label>
              <input placeholder="Número de tatuaje" value={form.tatuaje} onChange={e => setForm({ ...form, tatuaje: e.target.value })} className="input" />
            </div>

            {/* Microchip */}
            <div>
              <label className="input-label">Microchip</label>
              <input placeholder="Número de microchip" value={form.microchip} onChange={e => setForm({ ...form, microchip: e.target.value })} className="input" />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={guardar} disabled={guardando} className="btn-success disabled:opacity-50">
              {guardando ? 'Guardando...' : 'Guardar paciente'}
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
          placeholder="Buscar por nombre, especie, raza, tutor..."
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
              {['Paciente', 'Especie', 'Raza', 'Sexo', 'Esquemas', 'Tutor', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagina_items.map(p => (
              <tr key={p.id} onClick={() => navigate(`/expediente/${p.id}`)} className="table-row">
                <td className="table-cell font-semibold text-slate-800 dark:text-slate-200">{p.nombre}</td>
                <td className="table-cell">{p.especie}</td>
                <td className="table-cell text-slate-500 dark:text-slate-400">{p.raza || '—'}</td>
                <td className="table-cell">
                  <span className={p.sexo === 'Macho' ? 'badge-blue' : 'badge-purple'}>
                    {p.sexo === 'Macho' ? '♂' : '♀'} {p.sexo}
                  </span>
                </td>
                <td className="table-cell">{p.esquemas_preventivos || '—'}</td>
                <td className="table-cell">{p.tutor}</td>
                <td className="table-cell">
                  <span className="text-violet-600 dark:text-violet-400 font-medium text-xs">Ver →</span>
                </td>
              </tr>
            ))}
            {pagina_items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <div className="text-slate-400 dark:text-slate-500">
                    <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <p className="text-sm font-medium">Sin pacientes registrados</p>
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
