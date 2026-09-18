import express from 'express';
import { getHistory } from '../controllers/codeController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', optionalAuth, getHistory);

export default router;
