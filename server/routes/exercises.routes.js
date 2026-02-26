import { Router } from 'express';
import { getAllExercises, createExercise, updateExercise, deleteExercise } from '../controllers/exercise.controller.js';

const router = Router();

router.get('/', getAllExercises);
router.post('/', createExercise);
router.put('/:id', updateExercise);
router.delete('/:id', deleteExercise);

export default router;