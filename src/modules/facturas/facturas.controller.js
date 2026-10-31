'use strict';

const facturasService = require('./facturas.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, paginated } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');

const facturasController = {
  list: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || req.query;
    const { page, limit, offset } = getPagination(q);
    const { rows, total } = await facturasService.list({
      limit,
      offset,
      estado: q.estado,
      cliente_id: q.cliente_id,
    });
    return paginated(res, rows, { page, limit, total });
  }),

  getById: asyncHandler(async (req, res) => {
    const factura = await facturasService.getById(req.params.id);
    return ok(res, factura);
  }),

  generar: asyncHandler(async (req, res) => {
    const factura = await facturasService.generarDesdeReserva(req.body);
    return created(res, factura, 'Factura generada');
  }),

  cambiarEstado: asyncHandler(async (req, res) => {
    const factura = await facturasService.cambiarEstado(req.params.id, req.body.estado);
    return ok(res, factura, 'Estado de factura actualizado');
  }),
};

module.exports = facturasController;
