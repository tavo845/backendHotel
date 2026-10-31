'use strict';

const { Router } = require('express');
const controller = require('./public.controller');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { crearReservaSchema, idParam } = require('./public.validation');

const router = Router();

// --- Endpoints publicos (sin autenticacion) ---
router.get('/habitaciones', controller.listRooms);
router.get('/habitaciones/:id', validate({ params: idParam }), controller.getRoom);

// --- Endpoints que requieren sesion (cualquier usuario autenticado) ---
router.post('/reservas', authenticate, validate({ body: crearReservaSchema }), controller.crearReserva);
router.get('/reservas', authenticate, controller.misReservas);
router.post('/reservas/:id/cancelar', authenticate, validate({ params: idParam }), controller.cancelarReserva);

module.exports = router;
