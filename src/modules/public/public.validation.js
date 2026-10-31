'use strict';

const { z } = require('zod');

const fecha = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha invalido (YYYY-MM-DD)');

const crearReservaSchema = z.object({
  habitacion_id: z.coerce.number().int().positive('Habitacion invalida'),
  fecha_entrada: fecha,
  fecha_salida: fecha,
  num_huespedes: z.coerce.number().int().min(1).max(20).optional(),
  huesped: z
    .object({
      nombre: z.string().trim().min(1).max(120).optional(),
      apellido: z.string().trim().max(120).optional(),
      documento: z.string().trim().max(40).optional(),
      telefono: z.string().trim().max(40).optional(),
      ciudad: z.string().trim().max(120).optional(),
      pais: z.string().trim().max(120).optional(),
    })
    .optional(),
  tarjeta: z.object({
    numero: z.string().trim().min(12, 'Numero de tarjeta invalido').max(25),
    nombre: z.string().trim().min(1, 'Nombre en la tarjeta requerido').max(120),
    exp_mes: z.coerce.number().int().min(1).max(12),
    exp_anio: z.coerce.number().int().min(0).max(2100),
    cvc: z.string().trim().regex(/^\d{3,4}$/, 'CVC invalido'),
  }),
});

const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

module.exports = { crearReservaSchema, idParam };
