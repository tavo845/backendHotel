'use strict';

const { query } = require('../../config/database');

const TABLE = 'proveedores';

const proveedoresModel = {
  async findAll({ limit, offset, search }) {
    const params = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE nombre ILIKE $1 OR nit ILIKE $1 OR contacto ILIKE $1 OR tipo_servicio ILIKE $1`;
    }
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
      `INSERT INTO ${TABLE} (nombre, nit, contacto, email, telefono, direccion, tipo_servicio, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, TRUE))
       RETURNING *`,
      [data.nombre, data.nit, data.contacto, data.email, data.telefono, data.direccion, data.tipo_servicio, data.activo]
    );
    return rows[0];
  },

  async update(id, data) {
    const { rows } = await query(
      `UPDATE ${TABLE} SET
         nombre = COALESCE($2, nombre),
         nit = COALESCE($3, nit),
         contacto = COALESCE($4, contacto),
         email = COALESCE($5, email),
         telefono = COALESCE($6, telefono),
         direccion = COALESCE($7, direccion),
         tipo_servicio = COALESCE($8, tipo_servicio),
         activo = COALESCE($9, activo),
         actualizado_en = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, data.nombre, data.nit, data.contacto, data.email, data.telefono, data.direccion, data.tipo_servicio, data.activo]
    );
    return rows[0] || null;
  },

  async remove(id) {
    const { rowCount } = await query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
    return rowCount > 0;
  },
};

module.exports = proveedoresModel;
