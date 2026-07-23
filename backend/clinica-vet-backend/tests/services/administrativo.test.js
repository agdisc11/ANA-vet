const RolService = require('../../src/services/RolService');
const InventarioService = require('../../src/services/InventarioService');
const ServicioCatalogoService = require('../../src/services/ServicioCatalogoService');
const { NotFoundError, ConflictError } = require('../../src/errors/ApiError');

const CLINICA = 42;

describe('RolService.eliminar', () => {
  test('convierte el error de FK en 409 con el mensaje original', async () => {
    const errorFk = Object.assign(new Error('fk'), { code: 'ER_ROW_IS_REFERENCED_2' });
    const service = new RolService({
      rolRepository: { deleteById: jest.fn(async () => { throw errorFk; }) },
    });
    await expect(service.eliminar(2, CLINICA)).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining('empleados asignados'),
    });
  });

  test('404 cuando el rol no es de la clínica', async () => {
    const service = new RolService({ rolRepository: { deleteById: jest.fn(async () => 0) } });
    await expect(service.eliminar(2, CLINICA)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('InventarioService.actualizarSolicitud', () => {
  const solicitudBase = { id: 1, producto_id: 7, producto_nombre: 'Vacuna X', cantidad: 3 };

  const crearFakes = ({ solicitud = solicitudBase, stockAfectado = 1 } = {}) => {
    const inventarioRepository = {
      obtenerSolicitud: jest.fn(async () => solicitud),
      actualizarStatusSolicitud: jest.fn(async () => 1),
      incrementarStock: jest.fn(async () => stockAfectado),
    };
    return { service: new InventarioService({ inventarioRepository }), inventarioRepository };
  };

  test('completado suma la cantidad al stock por producto_id', async () => {
    const { service, inventarioRepository } = crearFakes();
    const r = await service.actualizarSolicitud(1, 'completado', CLINICA);
    expect(r.message).toBe('Solicitud completada y stock actualizado en inventario');
    expect(inventarioRepository.incrementarStock).toHaveBeenCalledWith(7, CLINICA, 3);
  });

  test('otros status no tocan el stock', async () => {
    const { service, inventarioRepository } = crearFakes();
    const r = await service.actualizarSolicitud(1, 'pendiente', CLINICA);
    expect(r.message).toBe('Solicitud actualizada');
    expect(inventarioRepository.incrementarStock).not.toHaveBeenCalled();
  });

  test('solicitud legacy sin producto_id: completa pero avisa que no actualizó stock', async () => {
    const { service, inventarioRepository } = crearFakes({
      solicitud: { ...solicitudBase, producto_id: null },
    });
    const r = await service.actualizarSolicitud(1, 'completado', CLINICA);
    expect(r.message).toContain('no tiene producto_id');
    expect(inventarioRepository.incrementarStock).not.toHaveBeenCalled();
  });

  test('producto eliminado del inventario: completa pero avisa', async () => {
    const { service } = crearFakes({ stockAfectado: 0 });
    const r = await service.actualizarSolicitud(1, 'completado', CLINICA);
    expect(r.message).toContain('el producto no fue encontrado');
  });

  test('404 si la solicitud no es de la clínica', async () => {
    const service = new InventarioService({
      inventarioRepository: { obtenerSolicitud: jest.fn(async () => null) },
    });
    await expect(service.actualizarSolicitud(1, 'completado', CLINICA)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('ServicioCatalogoService', () => {
  test('actualizar 404 si el servicio no es de la clínica', async () => {
    const service = new ServicioCatalogoService({
      servicioCatalogoRepository: { existeEnClinica: jest.fn(async () => false) },
    });
    await expect(service.actualizar(3, { precio: 100 }, CLINICA)).rejects.toBeInstanceOf(NotFoundError);
  });

  test('actualizar solo envía los campos provistos', async () => {
    const updateById = jest.fn(async () => 1);
    const service = new ServicioCatalogoService({
      servicioCatalogoRepository: { existeEnClinica: jest.fn(async () => true), updateById },
    });
    await service.actualizar(3, { precio: 250.5, activo: 0 }, CLINICA);
    expect(updateById).toHaveBeenCalledWith(3, CLINICA, { precio: 250.5, activo: 0 });
  });
});
