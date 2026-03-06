// server/routes/plans.js
import express from 'express';
import { getAllPlans, getPlanById, createPlan, updatePlan, deletePlan, togglePlanStatus, duplicatePlan } from '../controllers/plan.controller.js';

const router = express.Router();

router.get('/', getAllPlans);
router.get('/:id', getPlanById);
router.post('/', createPlan);
router.post('/:id/duplicate', duplicatePlan);
router.put('/:id', updatePlan);
router.delete('/:id', deletePlan);
router.patch('/:id/toggle-status', togglePlanStatus);



export default router;