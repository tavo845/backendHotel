'use strict';

const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

/**
 * Verifica el token JWT del header Authorization: Bearer <token>.
 * Coloca los datos del usuario en req.user.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Token no proporcionado'));
  }

  try {
    const payload = jwt.verify(token, env.jwt.secret);
    req.user = payload;
    return next();
  } catch (error) {
    return next(ApiError.unauthorized('Token invalido o expirado'));
  }
}

/**
 * Restringe el acceso a ciertos roles.
 * @param {...string} roles - Roles permitidos (ej. 'admin', 'empleado').
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (roles.length > 0 && !roles.includes(req.user.rol)) {
      return next(ApiError.forbidden('No tienes permisos para esta accion'));
    }
    return next();
  };
}

module.exports = { authenticate, authorize };
