const asyncHandler = require('../middleware/asyncHandler');

/**
 * Controlador de pacientes (capa HTTP).
 *
 * Factory con inyección de dependencias (DIP): recibe el servicio ya
 * construido; los tests le pasan un fake sin tocar MySQL.
 *
 * Responsabilidad única: traducir HTTP ⇄ servicio.
 *   - Sin SQL, sin reglas de negocio, sin try/catch (asyncHandler +
 *     errorHandler global se encargan de los errores tipados).
 */
function crearPacientesController({ pacienteService }) {
  return {
    // GET /api/pacientes  (?q=&page=&limit= — sin page: lista completa, contrato legacy)
    getAll: asyncHandler(async (req, res) => {
      const { q = null, page = null, limit = 20 } = req.queryValidada ?? {};
      const resultado = await pacienteService.listar(req.user.clinica_id, { q, page, limit });

      if (Array.isArray(resultado)) return res.json(resultado);

      res.json({
        data: resultado.datos,
        pagination: {
          page,
          limit,
          total: resultado.total,
          totalPages: Math.max(1, Math.ceil(resultado.total / limit)),
        },
      });
    }),

    // GET /api/pacientes/:id
    getById: asyncHandler(async (req, res) => {
      const paciente = await pacienteService.obtener(req.params.id, req.user.clinica_id);
      res.json(paciente);
    }),

    // POST /api/pacientes
    create: asyncHandler(async (req, res) => {
      const id = await pacienteService.crear(req.body, req.user.clinica_id);
      res.status(201).json({ id, mensaje: 'Paciente creado' });
    }),

    // PUT /api/pacientes/:id
    update: asyncHandler(async (req, res) => {
      await pacienteService.actualizar(req.params.id, req.body, req.user.clinica_id);
      res.json({ mensaje: 'Paciente actualizado' });
    }),

    // PUT /api/pacientes/:id/reasignar
    reasignar: asyncHandler(async (req, res) => {
      await pacienteService.reasignarTutor(req.params.id, req.body.nuevo_tutor_id, req.user.clinica_id);
      res.json({ mensaje: 'Tutor reasignado correctamente' });
    }),

    // DELETE /api/pacientes/:id
    remove: asyncHandler(async (req, res) => {
      await pacienteService.eliminar(req.params.id, req.user.clinica_id);
      res.json({ mensaje: 'Paciente eliminado' });
    }),
  };
}

module.exports = { crearPacientesController };
