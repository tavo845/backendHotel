'use strict';

const { query } = require('../../config/database');

const TABLE = 'servicios';

const serviciosModel = {
  async findAll({ limit, offset, search, categoria, activo }) {
    const params = [];
    const conds = [];
    if (search) {
      params.push(`%${search}%`);
      conds.push(`nombre ILIKE $${params.length}`);
    }
    if (categoria) {
      params.push(categoria);
      conds.push(`categoria = $${params.length}`);
    }
    if (activo !== undefined) {
      params.push(activo);
      conds.push(`activo = $${params.length}`);
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

  async create(data) {
    const { rows } = await query(
      `INSERT INTO ${TABLE} (nombre, categoria, precio, proveedor_id, activo)
       VALUES ($1, COALESCE($2, 'otro'), $3, $4, COALESCE($5, TRUE))
       RETURNING *`,
      [data.nombre, data.categoria, data.precio, data.proveedor_id, data.activo]
    );
    return rows[0];
  },

  async update(id, data) {
    const { rows } = await query(
      `UPDATE ${TABLE} SET
         nombre = COALESCE($2, nombre),
         categoria = COALESCE($3, categoria),
         precio = COALESCE($4, precio),
         proveedor_id = COALESCE($5, proveedor_id),
         activo = COALESCE($6, activo),
         actualizado_en = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, data.nombre, data.categoria, data.precio, data.proveedor_id, data.activo]
    );
    return rows[0] || null;
  },

  async remove(id) {
    const { rowCount } = await query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
    return rowCount > 0;
  },

  // --- Servicios consumidos dentro de una reserva ---

  async addToReserva({ reserva_id, servicio_id, cantidad, precio_unit, subtotal }) {
    const { rows } = await query(
      `INSERT INTO reserva_servicios (reserva_id, servicio_id, cantidad, precio_unit, subtotal)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [reserva_id, servicio_id, cantidad, precio_unit, subtotal]
    );
    return rows[0];
  },

  async listByReserva(reserva_id) {
    const { rows } = await query(
      `SELECT rs.*, s.nombre AS servicio_nombre, s.categoria AS servicio_categoria
       FROM reserva_servicios rs
       JOIN servicios s ON s.id = rs.servicio_id
       WHERE rs.reserva_id = $1
       ORDER BY rs.fecha DESC`,
      [reserva_id]
    );
    return rows;
  },

  async removeFromReserva(id) {
    const { rowCount } = await query(`DELETE FROM reserva_servicios WHERE id = $1`, [id]);
    return rowCount > 0;
  },
};

module.exports = serviciosModel;
