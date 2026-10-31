'use strict';

const reportesService = require('./reportes.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok } = require('../../utils/response');

const reportesController = {
  ocupacion: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || req.query;
    const data = await reportesService.ocupacionPorFecha({ desde: q.desde, hasta: q.hasta });
    return ok(res, data, 'Ocupacion por fecha');
  }),

  serviciosMasSolicitados: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || req.query;
    const data = await reportesService.serviciosMasSolicitados({
      desde: q.desde,
      hasta: q.hasta,
      limit: q.limit,
    });
    return ok(res, data, 'Servicios mas solicitados');
  }),

  resumen: asyncHandler(async (req, res) => {
    const data = await reportesService.resumenGeneral();
    return ok(res, data, 'Resumen general');
  }),
};

module.exports = reportesController;
