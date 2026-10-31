'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authModel = require('./auth.model');
const ApiError = require('../../utils/ApiError');
const { env } = require('../../config/env');

function generarToken(usuario) {
  return jwt.sign(
    { sub: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

const authService = {
  async register({ nombre, email, password, rol }) {
    const existente = await authModel.findByEmail(email);
    if (existente) throw ApiError.conflict('El email ya esta registrado');

    const password_hash = await bcrypt.hash(password, 10);
    const usuario = await authModel.create({ nombre, email, password_hash, rol });
    const token = generarToken(usuario);
    return { usuario, token };
  },

  async login({ email, password }) {
    const usuario = await authModel.findByEmail(email);
    if (!usuario) throw ApiError.unauthorized('Credenciales invalidas');
    if (!usuario.activo) throw ApiError.forbidden('Usuario inactivo');

    const coincide = await bcrypt.compare(password, usuario.password_hash);
    if (!coincide) throw ApiError.unauthorized('Credenciales invalidas');

    const token = generarToken(usuario);
    const { password_hash, ...perfil } = usuario;
    return { usuario: perfil, token };
  },

  async me(id) {
    const usuario = await authModel.findById(id);
    if (!usuario) throw ApiError.notFound('Usuario no encontrado');
    return usuario;
  },
};

module.exports = authService;
