'use strict';

const facturasModel = require('./facturas.model');
const reservasModel = require('../reservas/reservas.model');
const serviciosModel = require('../servicios/servicios.model');
const ApiError = require('../../utils/ApiError');
const { withTransaction } = require('../../config/database');

function generarNumeroFactura() {
  const ahora = new Date();
  const stamp = ahora.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `FAC-${stamp}-${rand}`;
}

const facturasService = {
  async list(opts) {
    return facturasModel.findAll(opts);
  },

  async getById(id) {
    const factura = await facturasModel.findById(id);
    if (!factura) throw ApiError.notFound('Factura no encontrada');
    return factura;
  },

  /**
   * Genera una factura a partir de una reserva: incluye el hospedaje
   * (total de la reserva) y todos los servicios consumidos.
   */
  async generarDesdeReserva({ reserva_id, impuesto_porcentaje = 0 }) {
    return withTransaction(async (client) => {
      const reserva = await reservasModel.findById(reserva_id);
      if (!reserva) throw ApiError.notFound('Reserva no encontrada');

      const existente = await facturasModel.findByReserva(reserva_id);
      if (existente) {
        throw ApiError.conflict('La reserva ya tiene una factura generada');
      }

      const detalle = [];

      // Linea de hospedaje
      detalle.push({
        descripcion: `Hospedaje habitacion ${reserva.habitacion_numero} (${reserva.habitacion_tipo})`,
        cantidad: 1,
        precio_unit: Number(reserva.total),
        subtotal: Number(reserva.total),
      });

      // Lineas de servicios consumidos
      const servicios = await serviciosModel.listByReserva(reserva_id);
      for (const s of servicios) {
        detalle.push({
          descripcion: `Servicio: ${s.servicio_nombre}`,
          cantidad: Number(s.cantidad),
          precio_unit: Number(s.precio_unit),
          subtotal: Number(s.subtotal),
        });
      }

      const subtotal = detalle.reduce((acc, l) => acc + l.subtotal, 0);
      const impuestos = Number((subtotal * (impuesto_porcentaje / 100)).toFixed(2));
      const total = Number((subtotal + impuestos).toFixed(2));

      const factura = await facturasModel.createConDetalle({
        reserva_id,
        cliente_id: reserva.cliente_id,
        numero: generarNumeroFactura(),
        subtotal,
        impuestos,
        total,
        detalle,
      }, client);

      return factura;
    });
  },

  async cambiarEstado(id, estado) {
    const factura = await facturasModel.cambiarEstado(id, estado);
    if (!factura) throw ApiError.notFound('Factura no encontrada');
    return factura;
  },
};

module.exports = facturasService;
