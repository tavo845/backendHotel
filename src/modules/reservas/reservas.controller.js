'use strict';

const reservasService = require('./reservas.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, noContent, paginated } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');

const reservasController = {
  list: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || req.query;
    const { page, limit, offset } = getPagination(q);
    const { rows, total } = await reservasService.list({
      limit,
      offset,
      estado: q.estado,
      cliente_id: q.cliente_id,
      habitacion_id: q.habitacion_id,
    });
    return paginated(res, rows, { page, limit, total });
  }),

  getById: asyncHandler(async (req, res) => {
    const reserva = await reservasService.getById(req.params.id);
    return ok(res, reserva);
  }),

  create: asyncHandler(async (req, res) => {
    const reserva = await reservasService.create(req.body);
    return created(res, reserva, 'Reserva creada');
  }),

  update: asyncHandler(async (req, res) => {
    const reserva = await reservasService.update(req.params.id, req.body);
    return ok(res, reserva, 'Reserva actualizada');
  }),

  cambiarEstado: asyncHandler(async (req, res) => {
    const reserva = await reservasService.cambiarEstado(req.params.id, req.body.estado);
    return ok(res, reserva, 'Estado de reserva actualizado');
  }),

  remove: asyncHandler(async (req, res) => {
    await reservasService.remove(req.params.id);
    return noContent(res);
  }),
};

module.exports = reservasController;
