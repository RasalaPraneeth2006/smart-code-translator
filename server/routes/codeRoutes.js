import express from 'express';
import { translateCode, analyzeCode, optimizeCode, getGeminiStatus } from '../controllers/codeController.js';
import { runCode, explainError } from '../controllers/runController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/gemini-status', getGeminiStatus);
router.post('/translate', optionalAuth, translateCode);
router.post('/analyze', analyzeCode);
router.post('/optimize', optimizeCode);
router.post('/run', runCode);
router.post('/explain-error', explainError);

export default router;
