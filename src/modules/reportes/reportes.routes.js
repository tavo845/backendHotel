'use strict';

const { Router } = require('express');
const controller = require('./reportes.controller');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const { rangoFechas, serviciosQuery } = require('./reportes.validation');

const router = Router();

router.use(authenticate);

router.get('/resumen', controller.resumen);
router.get('/ocupacion', validate({ query: rangoFechas }), controller.ocupacion);
router.get('/servicios-mas-solicitados', validate({ query: serviciosQuery }), controller.serviciosMasSolicitados);

module.exports = router;
