import { Router } from 'express';
import { sendMessage, getConversation, markAsRead, getChatUsers, getClientBadges} from '../controllers/chat.controller.js';


const router = Router();

router.get('/users', getChatUsers );
router.get('/badges/:userId', getClientBadges);
router.post('/', sendMessage);
router.get('/:userId1/:userId2', getConversation);
router.put('/read', markAsRead);

export default router;