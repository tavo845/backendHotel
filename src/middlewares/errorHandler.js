'use strict';

const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Middleware final de manejo de errores.
 * Convierte cualquier error en una respuesta JSON consistente.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Error interno del servidor';
  let details = err.details;

  // Errores comunes de PostgreSQL (codigos SQLSTATE)
  if (err.code === '23505') {
    // unique_violation
    statusCode = 409;
    message = 'Ya existe un registro con esos datos unicos';
    details = err.detail;
  } else if (err.code === '23503') {
    // foreign_key_violation
    statusCode = 409;
    message = 'La operacion viola una relacion con otro registro';
    details = err.detail;
  } else if (err.code === '23502') {
    // not_null_violation
    statusCode = 400;
    message = 'Falta un campo obligatorio';
    details = err.column;
  } else if (err.code === '22P02') {
    // invalid_text_representation (ej. UUID/entero invalido)
    statusCode = 400;
    message = 'Formato de dato invalido';
  }

  if (!(err instanceof ApiError) && statusCode === 500 && env.nodeEnv !== 'production') {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', err);
  }

  const body = {
    success: false,
    message,
  };

  if (details !== undefined) body.details = details;
  if (env.nodeEnv !== 'production' && statusCode === 500) {
    body.stack = err.stack;
  }

  res.status(statusCode).json(body);
}

module.exports = errorHandler;
