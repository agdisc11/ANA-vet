const asyncHandler = require('../middleware/asyncHandler');

/**
 * Controlador de clinicas (capa HTTP, factory con DI).
 * Contratos idénticos a la versión anterior (los consume AuthContext).
 */
function crearClinicasController({ clinicaService }) {
  return {
    // POST /api/clinicas/registro
    registro: asyncHandler(async (req, res) => {
      const clinicaId = await clinicaService.registrar(req.body);
      res.status(201).json({
        mensaje: 'Clínica registrada exitosamente',
        clinica_id: clinicaId,
      });
    }),

    // POST /api/clinicas/login
    login: asyncHandler(async (req, res) => {
      const sesion = await clinicaService.login(req.body);
      res.json(sesion);
    }),

    // GET /api/clinicas/perfil
    perfil: asyncHandler(async (req, res) => {
      const clinica = await clinicaService.perfil(req.user.clinica_id);
      res.json(clinica);
    }),

    // PUT /api/clinicas/perfil
    actualizarPerfil: asyncHandler(async (req, res) => {
      await clinicaService.actualizarPerfil(req.user.clinica_id, req.body);
      res.json({ mensaje: 'Perfil de clínica actualizado' });
    }),

    // PUT /api/clinicas/cambiar-password
    cambiarPassword: asyncHandler(async (req, res) => {
      await clinicaService.cambiarPassword(req.user.clinica_id, req.body);
      res.json({ mensaje: 'Contraseña actualizada correctamente' });
    }),
  };
}

module.exports = { crearClinicasController };
