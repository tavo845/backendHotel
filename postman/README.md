# Pruebas con Postman

Esta carpeta contiene la colección y el environment para probar la API.

## Archivos

- `Hotel-Reservas.postman_collection.json` — todos los endpoints organizados por módulo.
- `Hotel-Reservas.postman_environment.json` — variables (`baseUrl`, `token`, `reservaId`, `facturaId`).

## Importar en Postman

1. Abre Postman.
2. Botón **Import** (arriba a la izquierda).
3. Arrastra o selecciona los dos archivos `.json` de esta carpeta.
4. Arriba a la derecha, selecciona el environment **"Hotel Reservas - Local"**.

## Antes de empezar

Levanta el servidor:

```bash
npm run dev
```

Debe quedar en `http://localhost:4000` (es el valor por defecto de `baseUrl`).

## Flujo recomendado de prueba

1. **Auth → Login (guarda token)**
   Usa `admin@hotel.com` / `admin123`. Un script guarda el token automáticamente en `{{token}}`, así que el resto de peticiones ya van autenticadas.

2. **Clientes → Listar / Crear**
   El seed ya trae 2 clientes y 4 habitaciones.

3. **Reservas → Crear reserva**
   Guarda el `id` en `{{reservaId}}` automáticamente. Verifica que las fechas no se solapen con otra reserva de la misma habitación.

4. **Servicios → Agregar servicio a reserva**
   Usa `{{reservaId}}`. El seed trae servicios con `id` del 1 al 6.

5. **Facturas → Generar factura desde reserva**
   Toma `{{reservaId}}`, suma hospedaje + servicios e incluye impuestos. Guarda `{{facturaId}}`.

6. **Pagos → Pago manual** o **Crear intento de pago Stripe**
   El pago manual marca la factura como `pagada` si cubre el total. El intento de Stripe requiere `STRIPE_SECRET_KEY` en el `.env`.

7. **Reportes → Resumen / Ocupación / Servicios más solicitados**

## Notas

- Todos los endpoints (salvo `register` y `login`) requieren el header `Authorization: Bearer <token>`, que la colección envía automáticamente vía `{{token}}`.
- Las acciones de administración en **Empleados** y **Habitaciones** (crear/editar/eliminar) requieren rol `admin`. El usuario del seed ya es admin.
