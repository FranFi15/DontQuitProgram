// server/routes/scorebox.routes.js
import { Router } from 'express';

import { 
  createScoreBox, 
updateScoreBox,
  deleteScoreBox, 
  getPlanScoreBoxes, 
  addScoreEntry, 
  updateScoreEntry,
  getUserPlanHistory
} from '../controllers/scorebox.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/definition', verifyToken, isAdmin, createScoreBox);
router.put('/definition/:id', verifyToken, isAdmin, updateScoreBox);
router.delete('/definition/:id', verifyToken, isAdmin, deleteScoreBox);
router.get('/plan/:planId', getPlanScoreBoxes);
router.post('/entry', addScoreEntry);
router.put('/entry/:id', updateScoreEntry); 
router.get('/history/:userId', getUserPlanHistory);

export default router;