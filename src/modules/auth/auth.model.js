'use strict';

const { query } = require('../../config/database');

const TABLE = 'usuarios';

const authModel = {
  async findByEmail(email) {
    const { rows } = await query(`SELECT * FROM ${TABLE} WHERE email = $1`, [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await query(
      `SELECT id, nombre, email, rol, activo, creado_en FROM ${TABLE} WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ nombre, email, password_hash, rol }) {
    const { rows } = await query(
      `INSERT INTO ${TABLE} (nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, COALESCE($4, 'empleado'))
       RETURNING id, nombre, email, rol, activo, creado_en`,
      [nombre, email, password_hash, rol]
    );
    return rows[0];
  },
};

module.exports = authModel;
