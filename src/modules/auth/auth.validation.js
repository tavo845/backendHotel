'use strict';

const { z } = require('zod');

const registerSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  email: z.string().trim().email('Email invalido').max(160),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres').max(100),
  rol: z.enum(['admin', 'empleado', 'recepcion', 'cliente']).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email('Email invalido'),
  password: z.string().min(1, 'La contrasena es obligatoria'),
});

module.exports = { registerSchema, loginSchema };
