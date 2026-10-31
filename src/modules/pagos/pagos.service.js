'use strict';

const pagosModel = require('./pagos.model');
const facturasModel = require('../facturas/facturas.model');
const stripe = require('../../config/stripe');
const ApiError = require('../../utils/ApiError');
const { env } = require('../../config/env');

const pagosService = {
  async list(opts) {
    return pagosModel.findAll(opts);
  },

  async getById(id) {
    const pago = await pagosModel.findById(id);
    if (!pago) throw ApiError.notFound('Pago no encontrado');
    return pago;
  },

  /**
   * Crea un PaymentIntent en Stripe por el total de la factura y registra
   * el pago en estado pendiente. Devuelve el client_secret para el frontend.
   */
  async crearIntentoStripe({ factura_id, moneda }) {
    if (!stripe) {
      throw ApiError.badRequest('Stripe no esta configurado. Define STRIPE_SECRET_KEY.');
    }

    const factura = await facturasModel.findById(factura_id);
    if (!factura) throw ApiError.notFound('Factura no encontrada');
    if (factura.estado === 'pagada') {
      throw ApiError.conflict('La factura ya esta pagada');
    }
    if (factura.estado === 'anulada') {
      throw ApiError.conflict('La factura esta anulada');
    }

    const currency = (moneda || env.defaultCurrency).toLowerCase();
    // Stripe maneja montos en la unidad minima (centavos)
    const amount = Math.round(Number(factura.total) * 100);

    const intent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: { factura_id: String(factura_id), numero: factura.numero },
      automatic_payment_methods: { enabled: true },
    });

    const pago = await pagosModel.create({
      factura_id,
      monto: factura.total,
      moneda: currency,
      metodo: 'stripe',
      estado: 'pendiente',
      referencia_externa: intent.id,
    });

    return {
      pago,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
    };
  },

  /**
   * Registra un pago manual (efectivo o tarjeta presencial) y, si cubre
   * el total, marca la factura como pagada.
   */
  async registrarPagoManual({ factura_id, monto, metodo, moneda }) {
    const factura = await facturasModel.findById(factura_id);
    if (!factura) throw ApiError.notFound('Factura no encontrada');
    if (factura.estado === 'pagada') {
      throw ApiError.conflict('La factura ya esta pagada');
    }

    const pago = await pagosModel.create({
      factura_id,
      monto,
      moneda: (moneda || env.defaultCurrency).toLowerCase(),
      metodo,
      estado: 'completado',
      referencia_externa: null,
    });

    if (Number(monto) >= Number(factura.total)) {
      await facturasModel.cambiarEstado(factura_id, 'pagada');
    }

    return pago;
  },

  /**
   * Confirma un pago por su referencia externa (id del PaymentIntent).
   * Consulta el estado real en Stripe y actualiza factura/pago.
   */
  async confirmarPorReferencia(referencia_externa) {
    const pago = await pagosModel.findByReferencia(referencia_externa);
    if (!pago) throw ApiError.notFound('Pago no encontrado para esa referencia');

    if (stripe) {
      const intent = await stripe.paymentIntents.retrieve(referencia_externa);
      if (intent.status === 'succeeded') {
        const actualizado = await pagosModel.actualizarEstado(pago.id, 'completado');
        await facturasModel.cambiarEstado(pago.factura_id, 'pagada');
        return actualizado;
      }
      throw ApiError.conflict(`El pago aun no se completa (estado Stripe: ${intent.status})`);
    }

    // Sin Stripe configurado, confirma de forma directa (util en pruebas)
    const actualizado = await pagosModel.actualizarEstado(pago.id, 'completado');
    await facturasModel.cambiarEstado(pago.factura_id, 'pagada');
    return actualizado;
  },

  /**
   * Procesa un evento de webhook de Stripe ya verificado.
   */
  async procesarEventoStripe(event) {
    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      await pagosModel.actualizarEstadoPorReferencia(intent.id, 'completado');
      if (intent.metadata && intent.metadata.factura_id) {
        await facturasModel.cambiarEstado(Number(intent.metadata.factura_id), 'pagada');
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      await pagosModel.actualizarEstadoPorReferencia(intent.id, 'fallido');
    }
    return true;
  },
};

module.exports = pagosService;
