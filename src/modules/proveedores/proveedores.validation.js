'use strict';

const { z } = require('zod');

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

const listQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().trim().optional(),
});

const createSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(160),
  nit: z.string().trim().max(40).optional().nullable(),
  contacto: z.string().trim().max(120).optional().nullable(),
  email: z.string().trim().email('Email invalido').max(160).optional().nullable(),
  telefono: z.string().trim().max(40).optional().nullable(),
  direccion: z.string().trim().max(255).optional().nullable(),
  tipo_servicio: z.string().trim().max(120).optional().nullable(),
  activo: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

module.exports = { idParam, listQuery, createSchema, updateSchema };
