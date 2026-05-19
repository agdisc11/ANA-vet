import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import { useSelectedAnimal } from '../SelectedAnimalContext';

function InfoItem({ label, value }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  );
}

export default function Expediente() {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  const { setSelectedAnimal } = useSelectedAnimal();
  const [paciente, setPaciente] = useState(null);
  const [expedientes, setExpedientes] = useState([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    setSelectedAnimal(null);
    API.get(`/pacientes/${pacienteId}`).then(r => setPaciente(r.data));
    API.get(`/expedientes/${pacienteId}`).then(r => setExpedientes(r.data));
  }, [pacienteId, setSelectedAnimal]);

  useEffect(() => {
    if (paciente) setSelectedAnimal(paciente);
  }, [paciente, setSelectedAnimal]);

  useEffect(() => {
    return () => setSelectedAnimal(null);
  }, [setSelectedAnimal]);

  const guardar = async () => {
    setCreando(true);
    try {
      await API.post('/expedientes', { paciente_id: pacienteId });
      setMostrarForm(false);
      API.get(`/expedientes/${pacienteId}`).then(r => setExpedientes(r.data));
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Back */}
      <button onClick={() => navigate('/pacientes')} className="back-link">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Volver a Pacientes
      </button>

      {/* Patient card */}
      {paciente && (
        <div className="card p-5 mb-6">
          <div className="flex flex-wrap items-start gap-6">
            {/* Avatar */}
            <div className="w-14 h-14 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-2xl flex-shrink-0">
              {paciente.especie === 'Perro' ? '🐕' : paciente.especie === 'Gato' ? '🐈' : paciente.especie === 'Conejo' ? '🐇' : paciente.especie === 'Ave' ? '🦜' : paciente.especie === 'Reptil' ? '🦎' : paciente.especie === 'Caballo' ? '🐴' : '🐾'}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{paciente.nombre}</h1>
                <span className={paciente.sexo === 'Macho' ? 'badge-blue' : 'badge-purple'}>
                  {paciente.sexo === 'Macho' ? '♂' : '♀'} {paciente.sexo}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Tutor: <span className="font-medium text-slate-700 dark:text-slate-300">{paciente.tutor}</span></p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <InfoItem label="Especie" value={paciente.especie} />
                <InfoItem label="Raza" value={paciente.raza} />
                <InfoItem label="Función zootécnica" value={paciente.funcion_zootecnica} />
                <InfoItem label="Esquemas preventivos" value={paciente.esquemas_preventivos} />
                <InfoItem label="Tatuaje" value={paciente.tatuaje} />
                <InfoItem label="Microchip" value={paciente.microchip} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
            <button
              onClick={() => navigate(`/vacunas/${pacienteId}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 text-xs font-semibold hover:bg-teal-100 dark:hover:bg-teal-900/40 transition-colors"
            >
              💉 Ver vacunas
            </button>
          </div>
        </div>
      )}

      {/* Expedientes header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Expedientes clínicos</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">{expedientes.length} expediente{expedientes.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setMostrarForm(!mostrarForm)} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo expediente
        </button>
      </div>

      {/* New expediente form */}
      {mostrarForm && (
        <div className="form-section animate-slide-up mb-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            Se generará un número de expediente automáticamente. Las consultas, hospitalizaciones y cirugías se registran desde sus secciones.
          </p>
          <div className="flex gap-3">
            <button onClick={guardar} disabled={creando} className="btn-success disabled:opacity-50">
              {creando ? 'Creando...' : 'Crear expediente'}
            </button>
            <button onClick={() => setMostrarForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      {/* Expedientes list */}
      <div className="space-y-3">
        {expedientes.map(e => (
          <div key={e.id} className="card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <span className="badge-purple mb-1">Expediente #{e.id}</span>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Apertura: {e.fecha_apertura}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate(`/consulta/${pacienteId}/${e.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-semibold hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Consultas
              </button>
              <button
                onClick={() => navigate(`/hospitalizacion/${pacienteId}/${e.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Hospitalización
              </button>
              <button
                onClick={() => navigate(`/cirugia/${pacienteId}/${e.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Cirugía
              </button>
              <button
                onClick={() => navigate(`/recibo/${pacienteId}/${e.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
              >
                🧾 Recibo
              </button>
            </div>
          </div>
        ))}

        {expedientes.length === 0 && (
          <div className="card p-10 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sin expedientes clínicos</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Crea el primer expediente para este paciente</p>
          </div>
        )}
      </div>
    </div>
  );
}
