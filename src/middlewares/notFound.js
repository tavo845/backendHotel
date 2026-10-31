'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Middleware para rutas no encontradas (404).
 */
function notFound(req, res, next) {
  next(ApiError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
