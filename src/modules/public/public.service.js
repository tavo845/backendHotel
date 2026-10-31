'use strict';

/**
 * Servicio del sitio publico de reservas.
 *
 * Expone operaciones orientadas al huesped (no al personal del hotel):
 *  - Listar habitaciones disponibles con su imagen.
 *  - Crear una reserva completa (reserva + factura + pago) para el usuario
 *    autenticado, ligandola a un registro de cliente derivado de su cuenta.
 *
 * El cobro con tarjeta es SIMULADO (no se conecta a Stripe real): se valida
 * el numero con el algoritmo de Luhn y se aceptan tarjetas de prueba.
 */

const { query, withTransaction } = require('../../config/database');
const habitacionesModel = require('../habitaciones/habitaciones.model');
const reservasModel = require('../reservas/reservas.model');
const facturasModel = require('../facturas/facturas.model');
const pagosModel = require('../pagos/pagos.model');
const ApiError = require('../../utils/ApiError');

const TASA_IMPUESTO = 0.12; // IVA simulado 12%

function calcularNoches(entrada, salida) {
  const ms = new Date(salida) - new Date(entrada);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

/** Algoritmo de Luhn para validar el numero de tarjeta. */
function luhnValido(numero) {
  const limpio = String(numero).replace(/\D/g, '');
  if (limpio.length < 13 || limpio.length > 19) return false;
  let suma = 0;
  let alternar = false;
  for (let i = limpio.length - 1; i >= 0; i -= 1) {
    let d = parseInt(limpio[i], 10);
    if (alternar) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    suma += d;
    alternar = !alternar;
  }
  return suma % 10 === 0;
}

/**
 * Simula el cobro con tarjeta.
 * Reglas de la simulacion:
 *   - El numero debe pasar Luhn.
 *   - La tarjeta '4000000000000002' se rechaza siempre (tarjeta de prueba declinada).
 *   - Cualquier otra tarjeta valida por Luhn se aprueba.
 */
function simularCobro({ numero, nombre, exp_mes, exp_anio, cvc }) {
  const limpio = String(numero || '').replace(/\D/g, '');

  if (!nombre || !exp_mes || !exp_anio || !cvc) {
    return { aprobado: false, mensaje: 'Faltan datos de la tarjeta' };
  }
  if (!luhnValido(limpio)) {
    return { aprobado: false, mensaje: 'Numero de tarjeta invalido' };
  }
  if (!/^\d{3,4}$/.test(String(cvc))) {
    return { aprobado: false, mensaje: 'CVC invalido' };
  }
  // Validar expiracion (no vencida)
  const ahora = new Date();
  const anioFull = Number(exp_anio) < 100 ? 2000 + Number(exp_anio) : Number(exp_anio);
  const vence = new Date(anioFull, Number(exp_mes), 0, 23, 59, 59);
  if (Number.isNaN(vence.getTime()) || vence < ahora) {
    return { aprobado: false, mensaje: 'La tarjeta esta vencida' };
  }
  // Tarjeta de prueba que siempre se declina.
  if (limpio === '4000000000000002') {
    return { aprobado: false, mensaje: 'Pago rechazado por el banco emisor (tarjeta de prueba)' };
  }

  const referencia = 'SIM_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8).toUpperCase();
  return { aprobado: true, referencia, mensaje: 'Pago aprobado' };
}

const publicService = {
  /** Habitaciones para mostrar en el sitio publico (disponibles). */
  async listRooms() {
    const { rows } = await habitacionesModel.findAll({
      limit: 100,
      offset: 0,
      estado: 'disponible',
    });
    return rows;
  },

  async getRoom(id) {
    const habitacion = await habitacionesModel.findById(id);
    if (!habitacion) throw ApiError.notFound('Habitacion no encontrada');
    return habitacion;
  },

  /**
   * Asegura que exista un registro en `clientes` para el usuario autenticado.
   * Se usa el email como vinculo. Si no existe, lo crea a partir de los datos
   * del usuario y del formulario de huesped.
   */
  async ensureCliente(usuario, huesped, client) {
    const email = usuario.email;
    const { rows: existentes } = await client.query(
      `SELECT * FROM clientes WHERE email = $1 LIMIT 1`,
      [email]
    );
    if (existentes[0]) return existentes[0];

    // Derivar nombre/apellido del nombre completo del usuario o del huesped.
    const nombreCompleto = (huesped?.nombre || usuario.nombre || 'Huesped').trim();
    const partes = nombreCompleto.split(/\s+/);
    const nombre = partes.shift() || 'Huesped';
    const apellido = partes.join(' ') || (huesped?.apellido || '-');
    // Documento unico: si no se provee, se genera a partir del email.
    const documento = (huesped?.documento || `WEB-${email}`).slice(0, 40);

    const { rows } = await client.query(
      `INSERT INTO clientes (nombre, apellido, documento, email, telefono, ciudad, pais)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        nombre,
        apellido,
        documento,
        email,
        huesped?.telefono || null,
        huesped?.ciudad || null,
        huesped?.pais || null,
      ]
    );
    return rows[0];
  },

  /**
   * Crea una reserva completa desde el sitio publico:
   *   1. Valida habitacion y fechas.
   *   2. Simula el cobro con tarjeta.
   *   3. Dentro de una transaccion: crea/reutiliza cliente, crea reserva
   *      (confirmada), emite factura y registra el pago como completado.
   */
  async crearReserva(usuario, payload) {
    const { habitacion_id, fecha_entrada, fecha_salida, num_huespedes, huesped, tarjeta } = payload;

    const habitacion = await habitacionesModel.findById(habitacion_id);
    if (!habitacion) throw ApiError.badRequest('La habitacion indicada no existe');
    if (habitacion.estado !== 'disponible') {
      throw ApiError.conflict('La habitacion no esta disponible');
    }
    const noches = calcularNoches(fecha_entrada, fecha_salida);
    if (noches < 1) throw ApiError.badRequest('La fecha de salida debe ser posterior a la de entrada');
    if (num_huespedes && num_huespedes > habitacion.capacidad) {
      throw ApiError.badRequest('El numero de huespedes excede la capacidad de la habitacion');
    }

    // Simular el cobro ANTES de tocar la base de datos.
    const cobro = simularCobro(tarjeta || {});
    if (!cobro.aprobado) {
      throw ApiError.badRequest(cobro.mensaje || 'El pago fue rechazado');
    }

    const subtotal = Number(habitacion.precio_noche) * noches;
    const impuestos = Math.round(subtotal * TASA_IMPUESTO * 100) / 100;
    const total = Math.round((subtotal + impuestos) * 100) / 100;

    return withTransaction(async (client) => {
      // Verificar solapamiento dentro de la transaccion.
      const ocupada = await reservasModel.haySolapamiento(
        { habitacion_id, fecha_entrada, fecha_salida },
        client
      );
      if (ocupada) {
        throw ApiError.conflict('La habitacion ya esta reservada en esas fechas');
      }

      const cliente = await publicService.ensureCliente(usuario, huesped, client);

      const reserva = await reservasModel.create(
        {
          cliente_id: cliente.id,
          habitacion_id,
          empleado_id: null,
          fecha_entrada,
          fecha_salida,
          num_huespedes: num_huespedes || 1,
          estado: 'confirmada',
          total,
          notas: 'Reserva realizada desde el sitio web',
        },
        client
      );

      const numeroFactura = 'WEB-' + reserva.id + '-' + Date.now().toString().slice(-6);
      const factura = await facturasModel.createConDetalle(
        {
          reserva_id: reserva.id,
          cliente_id: cliente.id,
          numero: numeroFactura,
          subtotal,
          impuestos,
          total,
          detalle: [
            {
              descripcion: `Habitacion ${habitacion.numero} (${habitacion.tipo}) x ${noches} noche(s)`,
              cantidad: noches,
              precio_unit: Number(habitacion.precio_noche),
              subtotal,
            },
          ],
        },
        client
      );

      // Marcar la factura como pagada.
      await client.query(
        `UPDATE facturas SET estado = 'pagada', actualizado_en = NOW() WHERE id = $1`,
        [factura.id]
      );

      // Registrar el pago (tarjeta, completado).
      const { rows: pagoRows } = await client.query(
        `INSERT INTO pagos (factura_id, monto, moneda, metodo, estado, referencia_externa)
         VALUES ($1, $2, 'GTQ', 'tarjeta', 'completado', $3)
         RETURNING *`,
        [factura.id, total, cobro.referencia]
      );
      const pago = pagoRows[0];

      return {
        reserva: { ...reserva, estado: 'confirmada' },
        factura: { ...factura, estado: 'pagada' },
        pago,
        habitacion,
        noches,
        subtotal,
        impuestos,
        total,
        referencia_pago: cobro.referencia,
      };
    });
  },

  /**
   * Cancela una reserva del propio usuario autenticado.
   * Aplica un cargo de cancelacion del 10% del total y lo registra como un pago.
   * Solo se permite cancelar reservas en estado 'pendiente' o 'confirmada'.
   */
  async cancelarReserva(usuario, reservaId) {
    return withTransaction(async (client) => {
      // Buscar la reserva asegurando que pertenece al usuario (por email del cliente).
      const { rows } = await client.query(
        `SELECT r.*, f.id AS factura_id, f.estado AS factura_estado
         FROM reservas r
         JOIN clientes c ON c.id = r.cliente_id
         LEFT JOIN facturas f ON f.reserva_id = r.id
         WHERE r.id = $1 AND c.email = $2`,
        [reservaId, usuario.email]
      );
      const reserva = rows[0];
      if (!reserva) throw ApiError.notFound('Reserva no encontrada');

      if (reserva.estado === 'cancelada') {
        throw ApiError.conflict('La reserva ya estaba cancelada');
      }
      if (reserva.estado === 'completada') {
        throw ApiError.conflict('No se puede cancelar una reserva ya completada');
      }

      // Cargo de cancelacion: 10% del total de la reserva.
      const cargo = Math.round(Number(reserva.total) * 0.1 * 100) / 100;

      // Cambiar estado de la reserva.
      await client.query(
        `UPDATE reservas SET estado = 'cancelada', actualizado_en = NOW() WHERE id = $1`,
        [reservaId]
      );

      // Anular la factura asociada (si existe) y registrar el cargo como un pago.
      if (reserva.factura_id) {
        await client.query(
          `UPDATE facturas SET estado = 'anulada', actualizado_en = NOW() WHERE id = $1`,
          [reserva.factura_id]
        );
        if (cargo > 0) {
          await client.query(
            `INSERT INTO pagos (factura_id, monto, moneda, metodo, estado, referencia_externa)
             VALUES ($1, $2, 'GTQ', 'tarjeta', 'completado', $3)`,
            [reserva.factura_id, cargo, 'CANCEL_' + Date.now()]
          );
        }
      }

      return {
        reserva_id: reservaId,
        estado: 'cancelada',
        cargo_cancelacion: cargo,
        total_reserva: Number(reserva.total),
      };
    });
  },

  /** Lista las reservas del usuario autenticado (por su email -> cliente). */
  async misReservas(usuario) {
    const { rows } = await query(
      `SELECT r.*,
              h.numero AS habitacion_numero, h.tipo AS habitacion_tipo,
              h.precio_noche AS habitacion_precio, h.imagen_url AS habitacion_imagen,
              f.id AS factura_id, f.numero AS factura_numero,
              f.subtotal AS factura_subtotal, f.impuestos AS factura_impuestos,
              f.total AS factura_total, f.estado AS factura_estado,
              f.emitida_en AS factura_emitida_en,
              p.estado AS pago_estado, p.metodo AS pago_metodo,
              p.referencia_externa AS pago_referencia
       FROM reservas r
       JOIN clientes c ON c.id = r.cliente_id
       JOIN habitaciones h ON h.id = r.habitacion_id
       LEFT JOIN facturas f ON f.reserva_id = r.id
       LEFT JOIN LATERAL (
         SELECT estado, metodo, referencia_externa
         FROM pagos
         WHERE factura_id = f.id
         ORDER BY id DESC
         LIMIT 1
       ) p ON TRUE
       WHERE c.email = $1
       ORDER BY r.id DESC`,
      [usuario.email]
    );
    return rows;
  },
};

module.exports = publicService;
module.exports.luhnValido = luhnValido;
module.exports.simularCobro = simularCobro;
