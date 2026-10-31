'use strict';

require('dotenv').config();

/**
 * Centraliza y valida las variables de entorno.
 * Si falta alguna critica, el proceso se detiene con un mensaje claro.
 */
function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === null || value === '') {
    // No detenemos por variables opcionales; solo avisamos para las criticas.
    return undefined;
  }
  return value;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),

  db: {
    url: required('DATABASE_URL'),
    // ssl solo se usa si DB_SSL fue definido explicitamente; si no, se detecta por la URL.
    ssl: (process.env.DB_SSL || '').toLowerCase() === 'true',
    sslExplicit: process.env.DB_SSL !== undefined && process.env.DB_SSL !== '',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_inseguro_cambiame',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  defaultCurrency: process.env.DEFAULT_CURRENCY || 'usd',

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};

/**
 * Verifica variables criticas al arrancar y advierte de las opcionales faltantes.
 */
function validateEnv() {
  const problems = [];

  if (!env.db.url) {
    problems.push('DATABASE_URL no esta definida. Configura la conexion a PostgreSQL (Render).');
  }

  if (env.nodeEnv === 'production' && env.jwt.secret === 'dev_secret_inseguro_cambiame') {
    problems.push('JWT_SECRET usa el valor por defecto. Define uno seguro en produccion.');
  }

  if (problems.length > 0) {
    // eslint-disable-next-line no-console
    console.error('\n[ERROR DE CONFIGURACION]');
    problems.forEach((p) => console.error(' - ' + p));
    console.error('Revisa tu archivo .env (usa .env.example como guia).\n');
    process.exit(1);
  }

  if (!env.stripe.secretKey) {
    // eslint-disable-next-line no-console
    console.warn('[AVISO] STRIPE_SECRET_KEY no esta definida. El modulo de pagos no funcionara hasta configurarla.');
  }
}

module.exports = { env, validateEnv };
