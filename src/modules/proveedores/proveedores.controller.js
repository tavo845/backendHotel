'use strict';

const proveedoresService = require('./proveedores.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, noContent, paginated } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');

const proveedoresController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req.validatedQuery || req.query);
    const search = (req.validatedQuery || req.query).search;
    const { rows, total } = await proveedoresService.list({ limit, offset, search });
    return paginated(res, rows, { page, limit, total });
  }),

  getById: asyncHandler(async (req, res) => {
    const proveedor = await proveedoresService.getById(req.params.id);
    return ok(res, proveedor);
  }),

  create: asyncHandler(async (req, res) => {
    const proveedor = await proveedoresService.create(req.body);
    return created(res, proveedor, 'Proveedor creado');
  }),

  update: asyncHandler(async (req, res) => {
    const proveedor = await proveedoresService.update(req.params.id, req.body);
    return ok(res, proveedor, 'Proveedor actualizado');
  }),

  remove: asyncHandler(async (req, res) => {
    await proveedoresService.remove(req.params.id);
    return noContent(res);
  }),
};

module.exports = proveedoresController;
