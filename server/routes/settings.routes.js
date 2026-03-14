import { Router } from "express";

import {getFollowUpLimit, updateFollowUpLimit, getBankSettings, updateBankSettings} from '../controllers/settings.controller.js';
import { verifyToken, isAdmin } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/followup-stats', verifyToken, isAdmin, getFollowUpLimit);
router.put('/followup-limit', verifyToken, isAdmin, updateFollowUpLimit);

router.get('/bank', verifyToken, isAdmin, getBankSettings);
router.put('/bank', verifyToken, isAdmin, updateBankSettings);

export default router;