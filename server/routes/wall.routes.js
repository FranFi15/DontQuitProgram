import { Router } from 'express';
import { getWallPosts, createWallPost, approveAllWallPosts } from '../controllers/wall.controller.js';

const router = Router();

router.get('/:planId', getWallPosts);
router.post('/', createWallPost);
router.put('/approve-all', approveAllWallPosts);

export default router;