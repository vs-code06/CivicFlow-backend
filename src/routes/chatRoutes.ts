import express from 'express';
import { chatWithAI, chatWithAIStream } from '../controllers/chatController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// @ts-ignore
router.post('/', protect, chatWithAI);
// @ts-ignore
router.post('/stream', protect, chatWithAIStream);

export default router;
