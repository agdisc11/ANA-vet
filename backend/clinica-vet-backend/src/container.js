const { query, withTransaction } = require('./db/connection');
const passwords = require('./auth/passwords');
const tokens = require('./auth/tokens');

// ── Repositorios ──────────────────────────────────────────────
const PacienteRepository = require('./repositories/PacienteRepository');
const TutorRepository = require('./repositories/TutorRepository');
const CitaRepository = require('./repositories/CitaRepository');
const EmpleadoRepository = require('./repositories/EmpleadoRepository');
const ReciboRepository = require('./repositories/ReciboRepository');
const ClinicaRepository = require('./repositories/ClinicaRepository');
const RolRepository = require('./repositories/RolRepository');
const ExpedienteRepository = require('./repositories/ExpedienteRepository');
const ConsultaRepository = require('./repositories/ConsultaRepository');
const HospitalizacionRepository = require('./repositories/HospitalizacionRepository');
const CirugiaRepository = require('./repositories/CirugiaRepository');
const VacunaRepository = require('./repositories/VacunaRepository');
const InventarioRepository = require('./repositories/InventarioRepository');
const ServicioCatalogoRepository = require('./repositories/ServicioCatalogoRepository');
const DashboardRepository = require('./repositories/DashboardRepository');
const StatsRepository = require('./repositories/StatsRepository');
const CatalogoClinicoRepository = require('./repositories/CatalogoClinicoRepository');
const ReporteRepository = require('./repositories/ReporteRepository');
const RecordatorioRepository = require('./repositories/RecordatorioRepository');
const CarnetRepository = require('./repositories/CarnetRepository');
const TratamientoRepository = require('./repositories/TratamientoRepository');

// ── Servicios ─────────────────────────────────────────────────
const PacienteService = require('./services/PacienteService');
const CitaService = require('./services/CitaService');
const EmpleadoService = require('./services/EmpleadoService');
const TutorService = require('./services/TutorService');
const ReciboService = require('./services/ReciboService');
const ClinicaService = require('./services/ClinicaService');
const ExpedienteService = require('./services/ExpedienteService');
const ConsultaService = require('./services/ConsultaService');
const HospitalizacionService = require('./services/HospitalizacionService');
const CirugiaService = require('./services/CirugiaService');
const VacunaService = require('./services/VacunaService');
const RolService = require('./services/RolService');
const InventarioService = require('./services/InventarioService');
const ServicioCatalogoService = require('./services/ServicioCatalogoService');
const DashboardService = require('./services/DashboardService');
const RecordatorioService = require('./services/RecordatorioService');
const CarnetService = require('./services/CarnetService');
const TratamientoService = require('./services/TratamientoService');
const BusquedaService = require('./services/BusquedaService');

// ── Controladores ─────────────────────────────────────────────
const { crearPacientesController } = require('./controllers/pacientesController');
const { crearCitasController } = require('./controllers/citasController');
const { crearTutoresController } = require('./controllers/tutoresController');
const { crearRecibosController } = require('./controllers/recibosController');
const { crearClinicasController } = require('./controllers/clinicasController');
const { crearEmpleadosController } = require('./controllers/empleadosController');
const { crearExpedientesController } = require('./controllers/expedientesController');
const { crearConsultasController } = require('./controllers/consultasController');
const { crearHospitalizacionesController } = require('./controllers/hospitalizacionesController');
const { crearCirugiasController } = require('./controllers/cirugiasController');
const { crearVacunasController } = require('./controllers/vacunasController');
const { crearRolesController } = require('./controllers/rolesController');
const { crearInventarioController } = require('./controllers/inventarioController');
const { crearServiciosCatalogoController } = require('./controllers/serviciosCatalogoController');
const { crearDashboardController } = require('./controllers/dashboardController');
const { crearCalculadoraController } = require('./controllers/calculadoraController');
const { crearReportsController } = require('./controllers/reportsController');
const { crearRecordatoriosController } = require('./controllers/recordatoriosController');
const { crearCarnetController } = require('./controllers/carnetController');
const { crearTratamientoController } = require('./controllers/tratamientoController');
const { crearBuscarController } = require('./controllers/buscarController');

/**
 * Composition root: ÚNICO lugar donde se conectan las implementaciones
 * concretas (query/withTransaction de MySQL → repositorios → servicios →
 * controladores). El resto del código depende de abstracciones inyectadas
 * (DIP); los tests construyen cualquier capa con dependencias fake.
 */

// ── Instancias: repositorios ──────────────────────────────────
const pacienteRepository = new PacienteRepository({ query });
const tutorRepository = new TutorRepository({ query });
const citaRepository = new CitaRepository({ query });
const empleadoRepository = new EmpleadoRepository({ query });
const reciboRepository = new ReciboRepository({ query, withTransaction });
const clinicaRepository = new ClinicaRepository({ query, withTransaction });
const rolRepository = new RolRepository({ query });
const expedienteRepository = new ExpedienteRepository({ query });
const consultaRepository = new ConsultaRepository({ query });
const hospitalizacionRepository = new HospitalizacionRepository({ query, withTransaction });
const cirugiaRepository = new CirugiaRepository({ query, withTransaction });
const vacunaRepository = new VacunaRepository({ query });
const inventarioRepository = new InventarioRepository({ query });
const servicioCatalogoRepository = new ServicioCatalogoRepository({ query });
const dashboardRepository = new DashboardRepository({ query });
const statsRepository = new StatsRepository({ query });
const catalogoClinicoRepository = new CatalogoClinicoRepository({ query });
const reporteRepository = new ReporteRepository({ query });
const recordatorioRepository = new RecordatorioRepository({ query });
const carnetRepository = new CarnetRepository({ query });
const tratamientoRepository = new TratamientoRepository({ query });

// ── Instancias: servicios ─────────────────────────────────────
const pacienteService = new PacienteService({ pacienteRepository, tutorRepository });
const citaService = new CitaService({ citaRepository, pacienteRepository, empleadoRepository });
const empleadoService = new EmpleadoService({ empleadoRepository, rolRepository, passwords, tokens });
const clinicaService = new ClinicaService({ clinicaRepository, passwords, tokens });
const tutorService = new TutorService({ tutorRepository });
const reciboService = new ReciboService({ reciboRepository, pacienteRepository, empleadoRepository });
const expedienteService = new ExpedienteService({ expedienteRepository, pacienteRepository });
const consultaService = new ConsultaService({ consultaRepository, expedienteRepository, empleadoRepository });
const hospitalizacionService = new HospitalizacionService({ hospitalizacionRepository, expedienteRepository });
const cirugiaService = new CirugiaService({ cirugiaRepository, expedienteRepository });
const vacunaService = new VacunaService({ vacunaRepository, pacienteRepository });
const rolService = new RolService({ rolRepository });
const inventarioService = new InventarioService({ inventarioRepository });
const servicioCatalogoService = new ServicioCatalogoService({ servicioCatalogoRepository });
const dashboardService = new DashboardService({ dashboardRepository });
const recordatorioService = new RecordatorioService({ recordatorioRepository });
const carnetService = new CarnetService({ carnetRepository, pacienteRepository });
const tratamientoService = new TratamientoService({ tratamientoRepository });
const busquedaService = new BusquedaService({ pacienteRepository, tutorRepository });

// ── Instancias: controladores ─────────────────────────────────
const pacientesController = crearPacientesController({ pacienteService });
const citasController = crearCitasController({ citaService, empleadoService });
const tutoresController = crearTutoresController({ tutorService });
const recibosController = crearRecibosController({ reciboService });
const clinicasController = crearClinicasController({ clinicaService });
const empleadosController = crearEmpleadosController({ empleadoService });
const expedientesController = crearExpedientesController({ expedienteService });
const consultasController = crearConsultasController({ consultaService });
const hospitalizacionesController = crearHospitalizacionesController({ hospitalizacionService });
const cirugiasController = crearCirugiasController({ cirugiaService });
const vacunasController = crearVacunasController({ vacunaService });
const rolesController = crearRolesController({ rolService });
const inventarioController = crearInventarioController({ inventarioService });
const serviciosCatalogoController = crearServiciosCatalogoController({ servicioCatalogoService });
const dashboardController = crearDashboardController({ dashboardService, statsRepository });
const calculadoraController = crearCalculadoraController({ catalogoClinicoRepository });
const reportsController = crearReportsController({ reporteRepository });
const recordatoriosController = crearRecordatoriosController({ recordatorioService });
const carnetController = crearCarnetController({ carnetService });
const tratamientoController = crearTratamientoController({ tratamientoService });
const buscarController = crearBuscarController({ busquedaService });

module.exports = {
  // Repositorios
  pacienteRepository, tutorRepository, citaRepository, empleadoRepository,
  reciboRepository, clinicaRepository, rolRepository, expedienteRepository,
  consultaRepository, hospitalizacionRepository, cirugiaRepository,
  vacunaRepository, inventarioRepository, servicioCatalogoRepository,
  dashboardRepository, statsRepository, catalogoClinicoRepository, reporteRepository,
  recordatorioRepository, carnetRepository, tratamientoRepository,
  // Servicios
  pacienteService, citaService, empleadoService, clinicaService, tutorService,
  reciboService, expedienteService, consultaService, hospitalizacionService,
  cirugiaService, vacunaService, rolService, inventarioService,
  servicioCatalogoService, dashboardService, recordatorioService, carnetService,
  tratamientoService, busquedaService,
  // Controladores
  pacientesController, citasController, tutoresController, recibosController,
  clinicasController, empleadosController, expedientesController,
  consultasController, hospitalizacionesController, cirugiasController,
  vacunasController, rolesController, inventarioController,
  serviciosCatalogoController, dashboardController, calculadoraController,
  reportsController, recordatoriosController, carnetController, tratamientoController,
  buscarController,
};
