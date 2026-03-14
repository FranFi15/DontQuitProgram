// server/routes/plans.js
import express from 'express';
import { getAllPlans, getPlanById, createPlan, updatePlan, deletePlan, togglePlanStatus, duplicatePlan } from '../controllers/plan.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, isAdmin, getAllPlans);
router.get('/:id', getPlanById);
router.post('/', verifyToken, isAdmin, createPlan);
router.post('/:id/duplicate', verifyToken, isAdmin, duplicatePlan);
router.put('/:id', verifyToken, isAdmin, updatePlan);
router.delete('/:id', verifyToken, isAdmin, deletePlan);
router.patch('/:id/toggle-status', togglePlanStatus);



export default router;