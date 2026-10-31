'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { env } = require('./config/env');
const apiRoutes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const pagosController = require('./modules/pagos/pagos.controller');

const app = express();

// Seguridad y utilidades base
app.use(helmet());
app.use(
  cors({
    origin: env.cors.origin === '*' ? true : env.cors.origin.split(',').map((o) => o.trim()),
  })
);

if (env.nodeEnv !== 'test') {
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
}

// Limitador de peticiones (proteccion basica anti-abuso)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Webhook de Stripe: DEBE ir antes de express.json y con el body en crudo.
app.post(
  '/api/v1/pagos/webhook',
  express.raw({ type: 'application/json' }),
  pagosController.webhook
);

// Parseo JSON para el resto de rutas
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', uptime: process.uptime() });
});

// Rutas de la API
app.use('/api/v1', apiRoutes);

// 404 y manejador de errores (siempre al final)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
