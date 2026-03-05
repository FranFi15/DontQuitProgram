// server/routes/users.js
import express from 'express';
import { getAllUsers, createUser, updateUser, deleteUser, changePassword } from '../controllers/user.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.put('/profile/password/:id', verifyToken, changePassword);
export default router;