'use strict';

const { z } = require('zod');

const ESTADOS = ['emitida', 'pagada', 'anulada'];

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  estado: z.enum(ESTADOS).optional(),
  cliente_id: z.coerce.number().int().positive().optional(),
});

// Generar factura a partir de una reserva
const generarSchema = z.object({
  reserva_id: z.coerce.number().int().positive(),
  impuesto_porcentaje: z.coerce.number().min(0).max(100).optional(),
});

const estadoSchema = z.object({
  estado: z.enum(ESTADOS),
});

module.exports = { idParam, listQuery, generarSchema, estadoSchema };
