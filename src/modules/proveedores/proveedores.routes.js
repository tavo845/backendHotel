'use strict';

const { Router } = require('express');
const controller = require('./proveedores.controller');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { idParam, listQuery, createSchema, updateSchema } = require('./proveedores.validation');

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listQuery }), controller.list);
router.get('/:id', validate({ params: idParam }), controller.getById);
router.post('/', validate({ body: createSchema }), controller.create);
router.put('/:id', validate({ params: idParam, body: updateSchema }), controller.update);
router.delete('/:id', validate({ params: idParam }), controller.remove);

module.exports = router;
