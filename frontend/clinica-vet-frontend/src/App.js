import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Tutores from './pages/Tutores';
import Pacientes from './pages/Pacientes';
import Expediente from './pages/Expediente';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="flex h-screen bg-gray-100 dark:bg-gray-800">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tutores" element={<Tutores />} />
              <Route path="/pacientes" element={<Pacientes />} />
              <Route path="/expediente/:pacienteId" element={<Expediente />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;