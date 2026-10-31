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
  cargo: z.string().trim().min(1, 'El cargo es obligatorio').max(120),
  email: z.string().trim().email('Email invalido').max(160).optional().nullable(),
  telefono: z.string().trim().max(40).optional().nullable(),
  salario: z.coerce.number().min(0).optional(),
  fecha_ingreso: z.coerce.date().optional(),
  activo: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

module.exports = { idParam, listQuery, createSchema, updateSchema };
