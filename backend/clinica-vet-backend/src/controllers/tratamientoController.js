const asyncHandler = require('../middleware/asyncHandler');

/** Controlador de la hoja de tratamiento (capa HTTP, factory con DI). */
function crearTratamientoController({ tratamientoService }) {
  const hoyISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return {
    // GET /api/hospitalizaciones/internados — tablero de enfermería
    internados: asyncHandler(async (req, res) => {
      const fecha = req.queryValidada?.fecha || hoyISO();
      res.json(await tratamientoService.internados(req.user.clinica_id, fecha));
    }),

    // GET /api/hospitalizaciones/:id/tratamiento?fecha=
    hoja: asyncHandler(async (req, res) => {
      const fecha = req.queryValidada?.fecha ?? null;
      res.json(await tratamientoService.hoja(req.params.id, req.user.clinica_id, { fecha }));
    }),

    // POST /api/hospitalizaciones/:id/tratamiento
    crearTarea: asyncHandler(async (req, res) => {
      const id = await tratamientoService.agregarTarea(req.params.id, req.body, req.user.clinica_id);
      res.status(201).json({ id, mensaje: 'Tarea agregada a la hoja' });
    }),

    // POST /api/hospitalizaciones/:id/tratamiento/pauta
    crearPauta: asyncHandler(async (req, res) => {
      const { creadas, horas } = await tratamientoService.agregarPauta(
        req.params.id, req.body, req.user.clinica_id
      );
      res.status(201).json({ creadas, horas, mensaje: `Pauta creada: ${creadas} tomas` });
    }),

    // PUT /api/tratamiento/tareas/:tareaId/completar
    completar: asyncHandler(async (req, res) => {
      await tratamientoService.marcarCompletada(req.params.tareaId, req.user.clinica_id, {
        completada: req.body.completada,
        // Solo los empleados firman; el admin de clínica queda sin firma nominal
        empleadoId: req.user.tipo === 'empleado' ? req.user.id : null,
      });
      res.json({ mensaje: req.body.completada ? 'Tarea aplicada' : 'Tarea reabierta' });
    }),

    // DELETE /api/tratamiento/tareas/:tareaId
    eliminar: asyncHandler(async (req, res) => {
      await tratamientoService.eliminarTarea(req.params.tareaId, req.user.clinica_id);
      res.json({ mensaje: 'Tarea eliminada' });
    }),
  };
}

module.exports = { crearTratamientoController };
