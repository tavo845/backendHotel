'use strict';

const Stripe = require('stripe');
const { env } = require('./env');

/**
 * Instancia de Stripe. Si no hay clave configurada, se exporta null
 * y el servicio de pagos respondera con un error controlado.
 */
const stripe = env.stripe.secretKey ? new Stripe(env.stripe.secretKey) : null;

module.exports = stripe;
