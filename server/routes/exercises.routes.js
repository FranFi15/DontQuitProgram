import { Router } from 'express';
import { getAllExercises, createExercise, updateExercise, deleteExercise } from '../controllers/exercise.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/',  getAllExercises);
router.post('/', verifyToken, isAdmin, createExercise);
router.put('/:id', verifyToken, isAdmin, updateExercise);
router.delete('/:id', verifyToken, isAdmin, deleteExercise);

export default router;