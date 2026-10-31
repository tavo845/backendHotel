'use strict';

const publicService = require('./public.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');

const publicController = {
  listRooms: asyncHandler(async (req, res) => {
    const rooms = await publicService.listRooms();
    return ok(res, rooms);
  }),

  getRoom: asyncHandler(async (req, res) => {
    const room = await publicService.getRoom(req.params.id);
    return ok(res, room);
  }),

  crearReserva: asyncHandler(async (req, res) => {
    const data = await publicService.crearReserva(req.user, req.body);
    return created(res, data, 'Reserva confirmada y pago procesado');
  }),

  misReservas: asyncHandler(async (req, res) => {
    const reservas = await publicService.misReservas(req.user);
    return ok(res, reservas);
  }),

  cancelarReserva: asyncHandler(async (req, res) => {
    const data = await publicService.cancelarReserva(req.user, req.params.id);
    return ok(res, data, 'Reserva cancelada');
  }),
};

module.exports = publicController;
