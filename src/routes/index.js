'use strict';

const { Router } = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const clientesRoutes = require('../modules/clientes/clientes.routes');
const empleadosRoutes = require('../modules/empleados/empleados.routes');
const proveedoresRoutes = require('../modules/proveedores/proveedores.routes');
const habitacionesRoutes = require('../modules/habitaciones/habitaciones.routes');
const reservasRoutes = require('../modules/reservas/reservas.routes');
const serviciosRoutes = require('../modules/servicios/servicios.routes');
const facturasRoutes = require('../modules/facturas/facturas.routes');
const pagosRoutes = require('../modules/pagos/pagos.routes');
const reportesRoutes = require('../modules/reportes/reportes.routes');
const publicRoutes = require('../modules/public/public.routes');

const router = Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Sistema de Reservas de Hotel',
    version: 'v1',
    endpoints: [
      '/auth', '/clientes', '/empleados', '/proveedores', '/habitaciones',
      '/reservas', '/servicios', '/facturas', '/pagos', '/reportes', '/public',
    ],
  });
});

router.use('/auth', authRoutes);
router.use('/clientes', clientesRoutes);
router.use('/empleados', empleadosRoutes);
router.use('/proveedores', proveedoresRoutes);
router.use('/habitaciones', habitacionesRoutes);
router.use('/reservas', reservasRoutes);
router.use('/servicios', serviciosRoutes);
router.use('/facturas', facturasRoutes);
router.use('/pagos', pagosRoutes);
router.use('/reportes', reportesRoutes);
router.use('/public', publicRoutes);

module.exports = router;
