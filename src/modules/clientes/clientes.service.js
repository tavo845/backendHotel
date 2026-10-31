'use strict';

const clientesModel = require('./clientes.model');
const ApiError = require('../../utils/ApiError');

const clientesService = {
  async list({ limit, offset, search }) {
    return clientesModel.findAll({ limit, offset, search });
  },

  async getById(id) {
    const cliente = await clientesModel.findById(id);
    if (!cliente) throw ApiError.notFound('Cliente no encontrado');
    return cliente;
  },

  async create(data) {
    return clientesModel.create(data);
  },

  async update(id, data) {
    const actualizado = await clientesModel.update(id, data);
    if (!actualizado) throw ApiError.notFound('Cliente no encontrado');
    return actualizado;
  },

  async remove(id) {
    const eliminado = await clientesModel.remove(id);
    if (!eliminado) throw ApiError.notFound('Cliente no encontrado');
    return true;
  },
};

module.exports = clientesService;
