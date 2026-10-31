'use strict';

const { z } = require('zod');

const TIPOS = ['individual', 'doble', 'suite', 'familiar'];
const ESTADOS = ['disponible', 'mantenimiento', 'inactiva'];

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional(),
  estado: z.enum(ESTADOS).optional(),
  tipo: z.enum(TIPOS).optional(),
});

const disponibilidadQuery = z.object({
  fecha_entrada: z.coerce.date(),
  fecha_salida: z.coerce.date(),
  tipo: z.enum(TIPOS).optional(),
  capacidad: z.coerce.number().int().positive().optional(),
}).refine((d) => d.fecha_salida > d.fecha_entrada, {
  message: 'fecha_salida debe ser posterior a fecha_entrada',
  path: ['fecha_salida'],
});

const createSchema = z.object({
  numero: z.string().trim().min(1, 'El numero es obligatorio').max(20),
  tipo: z.enum(TIPOS),
  capacidad: z.coerce.number().int().positive().optional(),
  precio_noche: z.coerce.number().min(0),
  estado: z.enum(ESTADOS).optional(),
  descripcion: z.string().trim().optional().nullable(),
});

const updateSchema = createSchema.partial();

module.exports = { idParam, listQuery, disponibilidadQuery, createSchema, updateSchema };
