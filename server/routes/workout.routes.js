// server/routes/workouts.js
import express from 'express';
import { getPlanWorkouts, saveWorkout, deleteWorkout, deleteWeek, updateWeekNumber, updateWorkout, getMyRoutine, getUserActivePlans } from '../controllers/workout.controller.js';

const router = express.Router();

// Rutas
router.get('/my-plans/:userId', getUserActivePlans);
router.get('/my-routine/:userId', getMyRoutine);
router.get('/:planId', getPlanWorkouts);
router.put('/week/:planId/:weekNumber', updateWeekNumber);
router.post('/:planId', saveWorkout); 
router.delete('/:id', deleteWorkout); 
router.delete('/week/:planId/:weekNumber', deleteWeek); 


router.put('/:id', updateWorkout);


export default router;