import { Router } from 'express';
import { getDashboardStats } from '../controllers/dashboard.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', isAdmin, getDashboardStats);

export default router;