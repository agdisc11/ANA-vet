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

function App() {
  return (
    <SelectedAnimalProvider>
      <ThemeProvider>
        <BrowserRouter>
          <div className="flex h-screen bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-6 text-gray-900 dark:text-gray-100">
              <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tutores" element={<Tutores />} />
              <Route path="/pacientes" element={<Pacientes />} />
              <Route path="/expediente/:pacienteId" element={<Expediente />} />
              <Route path="/consulta/:pacienteId/:expedienteId" element={<Consulta />} />
              <Route path="/hospitalizacion/:pacienteId/:expedienteId" element={<Hospitalizacion />} />
              <Route path="/cirugia/:pacienteId/:expedienteId" element={<Cirugia />} />
              <Route path="/vacunas/:pacienteId" element={<Vacunas />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  </SelectedAnimalProvider>
  );
}

export default App;