'use strict';

const pagosService = require('./pagos.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, paginated } = require('../../utils/response');
const { getPagination } = require('../../utils/pagination');
const stripe = require('../../config/stripe');
const { env } = require('../../config/env');

const pagosController = {
  list: asyncHandler(async (req, res) => {
    const q = req.validatedQuery || req.query;
    const { page, limit, offset } = getPagination(q);
    const { rows, total } = await pagosService.list({
      limit,
      offset,
      estado: q.estado,
      factura_id: q.factura_id,
    });
    return paginated(res, rows, { page, limit, total });
  }),

  getById: asyncHandler(async (req, res) => {
    const pago = await pagosService.getById(req.params.id);
    return ok(res, pago);
  }),

  crearIntento: asyncHandler(async (req, res) => {
    const resultado = await pagosService.crearIntentoStripe(req.body);
    return created(res, resultado, 'Intento de pago creado');
  }),

  pagoManual: asyncHandler(async (req, res) => {
    const pago = await pagosService.registrarPagoManual(req.body);
    return created(res, pago, 'Pago registrado');
  }),

  confirmar: asyncHandler(async (req, res) => {
    const pago = await pagosService.confirmarPorReferencia(req.body.referencia_externa);
    return ok(res, pago, 'Pago confirmado');
  }),

  /**
   * Webhook de Stripe. Requiere el body en crudo (raw) para verificar la firma.
   * No usa autenticacion JWT: la seguridad viene de la firma del webhook.
   */
  webhook: asyncHandler(async (req, res) => {
    if (!stripe) return res.status(400).send('Stripe no configurado');

    const signature = req.headers['stripe-signature'];
    let event;
    try {
      if (env.stripe.webhookSecret) {
        event = stripe.webhooks.constructEvent(req.body, signature, env.stripe.webhookSecret);
      } else {
        // Sin secreto configurado: parsea el body (solo para desarrollo)
        event = JSON.parse(req.body.toString());
      }
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    await pagosService.procesarEventoStripe(event);
    return res.json({ received: true });
  }),
};

module.exports = pagosController;
