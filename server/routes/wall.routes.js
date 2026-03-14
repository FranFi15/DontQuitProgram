import { Router } from 'express';
import { getWallPosts, createWallPost, approveAllWallPosts, deleteWallPost, togglePinWallPost} from '../controllers/wall.controller.js';

const router = Router();

router.get('/:planId', getWallPosts);
router.post('/', createWallPost);
router.put('/approve-all', approveAllWallPosts);

router.delete('/:id', deleteWallPost);
router.put('/:id/pin', togglePinWallPost);

export default router;