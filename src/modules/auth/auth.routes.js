'use strict';

const { Router } = require('express');
const controller = require('./auth.controller');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { registerSchema, loginSchema } = require('./auth.validation');

const router = Router();

router.post('/register', validate({ body: registerSchema }), controller.register);
router.post('/login', validate({ body: loginSchema }), controller.login);
router.get('/me', authenticate, controller.me);

module.exports = router;
