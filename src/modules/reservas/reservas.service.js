'use strict';

const reservasModel = require('./reservas.model');
const habitacionesModel = require('../habitaciones/habitaciones.model');
const clientesModel = require('../clientes/clientes.model');
const ApiError = require('../../utils/ApiError');
const { withTransaction } = require('../../config/database');

/**
 * Calcula el numero de noches entre dos fechas.
 */
function calcularNoches(entrada, salida) {
  const ms = new Date(salida) - new Date(entrada);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

const reservasService = {
  async list(opts) {
    return reservasModel.findAll(opts);
  },

  async getById(id) {
    const reserva = await reservasModel.findById(id);
    if (!reserva) throw ApiError.notFound('Reserva no encontrada');
    return reserva;
  },

  async create(data) {
    return withTransaction(async (client) => {
      // Validar existencia de cliente y habitacion
      const cliente = await clientesModel.findById(data.cliente_id);
      if (!cliente) throw ApiError.badRequest('El cliente indicado no existe');

      const habitacion = await habitacionesModel.findById(data.habitacion_id);
      if (!habitacion) throw ApiError.badRequest('La habitacion indicada no existe');
      if (habitacion.estado !== 'disponible') {
        throw ApiError.conflict('La habitacion no esta disponible');
      }
      if (data.num_huespedes && data.num_huespedes > habitacion.capacidad) {
        throw ApiError.badRequest('El numero de huespedes excede la capacidad de la habitacion');
      }

      // Verificar solapamiento con otras reservas
      const ocupada = await reservasModel.haySolapamiento({
        habitacion_id: data.habitacion_id,
        fecha_entrada: data.fecha_entrada,
        fecha_salida: data.fecha_salida,
      }, client);
      if (ocupada) {
        throw ApiError.conflict('La habitacion ya esta reservada en esas fechas');
      }

      // Calcular total = noches * precio
      const noches = calcularNoches(data.fecha_entrada, data.fecha_salida);
      const total = Number(habitacion.precio_noche) * noches;

      return reservasModel.create({ ...data, total }, client);
    });
  },

  async update(id, data) {
    return withTransaction(async (client) => {
      const actual = await reservasModel.findById(id);
      if (!actual) throw ApiError.notFound('Reserva no encontrada');

      const habitacion_id = data.habitacion_id || actual.habitacion_id;
      const fecha_entrada = data.fecha_entrada || actual.fecha_entrada;
      const fecha_salida = data.fecha_salida || actual.fecha_salida;

      if (new Date(fecha_salida) <= new Date(fecha_entrada)) {
        throw ApiError.badRequest('fecha_salida debe ser posterior a fecha_entrada');
      }

      const ocupada = await reservasModel.haySolapamiento({
        habitacion_id,
        fecha_entrada,
        fecha_salida,
        excludeReservaId: id,
      }, client);
      if (ocupada) {
        throw ApiError.conflict('La habitacion ya esta reservada en esas fechas');
      }

      // Recalcular total si cambian fechas o habitacion
      let total;
      if (data.habitacion_id || data.fecha_entrada || data.fecha_salida) {
        const habitacion = await habitacionesModel.findById(habitacion_id);
        if (!habitacion) throw ApiError.badRequest('La habitacion indicada no existe');
        const noches = calcularNoches(fecha_entrada, fecha_salida);
        total = Number(habitacion.precio_noche) * noches;
      }

      const actualizada = await reservasModel.update(id, { ...data, total }, client);
      return actualizada;
    });
  },

  async cambiarEstado(id, estado) {
    const reserva = await reservasModel.cambiarEstado(id, estado);
    if (!reserva) throw ApiError.notFound('Reserva no encontrada');
    return reserva;
  },

  async remove(id) {
    const eliminada = await reservasModel.remove(id);
    if (!eliminada) throw ApiError.notFound('Reserva no encontrada');
    return true;
  },
};

module.exports = reservasService;
