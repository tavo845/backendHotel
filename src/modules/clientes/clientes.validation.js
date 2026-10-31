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
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  apellido: z.string().trim().min(1, 'El apellido es obligatorio').max(120),
  documento: z.string().trim().min(1, 'El documento es obligatorio').max(40),
  email: z.string().trim().email('Email invalido').max(160).optional().nullable(),
  telefono: z.string().trim().max(40).optional().nullable(),
  direccion: z.string().trim().max(255).optional().nullable(),
  ciudad: z.string().trim().max(120).optional().nullable(),
  pais: z.string().trim().max(120).optional().nullable(),
});

const updateSchema = createSchema.partial();

module.exports = { idParam, listQuery, createSchema, updateSchema };
