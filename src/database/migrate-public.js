'use strict';

/**
 * Migracion incremental para habilitar el sitio publico de reservas.
 *
 * Hace cambios que `schema.sql` (CREATE TABLE IF NOT EXISTS) no aplica sobre
 * tablas ya existentes:
 *   1. Agrega el rol 'cliente' al CHECK de usuarios.rol.
 *   2. Agrega la columna habitaciones.imagen_url.
 *   3. Asigna imagenes por defecto (Cloudinary) a las habitaciones que no tengan.
 *
 * Es idempotente: se puede ejecutar varias veces sin romper nada.
 * Uso: npm run db:migrate:public
 */
const { pool } = require('../config/database');
const { validateEnv } = require('../config/env');

// Imagenes provistas (Cloudinary). Se reparten entre las habitaciones.
const IMAGENES = [
  'https://res.cloudinary.com/txcrmlim/image/upload/v1793320574/vojtech-bruzek-Yrxr3bsPdS0-unsplash_1.jpg',
  'https://res.cloudinary.com/txcrmlim/image/upload/v1793320564/hiram-huang-NIbUk7ATSuw-unsplash.jpg',
];

async function migratePublic() {
  validateEnv();

  // eslint-disable-next-line no-console
  console.log('[MIGRATE-PUBLIC] Actualizando CHECK de usuarios.rol para incluir "cliente"...');
  await pool.query(`
    ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;
    ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check
      CHECK (rol IN ('admin', 'empleado', 'recepcion', 'cliente'));
  `);

  // eslint-disable-next-line no-console
  console.log('[MIGRATE-PUBLIC] Agregando columna habitaciones.imagen_url (si no existe)...');
  await pool.query(`ALTER TABLE habitaciones ADD COLUMN IF NOT EXISTS imagen_url TEXT;`);

  // eslint-disable-next-line no-console
  console.log('[MIGRATE-PUBLIC] Asignando imagenes por defecto a habitaciones sin imagen...');
  // Reparte las imagenes de forma alternada segun el id.
  await pool.query(
    `UPDATE habitaciones
       SET imagen_url = CASE WHEN (id % 2) = 0 THEN $1 ELSE $2 END
     WHERE imagen_url IS NULL OR imagen_url = ''`,
    [IMAGENES[0], IMAGENES[1]]
  );

  // eslint-disable-next-line no-console
  console.log('[MIGRATE-PUBLIC] Listo.');
}

migratePublic()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[MIGRATE-PUBLIC] Error:', err.message);
    pool.end().finally(() => process.exit(1));
  });
