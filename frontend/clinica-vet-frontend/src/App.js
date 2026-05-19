import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './ThemeContext';
import { SelectedAnimalProvider } from './SelectedAnimalContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import Sidebar from './components/Sidebar';
import Login from './pages/Login';
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
import Calculadora from './pages/Calculadora';
import RegistroClinica from './pages/RegistroClinica';
import Empleados from './pages/Empleados';

// ─────────────────────────────────────────────────────────────
// ProtectedRoute — Redirige al Login si no hay sesión activa
// ─────────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  const { pathname } = useLocation();

  if (!isLoggedIn) {
    // Guarda la ruta intentada para redirigir después del login (opcional)
    return <Navigate to="/login" state={{ from: pathname }} replace />;
  }

  return children;
}

// ─────────────────────────────────────────────────────────────
// PublicRoute — Redirige al Dashboard si ya hay sesión activa
// (evita que un usuario logueado vea el Login)
// ─────────────────────────────────────────────────────────────
function PublicRoute({ children }) {
  const { isLoggedIn } = useAuth();

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ─────────────────────────────────────────────────────────────
// AppShell — Layout principal con Sidebar (solo rutas protegidas)
// ─────────────────────────────────────────────────────────────
function AppShell() {
  const { pathname } = useLocation();
  const isCalculadora = pathname === '/calculadora';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      <Sidebar />
      {/*
        Si estamos en /calculadora: overflow-hidden (Calculadora maneja su propio scroll interno).
        En cualquier otra ruta: overflow-y-auto (scroll normal de página).
      */}
      <main className={`flex-1 min-h-0 flex flex-col ${isCalculadora ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        <Routes>
          {/* Calculadora: ocupa todo el espacio disponible y gestiona su propio scroll */}
          <Route path="/calculadora" element={<Calculadora />} />

          {/* Resto de rutas: contenedor con padding estándar */}
          <Route path="/" element={<div className="p-6 max-w-7xl mx-auto"><Dashboard /></div>} />
          <Route path="/tutores" element={<div className="p-6 max-w-7xl mx-auto"><Tutores /></div>} />
          <Route path="/pacientes" element={<div className="p-6 max-w-7xl mx-auto"><Pacientes /></div>} />
          <Route path="/consultas" element={<div className="p-6 max-w-7xl mx-auto"><ConsultasRegistro /></div>} />
          <Route path="/hospitalizaciones" element={<div className="p-6 max-w-7xl mx-auto"><HospitalizacionesRegistro /></div>} />
          <Route path="/cirugias" element={<div className="p-6 max-w-7xl mx-auto"><CirugiasRegistro /></div>} />
          <Route path="/vacunas" element={<div className="p-6 max-w-7xl mx-auto"><VacunasRegistro /></div>} />
          <Route path="/reportes" element={<div className="p-6 max-w-7xl mx-auto"><Reportes /></div>} />
          <Route path="/expediente/:pacienteId" element={<div className="p-6 max-w-7xl mx-auto"><Expediente /></div>} />
          <Route path="/consulta/:pacienteId/:expedienteId" element={<div className="p-6 max-w-7xl mx-auto"><Consulta /></div>} />
          <Route path="/hospitalizacion/:pacienteId/:expedienteId" element={<div className="p-6 max-w-7xl mx-auto"><Hospitalizacion /></div>} />
          <Route path="/cirugia/:pacienteId/:expedienteId" element={<div className="p-6 max-w-7xl mx-auto"><Cirugia /></div>} />
          <Route path="/vacunas/:pacienteId" element={<div className="p-6 max-w-7xl mx-auto"><Vacunas /></div>} />
          <Route path="/empleados" element={<div className="p-6 max-w-7xl mx-auto"><Empleados /></div>} />
        </Routes>
      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Router raíz — Separa rutas públicas de rutas protegidas
// ─────────────────────────────────────────────────────────────
function AppRouter() {
  return (
    <Routes>
      {/* Ruta pública: Login */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      {/* Ruta pública: Registro de clínica */}
      <Route
        path="/registro"
        element={
          <PublicRoute>
            <RegistroClinica />
          </PublicRoute>
        }
      />

      {/* Todas las demás rutas requieren autenticación */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

// ─────────────────────────────────────────────────────────────
// App — Raíz de la aplicación con todos los providers
// Orden de providers (de afuera hacia adentro):
//   SelectedAnimalProvider → ThemeProvider → AuthProvider → BrowserRouter
// ─────────────────────────────────────────────────────────────
function App() {
  return (
    <SelectedAnimalProvider>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </SelectedAnimalProvider>
  );
}

export default App;
