'use strict';

/**
 * Helpers para dar un formato consistente a todas las respuestas de la API.
 */

function ok(res, data, message = 'OK', status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

function created(res, data, message = 'Recurso creado') {
  return ok(res, data, message, 201);
}

function noContent(res) {
  return res.status(204).send();
}

function paginated(res, items, { page, limit, total }) {
  return res.status(200).json({
    success: true,
    message: 'OK',
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  });
}

module.exports = { ok, created, noContent, paginated };
