import { Router } from 'express';
import { getAllSubscriptions, createSubscription, deleteSubscription, getSubscriptionsByPlan, updateSubscription } from '../controllers/subscription.controller.js';

const router = Router();

router.get('/', getAllSubscriptions);
router.get('/plan/:planId', getSubscriptionsByPlan);
router.post('/', createSubscription);
router.put('/:id', updateSubscription);
router.delete('/:id', deleteSubscription);

export default router;