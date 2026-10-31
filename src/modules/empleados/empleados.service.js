'use strict';

const empleadosModel = require('./empleados.model');
const ApiError = require('../../utils/ApiError');

const empleadosService = {
  async list(opts) {
    return empleadosModel.findAll(opts);
  },

  async getById(id) {
    const empleado = await empleadosModel.findById(id);
    if (!empleado) throw ApiError.notFound('Empleado no encontrado');
    return empleado;
  },

  async create(data) {
    return empleadosModel.create(data);
  },

  async update(id, data) {
    const actualizado = await empleadosModel.update(id, data);
    if (!actualizado) throw ApiError.notFound('Empleado no encontrado');
    return actualizado;
  },

  async remove(id) {
    const eliminado = await empleadosModel.remove(id);
    if (!eliminado) throw ApiError.notFound('Empleado no encontrado');
    return true;
  },
};

module.exports = empleadosService;
