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

const router = Router();

router.post('/definition', createScoreBox);
router.put('/definition/:id', updateScoreBox);
router.delete('/definition/:id', deleteScoreBox);
router.get('/plan/:planId', getPlanScoreBoxes);
router.post('/entry', addScoreEntry);
router.put('/entry/:id', updateScoreEntry); 
router.get('/history/:userId', getUserPlanHistory);

export default router;