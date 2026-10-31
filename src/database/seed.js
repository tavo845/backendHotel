'use strict';

/**
 * Carga datos de ejemplo en la base de datos.
 * Uso: npm run db:seed  (ejecutar despues de db:migrate)
 */
const bcrypt = require('bcryptjs');
const { pool, withTransaction } = require('../config/database');
const { validateEnv } = require('../config/env');

async function seed() {
  validateEnv();

  await withTransaction(async (client) => {
    // eslint-disable-next-line no-console
    console.log('[SEED] Insertando usuario administrador...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    await client.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol)
       VALUES ($1, $2, $3, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      ['Administrador', 'admin@hotel.com', passwordHash]
    );

    // eslint-disable-next-line no-console
    console.log('[SEED] Insertando clientes...');
    await client.query(
      `INSERT INTO clientes (nombre, apellido, documento, email, telefono, ciudad, pais)
       VALUES
        ('Juan', 'Perez', 'DOC-001', 'juan@example.com', '555-1000', 'Guatemala', 'Guatemala'),
        ('Maria', 'Lopez', 'DOC-002', 'maria@example.com', '555-2000', 'Antigua', 'Guatemala')
       ON CONFLICT (documento) DO NOTHING`
    );

    // eslint-disable-next-line no-console
    console.log('[SEED] Insertando empleados...');
    await client.query(
      `INSERT INTO empleados (nombre, apellido, documento, cargo, email, salario)
       VALUES
        ('Ana', 'Ramirez', 'EMP-001', 'Recepcionista', 'ana@hotel.com', 5000),
        ('Carlos', 'Gomez', 'EMP-002', 'Gerente', 'carlos@hotel.com', 12000)
       ON CONFLICT (documento) DO NOTHING`
    );

    // eslint-disable-next-line no-console
    console.log('[SEED] Insertando proveedores...');
    await client.query(
      `INSERT INTO proveedores (nombre, nit, contacto, email, telefono, tipo_servicio)
       VALUES
        ('Distribuidora Alimentos SA', 'NIT-001', 'Pedro Diaz', 'ventas@alimentos.com', '555-3000', 'restaurante'),
        ('Lavanderia Express', 'NIT-002', 'Luisa Marroquin', 'info@lavanderia.com', '555-4000', 'lavanderia')
       ON CONFLICT (nit) DO NOTHING`
    );

    // eslint-disable-next-line no-console
    console.log('[SEED] Insertando habitaciones...');
    const IMG_A = 'https://res.cloudinary.com/txcrmlim/image/upload/v1793320574/vojtech-bruzek-Yrxr3bsPdS0-unsplash_1.jpg';
    const IMG_B = 'https://res.cloudinary.com/txcrmlim/image/upload/v1793320564/hiram-huang-NIbUk7ATSuw-unsplash.jpg';
    await client.query(
      `INSERT INTO habitaciones (numero, tipo, capacidad, precio_noche, estado, descripcion, imagen_url)
       VALUES
        ('101', 'individual', 1, 350.00, 'disponible', 'Habitacion individual con vista al jardin', $1),
        ('102', 'doble', 2, 550.00, 'disponible', 'Habitacion doble con balcon', $2),
        ('201', 'suite', 4, 1200.00, 'disponible', 'Suite de lujo con jacuzzi', $1),
        ('202', 'familiar', 5, 900.00, 'disponible', 'Habitacion familiar amplia', $2)
       ON CONFLICT (numero) DO NOTHING`,
      [IMG_A, IMG_B]
    );

    // eslint-disable-next-line no-console
    console.log('[SEED] Insertando servicios adicionales...');
    await client.query(
      `INSERT INTO servicios (nombre, categoria, precio)
       VALUES
        ('Desayuno buffet', 'restaurante', 75.00),
        ('Cena a la carta', 'restaurante', 150.00),
        ('Coctel de bienvenida', 'bar', 45.00),
        ('Masaje relajante', 'spa', 250.00),
        ('Servicio de lavanderia', 'lavanderia', 60.00),
        ('Traslado al aeropuerto', 'transporte', 120.00)`
    );
  });

  // eslint-disable-next-line no-console
  console.log('[SEED] Datos de ejemplo cargados. Usuario: admin@hotel.com / admin123');
}

seed()
  .then(() => pool.end())
  .then(() => process.exit(0))
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[SEED] Error:', err.message);
    pool.end().finally(() => process.exit(1));
  });
