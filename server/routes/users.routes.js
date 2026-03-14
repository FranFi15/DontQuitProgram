// server/routes/users.js
import express from 'express';
import { getAllUsers, createUser, updateUser, deleteUser, changePassword, getUserSubscriptions, getUserRMs } from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, isAdmin, getAllUsers);
router.get('/:id/rms', getUserRMs);
router.get('/:id/subscriptions', getUserSubscriptions);
router.post('/', verifyToken, isAdmin, createUser);
router.put('/:id', updateUser);
router.delete('/:id', verifyToken, isAdmin, deleteUser);

router.put('/profile/password/:id', verifyToken, changePassword);
export default router;