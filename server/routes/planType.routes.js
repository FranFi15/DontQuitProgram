import { Router } from 'express';
import { 
    createPlanType, 
    getPlanTypes, 
    updatePlanType, 
    deletePlanType 
} from '../controllers/planType.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/', verifyToken, isAdmin, createPlanType);    
router.get('/', getPlanTypes);       
router.put('/:id', verifyToken, isAdmin, updatePlanType);    

router.delete('/:id', verifyToken, isAdmin, deletePlanType); 


export default router;