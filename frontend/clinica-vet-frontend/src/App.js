import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { SelectedAnimalProvider } from './SelectedAnimalContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Tutores from './pages/Tutores';
import Pacientes from './pages/Pacientes';
import Expediente from './pages/Expediente';
import Consulta from './pages/Consulta';
import Hospitalizacion from './pages/Hospitalizacion';
import Cirugia from './pages/Cirugia';
import Vacunas from './pages/Vacunas';
import ConsultasRegistro from './pages/ConsultasRegistro';
import HospitalizacionesRegistro from './pages/HospitalizacionesRegistro';
import CirugiasRegistro from './pages/CirugiasRegistro';
import VacunasRegistro from './pages/VacunasRegistro';
import Reportes from './pages/Reportes';

function App() {
  return (
    <SelectedAnimalProvider>
      <ThemeProvider>
        <BrowserRouter>
          <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto">
              <div className="p-6 max-w-7xl mx-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tutores" element={<Tutores />} />
                  <Route path="/pacientes" element={<Pacientes />} />
                  <Route path="/consultas" element={<ConsultasRegistro />} />
                  <Route path="/hospitalizaciones" element={<HospitalizacionesRegistro />} />
                  <Route path="/cirugias" element={<CirugiasRegistro />} />
                  <Route path="/vacunas" element={<VacunasRegistro />} />
                  <Route path="/reportes" element={<Reportes />} />
                  <Route path="/expediente/:pacienteId" element={<Expediente />} />
                  <Route path="/consulta/:pacienteId/:expedienteId" element={<Consulta />} />
                  <Route path="/hospitalizacion/:pacienteId/:expedienteId" element={<Hospitalizacion />} />
                  <Route path="/cirugia/:pacienteId/:expedienteId" element={<Cirugia />} />
                  <Route path="/vacunas/:pacienteId" element={<Vacunas />} />
                </Routes>
              </div>
            </main>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </SelectedAnimalProvider>
  );
}

export default App;
