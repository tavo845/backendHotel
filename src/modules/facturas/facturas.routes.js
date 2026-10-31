'use strict';

const { Router } = require('express');
const controller = require('./facturas.controller');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { idParam, listQuery, generarSchema, estadoSchema } = require('./facturas.validation');

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listQuery }), controller.list);
router.get('/:id', validate({ params: idParam }), controller.getById);
router.post('/generar', validate({ body: generarSchema }), controller.generar);
router.patch('/:id/estado', validate({ params: idParam, body: estadoSchema }), controller.cambiarEstado);

module.exports = router;
