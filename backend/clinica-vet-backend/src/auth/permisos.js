const { query } = require('../db/connection');
const { ForbiddenError } = require('../errors/ApiError');

/**
 * RBAC por NOMBRE de rol.
 *
 * Antes la autorización comparaba `rol_id === 2` ("Veterinario"), pero los
 * IDs de la tabla `roles` son AUTO_INCREMENT globales y los roles se siembran
 * por clínica: el id 2 solo es "Veterinario" en la PRIMERA clínica registrada.
 * El nombre del rol sí es estable (se siembra igual en cada clínica).
 *
 * OCP: para dar o quitar capacidades solo se edita este mapa; ningún
 * middleware ni ruta cambia. '*' concede todos los permisos.
 */
const PERMISOS_POR_ROL = {
  Administrador: ['*'],
  Veterinario: ['clinico.acceso'],
  Recepcionista: [],
  Auxiliar: [],
};

// Cache nombre de rol por (clinica, rol_id) — evita una query por petición.
const cacheRoles = new Map();
const TTL_CACHE_MS = 60_000;

async function resolverNombreRol(rolId, clinicaId) {
  if (!rolId) return null;
  const clave = `${clinicaId}:${rolId}`;
  const entrada = cacheRoles.get(clave);
  if (entrada && entrada.expira > Date.now()) return entrada.nombre;

  const rows = await query(
    'SELECT nombre FROM roles WHERE id = ? AND clinica_id = ?',
    [rolId, clinicaId]
  );
  const nombre = rows[0]?.nombre ?? null;
  cacheRoles.set(clave, { nombre, expira: Date.now() + TTL_CACHE_MS });
  return nombre;
}

/**
 * Middleware: exige que el usuario autenticado tenga `permiso`.
 *   - tipo 'clinica' (dueño/admin) → siempre permitido.
 *   - tipo 'empleado' → se resuelve su rol (del JWT si trae rol_nombre,
 *     con fallback a BD para tokens emitidos antes de este cambio) y se
 *     consulta el mapa PERMISOS_POR_ROL.
 */
function requierePermiso(permiso) {
  return async (req, res, next) => {
    try {
      if (!req.user) throw new ForbiddenError('Acceso denegado');
      if (req.user.tipo === 'clinica') return next();

      const nombreRol =
        req.user.rol_nombre || (await resolverNombreRol(req.user.rol_id, req.user.clinica_id));
      const permisos = PERMISOS_POR_ROL[nombreRol] ?? [];

      if (permisos.includes('*') || permisos.includes(permiso)) return next();
      throw new ForbiddenError('No tienes permiso para realizar esta acción');
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requierePermiso, resolverNombreRol, PERMISOS_POR_ROL };
