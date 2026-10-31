'use strict';

const { query } = require('../../config/database');

const TABLE = 'facturas';

const facturasModel = {
  async findAll({ limit, offset, estado, cliente_id }) {
    const params = [];
    const conds = [];
    if (estado) {
      params.push(estado);
      conds.push(`f.estado = $${params.length}`);
    }
    if (cliente_id) {
      params.push(cliente_id);
      conds.push(`f.cliente_id = $${params.length}`);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT f.*, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido
       FROM ${TABLE} f
       JOIN clientes c ON c.id = f.cliente_id
       ${where}
       ORDER BY f.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const { rows: countRows } = await query(
      `SELECT COUNT(*)::int AS total FROM ${TABLE} f ${where}`,
      params
    );
    return { rows, total: countRows[0].total };
  },

  /**
   * Devuelve la factura con su detalle (lineas).
   */
  async findById(id) {
    const { rows } = await query(
      `SELECT f.*, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, c.documento AS cliente_documento
       FROM ${TABLE} f
       JOIN clientes c ON c.id = f.cliente_id
       WHERE f.id = $1`,
      [id]
    );
    if (!rows[0]) return null;
    const factura = rows[0];
    const { rows: detalle } = await query(
      `SELECT * FROM factura_detalle WHERE factura_id = $1 ORDER BY id ASC`,
      [id]
    );
    factura.detalle = detalle;
    return factura;
  },

  async findByReserva(reserva_id) {
    const { rows } = await query(`SELECT * FROM ${TABLE} WHERE reserva_id = $1`, [reserva_id]);
    return rows[0] || null;
  },

  async createConDetalle({ reserva_id, cliente_id, numero, subtotal, impuestos, total, detalle }, client) {
    const runner = client;
    const { rows } = await runner.query(
      `INSERT INTO ${TABLE} (reserva_id, cliente_id, numero, subtotal, impuestos, total, estado)
       VALUES ($1, $2, $3, $4, $5, $6, 'emitida')
       RETURNING *`,
      [reserva_id, cliente_id, numero, subtotal, impuestos, total]
    );
    const factura = rows[0];

    for (const linea of detalle) {
      await runner.query(
        `INSERT INTO factura_detalle (factura_id, descripcion, cantidad, precio_unit, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [factura.id, linea.descripcion, linea.cantidad, linea.precio_unit, linea.subtotal]
      );
    }

    factura.detalle = detalle;
    return factura;
  },

  async cambiarEstado(id, estado) {
    const { rows } = await query(
      `UPDATE ${TABLE} SET estado = $2, actualizado_en = NOW() WHERE id = $1 RETURNING *`,
      [id, estado]
    );
    return rows[0] || null;
  },
};

module.exports = facturasModel;
