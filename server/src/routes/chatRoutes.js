const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');

// @route   POST /api/chat/send
// @desc    Send a private message
// @access  Private
router.post('/send', auth, chatController.sendMessage);

// @route   GET /api/chat/history/:friendId
// @desc    Get chat history
// @access  Private
router.get('/history/:friendId', auth, chatController.getMessages);

// @route   GET /api/chat/:roomId
// @desc    Get room chat messages (Public/Unauthenticated for simplicity in room)
// @access  Public
router.get('/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const RoomMessage = require('../models/RoomMessage');
        const messages = await RoomMessage.find({ roomId }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        console.error("Error fetching room messages:", err);
        res.status(500).json({ msg: "Server Error" });
    }
});

module.exports = router;
