import { Router } from 'express';
import { getWallPosts, createWallPost, approveAllWallPosts, deleteWallPost, togglePinWallPost} from '../controllers/wall.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/:planId', getWallPosts);
router.post('/', createWallPost);
router.put('/approve-all', approveAllWallPosts);

router.delete('/:id', verifyToken, isAdmin, deleteWallPost);
router.put('/:id/pin', verifyToken, isAdmin, togglePinWallPost);

export default router;