'use strict';

const { Router } = require('express');
const controller = require('./empleados.controller');
const validate = require('../../middlewares/validate');
const { authenticate, authorize } = require('../../middlewares/auth');
const { idParam, listQuery, createSchema, updateSchema } = require('./empleados.validation');

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listQuery }), controller.list);
router.get('/:id', validate({ params: idParam }), controller.getById);
router.post('/', authorize('admin'), validate({ body: createSchema }), controller.create);
router.put('/:id', authorize('admin'), validate({ params: idParam, body: updateSchema }), controller.update);
router.delete('/:id', authorize('admin'), validate({ params: idParam }), controller.remove);

module.exports = router;
