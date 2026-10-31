'use strict';

const clientesService = require('./clientes.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, noContent, paginated } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');

const clientesController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPagination(req.validatedQuery || req.query);
    const search = (req.validatedQuery || req.query).search;
    const { rows, total } = await clientesService.list({ limit, offset, search });
    return paginated(res, rows, { page, limit, total });
  }),

  getById: asyncHandler(async (req, res) => {
    const cliente = await clientesService.getById(req.params.id);
    return ok(res, cliente);
  }),

  create: asyncHandler(async (req, res) => {
    const cliente = await clientesService.create(req.body);
    return created(res, cliente, 'Cliente creado');
  }),

  update: asyncHandler(async (req, res) => {
    const cliente = await clientesService.update(req.params.id, req.body);
    return ok(res, cliente, 'Cliente actualizado');
  }),

  remove: asyncHandler(async (req, res) => {
    await clientesService.remove(req.params.id);
    return noContent(res);
  }),
};

module.exports = clientesController;
