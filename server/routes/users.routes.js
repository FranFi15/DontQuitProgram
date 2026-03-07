// server/routes/users.js
import express from 'express';
import { getAllUsers, createUser, updateUser, deleteUser, changePassword, getUserSubscriptions } from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', getAllUsers);
router.get('/:id/subscriptions', getUserSubscriptions);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.put('/profile/password/:id', verifyToken, changePassword);
export default router;