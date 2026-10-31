'use strict';

const { query } = require('../../config/database');

const TABLE = 'clientes';

const clientesModel = {
  async findAll({ limit, offset, search }) {
    const params = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE nombre ILIKE $1 OR apellido ILIKE $1 OR documento ILIKE $1 OR email ILIKE $1`;
    }
    const dataParams = [...params, limit, offset];
    const { rows } = await query(
      `SELECT * FROM ${TABLE} ${where}
       ORDER BY id DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      dataParams
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
      `INSERT INTO ${TABLE} (nombre, apellido, documento, email, telefono, direccion, ciudad, pais)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [data.nombre, data.apellido, data.documento, data.email, data.telefono, data.direccion, data.ciudad, data.pais]
    );
    return rows[0];
  },

  async update(id, data) {
    const { rows } = await query(
      `UPDATE ${TABLE} SET
         nombre = COALESCE($2, nombre),
         apellido = COALESCE($3, apellido),
         documento = COALESCE($4, documento),
         email = COALESCE($5, email),
         telefono = COALESCE($6, telefono),
         direccion = COALESCE($7, direccion),
         ciudad = COALESCE($8, ciudad),
         pais = COALESCE($9, pais),
         actualizado_en = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, data.nombre, data.apellido, data.documento, data.email, data.telefono, data.direccion, data.ciudad, data.pais]
    );
    return rows[0] || null;
  },

  async remove(id) {
    const { rowCount } = await query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
    return rowCount > 0;
  },
};

module.exports = clientesModel;
