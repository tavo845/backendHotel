# Backend - Sistema de Reservas de Hotel

API REST construida con **Node.js + Express + PostgreSQL** (base de datos alojada en **Render**).
Arquitectura por capas y organizada por módulos (rutas → controlador → servicio → modelo).

## Módulos incluidos

- **Auth**: registro, login y perfil con JWT.
- **Clientes**: gestión de huéspedes.
- **Empleados**: administración del personal.
- **Proveedores**: gestión de proveedores.
- **Habitaciones**: catálogo + consulta de disponibilidad por fechas.
- **Reservas**: gestión de reservas con control de disponibilidad y cálculo de total.
- **Servicios**: catálogo de servicios adicionales y su consumo por reserva.
- **Facturación**: generación de facturas con detalle (hospedaje + servicios).
- **Pagos**: pagos en línea con Stripe (PaymentIntent + webhook) y pagos manuales.
- **Reportes**: ocupación por fecha y servicios más solicitados.

## Estructura del proyecto

```
src/
├── app.js                  # Configuración de Express (middlewares, rutas)
├── server.js               # Arranque del servidor y conexión a BD
├── config/
│   ├── env.js              # Variables de entorno centralizadas
│   ├── database.js         # Pool de PostgreSQL + helpers de transacción
│   └── stripe.js           # Cliente de Stripe
├── database/
│   ├── schema.sql          # Definición de tablas
│   ├── migrate.js          # Ejecuta el schema
│   └── seed.js             # Datos de ejemplo
├── middlewares/            # auth, validate, errorHandler, notFound
├── utils/                  # ApiError, response, asyncHandler, pagination
├── routes/index.js         # Router principal (/api/v1)
└── modules/                # Un folder por módulo (model/service/controller/routes/validation)
```

## Requisitos

- Node.js 18 o superior
- Una base de datos PostgreSQL (por ejemplo, en Render)

## Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo de ejemplo y complétalo con tus datos:

```bash
copy .env.example .env      # Windows (PowerShell/CMD)
# o
cp .env.example .env        # Linux / macOS
```

En `.env`, lo más importante es `DATABASE_URL`. En Render:
1. Entra a tu base de datos PostgreSQL.
2. Copia la **External Database URL**.
3. Pégala en `DATABASE_URL`. Deja `DB_SSL=true` (Render requiere SSL en conexiones externas).

### 3. Crear las tablas (migración)

```bash
npm run db:migrate
```

### 4. (Opcional) Cargar datos de ejemplo

```bash
npm run db:seed
```

Esto crea un usuario administrador de prueba:
- **Email:** `admin@hotel.com`
- **Password:** `admin123`

### 5. Levantar el servidor

```bash
npm run dev      # desarrollo (con recarga automática)
# o
npm start        # producción
```

El servidor queda disponible en `http://localhost:4000` y la API en `http://localhost:4000/api/v1`.

## Autenticación

La mayoría de endpoints requieren un token JWT. Flujo típico:

1. `POST /api/v1/auth/login` con `{ "email": "...", "password": "..." }`.
2. Usa el token recibido en el header: `Authorization: Bearer <token>`.

## Endpoints principales

| Recurso | Ruta base |
|---|---|
| Auth | `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me` |
| Clientes | `GET/POST /api/v1/clientes`, `GET/PUT/DELETE /api/v1/clientes/:id` |
| Empleados | `GET/POST /api/v1/empleados`, `GET/PUT/DELETE /api/v1/empleados/:id` |
| Proveedores | `GET/POST /api/v1/proveedores`, `GET/PUT/DELETE /api/v1/proveedores/:id` |
| Habitaciones | `GET/POST /api/v1/habitaciones`, `GET /api/v1/habitaciones/disponibilidad?fecha_entrada=&fecha_salida=` |
| Reservas | `GET/POST /api/v1/reservas`, `PATCH /api/v1/reservas/:id/estado` |
| Servicios | `GET/POST /api/v1/servicios`, `POST /api/v1/servicios/reserva/:reservaId` |
| Facturas | `POST /api/v1/facturas/generar`, `GET /api/v1/facturas/:id` |
| Pagos | `POST /api/v1/pagos/stripe/intento`, `POST /api/v1/pagos/manual` |
| Reportes | `GET /api/v1/reportes/ocupacion?desde=&hasta=`, `GET /api/v1/reportes/servicios-mas-solicitados?desde=&hasta=` |

## Pagos con Stripe

1. Define `STRIPE_SECRET_KEY` en `.env`.
2. Genera una factura con `POST /api/v1/facturas/generar`.
3. Crea el intento de pago con `POST /api/v1/pagos/stripe/intento` enviando `{ "factura_id": 1 }`. La respuesta incluye `clientSecret` para el frontend.
4. Configura el webhook de Stripe apuntando a `POST /api/v1/pagos/webhook` y coloca `STRIPE_WEBHOOK_SECRET` en `.env`. Al completarse el pago, la factura pasa a `pagada` automáticamente.

## Formato de respuestas

```json
{ "success": true, "message": "OK", "data": { } }
```

Los listados incluyen además un objeto `pagination`.

## Despliegue en Render

Guía completa en **[DEPLOY-RENDER.md](DEPLOY-RENDER.md)**. Resumen:

- El repositorio incluye `render.yaml` (Blueprint): en Render usa **New → Blueprint** y listo.
- **Build command:** `npm install` · **Start command:** `npm start` · **Health check:** `/health`
- No necesitas definir `PORT` (Render lo inyecta) ni `DB_SSL` (se detecta automáticamente).
- Ejecuta la migración una vez (localmente apuntando a la BD de Render o con un Job): `npm run db:migrate`.
