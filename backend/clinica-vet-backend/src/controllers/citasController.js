const asyncHandler = require('../middleware/asyncHandler');

/**
 * Controlador de la Agenda de citas (capa HTTP, factory con DI).
 */
function crearCitasController({ citaService, empleadoService }) {
  return {
    // GET /api/citas?desde=&hasta=&empleado_id=&estado=
    getAll: asyncHandler(async (req, res) => {
      const { desde, hasta, empleado_id, estado } = req.queryValidada;
      const citas = await citaService.listar(req.user.clinica_id, {
        desde,
        hasta,
        empleadoId: empleado_id,
        estado,
      });
      res.json(citas);
    }),

    // GET /api/citas/veterinarios — empleados activos para el selector de la Agenda
    getVeterinarios: asyncHandler(async (req, res) => {
      const empleados = await empleadoService.listarActivos(req.user.clinica_id);
      res.json(empleados);
    }),

    // GET /api/citas/:id
    getById: asyncHandler(async (req, res) => {
      const cita = await citaService.obtener(req.params.id, req.user.clinica_id);
      res.json(cita);
    }),

    // POST /api/citas
    create: asyncHandler(async (req, res) => {
      const id = await citaService.agendar(req.body, req.user.clinica_id);
      res.status(201).json({ id, mensaje: 'Cita agendada' });
    }),

    // PUT /api/citas/:id
    update: asyncHandler(async (req, res) => {
      await citaService.reagendar(req.params.id, req.body, req.user.clinica_id);
      res.json({ mensaje: 'Cita actualizada' });
    }),

    // PUT /api/citas/:id/estado
    cambiarEstado: asyncHandler(async (req, res) => {
      const estado = await citaService.cambiarEstado(
        req.params.id,
        req.body.estado,
        req.user.clinica_id
      );
      res.json({ mensaje: 'Estado actualizado', estado });
    }),

    // DELETE /api/citas/:id
    remove: asyncHandler(async (req, res) => {
      await citaService.eliminar(req.params.id, req.user.clinica_id);
      res.json({ mensaje: 'Cita eliminada' });
    }),
  };
}

module.exports = { crearCitasController };
