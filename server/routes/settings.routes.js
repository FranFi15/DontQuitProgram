import { Router } from "express";

import {getFollowUpLimit, updateFollowUpLimit, getBankSettings, updateBankSettings} from '../controllers/settings.controller.js';

const router = Router();

router.get('/followup-stats', getFollowUpLimit);
router.put('/followup-limit', updateFollowUpLimit);

router.get('/bank', getBankSettings);
router.put('/bank', updateBankSettings);

export default router;