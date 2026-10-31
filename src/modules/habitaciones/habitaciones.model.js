'use strict';

const { query } = require('../../config/database');

const TABLE = 'habitaciones';

const habitacionesModel = {
  async findAll({ limit, offset, search, estado, tipo }) {
    const params = [];
    const conds = [];
    if (search) {
      params.push(`%${search}%`);
      conds.push(`(numero ILIKE $${params.length} OR descripcion ILIKE $${params.length})`);
    }
    if (estado) {
      params.push(estado);
      conds.push(`estado = $${params.length}`);
    }
    if (tipo) {
      params.push(tipo);
      conds.push(`tipo = $${params.length}`);
    }
    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT * FROM ${TABLE} ${where}
       ORDER BY numero ASC
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
      `INSERT INTO ${TABLE} (numero, tipo, capacidad, precio_noche, estado, descripcion, imagen_url)
       VALUES ($1, $2, COALESCE($3, 1), $4, COALESCE($5, 'disponible'), $6, $7)
       RETURNING *`,
      [data.numero, data.tipo, data.capacidad, data.precio_noche, data.estado, data.descripcion, data.imagen_url]
    );
    return rows[0];
  },

  async update(id, data) {
    const { rows } = await query(
      `UPDATE ${TABLE} SET
         numero = COALESCE($2, numero),
         tipo = COALESCE($3, tipo),
         capacidad = COALESCE($4, capacidad),
         precio_noche = COALESCE($5, precio_noche),
         estado = COALESCE($6, estado),
         descripcion = COALESCE($7, descripcion),
         imagen_url = COALESCE($8, imagen_url),
         actualizado_en = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, data.numero, data.tipo, data.capacidad, data.precio_noche, data.estado, data.descripcion, data.imagen_url]
    );
    return rows[0] || null;
  },

  async remove(id) {
    const { rowCount } = await query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
    return rowCount > 0;
  },

  /**
   * Devuelve las habitaciones disponibles en un rango de fechas,
   * excluyendo las que tienen reservas activas que se solapan.
   */
  async findDisponibles({ fecha_entrada, fecha_salida, tipo, capacidad }) {
    const params = [fecha_entrada, fecha_salida];
    const conds = [`h.estado = 'disponible'`];
    if (tipo) {
      params.push(tipo);
      conds.push(`h.tipo = $${params.length}`);
    }
    if (capacidad) {
      params.push(capacidad);
      conds.push(`h.capacidad >= $${params.length}`);
    }
    const where = `WHERE ${conds.join(' AND ')}`;

    const { rows } = await query(
      `SELECT h.* FROM ${TABLE} h
       ${where}
       AND h.id NOT IN (
         SELECT r.habitacion_id FROM reservas r
         WHERE r.estado IN ('pendiente', 'confirmada')
           AND r.fecha_entrada < $2
           AND r.fecha_salida > $1
       )
       ORDER BY h.precio_noche ASC`,
      params
    );
    return rows;
  },
};

module.exports = habitacionesModel;
