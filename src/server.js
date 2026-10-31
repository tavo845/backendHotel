'use strict';

const app = require('./app');
const { env, validateEnv } = require('./config/env');
const { testConnection, pool } = require('./config/database');

async function start() {
  // Valida variables de entorno criticas antes de arrancar
  validateEnv();

  // Verifica la conexion a la base de datos
  try {
    const now = await testConnection();
    // eslint-disable-next-line no-console
    console.log(`[DB] Conexion exitosa a PostgreSQL (hora servidor: ${now})`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[DB] No se pudo conectar a PostgreSQL:', error.message);
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`[SERVER] Escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
    // eslint-disable-next-line no-console
    console.log(`[SERVER] API base: http://localhost:${env.port}/api/v1`);
  });

  // Cierre ordenado
  const shutdown = async (signal) => {
    // eslint-disable-next-line no-console
    console.log(`\n[SERVER] ${signal} recibido. Cerrando...`);
    server.close(async () => {
      await pool.end();
      // eslint-disable-next-line no-console
      console.log('[SERVER] Recursos liberados. Adios.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
