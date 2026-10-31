'use strict';

const { query } = require('../../config/database');

const TABLE = 'reservas';

/**
 * SELECT con datos relacionados (cliente y habitacion) para lectura enriquecida.
 */
const SELECT_JOIN = `
  SELECT r.*,
         c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, c.documento AS cliente_documento,
         h.numero AS habitacion_numero, h.tipo AS habitacion_tipo, h.precio_noche AS habitacion_precio
  FROM ${TABLE} r
  JOIN clientes c ON c.id = r.cliente_id
  JOIN habitaciones h ON h.id = r.habitacion_id
`;

const reservasModel = {
  async findAll({ limit, offset, estado, cliente_id, habitacion_id }) {
    const params = [];
    const conds = [];
    if (estado) {
      params.push(estado);
      conds.push(`r.estado = $${params.length}`);
    }
    if (cliente_id) {
      params.push(cliente_id);
      conds.push(`r.cliente_id = $${params.length}`);
    }
    if (habitacion_id) {
      params.push(habitacion_id);
      conds.push(`r.habitacion_id = $${params.length}`);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await query(
      `${SELECT_JOIN} ${where}
       ORDER BY r.id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const { rows: countRows } = await query(
      `SELECT COUNT(*)::int AS total FROM ${TABLE} r ${where}`,
      params
    );
    return { rows, total: countRows[0].total };
  },

  async findById(id) {
    const { rows } = await query(`${SELECT_JOIN} WHERE r.id = $1`, [id]);
    return rows[0] || null;
  },

  /**
   * Comprueba si la habitacion esta libre en el rango dado.
   * excludeReservaId permite ignorar la propia reserva al actualizar.
   */
  async haySolapamiento({ habitacion_id, fecha_entrada, fecha_salida, excludeReservaId }, client) {
    const runner = client || require('../../config/database');
    const params = [habitacion_id, fecha_entrada, fecha_salida];
    let extra = '';
    if (excludeReservaId) {
      params.push(excludeReservaId);
      extra = `AND id <> $${params.length}`;
    }
    const { rows } = await runner.query(
      `SELECT 1 FROM ${TABLE}
       WHERE habitacion_id = $1
         AND estado IN ('pendiente', 'confirmada')
         AND fecha_entrada < $3
         AND fecha_salida > $2
         ${extra}
       LIMIT 1`,
      params
    );
    return rows.length > 0;
  },

  async create(data, client) {
    const runner = client || require('../../config/database');
    const { rows } = await runner.query(
      `INSERT INTO ${TABLE}
        (cliente_id, habitacion_id, empleado_id, fecha_entrada, fecha_salida, num_huespedes, estado, total, notas)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, 1), COALESCE($7, 'pendiente'), $8, $9)
       RETURNING *`,
      [data.cliente_id, data.habitacion_id, data.empleado_id, data.fecha_entrada, data.fecha_salida,
        data.num_huespedes, data.estado, data.total, data.notas]
    );
    return rows[0];
  },

  async update(id, data, client) {
    const runner = client || require('../../config/database');
    const { rows } = await runner.query(
      `UPDATE ${TABLE} SET
         cliente_id = COALESCE($2, cliente_id),
         habitacion_id = COALESCE($3, habitacion_id),
         empleado_id = COALESCE($4, empleado_id),
         fecha_entrada = COALESCE($5, fecha_entrada),
         fecha_salida = COALESCE($6, fecha_salida),
         num_huespedes = COALESCE($7, num_huespedes),
         estado = COALESCE($8, estado),
         total = COALESCE($9, total),
         notas = COALESCE($10, notas),
         actualizado_en = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, data.cliente_id, data.habitacion_id, data.empleado_id, data.fecha_entrada, data.fecha_salida,
        data.num_huespedes, data.estado, data.total, data.notas]
    );
    return rows[0] || null;
  },

  async cambiarEstado(id, estado) {
    const { rows } = await query(
      `UPDATE ${TABLE} SET estado = $2, actualizado_en = NOW() WHERE id = $1 RETURNING *`,
      [id, estado]
    );
    return rows[0] || null;
  },

  async remove(id) {
    const { rowCount } = await query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
    return rowCount > 0;
  },
};

module.exports = reservasModel;
