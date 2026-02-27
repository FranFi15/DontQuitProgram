import { Router } from 'express';
import { 
  reportTransfer, 
  getPendingPayments, 
  approvePayment, 
  rejectPayment, 
  getAdminBadges,
  getPaymentHistory // 
} from '../controllers/payment.controller.js';
import { createPreference, receiveWebhook } from '../controllers/mercadopago.controller.js';
import { createOrder, captureOrder } from '../controllers/paypal.controller.js';

const router = Router();

// Rutas de consulta (Ponlas arriba)
router.get('/pending', getPendingPayments); 
router.get('/history', getPaymentHistory);
router.get('/badges', getAdminBadges);

// Rutas de acción
router.post('/transfer', reportTransfer); 
router.put('/:id/approve', approvePayment); 
router.put('/:id/reject', rejectPayment); 

// Pasarelas
router.post('/mp/create_preference', createPreference);
router.post('/mp/webhook', receiveWebhook);
router.post('/paypal/create-order', createOrder);
router.post('/paypal/capture-order', captureOrder);

export default router;