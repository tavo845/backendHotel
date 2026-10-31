'use strict';

const { Router } = require('express');
const controller = require('./servicios.controller');
const validate = require('../../middlewares/validate');
const { authenticate } = require('../../middlewares/auth');
const {
  idParam,
  listQuery,
  createSchema,
  updateSchema,
  addToReservaSchema,
  reservaIdParam,
} = require('./servicios.validation');

const router = Router();

router.use(authenticate);

// Catalogo de servicios
router.get('/', validate({ query: listQuery }), controller.list);
router.get('/:id', validate({ params: idParam }), controller.getById);
router.post('/', validate({ body: createSchema }), controller.create);
router.put('/:id', validate({ params: idParam, body: updateSchema }), controller.update);
router.delete('/:id', validate({ params: idParam }), controller.remove);

// Servicios consumidos en una reserva
router.get('/reserva/:reservaId', validate({ params: reservaIdParam }), controller.listByReserva);
router.post('/reserva/:reservaId', validate({ params: reservaIdParam, body: addToReservaSchema }), controller.addToReserva);
router.delete('/consumo/:id', validate({ params: idParam }), controller.removeFromReserva);

module.exports = router;
