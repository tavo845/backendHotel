'use strict';

const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/response');

const authController = {
  register: asyncHandler(async (req, res) => {
    const data = await authService.register(req.body);
    return created(res, data, 'Usuario registrado');
  }),

  login: asyncHandler(async (req, res) => {
    const data = await authService.login(req.body);
    return ok(res, data, 'Inicio de sesion exitoso');
  }),

  me: asyncHandler(async (req, res) => {
    const usuario = await authService.me(req.user.sub);
    return ok(res, usuario);
  }),
};

module.exports = authController;
