'use strict';

const serviciosService = require('./servicios.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, noContent, paginated } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');

const serviciosController = {
  list: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || req.query;
    const { page, limit, offset } = getPagination(q);
    const { rows, total } = await serviciosService.list({
      limit,
      offset,
      search: q.search,
      categoria: q.categoria,
      activo: q.activo,
    });
    return paginated(res, rows, { page, limit, total });
  }),

  getById: asyncHandler(async (req, res) => {
    const servicio = await serviciosService.getById(req.params.id);
    return ok(res, servicio);
  }),

  create: asyncHandler(async (req, res) => {
    const servicio = await serviciosService.create(req.body);
    return created(res, servicio, 'Servicio creado');
  }),

  update: asyncHandler(async (req, res) => {
    const servicio = await serviciosService.update(req.params.id, req.body);
    return ok(res, servicio, 'Servicio actualizado');
  }),

  remove: asyncHandler(async (req, res) => {
    await serviciosService.remove(req.params.id);
    return noContent(res);
  }),

  // --- Consumo dentro de reservas ---

  addToReserva: asyncHandler(async (req, res) => {
    const consumo = await serviciosService.addToReserva(req.params.reservaId, req.body);
    return created(res, consumo, 'Servicio agregado a la reserva');
  }),

  listByReserva: asyncHandler(async (req, res) => {
    const rows = await serviciosService.listByReserva(req.params.reservaId);
    return ok(res, rows);
  }),

  removeFromReserva: asyncHandler(async (req, res) => {
    await serviciosService.removeFromReserva(req.params.id);
    return noContent(res);
  }),
};

module.exports = serviciosController;
