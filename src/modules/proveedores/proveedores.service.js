'use strict';

const proveedoresModel = require('./proveedores.model');
const ApiError = require('../../utils/ApiError');

const proveedoresService = {
  async list(opts) {
    return proveedoresModel.findAll(opts);
  },

  async getById(id) {
    const proveedor = await proveedoresModel.findById(id);
    if (!proveedor) throw ApiError.notFound('Proveedor no encontrado');
    return proveedor;
  },

  async create(data) {
    return proveedoresModel.create(data);
  },

  async update(id, data) {
    const actualizado = await proveedoresModel.update(id, data);
    if (!actualizado) throw ApiError.notFound('Proveedor no encontrado');
    return actualizado;
  },

  async remove(id) {
    const eliminado = await proveedoresModel.remove(id);
    if (!eliminado) throw ApiError.notFound('Proveedor no encontrado');
    return true;
  },
};

module.exports = proveedoresService;
