import { Router } from 'express';
import { reportTransfer, getPendingPayments, approvePayment, rejectPayment, getAdminBadges } from '../controllers/payment.controller.js';
import { createPreference, receiveWebhook } from '../controllers/mercadopago.controller.js';
import { createOrder, captureOrder } from '../controllers/paypal.controller.js';

const router = Router();

// Rutas para los pagos
router.post('/transfer', reportTransfer); // El cliente reporta el pago
router.get('/pending', getPendingPayments); //Admin ve los pagos pendientes

router.put('/:id/approve', approvePayment); // Admin aprueba el pago, se crea la suscripción y se notifica al cliente
router.put('/:id/reject', rejectPayment); // Admin rechaza el pago

router.get('/badges', getAdminBadges);

router.post('/mp/create_preference', createPreference);
router.post('/mp/webhook', receiveWebhook);

router.post('/paypal/create-order', createOrder);
router.post('/paypal/capture-order', captureOrder);


export default router;