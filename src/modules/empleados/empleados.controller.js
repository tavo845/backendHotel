'use strict';

const empleadosService = require('./empleados.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, noContent, paginated } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');

const empleadosController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req.validatedQuery || req.query);
    const search = (req.validatedQuery || req.query).search;
    const { rows, total } = await empleadosService.list({ limit, offset, search });
    return paginated(res, rows, { page, limit, total });
  }),

  getById: asyncHandler(async (req, res) => {
    const empleado = await empleadosService.getById(req.params.id);
    return ok(res, empleado);
  }),

  create: asyncHandler(async (req, res) => {
    const empleado = await empleadosService.create(req.body);
    return created(res, empleado, 'Empleado creado');
  }),

  update: asyncHandler(async (req, res) => {
    const empleado = await empleadosService.update(req.params.id, req.body);
    return ok(res, empleado, 'Empleado actualizado');
  }),

  remove: asyncHandler(async (req, res) => {
    await empleadosService.remove(req.params.id);
    return noContent(res);
  }),
};

module.exports = empleadosController;
