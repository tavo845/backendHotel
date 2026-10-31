'use strict';

const { query } = require('../../config/database');

const TABLE = 'empleados';

const empleadosModel = {
  async findAll({ limit, offset, search }) {
    const params = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`);
      where = `WHERE nombre ILIKE $1 OR apellido ILIKE $1 OR documento ILIKE $1 OR cargo ILIKE $1`;
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
      `INSERT INTO ${TABLE} (nombre, apellido, documento, cargo, email, telefono, salario, fecha_ingreso, activo)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 0), COALESCE($8, CURRENT_DATE), COALESCE($9, TRUE))
       RETURNING *`,
      [data.nombre, data.apellido, data.documento, data.cargo, data.email, data.telefono, data.salario, data.fecha_ingreso, data.activo]
    );
    return rows[0];
  },

  async update(id, data) {
    const { rows } = await query(
      `UPDATE ${TABLE} SET
         nombre = COALESCE($2, nombre),
         apellido = COALESCE($3, apellido),
         documento = COALESCE($4, documento),
         cargo = COALESCE($5, cargo),
         email = COALESCE($6, email),
         telefono = COALESCE($7, telefono),
         salario = COALESCE($8, salario),
         fecha_ingreso = COALESCE($9, fecha_ingreso),
         activo = COALESCE($10, activo),
         actualizado_en = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, data.nombre, data.apellido, data.documento, data.cargo, data.email, data.telefono, data.salario, data.fecha_ingreso, data.activo]
    );
    return rows[0] || null;
  },

  async remove(id) {
    const { rowCount } = await query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
    return rowCount > 0;
  },
};

module.exports = empleadosModel;
