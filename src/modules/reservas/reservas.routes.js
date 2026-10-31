'use strict';

const { Router } = require('express');
const controller = require('./reservas.controller');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { idParam, listQuery, createSchema, updateSchema, estadoSchema } = require('./reservas.validation');

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listQuery }), controller.list);
router.get('/:id', validate({ params: idParam }), controller.getById);
router.post('/', validate({ body: createSchema }), controller.create);
router.put('/:id', validate({ params: idParam, body: updateSchema }), controller.update);
router.patch('/:id/estado', validate({ params: idParam, body: estadoSchema }), controller.cambiarEstado);
router.delete('/:id', validate({ params: idParam }), controller.remove);

module.exports = router;
