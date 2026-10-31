'use strict';

const { Pool } = require('pg');
const { env } = require('./env');

/**
 * Decide si usar SSL.
 * - Render EXTERNA (host ...render.com): requiere SSL.
 * - Render INTERNA (host tipo dpg-xxxx-a, sin dominio publico): no usa SSL.
 * Si DB_SSL viene definido explicitamente en el entorno, se respeta ese valor;
 * de lo contrario se detecta segun la URL.
 */
function resolveSsl() {
  const url = env.db.url || '';
  const esExterna = /render\.com/i.test(url);
  const usarSsl = env.db.sslExplicit ? env.db.ssl : esExterna;
  return usarSsl ? { rejectUnauthorized: false } : false;
}

/**
 * Pool de conexiones a PostgreSQL.
 * En Render la conexion externa requiere SSL; la interna no.
 */
const pool = new Pool({
  connectionString: env.db.url,
  ssl: resolveSsl(),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[DB] Error inesperado en un cliente inactivo del pool:', err.message);
});

/**
 * Ejecuta una consulta usando el pool.
 * @param {string} text - Consulta SQL con placeholders ($1, $2, ...).
 * @param {Array} [params] - Parametros de la consulta.
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  return pool.query(text, params);
}

/**
 * Obtiene un cliente del pool para manejar transacciones manualmente.
 * Recuerda llamar client.release() al terminar.
 */
async function getClient() {
  return pool.connect();
}

/**
 * Ejecuta una funcion dentro de una transaccion.
 * Hace COMMIT si todo sale bien y ROLLBACK ante cualquier error.
 * @param {(client: import('pg').PoolClient) => Promise<any>} callback
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Verifica que la base de datos responda. Util al arrancar el servidor.
 */
async function testConnection() {
  const { rows } = await pool.query('SELECT NOW() AS now');
  return rows[0].now;
}

module.exports = { pool, query, getClient, withTransaction, testConnection };
