import { Router } from 'express';
import { 
    createPlanType, 
    getPlanTypes, 
    updatePlanType, 
    deletePlanType 
} from '../controllers/planType.controller.js';

const router = Router();

router.post('/', createPlanType);    
router.get('/', getPlanTypes);       
router.put('/:id', updatePlanType);    

router.delete('/:id', deletePlanType); 


export default router;