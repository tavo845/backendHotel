-- ============================================================
-- Esquema de base de datos - Sistema de Reservas de Hotel
-- PostgreSQL
-- ============================================================

-- Limpieza opcional (respeta el orden por las FK).
-- Descomenta si quieres reiniciar todo el esquema.
-- DROP TABLE IF EXISTS pagos CASCADE;
-- DROP TABLE IF EXISTS factura_detalle CASCADE;
-- DROP TABLE IF EXISTS facturas CASCADE;
-- DROP TABLE IF EXISTS reserva_servicios CASCADE;
-- DROP TABLE IF EXISTS servicios CASCADE;
-- DROP TABLE IF EXISTS reservas CASCADE;
-- DROP TABLE IF EXISTS habitaciones CASCADE;
-- DROP TABLE IF EXISTS proveedores CASCADE;
-- DROP TABLE IF EXISTS empleados CASCADE;
-- DROP TABLE IF EXISTS clientes CASCADE;
-- DROP TABLE IF EXISTS usuarios CASCADE;

-- ------------------------------------------------------------
-- Usuarios (autenticacion del sistema)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol           VARCHAR(30)  NOT NULL DEFAULT 'empleado'
                CHECK (rol IN ('admin', 'empleado', 'recepcion', 'cliente')),
  activo        BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Clientes (huespedes)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clientes (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(120) NOT NULL,
  apellido       VARCHAR(120) NOT NULL,
  documento      VARCHAR(40)  NOT NULL UNIQUE,
  email          VARCHAR(160) UNIQUE,
  telefono       VARCHAR(40),
  direccion      VARCHAR(255),
  ciudad         VARCHAR(120),
  pais           VARCHAR(120),
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Empleados
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS empleados (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(120) NOT NULL,
  apellido       VARCHAR(120) NOT NULL,
  documento      VARCHAR(40)  NOT NULL UNIQUE,
  cargo          VARCHAR(120) NOT NULL,
  email          VARCHAR(160) UNIQUE,
  telefono       VARCHAR(40),
  salario        NUMERIC(12,2) DEFAULT 0 CHECK (salario >= 0),
  fecha_ingreso  DATE         NOT NULL DEFAULT CURRENT_DATE,
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Proveedores
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS proveedores (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(160) NOT NULL,
  nit            VARCHAR(40)  UNIQUE,
  contacto       VARCHAR(120),
  email          VARCHAR(160),
  telefono       VARCHAR(40),
  direccion      VARCHAR(255),
  tipo_servicio  VARCHAR(120),
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Habitaciones
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS habitaciones (
  id             SERIAL PRIMARY KEY,
  numero         VARCHAR(20)  NOT NULL UNIQUE,
  tipo           VARCHAR(40)  NOT NULL
                 CHECK (tipo IN ('individual', 'doble', 'suite', 'familiar')),
  capacidad      INT          NOT NULL DEFAULT 1 CHECK (capacidad >= 1),
  precio_noche   NUMERIC(12,2) NOT NULL CHECK (precio_noche >= 0),
  estado         VARCHAR(30)  NOT NULL DEFAULT 'disponible'
                 CHECK (estado IN ('disponible', 'mantenimiento', 'inactiva')),
  descripcion    TEXT,
  imagen_url     TEXT,
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Reservas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reservas (
  id             SERIAL PRIMARY KEY,
  cliente_id     INT NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  habitacion_id  INT NOT NULL REFERENCES habitaciones(id) ON DELETE RESTRICT,
  empleado_id    INT REFERENCES empleados(id) ON DELETE SET NULL,
  fecha_entrada  DATE NOT NULL,
  fecha_salida   DATE NOT NULL,
  num_huespedes  INT  NOT NULL DEFAULT 1 CHECK (num_huespedes >= 1),
  estado         VARCHAR(30) NOT NULL DEFAULT 'pendiente'
                 CHECK (estado IN ('pendiente', 'confirmada', 'cancelada', 'completada')),
  total          NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  notas          TEXT,
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_fechas CHECK (fecha_salida > fecha_entrada)
);

CREATE INDEX IF NOT EXISTS idx_reservas_habitacion ON reservas(habitacion_id);
CREATE INDEX IF NOT EXISTS idx_reservas_cliente ON reservas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_reservas_fechas ON reservas(fecha_entrada, fecha_salida);

-- ------------------------------------------------------------
-- Servicios adicionales (restaurante, bar, spa, etc.)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS servicios (
  id             SERIAL PRIMARY KEY,
  nombre         VARCHAR(160) NOT NULL,
  categoria      VARCHAR(60)  NOT NULL DEFAULT 'otro'
                 CHECK (categoria IN ('restaurante', 'bar', 'spa', 'lavanderia', 'transporte', 'otro')),
  precio         NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
  proveedor_id   INT REFERENCES proveedores(id) ON DELETE SET NULL,
  activo         BOOLEAN      NOT NULL DEFAULT TRUE,
  creado_en      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Servicios consumidos dentro de una reserva
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reserva_servicios (
  id            SERIAL PRIMARY KEY,
  reserva_id    INT NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
  servicio_id   INT NOT NULL REFERENCES servicios(id) ON DELETE RESTRICT,
  cantidad      INT NOT NULL DEFAULT 1 CHECK (cantidad >= 1),
  precio_unit   NUMERIC(12,2) NOT NULL CHECK (precio_unit >= 0),
  subtotal      NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
  fecha         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reserva_servicios_reserva ON reserva_servicios(reserva_id);
CREATE INDEX IF NOT EXISTS idx_reserva_servicios_servicio ON reserva_servicios(servicio_id);

-- ------------------------------------------------------------
-- Facturas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS facturas (
  id             SERIAL PRIMARY KEY,
  reserva_id     INT NOT NULL REFERENCES reservas(id) ON DELETE RESTRICT,
  cliente_id     INT NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  numero         VARCHAR(40) NOT NULL UNIQUE,
  subtotal       NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  impuestos      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (impuestos >= 0),
  total          NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  estado         VARCHAR(30) NOT NULL DEFAULT 'emitida'
                 CHECK (estado IN ('emitida', 'pagada', 'anulada')),
  emitida_en     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creado_en      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_facturas_reserva ON facturas(reserva_id);
CREATE INDEX IF NOT EXISTS idx_facturas_cliente ON facturas(cliente_id);

-- ------------------------------------------------------------
-- Detalle de factura
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS factura_detalle (
  id           SERIAL PRIMARY KEY,
  factura_id   INT NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  descripcion  VARCHAR(255) NOT NULL,
  cantidad     NUMERIC(12,2) NOT NULL DEFAULT 1 CHECK (cantidad >= 0),
  precio_unit  NUMERIC(12,2) NOT NULL CHECK (precio_unit >= 0),
  subtotal     NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0)
);

CREATE INDEX IF NOT EXISTS idx_factura_detalle_factura ON factura_detalle(factura_id);

-- ------------------------------------------------------------
-- Pagos en linea (Stripe / PayPal)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pagos (
  id                 SERIAL PRIMARY KEY,
  factura_id         INT NOT NULL REFERENCES facturas(id) ON DELETE RESTRICT,
  monto              NUMERIC(12,2) NOT NULL CHECK (monto >= 0),
  moneda             VARCHAR(10) NOT NULL DEFAULT 'usd',
  metodo             VARCHAR(30) NOT NULL DEFAULT 'stripe'
                     CHECK (metodo IN ('stripe', 'paypal', 'efectivo', 'tarjeta')),
  estado             VARCHAR(30) NOT NULL DEFAULT 'pendiente'
                     CHECK (estado IN ('pendiente', 'completado', 'fallido', 'reembolsado')),
  referencia_externa VARCHAR(255),
  creado_en          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pagos_factura ON pagos(factura_id);
