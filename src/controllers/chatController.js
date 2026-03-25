const asyncHandler = require('express-async-handler');

// @desc    Chat with AI
// @route   POST /api/chat
// @access  Private
const chatWithAI = asyncHandler(async (req, res) => {
    const { message } = req.body;
    
    // User data is injected by the protect middleware
    const userRole = req.user.role;
    const userId = req.user._id.toString();

    if (!message) {
        res.status(400);
        throw new Error('Please provide a message');
    }

    try {
        // Forward request to the Python AI service running on port 8000
        const response = await fetch('http://localhost:8000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                role: userRole,
                user_id: userId
            })
        });

        if (!response.ok) {
            throw new Error(`AI Service responded with status: ${response.status}`);
        }

        const data = await response.json();
        res.status(200).json({ success: true, reply: data.response });
    } catch (error) {
        console.error('Error communicating with AI service:', error);
        res.status(500);
        throw new Error('Failed to communicate with AI Service');
    }
});

// @desc    Chat with AI (Streaming)
// @route   POST /api/chat/stream
// @access  Private
const chatWithAIStream = asyncHandler(async (req, res) => {
    const { message } = req.body;
    
    const userRole = req.user.role;
    const userId = req.user._id.toString();

    if (!message) {
        res.status(400);
        throw new Error('Please provide a message');
    }

    try {
        const response = await fetch('http://localhost:8000/api/chat/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                role: userRole,
                user_id: userId
            })
        });

        if (!response.ok) {
            throw new Error(`AI Service responded with status: ${response.status}`);
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);
        }
        res.end();
    } catch (error) {
        console.error('Error communicating with AI service stream:', error);
        res.status(500);
        throw new Error('Failed to communicate with AI Service stream');
    }
});

module.exports = { chatWithAI, chatWithAIStream };
