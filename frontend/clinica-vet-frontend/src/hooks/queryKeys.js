/**
 * Claves de caché centralizadas de TanStack Query.
 *
 * Tenerlas en un solo lugar evita desajustes entre lo que una query
 * cachea y lo que una mutación invalida (una typo silenciosa rompería
 * la revalidación). Cada entrada es una factory que devuelve el array
 * de clave.
 */
export const queryKeys = {
  pacientes: {
    all: () => ['pacientes'],
    detail: (id) => ['pacientes', String(id)],
  },
  tutores: {
    all: () => ['tutores'],
  },
  empleados: {
    all: () => ['empleados'],
  },
  roles: {
    all: () => ['roles'],
  },
  inventario: {
    productos: () => ['inventario', 'productos'],
    solicitudes: () => ['inventario', 'solicitudes'],
  },
  serviciosCatalogo: {
    all: (incluirInactivos = false) => ['servicios-catalogo', { incluirInactivos }],
  },
  expedientes: {
    porPaciente: (pacienteId) => ['expedientes', String(pacienteId)],
  },
  consultas: {
    all: () => ['consultas', 'all'],
    porExpediente: (expedienteId) => ['consultas', String(expedienteId)],
  },
  cirugias: {
    all: () => ['cirugias', 'all'],
    porExpediente: (expedienteId) => ['cirugias', String(expedienteId)],
  },
  hospitalizaciones: {
    all: () => ['hospitalizaciones', 'all'],
    porExpediente: (expedienteId) => ['hospitalizaciones', String(expedienteId)],
  },
  vacunas: {
    all: () => ['vacunas', 'all'],
    porPaciente: (pacienteId) => ['vacunas', String(pacienteId)],
  },
  recibos: {
    porPaciente: (pacienteId) => ['recibos', String(pacienteId)],
  },
  dashboard: {
    clinica: () => ['dashboard', 'clinica'],
    empleado: () => ['dashboard', 'empleado'],
  },
  stats: {
    all: () => ['stats'],
  },
  calculadora: {
    medicamentos: () => ['calculadora', 'medicamentos'],
    toxicologia: () => ['calculadora', 'toxicologia'],
  },
  busqueda: {
    termino: (q) => ['busqueda', q],
  },
};
