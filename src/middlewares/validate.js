'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Middleware de validacion basado en esquemas de Zod.
 * Valida body, params y query segun el esquema recibido y reemplaza
 * los valores por los ya parseados/normalizados.
 *
 * @param {object} schemas - { body?, params?, query? } esquemas de Zod.
 */
function validate(schemas = {}) {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      if (schemas.query) {
        req.validatedQuery = schemas.query.parse(req.query);
      }
      next();
    } catch (error) {
      if (error.errors) {
        const details = error.errors.map((e) => ({
          campo: e.path.join('.'),
          mensaje: e.message,
        }));
        return next(ApiError.badRequest('Datos de entrada invalidos', details));
      }
      return next(error);
    }
  };
}

module.exports = validate;
