'use strict';

const { z } = require('zod');

const rangoFechas = z.object({
  desde: z.coerce.date(),
  hasta: z.coerce.date(),
}).refine((d) => d.hasta >= d.desde, {
  message: 'hasta debe ser igual o posterior a desde',
  path: ['hasta'],
});

const serviciosQuery = z.object({
  desde: z.coerce.date(),
  hasta: z.coerce.date(),
  limit: z.coerce.number().int().positive().max(100).optional(),
}).refine((d) => d.hasta >= d.desde, {
  message: 'hasta debe ser igual o posterior a desde',
  path: ['hasta'],
});

module.exports = { rangoFechas, serviciosQuery };
