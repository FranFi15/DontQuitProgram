import { Router } from 'express';
import { sendMessage, getConversation, markAsRead, getChatUsers} from '../controllers/chat.controller.js';
import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/users', verifyToken, isAdmin, getChatUsers );
router.post('/', sendMessage);
router.get('/:userId1/:userId2', getConversation);
router.put('/read', markAsRead);

export default router;