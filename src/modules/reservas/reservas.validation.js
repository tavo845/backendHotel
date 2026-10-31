'use strict';

const { z } = require('zod');

const ESTADOS = ['pendiente', 'confirmada', 'cancelada', 'completada'];

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  estado: z.enum(ESTADOS).optional(),
  cliente_id: z.coerce.number().int().positive().optional(),
  habitacion_id: z.coerce.number().int().positive().optional(),
});

const createSchema = z.object({
  cliente_id: z.coerce.number().int().positive(),
  habitacion_id: z.coerce.number().int().positive(),
  empleado_id: z.coerce.number().int().positive().optional().nullable(),
  fecha_entrada: z.coerce.date(),
  fecha_salida: z.coerce.date(),
  num_huespedes: z.coerce.number().int().positive().optional(),
  notas: z.string().trim().optional().nullable(),
}).refine((d) => d.fecha_salida > d.fecha_entrada, {
  message: 'fecha_salida debe ser posterior a fecha_entrada',
  path: ['fecha_salida'],
});

const updateSchema = z.object({
  cliente_id: z.coerce.number().int().positive().optional(),
  habitacion_id: z.coerce.number().int().positive().optional(),
  empleado_id: z.coerce.number().int().positive().optional().nullable(),
  fecha_entrada: z.coerce.date().optional(),
  fecha_salida: z.coerce.date().optional(),
  num_huespedes: z.coerce.number().int().positive().optional(),
  notas: z.string().trim().optional().nullable(),
});

const estadoSchema = z.object({
  estado: z.enum(ESTADOS),
});

module.exports = { idParam, listQuery, createSchema, updateSchema, estadoSchema };
