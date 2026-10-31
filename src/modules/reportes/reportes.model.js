'use strict';

const { query } = require('../../config/database');

const reportesModel = {
  /**
   * Ocupacion por fecha: para cada dia del rango cuenta cuantas habitaciones
   * estan ocupadas (reservas activas que cubren ese dia) y calcula el
   * porcentaje sobre el total de habitaciones disponibles.
   */
  async ocupacionPorFecha({ desde, hasta }) {
    const { rows } = await query(
      `WITH dias AS (
         SELECT generate_series($1::date, $2::date, interval '1 day')::date AS dia
       ),
       total_hab AS (
         SELECT COUNT(*)::int AS total FROM habitaciones WHERE estado <> 'inactiva'
       )
       SELECT d.dia,
              COUNT(r.id)::int AS habitaciones_ocupadas,
              t.total AS habitaciones_totales,
              CASE WHEN t.total > 0
                   THEN ROUND((COUNT(r.id)::numeric / t.total) * 100, 2)
                   ELSE 0 END AS porcentaje_ocupacion
       FROM dias d
       CROSS JOIN total_hab t
       LEFT JOIN reservas r
         ON r.estado IN ('confirmada', 'completada')
        AND r.fecha_entrada <= d.dia
        AND r.fecha_salida > d.dia
       GROUP BY d.dia, t.total
       ORDER BY d.dia`,
      [desde, hasta]
    );
    return rows;
  },

  /**
   * Servicios adicionales mas solicitados en un rango de fechas.
   */
  async serviciosMasSolicitados({ desde, hasta, limit }) {
    const { rows } = await query(
      `SELECT s.id AS servicio_id,
              s.nombre AS servicio_nombre,
              s.categoria,
              SUM(rs.cantidad)::int AS total_solicitado,
              SUM(rs.subtotal)::numeric AS ingresos
       FROM reserva_servicios rs
       JOIN servicios s ON s.id = rs.servicio_id
       WHERE rs.fecha::date BETWEEN $1 AND $2
       GROUP BY s.id, s.nombre, s.categoria
       ORDER BY total_solicitado DESC
       LIMIT $3`,
      [desde, hasta, limit]
    );
    return rows;
  },

  /**
   * Resumen general para dashboard.
   */
  async resumenGeneral() {
    const { rows } = await query(
      `SELECT
         (SELECT COUNT(*)::int FROM clientes) AS total_clientes,
         (SELECT COUNT(*)::int FROM habitaciones) AS total_habitaciones,
         (SELECT COUNT(*)::int FROM reservas WHERE estado IN ('pendiente','confirmada')) AS reservas_activas,
         (SELECT COALESCE(SUM(total),0)::numeric FROM facturas WHERE estado = 'pagada') AS ingresos_facturados`
    );
    return rows[0];
  },
};

module.exports = reportesModel;
