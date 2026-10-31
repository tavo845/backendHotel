'use strict';

const { query } = require('../../config/database');

const TABLE = 'pagos';

const pagosModel = {
  async findAll({ limit, offset, estado, factura_id }) {
    const params = [];
    const conds = [];
    if (estado) {
      params.push(estado);
      conds.push(`estado = $${params.length}`);
    }
    if (factura_id) {
      params.push(factura_id);
      conds.push(`factura_id = $${params.length}`);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT * FROM ${TABLE} ${where}
       ORDER BY id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const { rows: countRows } = await query(
      `SELECT COUNT(*)::int AS total FROM ${TABLE} ${where}`,
      params
    );
    return { rows, total: countRows[0].total };
  },

  async findById(id) {
    const { rows } = await query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);
    return rows[0] || null;
  },

  async findByReferencia(referencia) {
    const { rows } = await query(`SELECT * FROM ${TABLE} WHERE referencia_externa = $1`, [referencia]);
    return rows[0] || null;
  },

  async create(data) {
    const { rows } = await query(
      `INSERT INTO ${TABLE} (factura_id, monto, moneda, metodo, estado, referencia_externa)
       VALUES ($1, $2, $3, COALESCE($4, 'stripe'), COALESCE($5, 'pendiente'), $6)
       RETURNING *`,
      [data.factura_id, data.monto, data.moneda, data.metodo, data.estado, data.referencia_externa]
    );
    return rows[0];
  },

  async actualizarEstado(id, estado) {
    const { rows } = await query(
      `UPDATE ${TABLE} SET estado = $2, actualizado_en = NOW() WHERE id = $1 RETURNING *`,
      [id, estado]
    );
    return rows[0] || null;
  },

  async actualizarEstadoPorReferencia(referencia, estado) {
    const { rows } = await query(
      `UPDATE ${TABLE} SET estado = $2, actualizado_en = NOW()
       WHERE referencia_externa = $1 RETURNING *`,
      [referencia, estado]
    );
    return rows[0] || null;
  },
};

module.exports = pagosModel;
