'use strict';

const { z } = require('zod');

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  estado: z.enum(['pendiente', 'completado', 'fallido', 'reembolsado']).optional(),
  factura_id: z.coerce.number().int().positive().optional(),
});

// Crea un PaymentIntent de Stripe para una factura
const crearIntentoSchema = z.object({
  factura_id: z.coerce.number().int().positive(),
  moneda: z.string().trim().length(3).optional(),
});

// Registra un pago manual (efectivo/tarjeta) sin pasarela
const pagoManualSchema = z.object({
  factura_id: z.coerce.number().int().positive(),
  monto: z.coerce.number().positive(),
  metodo: z.enum(['efectivo', 'tarjeta']),
  moneda: z.string().trim().length(3).optional(),
});

// Confirma manualmente un intento por su reference (para pruebas sin webhook)
const confirmarSchema = z.object({
  referencia_externa: z.string().trim().min(1),
});

module.exports = { idParam, listQuery, crearIntentoSchema, pagoManualSchema, confirmarSchema };
