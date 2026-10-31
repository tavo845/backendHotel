'use strict';

/**
 * Normaliza los parametros de paginacion de la query string.
 * @param {object} query - req.query
 * @returns {{ page: number, limit: number, offset: number }}
 */
function getPagination(query = {}) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (Number.isNaN(page) || page < 1) page = 1;
  if (Number.isNaN(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100;

  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

module.exports = { getPagination };
