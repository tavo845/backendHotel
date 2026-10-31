'use strict';

const reportesModel = require('./reportes.model');

const reportesService = {
  async ocupacionPorFecha(rango) {
    return reportesModel.ocupacionPorFecha(rango);
  },

  async serviciosMasSolicitados({ desde, hasta, limit = 10 }) {
    return reportesModel.serviciosMasSolicitados({ desde, hasta, limit });
  },

  async resumenGeneral() {
    return reportesModel.resumenGeneral();
  },
};

module.exports = reportesService;
