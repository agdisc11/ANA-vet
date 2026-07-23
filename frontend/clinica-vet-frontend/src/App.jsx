import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './ThemeContext';
import { SelectedAnimalProvider } from './SelectedAnimalContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';

import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import PageLayout from './components/PageLayout';
import CommandPalette from './components/CommandPalette';
import { PageLoader } from './components/Loaders';

// Páginas públicas/ligeras → carga inmediata
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import RegistroClinica from './pages/RegistroClinica';
// Carnet público: sin sesión ni layout de la app (lo abre el tutor desde el QR)
const CarnetPublico = lazy(() => import('./pages/CarnetPublico'));

// Páginas protegidas → carga diferida (code-splitting por ruta).
// El bundle inicial deja de incluir jsPDF (Recibo) y las 10
// calculadoras: solo se descargan al entrar a esas vistas.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Agenda = lazy(() => import('./pages/Agenda'));
const Tutores = lazy(() => import('./pages/Tutores'));
const Pacientes = lazy(() => import('./pages/Pacientes'));
const Expediente = lazy(() => import('./pages/Expediente'));
const Consulta = lazy(() => import('./pages/Consulta'));
const Hospitalizacion = lazy(() => import('./pages/Hospitalizacion'));
const Cirugia = lazy(() => import('./pages/Cirugia'));
const Vacunas = lazy(() => import('./pages/Vacunas'));
const ConsultasRegistro = lazy(() => import('./pages/ConsultasRegistro'));
const HospitalizacionesRegistro = lazy(() => import('./pages/HospitalizacionesRegistro'));
const CirugiasRegistro = lazy(() => import('./pages/CirugiasRegistro'));
const VacunasRegistro = lazy(() => import('./pages/VacunasRegistro'));
const Reportes = lazy(() => import('./pages/Reportes'));
const Recordatorios = lazy(() => import('./pages/Recordatorios'));
const FlujoDelDia = lazy(() => import('./pages/FlujoDelDia'));
const HojaTratamiento = lazy(() => import('./pages/HojaTratamiento'));
const Calculadora = lazy(() => import('./pages/Calculadora'));
const Empleados = lazy(() => import('./pages/Empleados'));
const Recibo = lazy(() => import('./pages/Recibo'));
const Inventario = lazy(() => import('./pages/Inventario'));

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
// Responsivo: en pantallas < lg el sidebar se convierte en un
// drawer accesible mediante el botón de menú del header móvil.
// ─────────────────────────────────────────────────────────────
function AppShell() {
  const { pathname } = useLocation();
  const isCalculadora = pathname === '/calculadora';
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cierra el drawer al navegar a otra ruta
  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

  // Estable: el CommandPalette la usa como dependencia de su listener
  // de teclado, y una función nueva por render lo re-suscribiría siempre.
  const cerrarPalette = useCallback(() => setPaletteOpen(false), []);

  // Atajo global de la búsqueda (Fase 4.1). Se registra una sola vez y
  // vive en el shell para que funcione desde cualquier página.
  // preventDefault evita que el navegador abra SU barra de búsqueda.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((abierto) => !abierto);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        onOpenSearch={() => setPaletteOpen(true)}
      />
      <CommandPalette open={paletteOpen} onClose={cerrarPalette} />
      {/*
        Si estamos en /calculadora: overflow-hidden (Calculadora maneja su propio scroll interno).
        En cualquier otra ruta: overflow-y-auto (scroll normal de página).
      */}
      <main className={`flex-1 min-h-0 flex flex-col ${isCalculadora ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {/* Header móvil con botón de menú (solo < lg) */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-4 py-3 backdrop-blur-md">
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Abrir menú"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">ANA-vet</span>
          <button
            onClick={() => setPaletteOpen(true)}
            aria-label="Buscar"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Calculadora: ocupa todo el espacio disponible y gestiona su propio scroll */}
          <Route path="/calculadora" element={<Calculadora />} />

          {/* Resto de rutas: contenedor con padding estándar */}
          <Route path="/" element={<PageLayout><Dashboard /></PageLayout>} />
          <Route path="/agenda" element={<PageLayout><Agenda /></PageLayout>} />
          <Route path="/tutores" element={<PageLayout><Tutores /></PageLayout>} />
          <Route path="/pacientes" element={<PageLayout><Pacientes /></PageLayout>} />
          <Route path="/consultas" element={<PageLayout><ConsultasRegistro /></PageLayout>} />
          <Route path="/hospitalizaciones" element={<PageLayout><HospitalizacionesRegistro /></PageLayout>} />
          <Route path="/cirugias" element={<PageLayout><CirugiasRegistro /></PageLayout>} />
          <Route path="/vacunas" element={<PageLayout><VacunasRegistro /></PageLayout>} />
          <Route path="/reportes" element={<PageLayout><Reportes /></PageLayout>} />
          <Route path="/recordatorios" element={<PageLayout><Recordatorios /></PageLayout>} />
          <Route path="/flujo" element={<PageLayout><FlujoDelDia /></PageLayout>} />
          <Route path="/tratamiento/:hospitalizacionId" element={<PageLayout><HojaTratamiento /></PageLayout>} />
          <Route path="/expediente/:pacienteId" element={<PageLayout><Expediente /></PageLayout>} />
          <Route path="/consulta/:pacienteId/:expedienteId" element={<PageLayout><Consulta /></PageLayout>} />
          <Route path="/hospitalizacion/:pacienteId/:expedienteId" element={<PageLayout><Hospitalizacion /></PageLayout>} />
          <Route path="/cirugia/:pacienteId/:expedienteId" element={<PageLayout><Cirugia /></PageLayout>} />
          <Route path="/vacunas/:pacienteId" element={<PageLayout><Vacunas /></PageLayout>} />
          <Route path="/empleados" element={<PageLayout><Empleados /></PageLayout>} />
          <Route path="/recibo/:pacienteId/:expedienteId" element={<PageLayout><Recibo /></PageLayout>} />
          <Route path="/inventario" element={<PageLayout><Inventario /></PageLayout>} />

          {/* Catch-all: ruta no encontrada */}
          <Route path="*" element={<PageLayout><NotFound /></PageLayout>} />
        </Routes>
        </Suspense>
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

      {/* Carnet de vacunación público: accesible sin sesión */}
      <Route
        path="/carnet/:token"
        element={
          <Suspense fallback={<PageLoader />}>
            <CarnetPublico />
          </Suspense>
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
//   ErrorBoundary → SelectedAnimalProvider → ThemeProvider →
//   ToastProvider → ConfirmProvider → AuthProvider → BrowserRouter
// (ToastProvider va por encima de AuthProvider para que la sesión
//  expirada pueda emitir un toast.)
// ─────────────────────────────────────────────────────────────
function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SelectedAnimalProvider>
          <ThemeProvider>
            <ToastProvider>
              <ConfirmProvider>
                <AuthProvider>
                  <BrowserRouter>
                    <AppRouter />
                  </BrowserRouter>
                </AuthProvider>
              </ConfirmProvider>
            </ToastProvider>
          </ThemeProvider>
        </SelectedAnimalProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
