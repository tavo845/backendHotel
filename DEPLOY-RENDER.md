# Despliegue en Render

Guía para publicar el backend en Render. Tu base de datos PostgreSQL ya existe
en Render (base `proyectoropa`); aquí desplegarás el servicio web que la usa.

## Opción A — Con Blueprint (recomendada, usa `render.yaml`)

1. Sube el proyecto a un repositorio de GitHub/GitLab (ver "Preparar el repositorio" abajo).
2. En Render: **New → Blueprint**.
3. Conecta el repositorio que contiene `render.yaml`.
4. Render leerá el archivo y creará el servicio web `hotel-reservas-backend`:
   - `buildCommand`: `npm install`
   - `startCommand`: `npm start`
   - `healthCheckPath`: `/health`
   - `JWT_SECRET`: se genera solo de forma segura.
   - `CORS_ORIGIN`: `*` (abierto, para que el frontend pueda llamar al API).
5. **Define `DATABASE_URL` manualmente** en el dashboard del servicio (está marcada
   como secreta en `render.yaml`, por eso no se crea sola):
   - Entra a tu base `proyectoropa` en Render y copia la **Internal Database URL**
     (si el backend está en la misma cuenta y región) o la **External Database URL**.
   - Pégala en el servicio: **Environment → Add Environment Variable → `DATABASE_URL`**.
   - Si usaste la **External URL** (termina en `.render.com`), agrega también
     `DB_SSL=true`. Con la **Internal URL**, deja `DB_SSL` sin definir o en `false`.
6. Si vas a usar Stripe, agrega los valores `STRIPE_SECRET_KEY` y
   `STRIPE_WEBHOOK_SECRET` (están marcados como secretos).
7. Deploy. Cuando termine, tu API queda en `https://<tu-servicio>.onrender.com`.

## Opción B — Manual (sin Blueprint)

1. En Render: **New → Web Service** y conecta tu repositorio.
2. Configura:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
3. En **Environment**, agrega las variables:
   | Variable | Valor |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | La **Internal Database URL** de tu BD en Render |
   | `JWT_SECRET` | Un secreto largo y aleatorio |
   | `JWT_EXPIRES_IN` | `1d` |
   | `DEFAULT_CURRENCY` | `usd` |
   | `CORS_ORIGIN` | `*` (o el dominio de tu frontend) |
   | `STRIPE_SECRET_KEY` | (opcional) tu clave de Stripe |
   | `STRIPE_WEBHOOK_SECRET` | (opcional) secreto del webhook |

   No necesitas definir `PORT` (Render lo inyecta) ni `DB_SSL`
   (la app detecta SSL automáticamente: interna sin SSL, externa con SSL).

## Crear las tablas en producción

El servicio no corre la migración solo. Tienes dos opciones:

- **Desde tu máquina** (más simple): con el `.env` local apuntando a la
  **External Database URL** de `proyectoropa`, ejecuta una sola vez:
  ```bash
  npm run db:migrate          # crea todas las tablas (schema.sql)
  npm run db:migrate:public   # ajustes del sitio publico (rol cliente, imagen_url)
  npm run db:seed             # opcional: datos de ejemplo (habitaciones con imagen, admin, etc.)
  ```
  (Ya se ejecutó contra `proyectoropa`, así que las tablas y el seed están cargados.)

- **Desde Render** con un Job puntual, usando `node src/database/migrate.js`
  seguido de `node src/database/migrate-public.js`.

> El usuario administrador del seed es `admin@hotel.com` / `admin123`.

## Preparar el repositorio

Asegúrate de **no** subir el `.env` (ya está en `.gitignore`).

```bash
git init
git add .
git commit -m "Backend Sistema de Reservas de Hotel"
git branch -M main
git remote add origin <URL-de-tu-repo>
git push -u origin main
```

## Probar en producción con Postman

1. Importa `postman/Hotel-Reservas-Render.postman_environment.json`.
2. Edita la variable `baseUrl` y reemplaza `TU-SERVICIO` por el nombre real,
   por ejemplo: `https://hotel-reservas-backend.onrender.com/api/v1`.
3. Selecciona ese environment y ejecuta **Auth → Login** para empezar.

## Notas del plan gratuito de Render

- El servicio se "duerme" tras un rato de inactividad; la primera petición
  después de dormir puede tardar unos segundos en responder.
- La base de datos gratuita de Render tiene una fecha de expiración; revisa el
  dashboard para migrar a un plan de pago si necesitas persistencia a largo plazo.
