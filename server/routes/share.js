import { Router } from 'express';
import { createShare, getShare } from '../controllers/shareController.js';

const router = Router();

router.post('/',          createShare);
router.get('/:shareId',   getShare);

export default router;
