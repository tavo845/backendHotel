'use strict';

const habitacionesModel = require('./habitaciones.model');
const ApiError = require('../../utils/ApiError');

const habitacionesService = {
  async list(opts) {
    return habitacionesModel.findAll(opts);
  },

  async getById(id) {
    const habitacion = await habitacionesModel.findById(id);
    if (!habitacion) throw ApiError.notFound('Habitacion no encontrada');
    return habitacion;
  },

  async create(data) {
    return habitacionesModel.create(data);
  },

  async update(id, data) {
    const actualizada = await habitacionesModel.update(id, data);
    if (!actualizada) throw ApiError.notFound('Habitacion no encontrada');
    return actualizada;
  },

  async remove(id) {
    const eliminada = await habitacionesModel.remove(id);
    if (!eliminada) throw ApiError.notFound('Habitacion no encontrada');
    return true;
  },

  async disponibilidad(filtros) {
    return habitacionesModel.findDisponibles(filtros);
  },
};

module.exports = habitacionesService;
