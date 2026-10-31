'use strict';

/**
 * Error de aplicacion con codigo HTTP.
 * Permite lanzar errores controlados desde servicios/controladores.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - Codigo HTTP (400, 404, 409, ...).
   * @param {string} message - Mensaje legible para el cliente.
   * @param {any} [details] - Informacion adicional opcional.
   */
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Solicitud invalida', details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = 'No autenticado') {
    return new ApiError(401, message);
  }

  static forbidden(message = 'No autorizado') {
    return new ApiError(403, message);
  }

  static notFound(message = 'Recurso no encontrado') {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflicto con el estado actual') {
    return new ApiError(409, message);
  }

  static internal(message = 'Error interno del servidor') {
    return new ApiError(500, message);
  }
}

module.exports = ApiError;
