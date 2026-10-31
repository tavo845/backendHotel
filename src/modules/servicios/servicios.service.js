'use strict';

const serviciosModel = require('./servicios.model');
const reservasModel = require('../reservas/reservas.model');
const ApiError = require('../../utils/ApiError');

const serviciosService = {
  async list(opts) {
    return serviciosModel.findAll(opts);
  },

  async getById(id) {
    const servicio = await serviciosModel.findById(id);
    if (!servicio) throw ApiError.notFound('Servicio no encontrado');
    return servicio;
  },

  async create(data) {
    return serviciosModel.create(data);
  },

  async update(id, data) {
    const actualizado = await serviciosModel.update(id, data);
    if (!actualizado) throw ApiError.notFound('Servicio no encontrado');
    return actualizado;
  },

  async remove(id) {
    const eliminado = await serviciosModel.remove(id);
    if (!eliminado) throw ApiError.notFound('Servicio no encontrado');
    return true;
  },

  /**
   * Agrega el consumo de un servicio a una reserva.
   * Toma el precio actual del servicio y calcula el subtotal.
   */
  async addToReserva(reserva_id, { servicio_id, cantidad = 1 }) {
    const reserva = await reservasModel.findById(reserva_id);
    if (!reserva) throw ApiError.notFound('Reserva no encontrada');
    if (['cancelada', 'completada'].includes(reserva.estado)) {
      throw ApiError.conflict('No se pueden agregar servicios a una reserva cancelada o completada');
    }

    const servicio = await serviciosModel.findById(servicio_id);
    if (!servicio) throw ApiError.badRequest('El servicio indicado no existe');
    if (!servicio.activo) throw ApiError.badRequest('El servicio no esta activo');

    const precio_unit = Number(servicio.precio);
    const subtotal = precio_unit * cantidad;

    return serviciosModel.addToReserva({ reserva_id, servicio_id, cantidad, precio_unit, subtotal });
  },

  async listByReserva(reserva_id) {
    const reserva = await reservasModel.findById(reserva_id);
    if (!reserva) throw ApiError.notFound('Reserva no encontrada');
    return serviciosModel.listByReserva(reserva_id);
  },

  async removeFromReserva(id) {
    const eliminado = await serviciosModel.removeFromReserva(id);
    if (!eliminado) throw ApiError.notFound('Consumo de servicio no encontrado');
    return true;
  },
};

module.exports = serviciosService;
