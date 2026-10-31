'use strict';

const habitacionesService = require('./habitaciones.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, noContent, paginated } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');

const habitacionesController = {
  list: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || req.query;
    const { page, limit, offset } = getPagination(q);
    const { rows, total } = await habitacionesService.list({
      limit,
      offset,
      search: q.search,
      estado: q.estado,
      tipo: q.tipo,
    });
    return paginated(res, rows, { page, limit, total });
  }),

  disponibilidad: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || req.query;
    const rows = await habitacionesService.disponibilidad({
      fecha_entrada: q.fecha_entrada,
      fecha_salida: q.fecha_salida,
      tipo: q.tipo,
      capacidad: q.capacidad,
    });
    return ok(res, rows, 'Habitaciones disponibles');
  }),

  getById: asyncHandler(async (req, res) => {
    const habitacion = await habitacionesService.getById(req.params.id);
    return ok(res, habitacion);
  }),

  create: asyncHandler(async (req, res) => {
    const habitacion = await habitacionesService.create(req.body);
    return created(res, habitacion, 'Habitacion creada');
  }),

  update: asyncHandler(async (req, res) => {
    const habitacion = await habitacionesService.update(req.params.id, req.body);
    return ok(res, habitacion, 'Habitacion actualizada');
  }),

  remove: asyncHandler(async (req, res) => {
    await habitacionesService.remove(req.params.id);
    return noContent(res);
  }),
};

module.exports = habitacionesController;
