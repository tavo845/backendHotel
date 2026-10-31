'use strict';

const { Router } = require('express');
const controller = require('./pagos.controller');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const {
  idParam,
  listQuery,
  crearIntentoSchema,
  pagoManualSchema,
  confirmarSchema,
} = require('./pagos.validation');

const router = Router();

router.use(authenticate);

router.get('/', validate({ query: listQuery }), controller.list);
router.get('/:id', validate({ params: idParam }), controller.getById);
router.post('/stripe/intento', validate({ body: crearIntentoSchema }), controller.crearIntento);
router.post('/manual', validate({ body: pagoManualSchema }), controller.pagoManual);
router.post('/confirmar', validate({ body: confirmarSchema }), controller.confirmar);

module.exports = router;
