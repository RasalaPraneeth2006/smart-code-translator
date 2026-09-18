import express from 'express';
import { translateCode, analyzeCode, optimizeCode } from '../controllers/codeController.js';
import { runCode, explainError } from '../controllers/runController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/translate', optionalAuth, translateCode);
router.post('/analyze', analyzeCode);
router.post('/optimize', optimizeCode);
router.post('/run', runCode);
router.post('/explain-error', explainError);

export default router;
