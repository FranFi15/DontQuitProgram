import { Router } from 'express';
import { getAllSubscriptions, createSubscription, deleteSubscription, getSubscriptionsByPlan, updateSubscription } from '../controllers/subscription.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, isAdmin, getAllSubscriptions);
router.get('/plan/:planId', getSubscriptionsByPlan);
router.post('/', verifyToken, isAdmin, createSubscription);
router.put('/:id', verifyToken, isAdmin, updateSubscription);
router.delete('/:id', verifyToken, isAdmin, deleteSubscription);

export default router;