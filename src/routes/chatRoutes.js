const express = require('express');
const router = express.Router();
const { chatWithAI, chatWithAIStream } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, chatWithAI);
router.post('/stream', protect, chatWithAIStream);

module.exports = router;
