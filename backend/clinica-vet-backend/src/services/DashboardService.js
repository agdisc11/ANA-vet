/**
 * Servicio del dashboard: agrega los datos de lectura en las formas
 * que consumen las vistas (admin de clínica y empleado).
 */
class DashboardService {
  #dashboard;

  constructor({ dashboardRepository }) {
    this.#dashboard = dashboardRepository;
  }

  async resumenClinica(clinicaId) {
    const [ingresosMes, totalPacientes, consultasHoy, scorecard, ingresosRecientes, alertas] =
      await Promise.all([
        this.#dashboard.ingresosDelMes(clinicaId),
        this.#dashboard.totalPacientes(clinicaId),
        this.#dashboard.consultasDeHoy(clinicaId),
        this.#dashboard.scorecardEmpleados(clinicaId),
        this.#dashboard.ingresosRecientes(clinicaId),
        this.#dashboard.alertasInventario(clinicaId),
      ]);

    return {
      kpis: {
        ingresos_mes: ingresosMes,
        total_pacientes: totalPacientes,
        consultas_hoy: consultasHoy,
      },
      scorecard_empleados: scorecard,
      ingresos_recientes: ingresosRecientes,
      alertas_inventario: alertas,
    };
  }

  async resumenEmpleado(empleadoId, clinicaId) {
    const [consultasHoy, cirugiasHoy] = await Promise.all([
      this.#dashboard.consultasHoyDeEmpleado(empleadoId, clinicaId),
      this.#dashboard.cirugiasHoyDeEmpleado(empleadoId, clinicaId),
    ]);

    return {
      tareas_hoy: {
        consultas_hoy: consultasHoy,
        cirugias_hoy: cirugiasHoy,
        total_tareas: consultasHoy + cirugiasHoy,
      },
    };
  }
}

module.exports = DashboardService;
