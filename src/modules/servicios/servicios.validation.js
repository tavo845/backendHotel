'use strict';

const { z } = require('zod');

const CATEGORIAS = ['restaurante', 'bar', 'spa', 'lavanderia', 'transporte', 'otro'];

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional(),
  categoria: z.enum(CATEGORIAS).optional(),
  activo: z.coerce.boolean().optional(),
});

const createSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(160),
  categoria: z.enum(CATEGORIAS).optional(),
  precio: z.coerce.number().min(0),
  proveedor_id: z.coerce.number().int().positive().optional().nullable(),
  activo: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

// Agregar un servicio a una reserva
const addToReservaSchema = z.object({
  servicio_id: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().positive().optional(),
});

const reservaIdParam = z.object({
  reservaId: z.coerce.number().int().positive(),
});

module.exports = { idParam, listQuery, createSchema, updateSchema, addToReservaSchema, reservaIdParam };
