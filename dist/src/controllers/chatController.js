"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithAIStream = exports.chatWithAI = void 0;
// @desc    Chat with AI
const chatWithAI = async (req, res) => {
    const { message } = req.body;
    if (!req.user)
        return res.status(401).json({ message: 'Unauthenticated' });
    const userRole = req.user.role;
    const userId = req.user._id.toString();
    if (!message) {
        return res.status(400).json({ message: 'Please provide a message' });
    }
    try {
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
        return res.status(200).json({ success: true, reply: data.response });
    }
    catch (error) {
        console.error('Error communicating with AI service:', error);
        return res.status(500).json({ message: 'Failed to communicate with AI Service' });
    }
};
exports.chatWithAI = chatWithAI;
// @desc    Chat with AI (Streaming)
const chatWithAIStream = async (req, res) => {
    const { message } = req.body;
    if (!req.user)
        return res.status(401).json({ message: 'Unauthenticated' });
    const userRole = req.user.role;
    const userId = req.user._id.toString();
    if (!message) {
        return res.status(400).json({ message: 'Please provide a message' });
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
        const body = response.body;
        if (!body)
            throw new Error('No response body from AI service');
        const reader = body.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            const chunk = decoder.decode(value, { stream: true });
            res.write(chunk);
        }
        res.end();
    }
    catch (error) {
        console.error('Error communicating with AI service stream:', error);
        return res.status(500).json({ message: 'Failed to communicate with AI Service stream' });
    }
};
exports.chatWithAIStream = chatWithAIStream;
