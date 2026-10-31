'use strict';

/**
 * Ejecuta el esquema SQL (schema.sql) contra la base de datos configurada.
 * Uso: npm run db:migrate
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const { validateEnv } = require('../config/env');

async function migrate() {
  validateEnv();

  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  // eslint-disable-next-line no-console
  console.log('[MIGRATE] Ejecutando schema.sql...');
  await pool.query(sql);
  // eslint-disable-next-line no-console
  console.log('[MIGRATE] Esquema aplicado correctamente.');
}

migrate()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[MIGRATE] Error:', err.message);
    pool.end().finally(() => process.exit(1));
  });
