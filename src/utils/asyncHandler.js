'use strict';

/**
 * Envuelve controladores async para capturar errores y enviarlos a next().
 * Evita tener try/catch repetido en cada controlador.
 * @param {Function} fn
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
